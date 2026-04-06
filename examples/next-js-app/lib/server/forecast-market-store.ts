import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  Address,
  beginCell,
  Cell,
  storeStateInit as storeCoreStateInit,
  toNano,
  type StateInit as TonCoreStateInit,
} from "@ton/core";
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
import { TonForecastMarket } from "@ston-pulse/prediction-market-contract/ton-forecast-market";

import type {
  PredictionDirection,
  PredictionSettlementDirection,
} from "@/lib/community";
import {
  ensureCommunityDatabaseReady,
  getCommunityState,
} from "@/lib/server/community-store";
import {
  logRuntimeError,
  logRuntimeMessage,
} from "@/lib/server/runtime-logger";
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
import {
  ensureRuntimeDatabaseScopeInitialized,
  withRuntimeDatabaseSession,
} from "@/lib/server/runtime-database-session";
import { getRuntimeStorageDiagnostics } from "@/lib/server/runtime-storage";
import { tonApiClient } from "@/lib/ton-api-client";

const TONAPI_BASE_URL = process.env.TON_CONSOLE_API_URL ?? "https://tonapi.io";
const AUTO_CLAIM_RETRY_WINDOW_MS = 2 * 60 * 1000;
const AUTO_CYCLE_MARKET_LIMIT = 25;
const AUTO_CYCLE_CLAIM_LIMIT = 25;
const AUTO_CYCLE_CONFIRM_TIMEOUT_MS = 12_000;
const AUTO_CYCLE_CONFIRM_POLL_MS = 1_500;
const AUTO_CYCLE_RUN_HISTORY_LIMIT = 120;

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

type ForecastAutoCycleRunRow = {
  id: string;
  trigger_pair_id: string | null;
  trigger_market_address: string | null;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  scanned: number;
  locked_count: number;
  resolved_count: number;
  auto_claimed_count: number;
  automation_available: number;
  resolver_address: string | null;
  error_message: string | null;
  duration_ms: number | null;
};

type ForecastWalletState = {
  walletAddress: string;
  hasPosition: boolean;
  yesStakeTon: number;
  noStakeTon: number;
  totalStakeTon: number;
  claimed: boolean;
  claimable: boolean;
  winningSide: PredictionDirection | "draw" | null;
  isResolver: boolean;
  canLock: boolean;
  canResolve: boolean;
};

const STALE_PENDING_MARKET_WINDOW_MS = 15 * 60 * 1000;

function normalizeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return fallback;
}

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

