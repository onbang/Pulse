import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Address, beginCell, Cell, toNano } from "@ton/core";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { internal, WalletContractV4 } from "@ton/ton";
import {
  buildTonForecastBetPayloadBase64,
  buildTonForecastBetTransferMessage,
  buildTonForecastClaimForPayloadBase64,
  buildTonForecastClaimPayloadBase64,
  buildTonForecastLockPayloadBase64,
  buildTonForecastResolvePayloadBase64,
  parseTonForecastPayloadBase64,
  type TonForecastDirection,
  type TonForecastMarketStatus,
} from "@ston-pulse/prediction-sdk";
import {
  type StateInit,
  storeStateInit,
  TonForecastMarket,
} from "@ston-pulse/prediction-market-contract/ton-forecast-market";

import type { PredictionDirection } from "@/lib/community";
import { getCommunityState } from "@/lib/server/community-store";
import { stonApiClient } from "@/lib/ston-api-client";
import {
  getForecastAutoCycleEnabled,
  getForecastClaimTriggerTon,
  getForecastDeployReserveTon,
  getForecastProtocolFeeBps,
  getForecastResolverMnemonic,
  getForecastThresholdPresetsBps,
  getForecastTreasuryAddress,
} from "@/lib/forecast-market-config";
import {
  buildPredictionTokenMarketId,
  getPredictionTimeframeSeconds,
  isPredictionTimeframeId,
  type PredictionTimeframeId,
} from "@/lib/prediction-timeframes";
import { resolveCommunityDatabaseFile } from "@/lib/server/runtime-storage";
import { tonApiClient } from "@/lib/ton-api-client";

const databaseFile = resolveCommunityDatabaseFile();
const TONAPI_BASE_URL = process.env.TON_CONSOLE_API_URL ?? "https://tonapi.io";
const AUTO_CLAIM_RETRY_WINDOW_MS = 2 * 60 * 1000;
const AUTO_CYCLE_MARKET_LIMIT = 25;
const AUTO_CYCLE_CLAIM_LIMIT = 25;
const AUTO_CYCLE_CONFIRM_TIMEOUT_MS = 12_000;
const AUTO_CYCLE_CONFIRM_POLL_MS = 1_500;

let database: DatabaseSync | null = null;
let initialized = false;
type ResolverWalletContext = {
  address: string;
  wallet: {
    address: Address;
    getSeqno(): Promise<number>;
    sendTransfer(args: {
      seqno: number;
      secretKey: Buffer;
      messages: ReturnType<typeof internal>[];
      sendMode?: number;
    }): Promise<void>;
  };
  secretKey: Buffer;
};
let resolverWalletPromise: Promise<ResolverWalletContext | null> | null = null;

type ForecastMarketRow = {
  contract_address: string;
  pair_id: string;
  pair_label: string;
  token_address: string;
  token_symbol: string;
  timeframe_id: string;
  timeframe_seconds: number;
  threshold_bps: number;
  reference_price_e9: number;
  protocol_fee_bps: number;
  owner_address: string;
  resolver_address: string;
  treasury_address: string;
  created_at: string;
  close_time: string;
  deployment_message_hash: string | null;
  deployment_tx_hash: string | null;
  status: TonForecastMarketStatus;
  final_price_e9: number | null;
  resolved_at: string | null;
};

type ForecastAutoClaimRow = {
  market_address: string;
  wallet_address: string;
  requested_at: string;
  claimed_at: string | null;
  last_error: string | null;
};

const STALE_PENDING_MARKET_WINDOW_MS = 15 * 60 * 1000;

function normalizeTonAddress(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    return Address.parse(value).toString();
  } catch {
    return value;
  }
}

function shortAddress(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function predictionDirectionToForecast(
  value: PredictionDirection,
): TonForecastDirection {
  return value === "up" ? "yes" : "no";
}

function forecastDirectionToPrediction(
  value: TonForecastDirection,
): PredictionDirection {
  return value === "yes" ? "up" : "down";
}

function createForecastPairLabel(tokenSymbol: string, timeframeId: string) {
  return `${tokenSymbol} • ${timeframeId}`;
}

function createForecastMarketTitle(tokenSymbol: string, timeframeId: string) {
  return `${tokenSymbol} ${timeframeId} forecast`;
}

function createForecastMarketId(input: {
  tokenAddress: string;
  timeframeId: PredictionTimeframeId;
  createdAtUnix: number;
}) {
  return [
    "forecast",
    normalizeTonAddress(input.tokenAddress),
    input.timeframeId,
    input.createdAtUnix,
  ].join(":");
}

function toUnixSeconds(value: string) {
  return Math.floor(new Date(value).getTime() / 1000);
}

function isPendingUndeployedMarket(market: ForecastMarketRow | null) {
  return Boolean(
    market && market.status === "pending" && !market.deployment_tx_hash,
  );
}

async function buildPendingForecastDeployBetIntent(input: {
  market: ForecastMarketRow;
  direction: PredictionDirection;
  amountTon: number;
}) {
  if (!isPredictionTimeframeId(input.market.timeframe_id)) {
    throw new Error("Unsupported forecast timeframe.");
  }

  const createdAtUnix = toUnixSeconds(input.market.created_at);
  const closeTimeUnix = toUnixSeconds(input.market.close_time);
  const marketId = createForecastMarketId({
    tokenAddress: input.market.token_address,
    timeframeId: input.market.timeframe_id,
    createdAtUnix,
  });
  const marketTitle = createForecastMarketTitle(
    input.market.token_symbol,
    input.market.timeframe_id,
  );
  const contract = await TonForecastMarket.fromInit(
    Address.parse(input.market.owner_address),
    Address.parse(input.market.resolver_address),
    Address.parse(input.market.treasury_address),
    Address.parse(input.market.token_address),
    input.market.token_symbol,
    marketId,
    marketTitle,
    input.market.timeframe_id,
    BigInt(input.market.timeframe_seconds),
    BigInt(input.market.threshold_bps),
    BigInt(input.market.reference_price_e9),
    BigInt(input.market.protocol_fee_bps),
    BigInt(createdAtUnix),
    BigInt(closeTimeUnix),
  );

  return {
    market: {
      contractAddress: contract.address.toString(),
      pairId: input.market.pair_id,
      label: input.market.pair_label,
      tokenAddress: input.market.token_address,
      tokenSymbol: input.market.token_symbol,
      timeframeId: input.market.timeframe_id,
      timeframeSeconds: input.market.timeframe_seconds,
      thresholdBps: input.market.threshold_bps,
      referencePriceE9: input.market.reference_price_e9,
      createdAt: input.market.created_at,
      closeTime: input.market.close_time,
      status: "pending" as const,
    },
    tonConnect: {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: contract.address.toString(),
          amount: (
            toNano(getForecastDeployReserveTon()) +
            toNano(String(input.amountTon))
          ).toString(),
          stateInit: serializeStateInit(contract.init!),
          payload: buildTonForecastBetPayloadBase64(
            predictionDirectionToForecast(input.direction),
          ),
        },
      ],
    },
    syncCursor: new Date().toISOString(),
  };
}

