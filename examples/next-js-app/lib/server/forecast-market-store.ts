import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Address, beginCell, Cell, toNano } from "@ton/core";
import {
  buildTonForecastBetTransferMessage,
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
  getForecastClaimTriggerTon,
  getForecastDeployReserveTon,
  getForecastProtocolFeeBps,
  getForecastResolverAddress,
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

const databaseFile = resolveCommunityDatabaseFile();
const TONAPI_BASE_URL = process.env.TON_CONSOLE_API_URL ?? "https://tonapi.io";

let database: DatabaseSync | null = null;
let initialized = false;

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
    `);

    initialized = true;
  }

  return database;
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

  if (context.activeMarket) {
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
  const contract = await TonForecastMarket.fromInit(
    Address.parse(walletAddress),
    Address.parse(getForecastResolverAddress(walletAddress)),
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
    getForecastResolverAddress(walletAddress),
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
          amount: toNano(getForecastDeployReserveTon()).toString(),
          stateInit: serializeStateInit(contract.init!),
        },
        buildTonForecastBetTransferMessage({
          contractAddress,
          direction: predictionDirectionToForecast(input.direction),
          amountTon: input.amountTon,
        }),
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
  const activeMarket = getActiveForecastMarketRow(db, input.pairId);

  if (!walletAddress || !activeMarket || activeMarket.status !== "open") {
    return {
      ok: false,
      state: await getCommunityState(walletAddress || null),
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