function toTonConnectDeployAddress(address: Address) {
  return address.toString({
    bounceable: false,
    urlSafe: true,
    testOnly: false,
  });
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
  const contract = await TonForecastMarket.fromInit(
    Address.parse(input.market.owner_address),
    Address.parse(input.market.resolver_address),
    Address.parse(input.market.treasury_address),
    Address.parse(input.market.token_address),
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
          address: toTonConnectDeployAddress(contract.address),
          amount: (
            toNano(getForecastDeployReserveTon()) +
            toNano(String(input.amountTon))
          ).toString(),
          stateInit: serializeStateInit(contract.init!),
          payload: buildTonForecastBetPayloadBase64({
            direction: predictionDirectionToForecast(input.direction),
            amountTon: input.amountTon,
          }),
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

function getExplicitForecastResolverAddress() {
  const explicitResolver =
    process.env.NEXT_PUBLIC_FORECAST_RESOLVER_ADDRESS?.trim() ||
    process.env.FORECAST_RESOLVER_ADDRESS?.trim() ||
    "";

  return explicitResolver ? normalizeTonAddress(explicitResolver) : "";
}

function fromNanoToTonNumber(value: bigint) {
  return Number(value) / 1_000_000_000;
}

function getRecommendedResolverBalanceNano() {
  return (
    toNano(getForecastDeployReserveTon()) +
    toNano(getForecastClaimTriggerTon()) * BigInt(AUTO_CYCLE_CLAIM_LIMIT)
  );
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

async function tryGetResolverWalletContext() {
  try {
    return {
      context: await getResolverWalletContext(),
      error: null,
    };
  } catch (error) {
    return {
      context: null,
      error: normalizeErrorMessage(error, "resolver_wallet_unavailable"),
    };
  }
}

async function resolveForecastResolverAddress(ownerAddress?: string | null) {
  const explicitResolver = getExplicitForecastResolverAddress();

  if (explicitResolver) {
    return explicitResolver;
  }

  const resolverWallet = await getResolverWalletContext();

  if (resolverWallet?.address) {
    return normalizeTonAddress(resolverWallet.address);
  }

  return normalizeTonAddress(ownerAddress);
}

async function ensureForecastDatabase() {
  await ensureCommunityDatabaseReady();
  return ensureRuntimeDatabaseScopeInitialized(
    "forecast-market-store",
    (db) => {
      db.exec(`
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

        CREATE TABLE IF NOT EXISTS forecast_auto_cycle_runs (
          id TEXT PRIMARY KEY,
          trigger_pair_id TEXT,
          trigger_market_address TEXT,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          status TEXT NOT NULL,
          scanned INTEGER NOT NULL DEFAULT 0,
          locked_count INTEGER NOT NULL DEFAULT 0,
          resolved_count INTEGER NOT NULL DEFAULT 0,
          auto_claimed_count INTEGER NOT NULL DEFAULT 0,
          automation_available INTEGER NOT NULL DEFAULT 0,
          resolver_address TEXT,
          error_message TEXT,
          duration_ms INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_forecast_auto_cycle_runs_started
        ON forecast_auto_cycle_runs(started_at DESC);
      `);
    },
  );
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

function readForecastPositionFallback(
  db: DatabaseSync,
  market: ForecastMarketRow,
  walletAddress: string,
) {
  const betRows = db
    .prepare(`
      SELECT direction, amount
      FROM prediction_bets
      WHERE round_id = ?
        AND wallet_address = ?
        AND source_kind = 'onchain_sync'
    `)
    .all(market.contract_address, walletAddress) as Array<{
    direction: PredictionDirection;
    amount: number;
  }>;

  const yesStake = betRows
    .filter((row) => row.direction === "up")
    .reduce((sum, row) => sum + row.amount, 0);
  const noStake = betRows
    .filter((row) => row.direction === "down")
    .reduce((sum, row) => sum + row.amount, 0);
  const autoClaim = getForecastAutoClaimRow(
    db,
    market.contract_address,
    walletAddress,
  );

  if (yesStake <= 0 && noStake <= 0 && !autoClaim?.claimed_at) {
    return null;
  }

  return {
    yesStake,
    noStake,
    claimed: Boolean(autoClaim?.claimed_at),
  };
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
  action: "deploy" | "lock" | "resolve" | "claim";
  to: string;
  valueTon: string;
  payloadBase64?: string | null;
  bounce?: boolean;
  init?: { code: Cell; data: Cell } | null;
  marketAddress?: string;
  walletAddress?: string;
}) {
  const resolverWallet = await getResolverWalletContext();

  if (!resolverWallet) {
    return { ok: false as const, reason: "resolver_wallet_missing" as const };
  }

  const seqno = await resolverWallet.wallet.getSeqno();

  await logRuntimeMessage({
    scope: "forecast-market-store.resolver-message",
    message: "Sending resolver wallet message",
    path: input.marketAddress ?? input.to,
    metadata: {
      action: input.action,
      target: normalizeTonAddress(input.to),
      marketAddress: input.marketAddress
        ? normalizeTonAddress(input.marketAddress)
        : null,
      walletAddress: input.walletAddress
        ? normalizeTonAddress(input.walletAddress)
        : null,
      resolverAddress: normalizeTonAddress(resolverWallet.address),
      valueTon: input.valueTon,
      seqno,
    },
  });

  try {
    await resolverWallet.wallet.sendTransfer({
      seqno,
      secretKey: resolverWallet.secretKey,
      messages: [
        internal({
          to: Address.parse(input.to),
          value: toNano(input.valueTon),
          bounce: input.bounce ?? true,
          init: input.init ?? undefined,
          body: input.payloadBase64
            ? encodeForecastBody(input.payloadBase64)
            : Cell.EMPTY,
        }),
      ],
    });

    const seqnoIncremented = await waitForResolverSeqnoIncrement(
      resolverWallet.wallet,
      seqno,
    );

    await logRuntimeMessage({
      level: seqnoIncremented ? "info" : "warn",
      scope: "forecast-market-store.resolver-message",
      message: seqnoIncremented
        ? "Resolver wallet message confirmed by seqno increment"
        : "Resolver wallet message sent without seqno confirmation before timeout",
      path: input.marketAddress ?? input.to,
      metadata: {
        action: input.action,
        target: normalizeTonAddress(input.to),
        marketAddress: input.marketAddress
          ? normalizeTonAddress(input.marketAddress)
          : null,
        walletAddress: input.walletAddress
          ? normalizeTonAddress(input.walletAddress)
          : null,
        resolverAddress: normalizeTonAddress(resolverWallet.address),
        seqno,
        seqnoIncremented,
      },
    });

    return {
      ok: true as const,
      resolverAddress: resolverWallet.address,
      seqnoIncremented,
    };
  } catch (error) {
    await logRuntimeError({
      scope: "forecast-market-store.resolver-message",
      error,
      fallbackMessage: "Failed to send resolver wallet message",
      path: input.marketAddress ?? input.to,
      metadata: {
        action: input.action,
        target: normalizeTonAddress(input.to),
        marketAddress: input.marketAddress
          ? normalizeTonAddress(input.marketAddress)
          : null,
        walletAddress: input.walletAddress
          ? normalizeTonAddress(input.walletAddress)
          : null,
        resolverAddress: normalizeTonAddress(resolverWallet.address),
        valueTon: input.valueTon,
        seqno,
      },
    });
    throw error;
  }
}

async function ensureForecastMarketDeployed(
  db: DatabaseSync,
  market: ForecastMarketRow,
) {
  if (market.deployment_tx_hash) {
    return market;
  }

  const existingOnchainState = await readForecastMarketOnchainState(
    market.contract_address,
  );

  if (existingOnchainState) {
    await syncForecastMarketTransactions(db, market.contract_address);
    return getForecastMarketRow(db, market.contract_address) ?? market;
  }

  if (!isPredictionTimeframeId(market.timeframe_id)) {
    return market;
  }

  const resolverWallet = await getResolverWalletContext();

  if (
    !resolverWallet ||
    normalizeTonAddress(market.resolver_address) !==
      normalizeTonAddress(resolverWallet.address)
  ) {
    return market;
  }

  const contract = await TonForecastMarket.fromInit(
    Address.parse(market.owner_address),
    Address.parse(market.resolver_address),
    Address.parse(market.treasury_address),
    Address.parse(market.token_address),
    BigInt(market.timeframe_seconds),
    BigInt(market.threshold_bps),
    BigInt(market.reference_price_e9),
    BigInt(market.protocol_fee_bps),
    BigInt(toUnixSeconds(market.created_at)),
    BigInt(toUnixSeconds(market.close_time)),
  );

  await sendResolverMessage({
    action: "deploy",
    to: contract.address.toString(),
    valueTon: getForecastDeployReserveTon(),
    bounce: false,
    init: contract.init,
    marketAddress: contract.address.toString(),
  });

  await waitForForecastStatus(contract.address.toString(), [
    "open",
    "locked",
    "resolved_yes",
    "resolved_no",
    "resolved_draw",
  ]);
  await syncForecastMarketTransactions(db, contract.address.toString());

  return getForecastMarketRow(db, contract.address.toString()) ?? market;
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

function getLatestForecastMarketRow(
  db: DatabaseSync,
  pairId: string,
): ForecastMarketRow | null {
  const rows = db
    .prepare(`
    SELECT *
    FROM forecast_markets
    WHERE pair_id = ?
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

async function syncForecastContextMarkets(db: DatabaseSync, pairId: string) {
  const activeMarket = getActiveForecastMarketRow(db, pairId);
  const latestMarket = getLatestForecastMarketRow(db, pairId);
  const contractAddresses = [
    ...new Set([
      activeMarket?.contract_address ?? null,
      latestMarket?.contract_address ?? null,
    ]),
  ].filter((value): value is string => Boolean(value));

  for (const contractAddress of contractAddresses) {
    await syncForecastMarketTransactions(db, contractAddress);
  }
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
): PredictionSettlementDirection | null {
  if (status === "resolved_yes") {
    return "up" as const;
  }

  if (status === "resolved_no") {
    return "down" as const;
  }

  if (status === "resolved_draw") {
    return "draw" as const;
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
        const amountSource =
          incomingPayload.stakeAmountTon ??
          extractMessageTonValue(incomingMessage);
        const amount = Number(amountSource.toFixed(6));

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

      if (
        incomingPayload.type === "claim_reward" ||
        incomingPayload.type === "claim_reward_for"
      ) {
        const claimedWallet =
          incomingPayload.type === "claim_reward_for"
            ? normalizeTonAddress(incomingPayload.walletAddress)
            : normalizedSourceAddress;

        if (!claimedWallet) {
          continue;
        }

        db.prepare(`
          INSERT INTO forecast_auto_claims (
            market_address, wallet_address, requested_at, claimed_at, last_error
          ) VALUES (?, ?, ?, ?, NULL)
          ON CONFLICT(market_address, wallet_address) DO UPDATE SET
            claimed_at = excluded.claimed_at,
            last_error = NULL
        `).run(contractAddress, claimedWallet, createdAt, createdAt);
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
  } catch (error) {
    await logRuntimeError({
      scope: "forecast-market-store.sync-transactions",
      error,
      fallbackMessage: "Failed to sync forecast market transactions",
      path: contractAddress,
      metadata: {
        contractAddress,
      },
    });
    return false;
  }
}

function serializeStateInit(init: { code: Cell; data: Cell }) {
  const stateInit: TonCoreStateInit = {
    code: init.code,
    data: init.data,
  };

  return beginCell()
    .store(storeCoreStateInit(stateInit))
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

function isResolvedForecastStatus(status: TonForecastMarketStatus) {
  return (
    status === "resolved_yes" ||
    status === "resolved_no" ||
    status === "resolved_draw"
  );
}

function resolveForecastWinningSide(status: TonForecastMarketStatus) {
  if (status === "resolved_yes") {
    return "up" as const;
  }

  if (status === "resolved_no") {
    return "down" as const;
  }

  if (status === "resolved_draw") {
    return "draw" as const;
  }

  return null;
}

async function buildForecastWalletState(
  market: ForecastMarketRow,
  walletAddress?: string | null,
): Promise<ForecastWalletState | null> {
  const normalizedWalletAddress = normalizeTonAddress(walletAddress);

  if (!normalizedWalletAddress) {
    return null;
  }

  const position =
    (await readForecastPositionOnchain(
      market.contract_address,
      normalizedWalletAddress,
    )) ??
    readForecastPositionFallback(
      await ensureForecastDatabase(),
      market,
      normalizedWalletAddress,
    );
  const yesStakeTon = Number((position?.yesStake ?? 0).toFixed(6));
  const noStakeTon = Number((position?.noStake ?? 0).toFixed(6));
  const totalStakeTon = Number((yesStakeTon + noStakeTon).toFixed(6));
  const winningSide = resolveForecastWinningSide(market.status);
  const hasPosition = totalStakeTon > 0;
  const claimed = position?.claimed ?? false;
  const canLock =
    market.status === "open" &&
    Date.now() >= new Date(market.close_time).getTime();
  const isResolver =
    normalizeTonAddress(market.resolver_address) === normalizedWalletAddress;
  const canResolve =
    isResolver &&
    Date.now() >= new Date(market.close_time).getTime() &&
    (market.status === "open" || market.status === "locked");
  const claimable =
    hasPosition &&
    !claimed &&
    (winningSide === "draw"
      ? totalStakeTon > 0
      : winningSide === "up"
        ? yesStakeTon > 0
        : winningSide === "down"
          ? noStakeTon > 0
          : false);

  return {
    walletAddress: normalizedWalletAddress,
    hasPosition,
    yesStakeTon,
    noStakeTon,
    totalStakeTon,
    claimed,
    claimable,
    winningSide,
    isResolver,
    canLock,
    canResolve,
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

function pruneForecastAutoCycleRuns(db: DatabaseSync) {
  db.prepare(`
    DELETE FROM forecast_auto_cycle_runs
    WHERE id NOT IN (
      SELECT id
      FROM forecast_auto_cycle_runs
      ORDER BY started_at DESC
      LIMIT ?
    )
  `).run(AUTO_CYCLE_RUN_HISTORY_LIMIT);
}

function startForecastAutoCycleRun(
  db: DatabaseSync,
  input: {
    pairId?: string;
    marketAddress?: string;
    scanned: number;
    automationAvailable: boolean;
    resolverAddress?: string | null;
  },
) {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO forecast_auto_cycle_runs (
      id, trigger_pair_id, trigger_market_address, started_at, status, scanned,
      automation_available, resolver_address
    ) VALUES (?, ?, ?, ?, 'running', ?, ?, ?)
  `).run(
    runId,
    input.pairId ?? null,
    input.marketAddress ? normalizeTonAddress(input.marketAddress) : null,
    startedAt,
    input.scanned,
    input.automationAvailable ? 1 : 0,
    input.resolverAddress ? normalizeTonAddress(input.resolverAddress) : null,
  );

  pruneForecastAutoCycleRuns(db);

  return {
    id: runId,
    startedAt,
  };
}

function completeForecastAutoCycleRun(
  db: DatabaseSync,
  runId: string,
  startedAt: string,
  summary: {
    scanned: number;
    locked: number;
    resolved: number;
    autoClaimed: number;
    automationAvailable: boolean;
    resolverAddress?: string | null;
  },
) {
  const completedAt = new Date().toISOString();
  const durationMs = Math.max(0, Date.now() - new Date(startedAt).getTime());

  db.prepare(`
    UPDATE forecast_auto_cycle_runs
    SET completed_at = ?,
        status = 'completed',
        scanned = ?,
        locked_count = ?,
        resolved_count = ?,
        auto_claimed_count = ?,
        automation_available = ?,
        resolver_address = ?,
        error_message = NULL,
        duration_ms = ?
    WHERE id = ?
  `).run(
    completedAt,
    summary.scanned,
    summary.locked,
    summary.resolved,
    summary.autoClaimed,
    summary.automationAvailable ? 1 : 0,
    summary.resolverAddress
      ? normalizeTonAddress(summary.resolverAddress)
      : null,
    durationMs,
    runId,
  );
}

function failForecastAutoCycleRun(
  db: DatabaseSync,
  runId: string,
  startedAt: string,
  errorMessage: string,
) {
  const completedAt = new Date().toISOString();
  const durationMs = Math.max(0, Date.now() - new Date(startedAt).getTime());

  db.prepare(`
    UPDATE forecast_auto_cycle_runs
    SET completed_at = ?,
        status = 'failed',
        error_message = ?,
        duration_ms = ?
    WHERE id = ?
  `).run(completedAt, errorMessage, durationMs, runId);
}

function getRecentForecastAutoCycleRuns(db: DatabaseSync, limit = 20) {
  return db
    .prepare(`
      SELECT *
      FROM forecast_auto_cycle_runs
      ORDER BY started_at DESC
      LIMIT ?
    `)
    .all(Math.max(1, limit)) as ForecastAutoCycleRunRow[];
}

function getPendingForecastActionRows(
  db: DatabaseSync,
  status: "open" | "locked",
  limit = 8,
) {
  return db
    .prepare(`
      SELECT contract_address, pair_id, pair_label, status, close_time
      FROM forecast_markets
      WHERE status = ?
        AND close_time <= ?
      ORDER BY close_time ASC
      LIMIT ?
    `)
    .all(status, new Date().toISOString(), Math.max(1, limit)) as Array<{
    contract_address: string;
    pair_id: string;
    pair_label: string;
    status: TonForecastMarketStatus;
    close_time: string;
  }>;
}

function countPendingForecastActionRows(
  db: DatabaseSync,
  status: "open" | "locked",
) {
  return (
    (
      db
        .prepare(`
        SELECT COUNT(*) AS count
        FROM forecast_markets
        WHERE status = ?
          AND close_time <= ?
      `)
        .get(status, new Date().toISOString()) as { count: number } | undefined
    )?.count ?? 0
  );
}

function getRecentForecastAutoClaimErrors(db: DatabaseSync, limit = 8) {
  return db
    .prepare(`
      SELECT market_address, wallet_address, requested_at, claimed_at, last_error
      FROM forecast_auto_claims
      WHERE last_error IS NOT NULL
      ORDER BY requested_at DESC
      LIMIT ?
    `)
    .all(Math.max(1, limit)) as ForecastAutoClaimRow[];
}

function countForecastAutoClaimErrors(db: DatabaseSync) {
  return (
    (
      db
        .prepare(`
        SELECT COUNT(*) AS count
        FROM forecast_auto_claims
        WHERE last_error IS NOT NULL
      `)
        .get() as { count: number } | undefined
    )?.count ?? 0
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
    action: "lock",
    to: market.contract_address,
    valueTon: getForecastClaimTriggerTon(),
    payloadBase64: buildTonForecastLockPayloadBase64(),
    marketAddress: market.contract_address,
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
    action: "resolve",
    to: market.contract_address,
    valueTon: getForecastClaimTriggerTon(),
    payloadBase64: buildTonForecastResolvePayloadBase64({
      finalPriceE9: snapshot.currentPriceE9,
      resolvedAt: Math.floor(Date.now() / 1000),
    }),
    marketAddress: market.contract_address,
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
        action: "claim",
        to: market.contract_address,
        valueTon: getForecastClaimTriggerTon(),
        payloadBase64: buildTonForecastClaimForPayloadBase64({
          walletAddress: normalizedWallet,
        }),
        marketAddress: market.contract_address,
        walletAddress: normalizedWallet,
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
      await logRuntimeError({
        scope: "forecast-market-store.auto-claim",
        error,
        fallbackMessage: "Failed to auto-claim forecast payout",
        path: market.contract_address,
        metadata: {
          marketAddress: market.contract_address,
          walletAddress: normalizedWallet,
        },
      });
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
  return withRuntimeDatabaseSession(async () => {
    const db = await ensureForecastDatabase();
    const autoCycleEnabled = getForecastAutoCycleEnabled();
    const markets = getForecastMarketRowsForAutoCycle(db, input);
    const resolverWalletResult = await tryGetResolverWalletContext();
    const resolverAddress =
      resolverWalletResult.context?.address ||
      getExplicitForecastResolverAddress() ||
      null;
    const summary = {
      scanned: markets.length,
      locked: 0,
      resolved: 0,
      autoClaimed: 0,
      automationAvailable:
        autoCycleEnabled && Boolean(resolverWalletResult.context),
    };
    const run = startForecastAutoCycleRun(db, {
      pairId: input?.pairId,
      marketAddress: input?.marketAddress,
      scanned: summary.scanned,
      automationAvailable: summary.automationAvailable,
      resolverAddress,
    });

    if (resolverWalletResult.error) {
      await logRuntimeMessage({
        level: "warn",
        scope: "forecast-market-store.auto-cycle",
        message: "Resolver wallet is unavailable for forecast automation",
        metadata: {
          pairId: input?.pairId ?? null,
          marketAddress: input?.marketAddress ?? null,
          resolverAddress,
          error: resolverWalletResult.error,
        },
      });
    }

    try {
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
            market =
              getForecastMarketRow(db, market.contract_address) ?? market;
          }
        }

        if (summary.automationAvailable && market.status === "locked") {
          const resolved = await autoResolveForecastMarket(db, market);
          if (resolved) {
            summary.resolved += 1;
            await syncForecastMarketTransactions(db, market.contract_address);
            market =
              getForecastMarketRow(db, market.contract_address) ?? market;
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

      completeForecastAutoCycleRun(db, run.id, run.startedAt, {
        scanned: summary.scanned,
        locked: summary.locked,
        resolved: summary.resolved,
        autoClaimed: summary.autoClaimed,
        automationAvailable: summary.automationAvailable,
        resolverAddress,
      });

      await logRuntimeMessage({
        scope: "forecast-market-store.auto-cycle",
        message: "Forecast auto-cycle completed",
        metadata: {
          pairId: input?.pairId ?? null,
          marketAddress: input?.marketAddress ?? null,
          scanned: summary.scanned,
          locked: summary.locked,
          resolved: summary.resolved,
          autoClaimed: summary.autoClaimed,
          automationAvailable: summary.automationAvailable,
          resolverAddress,
        },
      });

      return summary;
    } catch (error) {
      const errorMessage = normalizeErrorMessage(
        error,
        "forecast_auto_cycle_failed",
      );

      failForecastAutoCycleRun(db, run.id, run.startedAt, errorMessage);
      await logRuntimeError({
        scope: "forecast-market-store.auto-cycle",
        error,
        fallbackMessage: "Failed to run forecast auto-cycle",
        metadata: {
          pairId: input?.pairId ?? null,
          marketAddress: input?.marketAddress ?? null,
          scanned: summary.scanned,
          locked: summary.locked,
          resolved: summary.resolved,
          autoClaimed: summary.autoClaimed,
          automationAvailable: summary.automationAvailable,
          resolverAddress,
        },
      });
      throw error;
    }
  });
}

function toForecastAutoCycleRunSummary(row: ForecastAutoCycleRunRow) {
  return {
    id: row.id,
    triggerPairId: row.trigger_pair_id,
    triggerMarketAddress: row.trigger_market_address,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    scanned: row.scanned,
    locked: row.locked_count,
    resolved: row.resolved_count,
    autoClaimed: row.auto_claimed_count,
    automationAvailable: Boolean(row.automation_available),
    resolverAddress: row.resolver_address,
    errorMessage: row.error_message,
    durationMs: row.duration_ms,
  };
}

export async function getForecastOperationsSummary() {
  return withRuntimeDatabaseSession(async () => {
    const db = await ensureForecastDatabase();
    const storage = getRuntimeStorageDiagnostics();
    const autoCycleEnabled = getForecastAutoCycleEnabled();
    const resolverWalletResult = await tryGetResolverWalletContext();
    const resolverConfigured = Boolean(
      getForecastResolverMnemonic().trim() ||
        getExplicitForecastResolverAddress(),
    );
    const lastRun = getRecentForecastAutoCycleRuns(db, 1)[0] ?? null;
    const pendingLockCount = countPendingForecastActionRows(db, "open");
    const pendingResolveCount = countPendingForecastActionRows(db, "locked");
    const autoClaimErrorCount = countForecastAutoClaimErrors(db);

    return {
      autoCycleEnabled,
      automationAvailable:
        autoCycleEnabled && Boolean(resolverWalletResult.context),
      resolverConfigured,
      resolverWalletError: resolverWalletResult.error,
      lastRun: lastRun ? toForecastAutoCycleRunSummary(lastRun) : null,
      pendingManualActions: {
        lockCount: pendingLockCount,
        resolveCount: pendingResolveCount,
        autoClaimErrorCount,
      },
      storage: {
        mode: storage.mode,
        databaseLikelyEphemeral: storage.databaseLikelyEphemeral,
        requireDurableStorage: storage.requireDurableStorage,
        warnings: storage.warnings,
      },
    };
  });
}

export async function getForecastOperationsSnapshot() {
  return withRuntimeDatabaseSession(async () => {
    const db = await ensureForecastDatabase();
    const storage = getRuntimeStorageDiagnostics();
    const autoCycleEnabled = getForecastAutoCycleEnabled();
    const resolverWalletResult = await tryGetResolverWalletContext();
    const resolverConfigured = Boolean(
      getForecastResolverMnemonic().trim() ||
        getExplicitForecastResolverAddress(),
    );
    const resolverAddress =
      resolverWalletResult.context?.address ||
      getExplicitForecastResolverAddress() ||
      null;
    const recommendedMinBalanceNano = getRecommendedResolverBalanceNano();
    const recentRuns = getRecentForecastAutoCycleRuns(db, 20);
    const pendingLockMarkets = getPendingForecastActionRows(db, "open", 8);
    const pendingResolveMarkets = getPendingForecastActionRows(db, "locked", 8);
    const recentAutoClaimErrors = getRecentForecastAutoClaimErrors(db, 8);
    let resolverSeqno: number | null = null;
    let resolverBalanceNano: string | null = null;
    let resolverBalanceTon: number | null = null;
    let resolverError = resolverWalletResult.error;

    if (resolverWalletResult.context) {
      try {
        resolverSeqno = await resolverWalletResult.context.wallet.getSeqno();
      } catch (error) {
        resolverError ??= normalizeErrorMessage(
          error,
          "resolver_seqno_unavailable",
        );
      }
    }

    if (resolverAddress) {
      try {
        const balance = await tonApiClient.getBalance(
          Address.parse(resolverAddress),
        );
        resolverBalanceNano = balance.toString();
        resolverBalanceTon = fromNanoToTonNumber(balance);
      } catch (error) {
        resolverError ??= normalizeErrorMessage(
          error,
          "resolver_balance_unavailable",
        );
      }
    }

    return {
      storage,
      resolver: {
        configured: resolverConfigured,
        automationWalletAvailable: Boolean(resolverWalletResult.context),
        address: resolverAddress,
        seqno: resolverSeqno,
        balanceNano: resolverBalanceNano,
        balanceTon: resolverBalanceTon,
        recommendedMinBalanceNano: recommendedMinBalanceNano.toString(),
        recommendedMinBalanceTon: fromNanoToTonNumber(
          recommendedMinBalanceNano,
        ),
        lowBalance:
          resolverBalanceNano == null
            ? null
            : BigInt(resolverBalanceNano) < recommendedMinBalanceNano,
        error: resolverError,
      },
      autoCycle: {
        enabled: autoCycleEnabled,
        automationAvailable:
          autoCycleEnabled && Boolean(resolverWalletResult.context),
        lastRun: recentRuns[0]
          ? toForecastAutoCycleRunSummary(recentRuns[0])
          : null,
        recentRuns: recentRuns.map(toForecastAutoCycleRunSummary),
        pendingLockMarkets: pendingLockMarkets.map((market) => ({
          contractAddress: market.contract_address,
          pairId: market.pair_id,
          label: market.pair_label,
          status: market.status,
          closeTime: market.close_time,
          overdueSeconds: Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(market.close_time).getTime()) / 1000,
            ),
          ),
        })),
        pendingResolveMarkets: pendingResolveMarkets.map((market) => ({
          contractAddress: market.contract_address,
          pairId: market.pair_id,
          label: market.pair_label,
          status: market.status,
          closeTime: market.close_time,
          overdueSeconds: Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(market.close_time).getTime()) / 1000,
            ),
          ),
        })),
        recentAutoClaimErrors: recentAutoClaimErrors.map((entry) => ({
          marketAddress: entry.market_address,
          walletAddress: entry.wallet_address,
          requestedAt: entry.requested_at,
          claimedAt: entry.claimed_at,
          error: entry.last_error,
        })),
      },
    };
  });
}