function parseMnemonicWords(value: string) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapForecastStatusCode(value: bigint | number) {
  const statusCode = typeof value === "bigint" ? Number(value) : value;

  switch (statusCode) {
    case 1:
      return "locked" as const;
    case 2:
      return "resolved_yes" as const;
    case 3:
      return "resolved_no" as const;
    case 4:
      return "resolved_draw" as const;
    default:
      return "open" as const;
  }
}

function encodeForecastBody(payloadBase64: string) {
  return Cell.fromBase64(payloadBase64);
}

async function getResolverWalletContext() {
  if (resolverWalletPromise) {
    return resolverWalletPromise;
  }

  resolverWalletPromise = (async () => {
    const mnemonic = getForecastResolverMnemonic();

    if (!mnemonic) {
      return null;
    }

    const words = parseMnemonicWords(mnemonic);

    if (words.length < 12) {
      throw new Error("FORECAST_RESOLVER_MNEMONIC is invalid.");
    }

    const keyPair = await mnemonicToPrivateKey(words);
    const wallet = tonApiClient.open(
      WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
      }),
    );

    return {
      address: wallet.address.toString(),
      wallet,
      secretKey: keyPair.secretKey,
    };
  })();

  return resolverWalletPromise;
}

async function resolveForecastResolverAddress(ownerAddress?: string | null) {
  const explicitResolver =
    process.env.NEXT_PUBLIC_FORECAST_RESOLVER_ADDRESS?.trim() ||
    process.env.FORECAST_RESOLVER_ADDRESS?.trim() ||
    "";

  if (explicitResolver) {
    return normalizeTonAddress(explicitResolver);
  }

  const resolverWallet = await getResolverWalletContext();

  if (resolverWallet?.address) {
    return normalizeTonAddress(resolverWallet.address);
  }

  return normalizeTonAddress(ownerAddress);
}