export async function getForecastMarketContext(input: {
  tokenAddress: string;
  timeframeId: string;
}) {
  return withRuntimeDatabaseSession(async () => {
    if (!isPredictionTimeframeId(input.timeframeId)) {
      throw new Error("Unsupported forecast timeframe.");
    }

    const db = await ensureForecastDatabase();
    const tokenAddress = normalizeTonAddress(input.tokenAddress);
    const pairId = buildPredictionTokenMarketId(
      tokenAddress,
      input.timeframeId,
    );
    await runForecastAutoCycle({ pairId });
    const activeMarket = getActiveForecastMarketRow(db, pairId);
    const latestMarket = getLatestForecastMarketRow(db, pairId);

    if (activeMarket || latestMarket) {
      await syncForecastContextMarkets(db, pairId);
    }

    const refreshedActiveMarket = getActiveForecastMarketRow(db, pairId);
    const refreshedLatestMarket = getLatestForecastMarketRow(db, pairId);
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
      latestMarket: toMarketSummary(refreshedLatestMarket),
    };
  });
}

export async function createForecastMarketIntent(input: {
  walletAddress: string;
  tokenAddress: string;
  timeframeId: PredictionTimeframeId;
  direction: PredictionDirection;
  amountTon: number;
  thresholdBps?: number;
}) {
  return withRuntimeDatabaseSession(async () => {
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
        const deployedMarket = await ensureForecastMarketDeployed(
          db,
          activeMarketRow!,
        );

        if (
          deployedMarket.deployment_tx_hash ||
          deployedMarket.status !== "pending"
        ) {
          return {
            ok: true,
            market: toMarketSummary(deployedMarket),
            tonConnect: {
              validUntil: Math.floor(Date.now() / 1000) + 600,
              messages: [
                buildTonForecastBetTransferMessage({
                  contractAddress: deployedMarket.contract_address,
                  direction: predictionDirectionToForecast(input.direction),
                  amountTon: input.amountTon,
                }),
              ],
            },
            syncCursor: new Date().toISOString(),
            state: await getCommunityState(walletAddress),
          };
        }

        const pendingIntent = await buildPendingForecastDeployBetIntent({
          market: deployedMarket,
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
    const resolverAddress = await resolveForecastResolverAddress(walletAddress);
    const contract = await TonForecastMarket.fromInit(
      Address.parse(walletAddress),
      Address.parse(resolverAddress),
      Address.parse(getForecastTreasuryAddress()),
      Address.parse(tokenAddress),
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

    const insertedMarket = getForecastMarketRow(db, contractAddress);
    const deployedMarket = insertedMarket
      ? await ensureForecastMarketDeployed(db, insertedMarket)
      : null;

    if (
      deployedMarket &&
      (deployedMarket.deployment_tx_hash || deployedMarket.status !== "pending")
    ) {
      return {
        ok: true,
        market: toMarketSummary(deployedMarket),
        tonConnect: {
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [
            buildTonForecastBetTransferMessage({
              contractAddress: deployedMarket.contract_address,
              direction: predictionDirectionToForecast(input.direction),
              amountTon: input.amountTon,
            }),
          ],
        },
        syncCursor,
        state: await getCommunityState(walletAddress),
      };
    }

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
            address: toTonConnectDeployAddress(contract.address),
            amount: (
              toNano(getForecastDeployReserveTon()) +
              toNano(String(input.amountTon))
            ).toString(),
            stateInit: serializeStateInit(contract.init!),
            payload: buildTonForecastBetPayloadBase64({
              direction: predictionDirectionToForecast(input.direction),
              amountTon: input.amountTon,
            }),
          },
        ],
      },
      syncCursor,
      state: await getCommunityState(walletAddress),
    };
  });
}