async function ensureForecastDatabase() {
  if (database && initialized) {
    return database;
  }

  await getCommunityState(null);
  await mkdir(dirname(databaseFile), { recursive: true });

  if (!database) {
    database = new DatabaseSync(databaseFile);
    database.exec("PRAGMA journal_mode = WAL;");
    database.exec("PRAGMA foreign_keys = ON;");
  }

  if (!initialized) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS forecast_markets (
        contract_address TEXT PRIMARY KEY,
        pair_id TEXT NOT NULL,
        pair_label TEXT NOT NULL,
        token_address TEXT NOT NULL,
        token_symbol TEXT NOT NULL,
        timeframe_id TEXT NOT NULL,
        timeframe_seconds INTEGER NOT NULL,
        threshold_bps INTEGER NOT NULL,
        reference_price_e9 INTEGER NOT NULL,
        protocol_fee_bps INTEGER NOT NULL,
        owner_address TEXT NOT NULL,
        resolver_address TEXT NOT NULL,
        treasury_address TEXT NOT NULL,
        created_at TEXT NOT NULL,
        close_time TEXT NOT NULL,
        deployment_message_hash TEXT,
        deployment_tx_hash TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        final_price_e9 INTEGER,
        resolved_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_forecast_markets_pair_created
      ON forecast_markets(pair_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS forecast_auto_claims (
        market_address TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        claimed_at TEXT,
        last_error TEXT,
        PRIMARY KEY (market_address, wallet_address)
      );

      CREATE INDEX IF NOT EXISTS idx_forecast_auto_claims_requested
      ON forecast_auto_claims(requested_at DESC);
    `);

    initialized = true;
  }

  return database;
}

async function readForecastMarketOnchainState(contractAddress: string) {
  try {
    const contract = tonApiClient.open(
      TonForecastMarket.fromAddress(Address.parse(contractAddress)),
    );
    const state = await contract.getGetMarketState();

    return {
      status: mapForecastStatusCode(state.status),
      finalPriceE9: Number(state.finalPriceE9),
      resolvedAt:
        Number(state.resolvedAt) > 0
          ? new Date(Number(state.resolvedAt) * 1000).toISOString()
          : null,
      closeTime: new Date(Number(state.closeTime) * 1000).toISOString(),
      createdAt: new Date(Number(state.createdAt) * 1000).toISOString(),
      totalYes: Number(state.totalYes) / 1_000_000_000,
      totalNo: Number(state.totalNo) / 1_000_000_000,
      resolverAddress: state.resolver.toString(),
      treasuryAddress: state.treasury.toString(),
    };
  } catch {
    return null;
  }
}

async function readForecastPositionOnchain(
  contractAddress: string,
  walletAddress: string,
) {
  try {
    const contract = tonApiClient.open(
      TonForecastMarket.fromAddress(Address.parse(contractAddress)),
    );
    const position = await contract.getGetPosition(
      Address.parse(walletAddress),
    );

    return {
      yesStake: Number(position.yesStake) / 1_000_000_000,
      noStake: Number(position.noStake) / 1_000_000_000,
      claimed: position.claimed,
    };
  } catch {
    return null;
  }
}

async function waitForResolverSeqnoIncrement(
  wallet: ResolverWalletContext["wallet"],
  initialSeqno: number,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < AUTO_CYCLE_CONFIRM_TIMEOUT_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, AUTO_CYCLE_CONFIRM_POLL_MS),
    );
    const nextSeqno = await wallet.getSeqno();

    if (nextSeqno > initialSeqno) {
      return true;
    }
  }

  return false;
}

async function sendResolverMessage(input: {
  to: string;
  valueTon: string;
  payloadBase64: string;
}) {
  const resolverWallet = await getResolverWalletContext();

  if (!resolverWallet) {
    return { ok: false as const, reason: "resolver_wallet_missing" as const };
  }

  const seqno = await resolverWallet.wallet.getSeqno();

  await resolverWallet.wallet.sendTransfer({
    seqno,
    secretKey: resolverWallet.secretKey,
    messages: [
      internal({
        to: Address.parse(input.to),
        value: toNano(input.valueTon),
        bounce: true,
        body: encodeForecastBody(input.payloadBase64),
      }),
    ],
  });

  await waitForResolverSeqnoIncrement(resolverWallet.wallet, seqno);

  return {
    ok: true as const,
    resolverAddress: resolverWallet.address,
  };
}

function shouldSkipAutoClaim(row: ForecastAutoClaimRow | null) {
  if (!row?.requested_at || row.claimed_at) {
    return false;
  }

  return (
    Date.now() - new Date(row.requested_at).getTime() <
    AUTO_CLAIM_RETRY_WINDOW_MS
  );
}

function extractTxHash(transaction: Record<string, unknown>) {
  const candidates = [
    transaction.hash,
    transaction.tx_id,
    transaction.transaction_id,
    transaction.lt_hash,
    (transaction.transaction_id as Record<string, unknown> | undefined)?.hash,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

function extractMessageHash(message: Record<string, unknown> | null) {
  if (!message) {
    return null;
  }

  const candidates = [
    message.hash,
    message.message_hash,
    message.msg_hash,
    (message.message_content as Record<string, unknown> | undefined)?.hash,
    (message.messageContent as Record<string, unknown> | undefined)?.hash,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

function extractTransactionCreatedAt(transaction: Record<string, unknown>) {
  const candidates = [
    transaction.utime,
    transaction.timestamp,
    transaction.created_at,
    transaction.now,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return new Date(candidate * 1000).toISOString();
    }

    if (typeof candidate === "string") {
      const numeric = Number(candidate);

      if (Number.isFinite(numeric)) {
        return new Date(numeric * 1000).toISOString();
      }
    }
  }

  return new Date().toISOString();
}

function extractMessageTonValue(message: Record<string, unknown> | null) {
  if (!message) {
    return 0;
  }

  const candidates = [
    message.value,
    message.amount,
    (message.value as Record<string, unknown> | undefined)?.coins,
    (message.amount as Record<string, unknown> | undefined)?.value,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate / 1_000_000_000;
    }

    if (typeof candidate === "string") {
      const numeric = Number(candidate);

      if (Number.isFinite(numeric)) {
        return numeric / 1_000_000_000;
      }
    }
  }

  return 0;
}

function normalizePayloadCandidate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
    try {
      const bytes = Buffer.from(trimmed, "hex");
      const [cell] = Cell.fromBoc(bytes);

      if (!cell) {
        return null;
      }

      return cell.toBoc().toString("base64");
    } catch {
      return null;
    }
  }

  return trimmed;
}

function extractForecastPayload(message: Record<string, unknown> | null) {
  if (!message) {
    return null;
  }

  const candidates = [
    message.body,
    message.raw_body,
    message.boc,
    message.payload,
    (message.message_content as Record<string, unknown> | undefined)?.body,
    (message.messageContent as Record<string, unknown> | undefined)?.body,
    (message.message_content as Record<string, unknown> | undefined)?.payload,
    (message.messageContent as Record<string, unknown> | undefined)?.payload,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.trim().length === 0) {
      continue;
    }

    const normalized = normalizePayloadCandidate(candidate);

    if (!normalized) {
      continue;
    }

    const parsed = parseTonForecastPayloadBase64(normalized);

    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function ensureProfile(db: DatabaseSync, walletAddress: string) {
  const normalizedWalletAddress = normalizeTonAddress(walletAddress);

  if (!normalizedWalletAddress) {
    return;
  }

  db.prepare(`
    INSERT OR IGNORE INTO profiles (
      wallet_address,
      display_name,
      bio,
      joined_at,
      total_points,
      streak,
      longest_streak,
      total_check_ins,
      check_in_dates_json,
      activities_json,
      notification_preferences_json,
      comments_count,
      predictions_count,
      swap_count,
      liquidity_actions_count
    ) VALUES (?, ?, '', ?, 0, 0, 0, 0, '[]', '{}', '{}', 0, 0, 0, 0)
  `).run(
    normalizedWalletAddress,
    shortAddress(normalizedWalletAddress),
    new Date().toISOString(),
  );
}

function getProfileRow(db: DatabaseSync, walletAddress: string) {
  return db
    .prepare(`
      SELECT wallet_address, display_name, predictions_count
      FROM profiles
      WHERE wallet_address = ?
    `)
    .get(normalizeTonAddress(walletAddress)) as
    | {
        wallet_address: string;
        display_name: string;
        predictions_count: number;
      }
    | undefined;
}

async function resolveAssetSnapshot(tokenAddress: string) {
  const asset = (await stonApiClient.getAsset(tokenAddress)) as {
    meta?: {
      symbol?: string | null;
      displayName?: string | null;
    };
    dexPriceUsd?: string | number | null;
  } | null;

  const tokenSymbol =
    asset?.meta?.symbol?.trim() || asset?.meta?.displayName?.trim() || "TOKEN";
  const priceUsd = Number(asset?.dexPriceUsd ?? 0);

  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error("Unable to resolve current token price for forecast.");
  }

  return {
    tokenSymbol,
    currentPriceUsd: priceUsd,
    currentPriceE9: Math.round(priceUsd * 1_000_000_000),
  };
}

function getForecastMarketRow(
  db: DatabaseSync,
  contractAddress: string,
): ForecastMarketRow | null {
  return (
    (db
      .prepare("SELECT * FROM forecast_markets WHERE contract_address = ?")
      .get(contractAddress) as ForecastMarketRow | undefined) ?? null
  );
}

function getActiveForecastMarketRow(
  db: DatabaseSync,
  pairId: string,
): ForecastMarketRow | null {
  const rows = db
    .prepare(`
    SELECT *
    FROM forecast_markets
    WHERE pair_id = ?
      AND status IN ('pending', 'open', 'locked')
    ORDER BY created_at DESC
  `)
    .all(pairId) as ForecastMarketRow[];

  for (const row of rows) {
    if (
      row.status === "pending" &&
      !row.deployment_tx_hash &&
      Date.now() - new Date(row.created_at).getTime() >
        STALE_PENDING_MARKET_WINDOW_MS
    ) {
      continue;
    }

    return row;
  }

  return null;
}

function computeForecastStatus(
  market: ForecastMarketRow,
  finalPriceE9?: number | null,
) {
  if (finalPriceE9 == null) {
    return Date.now() >= new Date(market.close_time).getTime()
      ? ("locked" as const)
      : ("open" as const);
  }

  const upperTarget =
    (market.reference_price_e9 * (10_000 + market.threshold_bps)) / 10_000;
  const lowerTarget =
    (market.reference_price_e9 * (10_000 - market.threshold_bps)) / 10_000;

  if (finalPriceE9 >= upperTarget) {
    return "resolved_yes" as const;
  }

  if (finalPriceE9 <= lowerTarget) {
    return "resolved_no" as const;
  }

  return "resolved_draw" as const;
}

function mapForecastStatusToRoundStatus(status: TonForecastMarketStatus) {
  if (
    status === "resolved_yes" ||
    status === "resolved_no" ||
    status === "resolved_draw"
  ) {
    return "settled" as const;
  }

  if (status === "locked") {
    return "closed" as const;
  }

  return "open" as const;
}

function mapForecastStatusToSettlementDirection(
  status: TonForecastMarketStatus,
) {
  if (status === "resolved_yes") {
    return "up" as const;
  }

  if (status === "resolved_no") {
    return "down" as const;
  }

  return null;
}

function upsertPredictionRoundProjection(
  db: DatabaseSync,
  market: ForecastMarketRow,
) {
  db.prepare(`
    INSERT INTO prediction_rounds (
      pair_id, round_id, pair_label, timeframe_id, status, opened_at, closes_at, resolved_at, duration_minutes, settlement_direction
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(pair_id) DO UPDATE SET
      round_id = excluded.round_id,
      pair_label = excluded.pair_label,
      timeframe_id = excluded.timeframe_id,
      status = excluded.status,
      opened_at = excluded.opened_at,
      closes_at = excluded.closes_at,
      resolved_at = excluded.resolved_at,
      duration_minutes = excluded.duration_minutes,
      settlement_direction = excluded.settlement_direction
  `).run(
    market.pair_id,
    market.contract_address,
    market.pair_label,
    market.timeframe_id,
    mapForecastStatusToRoundStatus(market.status),
    market.created_at,
    market.close_time,
    market.resolved_at,
    Math.round(market.timeframe_seconds / 60),
    mapForecastStatusToSettlementDirection(market.status),
  );
}

function buildPayoutPreviewRows(db: DatabaseSync, market: ForecastMarketRow) {
  const betRows = db
    .prepare(`
    SELECT wallet_address, author, amount, direction
    FROM prediction_bets
    WHERE round_id = ?
      AND source_kind = 'onchain_sync'
    ORDER BY created_at DESC
  `)
    .all(market.contract_address) as Array<{
    wallet_address: string;
    author: string;
    amount: number;
    direction: PredictionDirection;
  }>;

  const settlementDirection = mapForecastStatusToSettlementDirection(
    market.status,
  );
  const totalPool = betRows.reduce((sum, row) => sum + row.amount, 0);

  if (market.status === "resolved_draw") {
    const refunds = new Map<
      string,
      { walletAddress: string; author: string; totalStake: number }
    >();

    for (const row of betRows) {
      const current = refunds.get(row.wallet_address) ?? {
        walletAddress: row.wallet_address,
        author: row.author,
        totalStake: 0,
      };
      current.totalStake += row.amount;
      refunds.set(row.wallet_address, current);
    }

    return [...refunds.values()].map((entry) => ({
      ...entry,
      estimatedPayout: Number(entry.totalStake.toFixed(2)),
    }));
  }

  if (!settlementDirection || totalPool <= 0) {
    return [];
  }

  const winnerPool = betRows
    .filter((row) => row.direction === settlementDirection)
    .reduce((sum, row) => sum + row.amount, 0);

  if (winnerPool <= 0) {
    return [];
  }

  const loserPool = totalPool - winnerPool;
  const grouped = new Map<
    string,
    { walletAddress: string; author: string; totalStake: number }
  >();

  for (const row of betRows.filter(
    (item) => item.direction === settlementDirection,
  )) {
    const current = grouped.get(row.wallet_address) ?? {
      walletAddress: row.wallet_address,
      author: row.author,
      totalStake: 0,
    };
    current.totalStake += row.amount;
    grouped.set(row.wallet_address, current);
  }

  return [...grouped.values()]
    .map((entry) => {
      const grossProfit = (entry.totalStake / winnerPool) * loserPool;
      const protocolFee = grossProfit * (market.protocol_fee_bps / 10_000);

      return {
        ...entry,
        estimatedPayout: Number(
          (entry.totalStake + grossProfit - protocolFee).toFixed(2),
        ),
      };
    })
    .sort((a, b) => b.estimatedPayout - a.estimatedPayout);
}

function upsertPredictionSettlementProjection(
  db: DatabaseSync,
  market: ForecastMarketRow,
) {
  if (
    market.status !== "resolved_yes" &&
    market.status !== "resolved_no" &&
    market.status !== "resolved_draw"
  ) {
    return;
  }

  const betRows = db
    .prepare(`
    SELECT amount
    FROM prediction_bets
    WHERE round_id = ?
      AND source_kind = 'onchain_sync'
  `)
    .all(market.contract_address) as Array<{ amount: number }>;

  const totalPool = betRows.reduce((sum, row) => sum + row.amount, 0);
  const payouts = buildPayoutPreviewRows(db, market);

  db.prepare(`
    INSERT INTO prediction_settlements (
      round_id, pair_id, pair_label, settlement_direction, settled_at, total_pool, payouts_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(round_id) DO UPDATE SET
      pair_id = excluded.pair_id,
      pair_label = excluded.pair_label,
      settlement_direction = excluded.settlement_direction,
      settled_at = excluded.settled_at,
      total_pool = excluded.total_pool,
      payouts_json = excluded.payouts_json
  `).run(
    market.contract_address,
    market.pair_id,
    market.pair_label,
    mapForecastStatusToSettlementDirection(market.status),
    market.resolved_at ?? market.close_time,
    Number(totalPool.toFixed(2)),
    JSON.stringify(payouts),
  );
}

async function syncForecastMarketTransactions(
  db: DatabaseSync,
  contractAddress: string,
) {
  const market = getForecastMarketRow(db, contractAddress);

  if (!market) {
    return false;
  }

  try {
    const response = await fetch(
      `${TONAPI_BASE_URL}/v2/blockchain/accounts/${encodeURIComponent(
        contractAddress,
      )}/transactions?limit=100`,
      {
        headers: process.env.TON_CONSOLE_API_KEY
          ? { Authorization: `Bearer ${process.env.TON_CONSOLE_API_KEY}` }
          : {},
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as {
      transactions?: Array<Record<string, unknown>>;
    };

    const transactions = [...(payload.transactions ?? [])].reverse();
    let sawContractActivity = false;

    for (const transaction of transactions) {
      const chainTxHash = extractTxHash(transaction);
      const incomingMessage = (transaction.in_msg ??
        transaction.inMessage) as Record<string, unknown> | null;
      const incomingPayload = extractForecastPayload(incomingMessage);
      const incomingMessageHash = extractMessageHash(incomingMessage);
      const createdAt = extractTransactionCreatedAt(transaction);
      const sourceValue =
        (incomingMessage?.source as
          | Record<string, unknown>
          | string
          | undefined) ??
        (incomingMessage?.src as
          | Record<string, unknown>
          | string
          | undefined) ??
        null;
      const sourceAddress =
        typeof sourceValue === "string"
          ? sourceValue
          : typeof sourceValue?.["address"] === "string"
            ? (sourceValue["address"] as string)
            : null;
      const normalizedSourceAddress = normalizeTonAddress(sourceAddress);

      if (!chainTxHash) {
        continue;
      }

      if (!market.deployment_tx_hash) {
        db.prepare(`
          UPDATE forecast_markets
          SET deployment_tx_hash = COALESCE(deployment_tx_hash, ?),
              status = CASE WHEN status = 'pending' THEN 'open' ELSE status END
          WHERE contract_address = ?
        `).run(chainTxHash, contractAddress);
      }

      if (!incomingPayload || !normalizedSourceAddress) {
        sawContractActivity = true;
        continue;
      }

      sawContractActivity = true;
      ensureProfile(db, normalizedSourceAddress);
      const profile = getProfileRow(db, normalizedSourceAddress);

      if (!profile) {
        continue;
      }

      if (
        incomingPayload.type === "bet_yes" ||
        incomingPayload.type === "bet_no"
      ) {
        const direction = forecastDirectionToPrediction(
          incomingPayload.type === "bet_yes" ? "yes" : "no",
        );
        const amount = Number(
          extractMessageTonValue(incomingMessage).toFixed(6),
        );

        if (!Number.isFinite(amount) || amount <= 0) {
          continue;
        }

        const exists = db
          .prepare("SELECT id FROM prediction_bets WHERE chain_tx_hash = ?")
          .get(chainTxHash) as { id: string } | undefined;

        if (!exists) {
          db.prepare(`
            INSERT INTO prediction_bets (
              id, round_id, pair_id, pair_label, wallet_address, author, amount, direction,
              created_at, source_message_hash, chain_tx_hash, confirmed_at, source_kind
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'onchain_sync')
          `).run(
            `forecast-${chainTxHash}`,
            contractAddress,
            market.pair_id,
            market.pair_label,
            normalizedSourceAddress,
            profile.display_name,
            amount,
            direction,
            createdAt,
            incomingMessageHash,
            chainTxHash,
            createdAt,
          );

          db.prepare(`
            INSERT INTO prediction_positions (pair_id, wallet_address, direction)
            VALUES (?, ?, ?)
            ON CONFLICT(pair_id, wallet_address) DO UPDATE SET direction = excluded.direction
          `).run(market.pair_id, normalizedSourceAddress, direction);

          db.prepare(`
            UPDATE profiles
            SET predictions_count = predictions_count + 1,
                total_points = total_points + 5
            WHERE wallet_address = ?
          `).run(normalizedSourceAddress);
        }

        continue;
      }

      if (incomingPayload.type === "lock_market") {
        db.prepare(`
          UPDATE forecast_markets
          SET status = 'locked'
          WHERE contract_address = ?
        `).run(contractAddress);
        continue;
      }

      if (incomingPayload.type === "resolve_market") {
        const nextStatus = computeForecastStatus(
          market,
          incomingPayload.finalPriceE9,
        );

        db.prepare(`
          UPDATE forecast_markets
          SET status = ?,
              final_price_e9 = ?,
              resolved_at = ?
          WHERE contract_address = ?
        `).run(
          nextStatus,
          incomingPayload.finalPriceE9,
          incomingPayload.resolvedAt > 0
            ? new Date(incomingPayload.resolvedAt * 1000).toISOString()
            : createdAt,
          contractAddress,
        );
        continue;
      }

      if (incomingPayload.type === "claim_reward_for") {
        db.prepare(`
          INSERT INTO forecast_auto_claims (
            market_address, wallet_address, requested_at, claimed_at, last_error
          ) VALUES (?, ?, ?, ?, NULL)
          ON CONFLICT(market_address, wallet_address) DO UPDATE SET
            claimed_at = excluded.claimed_at,
            last_error = NULL
        `).run(
          contractAddress,
          normalizeTonAddress(incomingPayload.walletAddress),
          createdAt,
          createdAt,
        );
      }
    }

    const onchainState = await readForecastMarketOnchainState(contractAddress);

    if (onchainState) {
      db.prepare(`
        UPDATE forecast_markets
        SET resolver_address = ?,
            treasury_address = ?,
            created_at = ?,
            close_time = ?,
            status = ?,
            final_price_e9 = ?,
            resolved_at = ?
        WHERE contract_address = ?
      `).run(
        onchainState.resolverAddress,
        onchainState.treasuryAddress,
        onchainState.createdAt,
        onchainState.closeTime,
        onchainState.status,
        onchainState.finalPriceE9 > 0 ? onchainState.finalPriceE9 : null,
        onchainState.resolvedAt,
        contractAddress,
      );
    }

    const refreshedMarket = getForecastMarketRow(db, contractAddress);

    if (!refreshedMarket) {
      return sawContractActivity;
    }

    if (refreshedMarket.status === "pending" && sawContractActivity) {
      db.prepare(`
        UPDATE forecast_markets
        SET status = CASE
          WHEN ? >= strftime('%s', close_time) THEN 'locked'
          ELSE 'open'
        END
        WHERE contract_address = ?
      `).run(Math.floor(Date.now() / 1000), contractAddress);
    } else if (
      refreshedMarket.status === "open" &&
      Date.now() >= new Date(refreshedMarket.close_time).getTime()
    ) {
      db.prepare(`
        UPDATE forecast_markets
        SET status = 'locked'
        WHERE contract_address = ?
      `).run(contractAddress);
    }

    const projectedMarket = getForecastMarketRow(db, contractAddress);

    if (projectedMarket) {
      upsertPredictionRoundProjection(db, projectedMarket);
      upsertPredictionSettlementProjection(db, projectedMarket);
    }

    return sawContractActivity;
  } catch {
    return false;
  }
}

function serializeStateInit(init: { code: Cell; data: Cell }) {
  const stateInit: StateInit = {
    $$type: "StateInit",
    code: init.code,
    data: init.data,
  };

  return beginCell()
    .store(storeStateInit(stateInit))
    .endCell()
    .toBoc()
    .toString("base64");
}

function toMarketSummary(row: ForecastMarketRow | null) {
  if (!row) {
    return null;
  }

  return {
    contractAddress: row.contract_address,
    pairId: row.pair_id,
    label: row.pair_label,
    tokenAddress: row.token_address,
    tokenSymbol: row.token_symbol,
    timeframeId: row.timeframe_id,
    timeframeSeconds: row.timeframe_seconds,
    thresholdBps: row.threshold_bps,
    referencePriceE9: row.reference_price_e9,
    createdAt: row.created_at,
    closeTime: row.close_time,
    status: row.status,
    finalPriceE9: row.final_price_e9,
    resolvedAt: row.resolved_at,
  };
}

function getForecastAutoClaimRow(
  db: DatabaseSync,
  marketAddress: string,
  walletAddress: string,
) {
  return (
    (db
      .prepare(`
        SELECT *
        FROM forecast_auto_claims
        WHERE market_address = ?
          AND wallet_address = ?
      `)
      .get(
        normalizeTonAddress(marketAddress),
        normalizeTonAddress(walletAddress),
      ) as ForecastAutoClaimRow | undefined) ?? null
  );
}

function markForecastAutoClaimRequested(
  db: DatabaseSync,
  marketAddress: string,
  walletAddress: string,
) {
  db.prepare(`
    INSERT INTO forecast_auto_claims (
      market_address, wallet_address, requested_at, claimed_at, last_error
    ) VALUES (?, ?, ?, NULL, NULL)
    ON CONFLICT(market_address, wallet_address) DO UPDATE SET
      requested_at = excluded.requested_at,
      last_error = NULL
  `).run(
    normalizeTonAddress(marketAddress),
    normalizeTonAddress(walletAddress),
    new Date().toISOString(),
  );
}

function markForecastAutoClaimSettled(
  db: DatabaseSync,
  marketAddress: string,
  walletAddress: string,
) {
  db.prepare(`
    INSERT INTO forecast_auto_claims (
      market_address, wallet_address, requested_at, claimed_at, last_error
    ) VALUES (?, ?, ?, ?, NULL)
    ON CONFLICT(market_address, wallet_address) DO UPDATE SET
      claimed_at = excluded.claimed_at,
      last_error = NULL
  `).run(
    normalizeTonAddress(marketAddress),
    normalizeTonAddress(walletAddress),
    new Date().toISOString(),
    new Date().toISOString(),
  );
}

function markForecastAutoClaimError(
  db: DatabaseSync,
  marketAddress: string,
  walletAddress: string,
  error: string,
) {
  db.prepare(`
    INSERT INTO forecast_auto_claims (
      market_address, wallet_address, requested_at, claimed_at, last_error
    ) VALUES (?, ?, ?, NULL, ?)
    ON CONFLICT(market_address, wallet_address) DO UPDATE SET
      requested_at = excluded.requested_at,
      last_error = excluded.last_error
  `).run(
    normalizeTonAddress(marketAddress),
    normalizeTonAddress(walletAddress),
    new Date().toISOString(),
    error,
  );
}

async function waitForForecastStatus(
  contractAddress: string,
  expectedStatuses: TonForecastMarketStatus[],
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < AUTO_CYCLE_CONFIRM_TIMEOUT_MS) {
    const state = await readForecastMarketOnchainState(contractAddress);

    if (state && expectedStatuses.includes(state.status)) {
      return state;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, AUTO_CYCLE_CONFIRM_POLL_MS),
    );
  }

  return null;
}

async function waitForForecastClaimed(
  contractAddress: string,
  walletAddress: string,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < AUTO_CYCLE_CONFIRM_TIMEOUT_MS) {
    const position = await readForecastPositionOnchain(
      contractAddress,
      walletAddress,
    );

    if (position?.claimed) {
      return true;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, AUTO_CYCLE_CONFIRM_POLL_MS),
    );
  }

  return false;
}

function getForecastMarketRowsForAutoCycle(
  db: DatabaseSync,
  input?: { pairId?: string; marketAddress?: string },
) {
  if (input?.marketAddress) {
    const row = getForecastMarketRow(
      db,
      normalizeTonAddress(input.marketAddress),
    );
    return row ? [row] : [];
  }

  if (input?.pairId) {
    return db
      .prepare(`
        SELECT *
        FROM forecast_markets
        WHERE pair_id = ?
        ORDER BY created_at DESC
        LIMIT 6
      `)
      .all(input.pairId) as ForecastMarketRow[];
  }

  return db
    .prepare(`
      SELECT *
      FROM forecast_markets
      WHERE status IN ('open', 'locked', 'resolved_yes', 'resolved_no', 'resolved_draw')
      ORDER BY close_time ASC
      LIMIT ?
    `)
    .all(AUTO_CYCLE_MARKET_LIMIT) as ForecastMarketRow[];
}

async function autoLockForecastMarket(
  db: DatabaseSync,
  market: ForecastMarketRow,
) {
  if (market.status !== "open") {
    return false;
  }

  if (Date.now() < new Date(market.close_time).getTime()) {
    return false;
  }

  await sendResolverMessage({
    to: market.contract_address,
    valueTon: getForecastClaimTriggerTon(),
    payloadBase64: buildTonForecastLockPayloadBase64(),
  });

  return Boolean(
    await waitForForecastStatus(market.contract_address, [
      "locked",
      "resolved_yes",
      "resolved_no",
      "resolved_draw",
    ]),
  );
}

async function autoResolveForecastMarket(
  db: DatabaseSync,
  market: ForecastMarketRow,
) {
  if (market.status !== "locked") {
    return false;
  }

  const resolverWallet = await getResolverWalletContext();

  if (
    !resolverWallet ||
    normalizeTonAddress(market.resolver_address) !==
      normalizeTonAddress(resolverWallet.address)
  ) {
    return false;
  }

  const snapshot = await resolveAssetSnapshot(market.token_address);

  await sendResolverMessage({
    to: market.contract_address,
    valueTon: getForecastClaimTriggerTon(),
    payloadBase64: buildTonForecastResolvePayloadBase64({
      finalPriceE9: snapshot.currentPriceE9,
      resolvedAt: Math.floor(Date.now() / 1000),
    }),
  });

  return Boolean(
    await waitForForecastStatus(market.contract_address, [
      "resolved_yes",
      "resolved_no",
      "resolved_draw",
    ]),
  );
}

function getForecastWinningWallets(
  db: DatabaseSync,
  market: ForecastMarketRow,
) {
  const settlementDirection = mapForecastStatusToSettlementDirection(
    market.status,
  );
  const betRows = db
    .prepare(`
      SELECT wallet_address, direction, SUM(amount) AS total_amount
      FROM prediction_bets
      WHERE round_id = ?
        AND source_kind = 'onchain_sync'
      GROUP BY wallet_address, direction
      ORDER BY MAX(created_at) DESC
    `)
    .all(market.contract_address) as Array<{
    wallet_address: string;
    direction: PredictionDirection;
    total_amount: number;
  }>;

  if (market.status === "resolved_draw") {
    return [...new Set(betRows.map((row) => row.wallet_address))];
  }

  if (!settlementDirection) {
    return [];
  }

  return betRows
    .filter(
      (row) => row.direction === settlementDirection && row.total_amount > 0,
    )
    .map((row) => row.wallet_address);
}

async function autoClaimForecastMarket(
  db: DatabaseSync,
  market: ForecastMarketRow,
) {
  if (
    market.status !== "resolved_yes" &&
    market.status !== "resolved_no" &&
    market.status !== "resolved_draw"
  ) {
    return 0;
  }

  const resolverWallet = await getResolverWalletContext();

  if (!resolverWallet) {
    return 0;
  }

  let processedCount = 0;
  const wallets = getForecastWinningWallets(db, market).slice(
    0,
    AUTO_CYCLE_CLAIM_LIMIT,
  );

  for (const walletAddress of wallets) {
    const normalizedWallet = normalizeTonAddress(walletAddress);
    const position = await readForecastPositionOnchain(
      market.contract_address,
      normalizedWallet,
    );

    if (!position || position.claimed) {
      markForecastAutoClaimSettled(
        db,
        market.contract_address,
        normalizedWallet,
      );
      continue;
    }

    const existingAutoClaim = getForecastAutoClaimRow(
      db,
      market.contract_address,
      normalizedWallet,
    );

    if (shouldSkipAutoClaim(existingAutoClaim)) {
      continue;
    }

    try {
      markForecastAutoClaimRequested(
        db,
        market.contract_address,
        normalizedWallet,
      );

      await sendResolverMessage({
        to: market.contract_address,
        valueTon: getForecastClaimTriggerTon(),
        payloadBase64: buildTonForecastClaimForPayloadBase64({
          walletAddress: normalizedWallet,
        }),
      });

      const claimed = await waitForForecastClaimed(
        market.contract_address,
        normalizedWallet,
      );

      if (claimed) {
        markForecastAutoClaimSettled(
          db,
          market.contract_address,
          normalizedWallet,
        );
        processedCount += 1;
      } else {
        markForecastAutoClaimError(
          db,
          market.contract_address,
          normalizedWallet,
          "claim_confirmation_timeout",
        );
      }
    } catch (error) {
      markForecastAutoClaimError(
        db,
        market.contract_address,
        normalizedWallet,
        error instanceof Error ? error.message : "claim_failed",
      );
    }
  }

  return processedCount;
}

export async function runForecastAutoCycle(input?: {
  pairId?: string;
  marketAddress?: string;
}) {
  const db = await ensureForecastDatabase();
  const autoCycleEnabled = getForecastAutoCycleEnabled();
  const markets = getForecastMarketRowsForAutoCycle(db, input);
  const summary = {
    scanned: markets.length,
    locked: 0,
    resolved: 0,
    autoClaimed: 0,
    automationAvailable: false,
  };

  if (markets.length === 0) {
    return summary;
  }

  const resolverWallet = await getResolverWalletContext();
  summary.automationAvailable = autoCycleEnabled && Boolean(resolverWallet);

  for (const marketRow of markets) {
    await syncForecastMarketTransactions(db, marketRow.contract_address);
    let market = getForecastMarketRow(db, marketRow.contract_address);

    if (!market) {
      continue;
    }

    if (summary.automationAvailable && market.status === "open") {
      const locked = await autoLockForecastMarket(db, market);
      if (locked) {
        summary.locked += 1;
        await syncForecastMarketTransactions(db, market.contract_address);
        market = getForecastMarketRow(db, market.contract_address) ?? market;
      }
    }

    if (summary.automationAvailable && market.status === "locked") {
      const resolved = await autoResolveForecastMarket(db, market);
      if (resolved) {
        summary.resolved += 1;
        await syncForecastMarketTransactions(db, market.contract_address);
        market = getForecastMarketRow(db, market.contract_address) ?? market;
      }
    }

    if (
      summary.automationAvailable &&
      (market.status === "resolved_yes" ||
        market.status === "resolved_no" ||
        market.status === "resolved_draw")
    ) {
      summary.autoClaimed += await autoClaimForecastMarket(db, market);
      await syncForecastMarketTransactions(db, market.contract_address);
    }
  }

  return summary;
}

export async function getForecastMarketContext(input: {
  tokenAddress: string;
  timeframeId: string;
}) {
  if (!isPredictionTimeframeId(input.timeframeId)) {
    throw new Error("Unsupported forecast timeframe.");
  }

  const db = await ensureForecastDatabase();
  const tokenAddress = normalizeTonAddress(input.tokenAddress);
  const pairId = buildPredictionTokenMarketId(tokenAddress, input.timeframeId);
  await runForecastAutoCycle({ pairId });
  const activeMarket = getActiveForecastMarketRow(db, pairId);

  if (activeMarket) {
    await syncForecastMarketTransactions(db, activeMarket.contract_address);
  }

  const refreshedActiveMarket = getActiveForecastMarketRow(db, pairId);
  const snapshot = await resolveAssetSnapshot(tokenAddress);

  return {
    pairId,
    tokenAddress,
    tokenSymbol: snapshot.tokenSymbol,
    timeframeId: input.timeframeId,
    timeframeSeconds: getPredictionTimeframeSeconds(input.timeframeId),
    currentPriceUsd: snapshot.currentPriceUsd,
    currentPriceE9: snapshot.currentPriceE9,
    thresholdPresetsBps: getForecastThresholdPresetsBps(),
    canCreate: !refreshedActiveMarket,
    activeMarket: toMarketSummary(refreshedActiveMarket),
  };
}

export async function createForecastMarketIntent(input: {
  walletAddress: string;
  tokenAddress: string;
  timeframeId: PredictionTimeframeId;
  direction: PredictionDirection;
  amountTon: number;
  thresholdBps?: number;
}) {
  const db = await ensureForecastDatabase();
  const walletAddress = normalizeTonAddress(input.walletAddress);
  const tokenAddress = normalizeTonAddress(input.tokenAddress);

  if (!walletAddress || !tokenAddress) {
    throw new Error("Wallet and token address are required.");
  }

  const context = await getForecastMarketContext({
    tokenAddress,
    timeframeId: input.timeframeId,
  });
  const activeMarketRow = getActiveForecastMarketRow(db, context.pairId);

  if (context.activeMarket) {
    if (isPendingUndeployedMarket(activeMarketRow)) {
      const pendingIntent = await buildPendingForecastDeployBetIntent({
        market: activeMarketRow!,
        direction: input.direction,
        amountTon: input.amountTon,
      });

      return {
        ok: true,
        ...pendingIntent,
        state: await getCommunityState(walletAddress),
      };
    }

    return {
      ok: false,
      reason: "active_market_exists" as const,
      context,
      state: await getCommunityState(walletAddress),
    };
  }

  const thresholdBps =
    input.thresholdBps && Number.isFinite(input.thresholdBps)
      ? input.thresholdBps
      : (context.thresholdPresetsBps[0] ?? 100);
  const createdAtUnix = Math.floor(Date.now() / 1000);
  const timeframeSeconds = getPredictionTimeframeSeconds(input.timeframeId);
  const closeTimeUnix = createdAtUnix + timeframeSeconds;
  const syncCursor = new Date().toISOString();
  const pairLabel = createForecastPairLabel(
    context.tokenSymbol,
    input.timeframeId,
  );
  const marketTitle = createForecastMarketTitle(
    context.tokenSymbol,
    input.timeframeId,
  );
  const marketId = createForecastMarketId({
    tokenAddress,
    timeframeId: input.timeframeId,
    createdAtUnix,
  });
  const resolverAddress = await resolveForecastResolverAddress(walletAddress);
  const contract = await TonForecastMarket.fromInit(
    Address.parse(walletAddress),
    Address.parse(resolverAddress),
    Address.parse(getForecastTreasuryAddress()),
    Address.parse(tokenAddress),
    context.tokenSymbol,
    marketId,
    marketTitle,
    input.timeframeId,
    BigInt(timeframeSeconds),
    BigInt(thresholdBps),
    BigInt(context.currentPriceE9),
    BigInt(getForecastProtocolFeeBps()),
    BigInt(createdAtUnix),
    BigInt(closeTimeUnix),
  );
  const contractAddress = contract.address.toString();

  db.prepare(`
    INSERT OR REPLACE INTO forecast_markets (
      contract_address, pair_id, pair_label, token_address, token_symbol, timeframe_id,
      timeframe_seconds, threshold_bps, reference_price_e9, protocol_fee_bps,
      owner_address, resolver_address, treasury_address, created_at, close_time,
      deployment_message_hash, deployment_tx_hash, status, final_price_e9, resolved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'pending', NULL, NULL)
  `).run(
    contractAddress,
    context.pairId,
    pairLabel,
    tokenAddress,
    context.tokenSymbol,
    input.timeframeId,
    timeframeSeconds,
    thresholdBps,
    context.currentPriceE9,
    getForecastProtocolFeeBps(),
    walletAddress,
    resolverAddress,
    getForecastTreasuryAddress(),
    new Date(createdAtUnix * 1000).toISOString(),
    new Date(closeTimeUnix * 1000).toISOString(),
  );

  return {
    ok: true,
    market: {
      contractAddress,
      pairId: context.pairId,
      label: pairLabel,
      tokenAddress,
      tokenSymbol: context.tokenSymbol,
      timeframeId: input.timeframeId,
      timeframeSeconds,
      thresholdBps,
      referencePriceE9: context.currentPriceE9,
      createdAt: new Date(createdAtUnix * 1000).toISOString(),
      closeTime: new Date(closeTimeUnix * 1000).toISOString(),
      status: "pending" as const,
    },
    tonConnect: {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: contractAddress,
          amount: (
            toNano(getForecastDeployReserveTon()) +
            toNano(String(input.amountTon))
          ).toString(),
          stateInit: serializeStateInit(contract.init!),
          payload: buildTonForecastBetPayloadBase64(
            predictionDirectionToForecast(input.direction),
          ),
        },
      ],
    },
    syncCursor,
    state: await getCommunityState(walletAddress),
  };
}

export async function createForecastBetIntent(input: {
  walletAddress: string;
  pairId: string;
  direction: PredictionDirection;
  amountTon: number;
}) {
  const db = await ensureForecastDatabase();
  const walletAddress = normalizeTonAddress(input.walletAddress);
  await runForecastAutoCycle({ pairId: input.pairId });
  const activeMarket = getActiveForecastMarketRow(db, input.pairId);

  if (!walletAddress || !activeMarket) {
    return {
      ok: false,
      state: await getCommunityState(walletAddress || null),
    };
  }

  if (isPendingUndeployedMarket(activeMarket)) {
    const pendingIntent = await buildPendingForecastDeployBetIntent({
      market: activeMarket,
      direction: input.direction,
      amountTon: input.amountTon,
    });

    return {
      ok: true,
      ...pendingIntent,
      state: await getCommunityState(walletAddress),
    };
  }

  if (activeMarket.status !== "open") {
    return {
      ok: false,
      state: await getCommunityState(walletAddress),
    };
  }

  return {
    ok: true,
    market: toMarketSummary(activeMarket),
    tonConnect: {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        buildTonForecastBetTransferMessage({
          contractAddress: activeMarket.contract_address,
          direction: predictionDirectionToForecast(input.direction),
          amountTon: input.amountTon,
        }),
      ],
    },
    syncCursor: new Date().toISOString(),
    state: await getCommunityState(walletAddress),
  };
}

export async function syncForecastMarket(input: {
  walletAddress: string;
  pairId?: string;
  marketAddress?: string;
  syncCursor?: string;
}) {
  const db = await ensureForecastDatabase();
  const walletAddress = normalizeTonAddress(input.walletAddress);
  await runForecastAutoCycle({
    pairId: input.pairId,
    marketAddress: input.marketAddress,
  });
  const market =
    (input.marketAddress
      ? getForecastMarketRow(db, normalizeTonAddress(input.marketAddress))
      : null) ??
    (input.pairId ? getActiveForecastMarketRow(db, input.pairId) : null);

  if (!walletAddress || !market) {
    return {
      result: false,
      syncStatus: "missing" as const,
      state: await getCommunityState(walletAddress || null),
    };
  }

  const synced = await syncForecastMarketTransactions(
    db,
    market.contract_address,
  );
  const updatedMarket = getForecastMarketRow(db, market.contract_address);

  const confirmedBet = db
    .prepare(`
      SELECT id
      FROM prediction_bets
      WHERE wallet_address = ?
        AND round_id = ?
        AND source_kind = 'onchain_sync'
        AND (? IS NULL OR created_at >= ?)
      LIMIT 1
    `)
    .get(
      walletAddress,
      market.contract_address,
      input.syncCursor ?? null,
      input.syncCursor ?? null,
    ) as { id: string } | undefined;

  return {
    result: Boolean(confirmedBet),
    syncStatus: confirmedBet
      ? ("confirmed" as const)
      : synced
        ? ("pending" as const)
        : ("missing" as const),
    market: toMarketSummary(updatedMarket),
    state: await getCommunityState(walletAddress),
  };
}

export async function createForecastClaimIntent(input: {
  walletAddress: string;
  marketAddress: string;
}) {
  const db = await ensureForecastDatabase();
  const walletAddress = normalizeTonAddress(input.walletAddress);
  const marketAddress = normalizeTonAddress(input.marketAddress);
  const market = getForecastMarketRow(db, marketAddress);

  if (!walletAddress || !market) {
    return {
      ok: false,
      state: await getCommunityState(walletAddress || null),
    };
  }

  await syncForecastMarketTransactions(db, marketAddress);
  const refreshedMarket = getForecastMarketRow(db, marketAddress);

  if (
    !refreshedMarket ||
    (refreshedMarket.status !== "resolved_yes" &&
      refreshedMarket.status !== "resolved_no" &&
      refreshedMarket.status !== "resolved_draw")
  ) {
    return {
      ok: false,
      state: await getCommunityState(walletAddress),
    };
  }

  return {
    ok: true,
    market: toMarketSummary(refreshedMarket),
    tonConnect: {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: marketAddress,
          amount: toNano(getForecastClaimTriggerTon()).toString(),
          payload: buildTonForecastClaimPayloadBase64(),
        },
      ],
    },
    state: await getCommunityState(walletAddress),
  };
}

export async function createForecastResolveIntent(input: {
  walletAddress: string;
  marketAddress: string;
  finalPriceE9: number;
  resolvedAt?: number;
}) {
  const db = await ensureForecastDatabase();
  const walletAddress = normalizeTonAddress(input.walletAddress);
  const marketAddress = normalizeTonAddress(input.marketAddress);
  const market = getForecastMarketRow(db, marketAddress);

  if (!walletAddress || !market) {
    return {
      ok: false,
      state: await getCommunityState(walletAddress || null),
    };
  }

  if (normalizeTonAddress(market.resolver_address) !== walletAddress) {
    return {
      ok: false,
      reason: "resolver_only" as const,
      state: await getCommunityState(walletAddress),
    };
  }

  return {
    ok: true,
    market: toMarketSummary(market),
    tonConnect: {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: marketAddress,
          amount: toNano(getForecastClaimTriggerTon()).toString(),
          payload: buildTonForecastResolvePayloadBase64({
            finalPriceE9: Math.max(1, Math.round(input.finalPriceE9)),
            resolvedAt:
              input.resolvedAt && Number.isFinite(input.resolvedAt)
                ? Math.max(1, Math.round(input.resolvedAt))
                : Math.floor(Date.now() / 1000),
          }),
        },
      ],
    },
    state: await getCommunityState(walletAddress),
  };
}

export async function createForecastLockIntent(input: {
  walletAddress: string;
  marketAddress: string;
}) {
  const db = await ensureForecastDatabase();
  const walletAddress = normalizeTonAddress(input.walletAddress);
  const marketAddress = normalizeTonAddress(input.marketAddress);
  const market = getForecastMarketRow(db, marketAddress);

  if (!walletAddress || !market) {
    return {
      ok: false,
      state: await getCommunityState(walletAddress || null),
    };
  }

  return {
    ok: true,
    market: toMarketSummary(market),
    tonConnect: {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: marketAddress,
          amount: toNano(getForecastClaimTriggerTon()).toString(),
          payload: buildTonForecastLockPayloadBase64(),
        },
      ],
    },
    state: await getCommunityState(walletAddress),
  };
}