export async function createForecastBetIntent(input: {
  walletAddress: string;
  pairId: string;
  direction: PredictionDirection;
  amountTon: number;
}) {
  return withRuntimeDatabaseSession(async () => {
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
      const deployedMarket = await ensureForecastMarketDeployed(
        db,
        activeMarket,
      );

      if (
        deployedMarket.deployment_tx_hash ||
        deployedMarket.status !== "pending"
      ) {
        return {
          ok: true,
          market: toMarketSummary(deployedMarket),
          tonConnect: {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [
              buildTonForecastBetTransferMessage({
                contractAddress: deployedMarket.contract_address,
                direction: predictionDirectionToForecast(input.direction),
                amountTon: input.amountTon,
              }),
            ],
          },
          syncCursor: new Date().toISOString(),
          state: await getCommunityState(walletAddress),
        };
      }

      const pendingIntent = await buildPendingForecastDeployBetIntent({
        market: deployedMarket,
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
  });
}

export async function syncForecastMarket(input: {
  walletAddress: string;
  pairId?: string;
  marketAddress?: string;
  syncCursor?: string;
}) {
  return withRuntimeDatabaseSession(async () => {
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
    const viewer = updatedMarket
      ? await buildForecastWalletState(updatedMarket, walletAddress)
      : null;

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
      viewer,
      state: await getCommunityState(walletAddress),
    };
  });
}

export async function createForecastClaimIntent(input: {
  walletAddress: string;
  marketAddress: string;
}) {
  return withRuntimeDatabaseSession(async () => {
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
    const viewer = refreshedMarket
      ? await buildForecastWalletState(refreshedMarket, walletAddress)
      : null;

    if (!refreshedMarket) {
      return {
        ok: false,
        reason: "market_missing" as const,
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    if (!isResolvedForecastStatus(refreshedMarket.status)) {
      return {
        ok: false,
        reason: "market_not_resolved" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    if (!viewer?.hasPosition) {
      return {
        ok: false,
        reason: "position_not_found" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    if (viewer.claimed) {
      return {
        ok: false,
        reason: "already_claimed" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    if (!viewer.claimable) {
      return {
        ok: false,
        reason: "no_winning_position" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    return {
      ok: true,
      market: toMarketSummary(refreshedMarket),
      viewer,
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
  });
}

export async function createForecastResolveIntent(input: {
  walletAddress: string;
  marketAddress: string;
  finalPriceE9?: number;
  resolvedAt?: number;
}) {
  return withRuntimeDatabaseSession(async () => {
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
    const refreshedMarket = getForecastMarketRow(db, marketAddress) ?? market;
    const viewer = await buildForecastWalletState(
      refreshedMarket,
      walletAddress,
    );

    if (
      normalizeTonAddress(refreshedMarket.resolver_address) !== walletAddress
    ) {
      return {
        ok: false,
        reason: "resolver_only" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    if (Date.now() < new Date(refreshedMarket.close_time).getTime()) {
      return {
        ok: false,
        reason: "market_still_open" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    if (isResolvedForecastStatus(refreshedMarket.status)) {
      return {
        ok: false,
        reason: "market_already_resolved" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    if (
      refreshedMarket.status !== "open" &&
      refreshedMarket.status !== "locked"
    ) {
      return {
        ok: false,
        reason: "market_not_resolvable" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    let finalPriceE9 = input.finalPriceE9;
    let finalPriceUsd: number | null = null;

    if (
      typeof finalPriceE9 !== "number" ||
      !Number.isFinite(finalPriceE9) ||
      finalPriceE9 <= 0
    ) {
      try {
        const snapshot = await resolveAssetSnapshot(
          refreshedMarket.token_address,
        );
        finalPriceE9 = snapshot.currentPriceE9;
        finalPriceUsd = snapshot.currentPriceUsd;
      } catch {
        return {
          ok: false,
          reason: "price_unavailable" as const,
          market: toMarketSummary(refreshedMarket),
          viewer,
          state: await getCommunityState(walletAddress),
        };
      }
    }

    const resolvedAt =
      input.resolvedAt && Number.isFinite(input.resolvedAt)
        ? Math.max(1, Math.round(input.resolvedAt))
        : Math.floor(Date.now() / 1000);
    const normalizedFinalPriceE9 = Math.max(1, Math.round(finalPriceE9));

    return {
      ok: true,
      market: toMarketSummary(refreshedMarket),
      viewer,
      resolution: {
        finalPriceE9: normalizedFinalPriceE9,
        finalPriceUsd,
        resolvedAt,
      },
      tonConnect: {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: marketAddress,
            amount: toNano(getForecastClaimTriggerTon()).toString(),
            payload: buildTonForecastResolvePayloadBase64({
              finalPriceE9: normalizedFinalPriceE9,
              resolvedAt,
            }),
          },
        ],
      },
      state: await getCommunityState(walletAddress),
    };
  });
}

export async function createForecastLockIntent(input: {
  walletAddress: string;
  marketAddress: string;
}) {
  return withRuntimeDatabaseSession(async () => {
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
    const refreshedMarket = getForecastMarketRow(db, marketAddress) ?? market;
    const viewer = await buildForecastWalletState(
      refreshedMarket,
      walletAddress,
    );

    if (refreshedMarket.status !== "open") {
      return {
        ok: false,
        reason: "market_not_open" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    if (Date.now() < new Date(refreshedMarket.close_time).getTime()) {
      return {
        ok: false,
        reason: "market_still_open" as const,
        market: toMarketSummary(refreshedMarket),
        viewer,
        state: await getCommunityState(walletAddress),
      };
    }

    return {
      ok: true,
      market: toMarketSummary(refreshedMarket),
      viewer,
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
  });
}
