import { mkdir, readFile, stat } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { Address, Cell } from "@ton/core";
import { parsePredictionContractPayloadBase64 } from "@ston-pulse/prediction-sdk";

import {
  COMMENT_POINTS,
  DAILY_CHECK_IN_POINTS,
  PREDICTION_POINTS,
  TRACK_POINTS,
  getCheckInBonusPoints,
  getCheckInRewardPoints,
  type ActivityItem,
  type ActivityTrack,
  type CheckInEvent,
  type CommentReactionEmoji,
  type CommunityStore,
  type PoolComment,
  type PredictionBet,
  type PredictionDirection,
  type PredictionHistoryBet,
  type PredictionSettlement,
  type PredictionPayoutPreview,
  type PredictionRound,
  type RewardLedgerEntry,
  type NotificationPreferences,
  type UserProfile,
  buildCommunityState,
  createDefaultProfile,
  defaultCommunityStore,
  normalizeNotificationPreferences,
} from "@/lib/community";
import {
  CHECK_IN_CONFIRM_TON_AMOUNT,
  getCheckInTreasuryAddress,
  parseCheckInTransferComment,
} from "@/lib/check-in-config";
import {
  getPredictionEntryAddress,
  getPredictionMarketAddress,
  isPredictionContractModeEnabled,
} from "@/lib/prediction-config";
import {
  canonicalizePredictionMarketId,
  canonicalizePredictionRoundId,
  buildPredictionTokenMarketId,
  buildPredictionTokenRoundId,
  getPredictionTimeframeMinutes,
  getPredictionTimeframeSeconds,
  isPredictionTimeframeId,
  parsePredictionTokenMarketId,
  resolvePredictionDurationMinutes,
  resolvePredictionRoundStartTimestamp,
} from "@/lib/prediction-timeframes";
import { parsePredictionTransferComment } from "@/lib/prediction-transfer";

const databaseFile =
  process.env.STON_PULSE_DB_FILE ??
  join(process.cwd(), ".data/community.sqlite");
const legacyJsonFile =
  process.env.STON_PULSE_DATA_FILE ??
  join(process.cwd(), ".data/community.json");

let database: DatabaseSync | null = null;
let initialized = false;
const DEFAULT_ROUND_DURATION_MINUTES = 240;
const TONAPI_BASE_URL = process.env.TON_CONSOLE_API_URL ?? "https://tonapi.io";

async function ensureDatabase() {
  if (database && initialized) {
    return database;
  }

  await mkdir(dirname(databaseFile), { recursive: true });

  if (!database) {
    database = new DatabaseSync(databaseFile);
    database.exec("PRAGMA journal_mode = WAL;");
    database.exec("PRAGMA foreign_keys = ON;");
  }

  if (!initialized) {
    setupSchema(database);
    await migrateLegacyJson(database);
    initialized = true;
  }

  return database;
}

function setupSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      wallet_address TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      bio TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      total_points INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      total_check_ins INTEGER NOT NULL DEFAULT 0,
      last_check_in_date TEXT,
      check_in_dates_json TEXT NOT NULL DEFAULT '[]',
      activities_json TEXT NOT NULL DEFAULT '{}',
      notification_preferences_json TEXT NOT NULL DEFAULT '{}',
      comments_count INTEGER NOT NULL DEFAULT 0,
      predictions_count INTEGER NOT NULL DEFAULT 0,
      swap_count INTEGER NOT NULL DEFAULT 0,
      liquidity_actions_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS check_in_events (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      date_key TEXT NOT NULL,
      amount_ton REAL NOT NULL,
      source_message_hash TEXT,
      chain_tx_hash TEXT,
      created_at TEXT NOT NULL,
      confirmed_at TEXT,
      points_awarded INTEGER NOT NULL DEFAULT 0,
      streak_after_check_in INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS reward_ledger (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      reason TEXT NOT NULL,
      label TEXT NOT NULL,
      points INTEGER NOT NULL,
      related_event_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      pool_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      author TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comment_reactions (
      comment_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      PRIMARY KEY (comment_id, emoji, wallet_address),
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prediction_positions (
      pair_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      direction TEXT NOT NULL,
      PRIMARY KEY (pair_id, wallet_address)
    );

    CREATE TABLE IF NOT EXISTS prediction_bets (
      id TEXT PRIMARY KEY,
      pair_id TEXT NOT NULL,
      round_id TEXT,
      pair_label TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      author TEXT NOT NULL,
      amount REAL NOT NULL,
      direction TEXT NOT NULL,
      created_at TEXT NOT NULL,
      source_message_hash TEXT,
      chain_tx_hash TEXT,
      confirmed_at TEXT,
      source_kind TEXT NOT NULL DEFAULT 'offchain'
    );

    CREATE TABLE IF NOT EXISTS prediction_rounds (
      pair_id TEXT PRIMARY KEY,
      round_id TEXT NOT NULL,
      pair_label TEXT NOT NULL,
      timeframe_id TEXT,
      status TEXT NOT NULL,
      opened_at TEXT NOT NULL,
      closes_at TEXT NOT NULL,
      resolved_at TEXT,
      duration_minutes INTEGER NOT NULL,
      settlement_direction TEXT
    );

    CREATE TABLE IF NOT EXISTS prediction_settlements (
      round_id TEXT PRIMARY KEY,
      pair_id TEXT NOT NULL,
      pair_label TEXT NOT NULL,
      settlement_direction TEXT NOT NULL,
      settled_at TEXT NOT NULL,
      total_pool REAL NOT NULL,
      payouts_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watchlists (
      wallet_address TEXT NOT NULL,
      pool_id TEXT NOT NULL,
      pool_label TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (wallet_address, pool_id)
    );

    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL
    );
  `);

  ensureColumn(
    db,
    "profiles",
    "notification_preferences_json",
    "TEXT NOT NULL DEFAULT '{}'",
  );
  ensureColumn(db, "profiles", "longest_streak", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "profiles", "total_check_ins", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "profiles", "swap_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(
    db,
    "profiles",
    "liquidity_actions_count",
    "INTEGER NOT NULL DEFAULT 0",
  );
  ensureColumn(db, "prediction_bets", "source_message_hash", "TEXT");
  ensureColumn(db, "prediction_bets", "round_id", "TEXT");
  ensureColumn(db, "prediction_bets", "chain_tx_hash", "TEXT");
  ensureColumn(db, "prediction_bets", "confirmed_at", "TEXT");
  ensureColumn(
    db,
    "prediction_bets",
    "source_kind",
    "TEXT NOT NULL DEFAULT 'offchain'",
  );
  ensureColumn(db, "prediction_rounds", "timeframe_id", "TEXT");

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_check_in_events_source_message_hash
    ON check_in_events(source_message_hash)
    WHERE source_message_hash IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_check_in_events_chain_tx_hash
    ON check_in_events(chain_tx_hash)
    WHERE chain_tx_hash IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_check_in_rewards_related_event
    ON reward_ledger(related_event_id, reason)
    WHERE related_event_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_prediction_bets_source_message_hash
    ON prediction_bets(source_message_hash)
    WHERE source_message_hash IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_prediction_bets_chain_tx_hash
    ON prediction_bets(chain_tx_hash)
    WHERE chain_tx_hash IS NOT NULL;
  `);
}

function ensureColumn(
  db: DatabaseSync,
  table: string,
  column: string,
  definition: string,
) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;

  if (columns.some((item) => item.name === column)) {
    return;
  }

  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function migrateLegacyJson(db: DatabaseSync) {
  const profileCount = db
    .prepare("SELECT COUNT(*) AS count FROM profiles")
    .get() as { count: number };

  if (profileCount.count > 0) {
    return;
  }

  try {
    await stat(legacyJsonFile);
  } catch {
    return;
  }

  try {
    const raw = await readFile(legacyJsonFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<CommunityStore>;
    const store: CommunityStore = {
      ...defaultCommunityStore,
      ...parsed,
      profiles: parsed.profiles ?? {},
      comments: parsed.comments ?? {},
      predictions: parsed.predictions ?? {},
      activity: parsed.activity ?? [],
    };

    db.exec("BEGIN");

    const insertProfile = db.prepare(`
      INSERT OR REPLACE INTO profiles (
        wallet_address, display_name, bio, joined_at, total_points, streak, longest_streak, total_check_ins,
        last_check_in_date, check_in_dates_json, activities_json, notification_preferences_json,
        comments_count, predictions_count, swap_count, liquidity_actions_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertCheckInEvent = db.prepare(`
      INSERT OR REPLACE INTO check_in_events (
        id, wallet_address, date_key, amount_ton, source_message_hash, chain_tx_hash, created_at,
        confirmed_at, points_awarded, streak_after_check_in, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRewardLedger = db.prepare(`
      INSERT OR REPLACE INTO reward_ledger (
        id, wallet_address, reason, label, points, related_event_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertComment = db.prepare(`
      INSERT OR REPLACE INTO comments (id, pool_id, wallet_address, author, text, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertReaction = db.prepare(`
      INSERT OR REPLACE INTO comment_reactions (comment_id, emoji, wallet_address)
      VALUES (?, ?, ?)
    `);
    const insertPosition = db.prepare(`
      INSERT OR REPLACE INTO prediction_positions (pair_id, wallet_address, direction)
      VALUES (?, ?, ?)
    `);
    const insertBet = db.prepare(`
      INSERT OR REPLACE INTO prediction_bets (
        id, pair_id, pair_label, wallet_address, author, amount, direction, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRound = db.prepare(`
      INSERT OR REPLACE INTO prediction_rounds (
        pair_id, round_id, pair_label, status, opened_at, closes_at, resolved_at, duration_minutes, settlement_direction
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSettlement = db.prepare(`
      INSERT OR REPLACE INTO prediction_settlements (
        round_id, pair_id, pair_label, settlement_direction, settled_at, total_pool, payouts_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertWatchlist = db.prepare(`
      INSERT OR REPLACE INTO watchlists (wallet_address, pool_id, pool_label, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const insertActivity = db.prepare(`
      INSERT OR REPLACE INTO activity (id, type, wallet_address, author, created_at, title, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const profile of Object.values(store.profiles)) {
      insertProfile.run(
        profile.walletAddress,
        profile.displayName,
        profile.bio,
        profile.joinedAt,
        profile.totalPoints,
        profile.streak,
        profile.longestStreak,
        profile.totalCheckIns,
        profile.lastCheckInDate ?? null,
        JSON.stringify(profile.checkInDates),
        JSON.stringify(profile.activities),
        JSON.stringify(
          normalizeNotificationPreferences(profile.notificationPreferences),
        ),
        profile.commentsCount,
        profile.predictionsCount,
        profile.swapCount,
        profile.liquidityActionsCount,
      );

      for (const [index, dateKey] of profile.checkInDates.entries()) {
        const eventId = `${profile.walletAddress}-legacy-checkin-${dateKey}`;
        const streakAfterCheckIn = Math.min(
          index + 1,
          profile.longestStreak || profile.streak || index + 1,
        );
        insertCheckInEvent.run(
          eventId,
          profile.walletAddress,
          dateKey,
          Number(CHECK_IN_CONFIRM_TON_AMOUNT),
          null,
          null,
          `${dateKey}T00:00:00.000Z`,
          `${dateKey}T00:00:00.000Z`,
          getCheckInRewardPoints(streakAfterCheckIn),
          streakAfterCheckIn,
          "confirmed",
        );
        insertRewardLedger.run(
          `${eventId}-reward`,
          profile.walletAddress,
          "daily_check_in",
          "Legacy daily check-in",
          getCheckInRewardPoints(streakAfterCheckIn),
          eventId,
          `${dateKey}T00:00:00.000Z`,
        );
      }

      for (const item of profile.watchedPools) {
        insertWatchlist.run(
          profile.walletAddress,
          item.poolId,
          item.poolLabel,
          item.createdAt,
        );
      }
    }

    for (const [poolId, comments] of Object.entries(store.comments)) {
      for (const comment of comments) {
        insertComment.run(
          comment.id,
          poolId,
          comment.walletAddress,
          comment.author,
          comment.text,
          comment.createdAt,
        );

        for (const [emoji, addresses] of Object.entries(comment.reactions)) {
          for (const address of addresses ?? []) {
            insertReaction.run(comment.id, emoji, address);
          }
        }
      }
    }

    for (const [pairId, prediction] of Object.entries(store.predictions)) {
      const openedAt =
        prediction.bets.at(-1)?.createdAt ?? new Date().toISOString();
      const closesAt = new Date(
        new Date(openedAt).getTime() +
          DEFAULT_ROUND_DURATION_MINUTES * 60 * 1000,
      ).toISOString();

      insertRound.run(
        pairId,
        `${pairId}-legacy`,
        prediction.label,
        "open",
        openedAt,
        closesAt,
        null,
        DEFAULT_ROUND_DURATION_MINUTES,
        null,
      );

      if (
        prediction.round?.status === "settled" &&
        prediction.round.settlementDirection
      ) {
        const totalPool = prediction.bets.reduce(
          (sum, bet) => sum + bet.amount,
          0,
        );
        insertSettlement.run(
          prediction.round.id,
          pairId,
          prediction.label,
          prediction.round.settlementDirection,
          prediction.round.resolvedAt ?? new Date().toISOString(),
          totalPool,
          JSON.stringify(prediction.payoutPreviews ?? []),
        );
      }

      for (const address of prediction.up) {
        insertPosition.run(pairId, address, "up");
      }

      for (const address of prediction.down) {
        insertPosition.run(pairId, address, "down");
      }

      for (const bet of prediction.bets) {
        insertBet.run(
          bet.id,
          pairId,
          prediction.label,
          bet.walletAddress,
          bet.author,
          bet.amount,
          bet.direction,
          bet.createdAt,
        );
      }
    }

    for (const item of store.activity) {
      insertActivity.run(
        item.id,
        item.type,
        item.walletAddress,
        item.author,
        item.createdAt,
        item.title,
        item.detail,
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

function getDateKeyFromIso(iso: string) {
  return iso.slice(0, 10);
}

function isNextDateKey(previousDateKey: string | null, nextDateKey: string) {
  if (!previousDateKey) {
    return false;
  }

  const previous = new Date(`${previousDateKey}T00:00:00.000Z`);
  previous.setUTCDate(previous.getUTCDate() + 1);
  return previous.toISOString().slice(0, 10) === nextDateKey;
}

function buildRewardEntries(input: {
  walletAddress: string;
  eventId: string;
  createdAt: string;
  streakAfterCheckIn: number;
}) {
  const bonusPoints = getCheckInBonusPoints(input.streakAfterCheckIn);
  const entries: Array<Omit<RewardLedgerEntry, "id"> & { id: string }> = [
    {
      id: `${input.eventId}-daily`,
      walletAddress: input.walletAddress,
      reason: "daily_check_in",
      label: "Daily check-in reward",
      points: DAILY_CHECK_IN_POINTS,
      relatedEventId: input.eventId,
      createdAt: input.createdAt,
    },
  ];

  if (bonusPoints > 0) {
    entries.push({
      id: `${input.eventId}-bonus`,
      walletAddress: input.walletAddress,
      reason: "streak_bonus",
      label: `Streak bonus x${input.streakAfterCheckIn}`,
      points: bonusPoints,
      relatedEventId: input.eventId,
      createdAt: input.createdAt,
    });
  }

  return entries;
}

function insertRewardEntries(
  db: DatabaseSync,
  entries: Array<Omit<RewardLedgerEntry, "id"> & { id: string }>,
) {
  const statement = db.prepare(`
    INSERT OR IGNORE INTO reward_ledger (
      id, wallet_address, reason, label, points, related_event_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const entry of entries) {
    statement.run(
      entry.id,
      entry.walletAddress,
      entry.reason,
      entry.label,
      entry.points,
      entry.relatedEventId ?? null,
      entry.createdAt,
    );
  }
}

function ensureRoundState(db: DatabaseSync, pairId: string, label: string) {
  const normalizedPairId = canonicalizePredictionMarketId(pairId);
  const isTokenPredictionRound = pairId.startsWith("prediction:");
  const existing = db
    .prepare("SELECT * FROM prediction_rounds WHERE pair_id = ?")
    .get(normalizedPairId) as
    | {
        pair_id: string;
        round_id: string;
        pair_label: string;
        status: PredictionRound["status"];
        opened_at: string;
        closes_at: string;
        resolved_at: string | null;
        timeframe_id: string | null;
        duration_minutes: number;
        settlement_direction: PredictionDirection | null;
      }
    | undefined;

  if (isTokenPredictionRound) {
    const currentRound = createCurrentTokenRound(normalizedPairId, label);

    if (!existing) {
      db.prepare(`
        INSERT INTO prediction_rounds (
          pair_id, round_id, pair_label, timeframe_id, status, opened_at, closes_at, resolved_at, duration_minutes, settlement_direction
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        normalizedPairId,
        currentRound.id,
        label,
        currentRound.timeframeId ?? null,
        currentRound.status,
        currentRound.openedAt,
        currentRound.closesAt,
        currentRound.resolvedAt ?? null,
        currentRound.durationMinutes,
        currentRound.settlementDirection ?? null,
      );

      return currentRound;
    }

    if (existing.round_id !== currentRound.id) {
      if (
        existing.status === "open" &&
        new Date(existing.closes_at).getTime() <= Date.now()
      ) {
        db.prepare(`
          UPDATE prediction_rounds
          SET status = 'closed'
          WHERE pair_id = ? AND status = 'open'
        `).run(normalizedPairId);

        return createRound(existing.pair_id, existing.pair_label, {
          id: existing.round_id,
          pairId: existing.pair_id,
          timeframeId: existing.timeframe_id ?? undefined,
          status: "closed",
          openedAt: existing.opened_at,
          closesAt: existing.closes_at,
          resolvedAt: existing.resolved_at ?? undefined,
          durationMinutes: existing.duration_minutes,
          settlementDirection: existing.settlement_direction ?? undefined,
        });
      }

      if (existing.status !== "settled") {
        return createRound(existing.pair_id, existing.pair_label, {
          id: existing.round_id,
          pairId: existing.pair_id,
          timeframeId: existing.timeframe_id ?? undefined,
          status: existing.status,
          openedAt: existing.opened_at,
          closesAt: existing.closes_at,
          resolvedAt: existing.resolved_at ?? undefined,
          durationMinutes: existing.duration_minutes,
          settlementDirection: existing.settlement_direction ?? undefined,
        });
      }

      db.exec("BEGIN");
      try {
        db.prepare("DELETE FROM prediction_positions WHERE pair_id = ?").run(
          normalizedPairId,
        );
        db.prepare(`
          UPDATE prediction_rounds
          SET round_id = ?, pair_label = ?, timeframe_id = ?, status = ?, opened_at = ?, closes_at = ?, resolved_at = ?, duration_minutes = ?, settlement_direction = ?
          WHERE pair_id = ?
        `).run(
          currentRound.id,
          label,
          currentRound.timeframeId ?? null,
          currentRound.status,
          currentRound.openedAt,
          currentRound.closesAt,
          null,
          currentRound.durationMinutes,
          null,
          normalizedPairId,
        );
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }

      return currentRound;
    }
  }

  if (!existing) {
    const round = createRound(pairId, label);

    db.prepare(`
      INSERT INTO prediction_rounds (
        pair_id, round_id, pair_label, timeframe_id, status, opened_at, closes_at, resolved_at, duration_minutes, settlement_direction
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pairId,
      round.id,
      label,
      round.timeframeId ?? null,
      round.status,
      round.openedAt,
      round.closesAt,
      round.resolvedAt ?? null,
      round.durationMinutes,
      round.settlementDirection ?? null,
    );

    return round;
  }

  if (
    existing.status === "open" &&
    new Date(existing.closes_at).getTime() <= Date.now()
  ) {
    db.prepare(`
      UPDATE prediction_rounds
      SET status = 'closed'
      WHERE pair_id = ? AND status = 'open'
    `).run(normalizedPairId);

    return createRound(existing.pair_id, existing.pair_label, {
      id: existing.round_id,
      pairId: existing.pair_id,
      timeframeId: existing.timeframe_id ?? undefined,
      status: "closed",
      openedAt: existing.opened_at,
      closesAt: existing.closes_at,
      resolvedAt: existing.resolved_at ?? undefined,
      durationMinutes: existing.duration_minutes,
      settlementDirection: existing.settlement_direction ?? undefined,
    });
  }

  if (existing.status === "closed" && isTokenPredictionRound) {
    return createRound(existing.pair_id, existing.pair_label, {
      id: existing.round_id,
      pairId: existing.pair_id,
      timeframeId: existing.timeframe_id ?? undefined,
      status: existing.status,
      openedAt: existing.opened_at,
      closesAt: existing.closes_at,
      resolvedAt: existing.resolved_at ?? undefined,
      durationMinutes: existing.duration_minutes,
      settlementDirection: existing.settlement_direction ?? undefined,
    });
  }

  if (existing.status === "settled") {
    const round = createRound(pairId, label);

    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM prediction_positions WHERE pair_id = ?").run(
        normalizedPairId,
      );
      db.prepare(`
        UPDATE prediction_rounds
        SET round_id = ?, pair_label = ?, timeframe_id = ?, status = ?, opened_at = ?, closes_at = ?, resolved_at = ?, duration_minutes = ?, settlement_direction = ?
        WHERE pair_id = ?
      `).run(
        round.id,
        label,
        round.timeframeId ?? null,
        round.status,
        round.openedAt,
        round.closesAt,
        null,
        round.durationMinutes,
        null,
        normalizedPairId,
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return round;
  }

  return createRound(existing.pair_id, existing.pair_label, {
    id: existing.round_id,
    pairId: existing.pair_id,
    timeframeId: existing.timeframe_id ?? undefined,
    status: existing.status,
    openedAt: existing.opened_at,
    closesAt: existing.closes_at,
    resolvedAt: existing.resolved_at ?? undefined,
    durationMinutes: existing.duration_minutes,
    settlementDirection: existing.settlement_direction ?? undefined,
  });
}

function refreshPredictionRounds(db: DatabaseSync) {
  const rows = db
    .prepare(`
    SELECT pair_id, pair_label, status, closes_at
    FROM prediction_rounds
    ORDER BY closes_at ASC
  `)
    .all() as Array<{
    pair_id: string;
    pair_label: string;
    status: PredictionRound["status"];
    closes_at: string;
  }>;

  const now = Date.now();

  for (const row of rows) {
    if (row.status === "open" && new Date(row.closes_at).getTime() <= now) {
      db.prepare(`
        UPDATE prediction_rounds
        SET status = 'closed'
        WHERE pair_id = ? AND status = 'open'
      `).run(row.pair_id);

      pushActivity(db, {
        type: "prediction_round_closed",
        walletAddress: "system",
        author: "STON Pulse",
        createdAt: new Date().toISOString(),
        title: "Prediction round closed",
        detail: `${row.pair_label} is now awaiting settlement.`,
      });
    }
  }
}

function parseJson<T>(value: string | null, fallback: T) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function createRound(
  pairId: string,
  label: string,
  input?: Partial<PredictionRound>,
): PredictionRound {
  const openedAt = input?.openedAt ?? new Date().toISOString();
  const durationMinutes =
    input?.durationMinutes ?? resolvePredictionDurationMinutes(pairId);
  const closesAt =
    input?.closesAt ??
    new Date(
      new Date(openedAt).getTime() + durationMinutes * 60 * 1000,
    ).toISOString();

  return {
    id: input?.id ?? `${pairId}-${Date.now()}`,
    pairId: input?.pairId ?? pairId,
    timeframeId: input?.timeframeId,
    status: input?.status ?? "open",
    openedAt,
    closesAt,
    resolvedAt: input?.resolvedAt,
    durationMinutes,
    settlementDirection: input?.settlementDirection,
  };
}

function createCurrentTokenRound(
  pairId: string,
  label: string,
  at: Date = new Date(),
): PredictionRound {
  const parsed = parsePredictionTokenMarketId(pairId);

  if (!parsed) {
    return createRound(pairId, label);
  }

  const roundStartTimestamp = resolvePredictionRoundStartTimestamp(
    parsed.timeframe,
    at,
  );
  const durationMinutes = getPredictionTimeframeMinutes(parsed.timeframe);
  const durationSeconds = getPredictionTimeframeSeconds(parsed.timeframe);
  const openedAt = new Date(roundStartTimestamp * 1000).toISOString();
  const closesAt = new Date(
    (roundStartTimestamp + durationSeconds) * 1000,
  ).toISOString();

  return {
    id: buildPredictionTokenRoundId(
      parsed.contractAddress,
      parsed.timeframe,
      at,
    ),
    pairId,
    timeframeId: parsed.timeframe,
    status: "open",
    openedAt,
    closesAt,
    durationMinutes,
  };
}

function getRoundIdentifier(
  round:
    | PredictionRound
    | {
        round_id: string;
      },
) {
  return "round_id" in round ? round.round_id : round.id;
}

function hydrateStore(db: DatabaseSync): CommunityStore {
  const profilesRows = db.prepare("SELECT * FROM profiles").all() as Array<{
    wallet_address: string;
    display_name: string;
    bio: string;
    joined_at: string;
    total_points: number;
    streak: number;
    longest_streak: number;
    total_check_ins: number;
    last_check_in_date: string | null;
    check_in_dates_json: string;
    activities_json: string;
    notification_preferences_json: string;
    comments_count: number;
    predictions_count: number;
    swap_count: number;
    liquidity_actions_count: number;
  }>;

  const profiles = Object.fromEntries(
    profilesRows.map((row) => {
      const profile: UserProfile = {
        walletAddress: row.wallet_address,
        displayName: row.display_name,
        bio: row.bio,
        joinedAt: row.joined_at,
        totalPoints: row.total_points,
        streak: row.streak,
        longestStreak: row.longest_streak,
        totalCheckIns: row.total_check_ins,
        lastCheckInDate: row.last_check_in_date ?? undefined,
        checkInDates: parseJson<string[]>(row.check_in_dates_json, []),
        activities: parseJson<Partial<Record<ActivityTrack, string>>>(
          row.activities_json,
          {},
        ),
        notificationPreferences: normalizeNotificationPreferences(
          parseJson<Partial<NotificationPreferences>>(
            row.notification_preferences_json,
            {},
          ),
        ),
        commentsCount: row.comments_count,
        predictionsCount: row.predictions_count,
        swapCount: row.swap_count,
        liquidityActionsCount: row.liquidity_actions_count,
        watchedPools: [],
      };

      return [row.wallet_address, profile];
    }),
  ) as Record<string, UserProfile>;

  const watchlistRows = db.prepare("SELECT * FROM watchlists").all() as Array<{
    wallet_address: string;
    pool_id: string;
    pool_label: string;
    created_at: string;
  }>;

  for (const row of watchlistRows) {
    profiles[row.wallet_address]?.watchedPools.push({
      poolId: row.pool_id,
      poolLabel: row.pool_label,
      createdAt: row.created_at,
    });
  }

  for (const profile of Object.values(profiles)) {
    profile.watchedPools.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const commentsRows = db.prepare("SELECT * FROM comments").all() as Array<{
    id: string;
    pool_id: string;
    wallet_address: string;
    author: string;
    text: string;
    created_at: string;
  }>;
  const reactionRows = db
    .prepare("SELECT * FROM comment_reactions")
    .all() as Array<{
    comment_id: string;
    emoji: CommentReactionEmoji;
    wallet_address: string;
  }>;
  const reactionsByComment = new Map<
    string,
    Partial<Record<CommentReactionEmoji, string[]>>
  >();

  for (const row of reactionRows) {
    const current = reactionsByComment.get(row.comment_id) ?? {};
    current[row.emoji] = [...(current[row.emoji] ?? []), row.wallet_address];
    reactionsByComment.set(row.comment_id, current);
  }

  const comments: Record<string, PoolComment[]> = {};

  for (const row of commentsRows) {
    const item: PoolComment = {
      id: row.id,
      walletAddress: row.wallet_address,
      author: row.author,
      text: row.text,
      createdAt: row.created_at,
      reactions: reactionsByComment.get(row.id) ?? {},
    };

    comments[row.pool_id] = [...(comments[row.pool_id] ?? []), item].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
  }

  const betRows = db.prepare("SELECT * FROM prediction_bets").all() as Array<{
    id: string;
    pair_id: string;
    round_id: string | null;
    pair_label: string;
    wallet_address: string;
    author: string;
    amount: number;
    direction: PredictionDirection;
    created_at: string;
    source_message_hash: string | null;
    chain_tx_hash: string | null;
    confirmed_at: string | null;
    source_kind: "offchain" | "wallet_signed" | "pending" | "onchain_sync";
  }>;
  const positionRows = db
    .prepare("SELECT * FROM prediction_positions")
    .all() as Array<{
    pair_id: string;
    wallet_address: string;
    direction: PredictionDirection;
  }>;
  const roundRows = db
    .prepare("SELECT * FROM prediction_rounds")
    .all() as Array<{
    pair_id: string;
    round_id: string;
    pair_label: string;
    timeframe_id: string | null;
    status: PredictionRound["status"];
    opened_at: string;
    closes_at: string;
    resolved_at: string | null;
    duration_minutes: number;
    settlement_direction: PredictionDirection | null;
  }>;
  const settlementRows = db
    .prepare(
      "SELECT * FROM prediction_settlements ORDER BY settled_at DESC LIMIT 50",
    )
    .all() as Array<{
    round_id: string;
    pair_id: string;
    pair_label: string;
    settlement_direction: PredictionDirection;
    settled_at: string;
    total_pool: number;
    payouts_json: string;
  }>;

  const predictions: CommunityStore["predictions"] = {};
  const predictionHistory: PredictionHistoryBet[] = [];
  const currentRoundIds = new Map<string, string>();

  for (const row of roundRows) {
    const canonicalPairId = canonicalizePredictionMarketId(row.pair_id);
    const canonicalRoundId = canonicalizePredictionRoundId(row.round_id);
    currentRoundIds.set(canonicalPairId, canonicalRoundId);
    predictions[canonicalPairId] = {
      label: row.pair_label,
      up: [],
      down: [],
      bets: [],
      round: createRound(row.pair_id, row.pair_label, {
        id: canonicalRoundId,
        pairId: canonicalPairId,
        timeframeId: row.timeframe_id ?? undefined,
        status: row.status,
        openedAt: row.opened_at,
        closesAt: row.closes_at,
        resolvedAt: row.resolved_at ?? undefined,
        durationMinutes: row.duration_minutes,
        settlementDirection: row.settlement_direction ?? undefined,
      }),
      payoutPreviews: [],
    };
  }

  for (const row of betRows) {
    const canonicalPairId = canonicalizePredictionMarketId(row.pair_id);
    const canonicalRoundId = row.round_id
      ? canonicalizePredictionRoundId(row.round_id)
      : undefined;
    const bet: PredictionBet = {
      id: row.id,
      roundId: canonicalRoundId,
      walletAddress: row.wallet_address,
      author: row.author,
      amount: row.amount,
      direction: row.direction,
      createdAt: row.created_at,
      txHash: row.source_message_hash ?? undefined,
      chainTxHash: row.chain_tx_hash ?? undefined,
      sourceKind: row.source_kind,
    };

    predictionHistory.push({
      ...bet,
      pairId: canonicalPairId,
      pairLabel: row.pair_label,
    });

    const currentRoundId = currentRoundIds.get(canonicalPairId);

    if (
      currentRoundId &&
      canonicalRoundId &&
      canonicalRoundId !== currentRoundId
    ) {
      continue;
    }

    const existing = predictions[canonicalPairId] ?? {
      label: row.pair_label,
      up: [],
      down: [],
      bets: [],
      round: createRound(canonicalPairId, row.pair_label),
      payoutPreviews: [],
    };

    predictions[canonicalPairId] = {
      ...existing,
      label: row.pair_label,
      bets: [...existing.bets, bet].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    };
  }

  for (const row of positionRows) {
    const canonicalPairId = canonicalizePredictionMarketId(row.pair_id);
    const existing = predictions[canonicalPairId] ?? {
      label: canonicalPairId,
      up: [],
      down: [],
      bets: [],
      round: createRound(canonicalPairId, canonicalPairId),
      payoutPreviews: [],
    };

    predictions[canonicalPairId] = {
      ...existing,
      up:
        row.direction === "up"
          ? [...existing.up, row.wallet_address]
          : existing.up,
      down:
        row.direction === "down"
          ? [...existing.down, row.wallet_address]
          : existing.down,
    };
  }

  for (const [pairId, prediction] of Object.entries(predictions)) {
    const round = prediction.round ?? createRound(pairId, prediction.label);

    if (
      round.status === "open" &&
      new Date(round.closesAt).getTime() <= Date.now()
    ) {
      round.status = "closed";
    }

    prediction.round = round;

    const totalPool = prediction.bets.reduce((sum, bet) => sum + bet.amount, 0);
    const winnerDirection = round.settlementDirection;

    if (!winnerDirection || totalPool <= 0) {
      prediction.payoutPreviews = [];
      continue;
    }

    const winningPool = prediction.bets
      .filter((bet) => bet.direction === winnerDirection)
      .reduce((sum, bet) => sum + bet.amount, 0);

    if (winningPool <= 0) {
      prediction.payoutPreviews = [];
      continue;
    }

    const payouts = new Map<
      string,
      Omit<PredictionPayoutPreview, "estimatedPayout">
    >();

    for (const bet of prediction.bets.filter(
      (item) => item.direction === winnerDirection,
    )) {
      const current = payouts.get(bet.walletAddress) ?? {
        walletAddress: bet.walletAddress,
        author: bet.author,
        totalStake: 0,
      };

      current.totalStake += bet.amount;
      payouts.set(bet.walletAddress, current);
    }

    prediction.payoutPreviews = [...payouts.values()]
      .map((item) => ({
        ...item,
        estimatedPayout: Number(
          ((item.totalStake / winningPool) * totalPool).toFixed(2),
        ),
      }))
      .sort((a, b) => b.estimatedPayout - a.estimatedPayout);
  }

  const activityRows = db
    .prepare("SELECT * FROM activity ORDER BY created_at DESC LIMIT 150")
    .all() as Array<{
    id: string;
    type: ActivityItem["type"];
    wallet_address: string;
    author: string;
    created_at: string;
    title: string;
    detail: string;
  }>;
  const activity = activityRows.map(
    (row): ActivityItem => ({
      id: row.id,
      type: row.type,
      walletAddress: row.wallet_address,
      author: row.author,
      createdAt: row.created_at,
      title: row.title,
      detail: row.detail,
    }),
  );
  const settlements = settlementRows.map(
    (row): PredictionSettlement => ({
      roundId: row.round_id,
      pairId: row.pair_id,
      pairLabel: row.pair_label,
      settlementDirection: row.settlement_direction,
      settledAt: row.settled_at,
      totalPool: row.total_pool,
      payouts: parseJson<PredictionPayoutPreview[]>(row.payouts_json, []),
    }),
  );

  const checkInEventRows = db
    .prepare("SELECT * FROM check_in_events ORDER BY created_at DESC LIMIT 180")
    .all() as Array<{
    id: string;
    wallet_address: string;
    date_key: string;
    amount_ton: number;
    source_message_hash: string | null;
    chain_tx_hash: string | null;
    created_at: string;
    confirmed_at: string | null;
    points_awarded: number;
    streak_after_check_in: number;
    status: CheckInEvent["status"];
  }>;
  const rewardLedgerRows = db
    .prepare("SELECT * FROM reward_ledger ORDER BY created_at DESC LIMIT 240")
    .all() as Array<{
    id: string;
    wallet_address: string;
    reason: RewardLedgerEntry["reason"];
    label: string;
    points: number;
    related_event_id: string | null;
    created_at: string;
  }>;
  const checkInEvents = checkInEventRows.map(
    (row): CheckInEvent => ({
      id: row.id,
      walletAddress: row.wallet_address,
      dateKey: row.date_key,
      amountTon: row.amount_ton,
      sourceMessageHash: row.source_message_hash ?? undefined,
      chainTxHash: row.chain_tx_hash ?? undefined,
      createdAt: row.created_at,
      confirmedAt: row.confirmed_at ?? undefined,
      pointsAwarded: row.points_awarded,
      streakAfterCheckIn: row.streak_after_check_in,
      status: row.status,
    }),
  );
  const rewardLedger = rewardLedgerRows.map(
    (row): RewardLedgerEntry => ({
      id: row.id,
      walletAddress: row.wallet_address,
      reason: row.reason,
      label: row.label,
      points: row.points,
      relatedEventId: row.related_event_id ?? undefined,
      createdAt: row.created_at,
    }),
  );

  return {
    profiles,
    comments,
    predictions,
    predictionHistory: predictionHistory.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
    settlements,
    checkInEvents,
    rewardLedger,
    activity,
  };
}

function pushActivity(db: DatabaseSync, activity: Omit<ActivityItem, "id">) {
  const item: ActivityItem = {
    id: `${activity.walletAddress}-${Date.now()}`,
    ...activity,
  };

  db.prepare(`
    INSERT INTO activity (id, type, wallet_address, author, created_at, title, detail)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.type,
    item.walletAddress,
    item.author,
    item.createdAt,
    item.title,
    item.detail,
  );

  db.prepare(`
    DELETE FROM activity
    WHERE id NOT IN (
      SELECT id FROM activity ORDER BY created_at DESC LIMIT 150
    )
  `).run();
}

function ensureProfile(
  db: DatabaseSync,
  walletAddress: string,
  telegramDisplayName?: string | null,
) {
  const row = db
    .prepare("SELECT wallet_address FROM profiles WHERE wallet_address = ?")
    .get(walletAddress) as { wallet_address: string } | undefined;

  if (!row) {
    const profile = createDefaultProfile(
      walletAddress,
      telegramDisplayName ?? undefined,
    );

    db.prepare(`
      INSERT INTO profiles (
        wallet_address, display_name, bio, joined_at, total_points, streak, longest_streak, total_check_ins,
        last_check_in_date, check_in_dates_json, activities_json, notification_preferences_json, comments_count,
        predictions_count, swap_count, liquidity_actions_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      profile.walletAddress,
      profile.displayName,
      profile.bio,
      profile.joinedAt,
      profile.totalPoints,
      profile.streak,
      profile.longestStreak,
      profile.totalCheckIns,
      null,
      JSON.stringify(profile.checkInDates),
      JSON.stringify(profile.activities),
      JSON.stringify(profile.notificationPreferences),
      profile.commentsCount,
      profile.predictionsCount,
      profile.swapCount,
      profile.liquidityActionsCount,
    );

    pushActivity(db, {
      type: "profile_created",
      walletAddress,
      author: profile.displayName,
      createdAt: new Date().toISOString(),
      title: "Joined STON Pulse",
      detail: "Created a new on-platform profile.",
    });
  }
}

function getProfileRow(db: DatabaseSync, walletAddress: string) {
  return db
    .prepare("SELECT * FROM profiles WHERE wallet_address = ?")
    .get(walletAddress) as
    | {
        wallet_address: string;
        display_name: string;
        bio: string;
        joined_at: string;
        total_points: number;
        streak: number;
        longest_streak: number;
        total_check_ins: number;
        last_check_in_date: string | null;
        check_in_dates_json: string;
        activities_json: string;
        notification_preferences_json: string;
        comments_count: number;
        predictions_count: number;
        swap_count: number;
        liquidity_actions_count: number;
      }
    | undefined;
}

async function syncOnchainCheckInTransactions(
  db: DatabaseSync,
  walletAddress: string | null,
  options?: { targetMessageHash?: string | null },
) {
  const treasuryAddress = getCheckInTreasuryAddress();
  const normalizedWalletAddress = normalizeTonAddress(walletAddress);
  const normalizedTargetMessageHash =
    options?.targetMessageHash?.trim() || null;

  try {
    const response = await fetch(
      `${TONAPI_BASE_URL}/v2/blockchain/accounts/${encodeURIComponent(
        treasuryAddress,
      )}/transactions?limit=100`,
      {
        headers: process.env.TON_CONSOLE_API_KEY
          ? { Authorization: `Bearer ${process.env.TON_CONSOLE_API_KEY}` }
          : {},
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      transactions?: Array<Record<string, unknown>>;
    };

    for (const transaction of payload.transactions ?? []) {
      const chainTxHash = extractTxHash(transaction);
      const incomingMessage = (transaction.in_msg ??
        transaction.inMessage) as Record<string, unknown> | null;
      const incomingMessageHash = extractMessageHash(incomingMessage);

      if (
        normalizedTargetMessageHash &&
        incomingMessageHash !== normalizedTargetMessageHash
      ) {
        continue;
      }

      const existingConfirmedByChainHash = chainTxHash
        ? (db
            .prepare("SELECT id FROM check_in_events WHERE chain_tx_hash = ?")
            .get(chainTxHash) as { id: string } | undefined)
        : undefined;

      if (existingConfirmedByChainHash) {
        continue;
      }

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

      if (
        normalizedWalletAddress &&
        normalizedSourceAddress &&
        normalizedSourceAddress !== normalizedWalletAddress
      ) {
        continue;
      }

      const parsedComment = parseCheckInTransferComment(
        extractMessageComment(incomingMessage),
      );

      if (
        !chainTxHash ||
        !incomingMessageHash ||
        !normalizedSourceAddress ||
        !parsedComment
      ) {
        continue;
      }

      if (parsedComment.walletAddress !== normalizedSourceAddress) {
        continue;
      }

      const amountTon = extractMessageTonValue(incomingMessage);
      if (amountTon < Number(CHECK_IN_CONFIRM_TON_AMOUNT) * 0.99) {
        continue;
      }

      ensureProfile(db, normalizedSourceAddress);
      const current = getProfileRow(db, normalizedSourceAddress);
      if (!current) {
        continue;
      }

      const confirmedDateKey = parsedComment.dateKey;
      const alreadyConfirmedForDay = db
        .prepare(
          `
          SELECT id FROM check_in_events
          WHERE wallet_address = ? AND date_key = ? AND status = 'confirmed'
          LIMIT 1
        `,
        )
        .get(normalizedSourceAddress, confirmedDateKey) as
        | { id: string }
        | undefined;

      const confirmedAt = extractTransactionCreatedAt(transaction);
      const currentDates = parseJson<string[]>(current.check_in_dates_json, []);
      const previousDate = current.last_check_in_date;
      const streakAfterCheckIn =
        previousDate === confirmedDateKey
          ? current.streak
          : isNextDateKey(previousDate, confirmedDateKey)
            ? current.streak + 1
            : 1;
      const nextLongestStreak = Math.max(
        current.longest_streak,
        streakAfterCheckIn,
      );
      const nextCheckInDates = currentDates.includes(confirmedDateKey)
        ? currentDates
        : [...currentDates, confirmedDateKey].sort();
      const rewardPoints = getCheckInRewardPoints(streakAfterCheckIn);
      const existingByMessageHash = db
        .prepare(
          `
          SELECT id, status
          FROM check_in_events
          WHERE source_message_hash = ?
        `,
        )
        .get(incomingMessageHash) as
        | { id: string; status: CheckInEvent["status"] }
        | undefined;
      const eventId =
        existingByMessageHash?.id ??
        `checkin-${normalizedSourceAddress}-${incomingMessageHash}`;

      db.exec("BEGIN");
      try {
        if (existingByMessageHash) {
          db.prepare(`
            UPDATE check_in_events
            SET wallet_address = ?,
                date_key = ?,
                amount_ton = ?,
                chain_tx_hash = ?,
                confirmed_at = ?,
                points_awarded = ?,
                streak_after_check_in = ?,
                status = 'confirmed'
            WHERE source_message_hash = ?
          `).run(
            normalizedSourceAddress,
            confirmedDateKey,
            amountTon,
            chainTxHash,
            confirmedAt,
            rewardPoints,
            streakAfterCheckIn,
            incomingMessageHash,
          );
        } else {
          db.prepare(`
            INSERT INTO check_in_events (
              id, wallet_address, date_key, amount_ton, source_message_hash, chain_tx_hash,
              created_at, confirmed_at, points_awarded, streak_after_check_in, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
          `).run(
            eventId,
            normalizedSourceAddress,
            confirmedDateKey,
            amountTon,
            incomingMessageHash,
            chainTxHash,
            confirmedAt,
            confirmedAt,
            rewardPoints,
            streakAfterCheckIn,
          );
        }

        if (!alreadyConfirmedForDay) {
          db.prepare(`
            UPDATE profiles
            SET total_points = total_points + ?,
                streak = ?,
                longest_streak = ?,
                total_check_ins = total_check_ins + 1,
                last_check_in_date = ?,
                check_in_dates_json = ?
            WHERE wallet_address = ?
          `).run(
            rewardPoints,
            streakAfterCheckIn,
            nextLongestStreak,
            confirmedDateKey,
            JSON.stringify(nextCheckInDates),
            normalizedSourceAddress,
          );

          insertRewardEntries(
            db,
            buildRewardEntries({
              walletAddress: normalizedSourceAddress,
              eventId,
              createdAt: confirmedAt,
              streakAfterCheckIn,
            }),
          );

          pushActivity(db, {
            type: "daily_check_in",
            walletAddress: normalizedSourceAddress,
            author: current.display_name,
            createdAt: confirmedAt,
            title: "Confirmed daily check-in",
            detail: `Check-in confirmed onchain. +${rewardPoints} points, streak ${streakAfterCheckIn}.`,
          });
        }

        db.exec("COMMIT");
      } catch {
        db.exec("ROLLBACK");
      }
    }
  } catch {
    return;
  }
}

function normalizeTonAddress(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return Address.parse(value).toString();
  } catch {
    return value;
  }
}

function resolvePredictionPairIdByLabel(db: DatabaseSync, label: string) {
  const rows = db
    .prepare(
      "SELECT pair_id FROM prediction_rounds WHERE pair_label = ? ORDER BY opened_at DESC LIMIT 5",
    )
    .all(label) as Array<{ pair_id: string }>;

  if (rows.length === 1) {
    return rows[0]?.pair_id ?? null;
  }

  return rows[0]?.pair_id ?? null;
}

function extractTxHash(transaction: Record<string, unknown>) {
  const candidates = [
    transaction.hash,
    transaction.tx_id,
    transaction.transaction_id,
    transaction.lt_hash,
  ];

  return (
    candidates.find((value): value is string => typeof value === "string") ??
    null
  );
}

function extractMessageHash(message: Record<string, unknown> | null) {
  if (!message) {
    return null;
  }

  const candidates = [
    message.hash,
    message.msg_hash,
    message.message_hash,
    (message.message_content as Record<string, unknown> | undefined)?.hash,
    (message.messageContent as Record<string, unknown> | undefined)?.hash,
  ];

  return (
    candidates.find((value): value is string => typeof value === "string") ??
    null
  );
}

function extractTransactionCreatedAt(transaction: Record<string, unknown>) {
  const candidates = [
    transaction.utime,
    transaction.timestamp,
    transaction.now,
    transaction.created_at,
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

      const parsedDate = new Date(candidate);

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }
  }

  return new Date().toISOString();
}

function getRoundSnapshot(db: DatabaseSync, pairId: string, label: string) {
  const existing = db
    .prepare("SELECT * FROM prediction_rounds WHERE pair_id = ?")
    .get(pairId) as
    | {
        pair_id: string;
        round_id: string;
        pair_label: string;
        status: PredictionRound["status"];
        opened_at: string;
        closes_at: string;
        resolved_at: string | null;
        timeframe_id: string | null;
        duration_minutes: number;
        settlement_direction: PredictionDirection | null;
      }
    | undefined;

  if (existing) {
    return createRound(existing.pair_id, existing.pair_label, {
      id: existing.round_id,
      pairId: existing.pair_id,
      timeframeId: existing.timeframe_id ?? undefined,
      status: existing.status,
      openedAt: existing.opened_at,
      closesAt: existing.closes_at,
      resolvedAt: existing.resolved_at ?? undefined,
      durationMinutes: existing.duration_minutes,
      settlementDirection: existing.settlement_direction ?? undefined,
    });
  }

  const round = createRound(pairId, label);
  db.prepare(`
    INSERT INTO prediction_rounds (
      pair_id, round_id, pair_label, timeframe_id, status, opened_at, closes_at, resolved_at, duration_minutes, settlement_direction
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pairId,
    round.id,
    label,
    round.timeframeId ?? null,
    round.status,
    round.openedAt,
    round.closesAt,
    round.resolvedAt ?? null,
    round.durationMinutes,
    round.settlementDirection ?? null,
  );

  return round;
}

function extractMessageComment(message: Record<string, unknown> | null) {
  if (!message) {
    return null;
  }

  const direct = [
    message.comment,
    message.text,
    message.decoded_comment,
    message.decodedComment,
    message.body,
  ];

  const directMatch = direct.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  if (directMatch) {
    return directMatch;
  }

  const content = (message.message_content ??
    message.messageContent ??
    message.decoded_body ??
    message.decodedBody) as Record<string, unknown> | undefined;

  if (!content) {
    return null;
  }

  const nested = [
    content.comment,
    content.text,
    (content.decoded as Record<string, unknown> | undefined)?.comment,
    (content.decoded as Record<string, unknown> | undefined)?.text,
  ];

  return (
    nested.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    ) ?? null
  );
}

async function syncOnchainPredictionTransactions(
  db: DatabaseSync,
  walletAddress: string | null,
  options?: {
    targetMessageHash?: string | null;
  },
) {
  const entryAddress = getPredictionEntryAddress();
  const contractAddress = getPredictionMarketAddress();
  const isContractMode = isPredictionContractModeEnabled();

  if (!entryAddress) {
    return;
  }

  try {
    const response = await fetch(
      `${TONAPI_BASE_URL}/v2/blockchain/accounts/${encodeURIComponent(
        entryAddress,
      )}/transactions?limit=100`,
      {
        headers: process.env.TON_CONSOLE_API_KEY
          ? { Authorization: `Bearer ${process.env.TON_CONSOLE_API_KEY}` }
          : {},
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      transactions?: Array<Record<string, unknown>>;
    };
    const transactions = payload.transactions ?? [];
    const normalizedWalletAddress = normalizeTonAddress(walletAddress);
    const normalizedTargetMessageHash =
      options?.targetMessageHash?.trim() || null;

    for (const transaction of transactions) {
      const chainTxHash = extractTxHash(transaction);
      const incomingMessage = (transaction.in_msg ??
        transaction.inMessage) as Record<string, unknown> | null;
      const incomingMessageHash = extractMessageHash(incomingMessage);
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

      if (
        normalizedWalletAddress &&
        normalizedSourceAddress &&
        normalizedSourceAddress !== normalizedWalletAddress
      ) {
        continue;
      }

      const comment = extractMessageComment(incomingMessage);
      const parsedComment = parsePredictionTransferComment(comment);
      const parsedContractPayload =
        isContractMode &&
        normalizeTonAddress(entryAddress) ===
          normalizeTonAddress(contractAddress)
          ? extractPredictionContractPayload(incomingMessage)
          : null;

      if (
        normalizedTargetMessageHash &&
        incomingMessageHash !== normalizedTargetMessageHash
      ) {
        continue;
      }

      if (
        !chainTxHash ||
        !normalizedSourceAddress ||
        !incomingMessageHash ||
        (!parsedComment && !parsedContractPayload)
      ) {
        continue;
      }

      const pairId =
        parsedContractPayload?.type === "place_bet" &&
        isPredictionTimeframeId(parsedContractPayload.timeframeId)
          ? buildPredictionTokenMarketId(
              parsedContractPayload.tokenAddress,
              parsedContractPayload.timeframeId,
            )
          : canonicalizePredictionMarketId(
              parsedComment?.pairId ??
                resolvePredictionPairIdByLabel(
                  db,
                  parsedComment?.label ?? "",
                ) ??
                "",
            );

      if (!pairId) {
        continue;
      }

      const existingConfirmedByChainHash = db
        .prepare("SELECT id FROM prediction_bets WHERE chain_tx_hash = ?")
        .get(chainTxHash) as { id: string } | undefined;

      if (existingConfirmedByChainHash) {
        continue;
      }

      ensureProfile(db, normalizedSourceAddress);
      const current = getProfileRow(db, normalizedSourceAddress);

      if (!current) {
        continue;
      }

      const round = getRoundSnapshot(
        db,
        pairId,
        parsedContractPayload?.label ?? parsedComment?.label ?? pairId,
      );
      const roundId =
        parsedContractPayload?.type === "place_bet" &&
        isPredictionTimeframeId(parsedContractPayload.timeframeId)
          ? buildPredictionTokenRoundId(
              parsedContractPayload.tokenAddress,
              parsedContractPayload.timeframeId,
              new Date(parsedContractPayload.roundStartTimestamp * 1000),
            )
          : (parsedContractPayload?.roundId ?? round.id);

      const amount = parsedContractPayload
        ? extractMessageTonValue(incomingMessage)
        : (parsedComment?.amount ?? 0);
      const direction =
        parsedContractPayload?.direction ?? parsedComment?.direction;
      const label =
        parsedContractPayload?.label ?? parsedComment?.label ?? pairId;

      if (!direction || !Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      const confirmedAt = extractTransactionCreatedAt(transaction);
      const existingByMessageHash = db
        .prepare(
          `
          SELECT id, source_kind
          FROM prediction_bets
          WHERE source_message_hash = ?
        `,
        )
        .get(incomingMessageHash) as
        | {
            id: string;
            source_kind:
              | "offchain"
              | "wallet_signed"
              | "pending"
              | "onchain_sync";
          }
        | undefined;

      const recentPendingCandidate = !existingByMessageHash
        ? (db
            .prepare(
              `
              SELECT id
              FROM prediction_bets
              WHERE wallet_address = ?
                AND pair_id = ?
                AND direction = ?
                AND source_kind = 'pending'
                AND chain_tx_hash IS NULL
                AND amount BETWEEN ? AND ?
              ORDER BY created_at DESC
              LIMIT 1
            `,
            )
            .get(
              normalizedSourceAddress,
              pairId,
              direction,
              Math.max(0, Math.round(amount * 100) / 100 - 0.0001),
              Math.round(amount * 100) / 100 + 0.0001,
            ) as { id: string } | undefined)
        : undefined;

      if (existingByMessageHash?.source_kind === "onchain_sync") {
        db.prepare(`
          UPDATE prediction_bets
          SET chain_tx_hash = COALESCE(chain_tx_hash, ?),
              confirmed_at = COALESCE(confirmed_at, ?)
          WHERE source_message_hash = ?
        `).run(chainTxHash, confirmedAt, incomingMessageHash);
        continue;
      }

      db.exec("BEGIN");
      try {
        if (
          parsedContractPayload?.type === "place_bet" &&
          parsedContractPayload.roundId
        ) {
          const openedAt = new Date(
            parsedContractPayload.roundStartTimestamp * 1000,
          ).toISOString();
          const closesAt = new Date(
            (parsedContractPayload.roundStartTimestamp +
              parsedContractPayload.roundDurationSeconds) *
              1000,
          ).toISOString();
          const currentStatus =
            Date.now() >= new Date(closesAt).getTime() ? "closed" : "open";

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
            pairId,
            parsedContractPayload.roundId,
            label,
            parsedContractPayload.timeframeId,
            currentStatus,
            openedAt,
            closesAt,
            null,
            Math.round(parsedContractPayload.roundDurationSeconds / 60),
            null,
          );

          db.prepare("DELETE FROM prediction_positions WHERE pair_id = ?").run(
            pairId,
          );
        }

        db.prepare(`
          INSERT OR REPLACE INTO prediction_positions (pair_id, wallet_address, direction)
          VALUES (?, ?, ?)
        `).run(pairId, normalizedSourceAddress, direction);

        const existingBetTarget =
          existingByMessageHash?.id ?? recentPendingCandidate?.id ?? null;

        if (existingBetTarget) {
          db.prepare(`
            UPDATE prediction_bets
            SET round_id = ?,
                pair_id = ?,
                pair_label = ?,
                wallet_address = ?,
                author = ?,
                amount = ?,
                direction = ?,
                created_at = ?,
                chain_tx_hash = ?,
                confirmed_at = ?,
                source_kind = 'onchain_sync'
            WHERE ${existingByMessageHash ? "source_message_hash = ?" : "id = ?"}
          `).run(
            roundId,
            pairId,
            label,
            normalizedSourceAddress,
            current.display_name,
            Math.round(amount * 100) / 100,
            direction,
            confirmedAt,
            chainTxHash,
            confirmedAt,
            existingByMessageHash ? incomingMessageHash : existingBetTarget,
          );
        } else {
          db.prepare(`
            INSERT INTO prediction_bets (
              id,
              round_id,
              pair_id,
              pair_label,
              wallet_address,
              author,
              amount,
              direction,
              created_at,
              source_message_hash,
              chain_tx_hash,
              confirmed_at,
              source_kind
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            `onchain-${chainTxHash}`,
            roundId,
            pairId,
            label,
            normalizedSourceAddress,
            current.display_name,
            Math.round(amount * 100) / 100,
            direction,
            confirmedAt,
            incomingMessageHash,
            chainTxHash,
            confirmedAt,
            "onchain_sync",
          );
        }

        db.prepare(`
          UPDATE profiles
          SET predictions_count = predictions_count + 1,
              total_points = total_points + ?
          WHERE wallet_address = ?
        `).run(PREDICTION_POINTS, normalizedSourceAddress);

        pushActivity(db, {
          type: "prediction_added",
          walletAddress: normalizedSourceAddress,
          author: current.display_name,
          createdAt: confirmedAt,
          title: "Synced onchain prediction bet",
          detail: `${direction === "up" ? "Bullish" : "Bearish"} on ${label} for ${amount.toFixed(2)} TON.`,
        });

        db.exec("COMMIT");
      } catch {
        db.exec("ROLLBACK");
      }
    }
  } catch {
    return;
  }
}

function extractPredictionContractPayload(
  message: Record<string, unknown> | null,
) {
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

    const normalizedCandidate = normalizePredictionPayloadCandidate(candidate);

    if (!normalizedCandidate) {
      continue;
    }

    const parsed = parsePredictionContractPayloadBase64(normalizedCandidate);

    if (parsed?.type === "place_bet") {
      return parsed;
    }
  }

  return null;
}

function normalizePredictionPayloadCandidate(value: string) {
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

export async function getCommunityState(walletAddress: string | null) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  if (walletAddress) {
    ensureProfile(db, walletAddress);
  }
  await syncOnchainCheckInTransactions(db, walletAddress);
  await syncOnchainPredictionTransactions(db, walletAddress);
  const store = hydrateStore(db);
  return buildCommunityState(store, walletAddress);
}

export async function upsertProfile(input: {
  walletAddress: string;
  displayName: string;
  bio: string;
  telegramDisplayName?: string | null;
  notificationPreferences?: Partial<NotificationPreferences>;
}) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress, input.telegramDisplayName);

  const current = getProfileRow(db, input.walletAddress);
  const fallbackName =
    current?.display_name ??
    createDefaultProfile(
      input.walletAddress,
      input.telegramDisplayName ?? undefined,
    ).displayName;

  db.prepare(`
    UPDATE profiles
    SET display_name = ?, bio = ?, notification_preferences_json = ?
    WHERE wallet_address = ?
  `).run(
    input.displayName.trim() || fallbackName,
    input.bio.trim() || "Liquidity explorer on TON.",
    JSON.stringify(
      normalizeNotificationPreferences({
        ...parseJson<Partial<NotificationPreferences>>(
          current?.notification_preferences_json ?? "{}",
          {},
        ),
        ...(input.notificationPreferences ?? {}),
      }),
    ),
    input.walletAddress,
  );

  return buildCommunityState(hydrateStore(db), input.walletAddress);
}

export async function registerPendingCheckInTransaction(input: {
  walletAddress: string;
  txHash: string;
}) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);
  const current = getProfileRow(db, input.walletAddress);

  if (!current) {
    return {
      result: { ok: false, points: 0, syncStatus: "failed" as const },
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const today = getTodayKey();

  if (current.last_check_in_date === today) {
    return {
      result: { ok: false, points: 0, syncStatus: "confirmed" as const },
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const existingTodayEvent = db
    .prepare(
      `
      SELECT id, status
      FROM check_in_events
      WHERE wallet_address = ? AND date_key = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    )
    .get(input.walletAddress, today) as
    | { id: string; status: CheckInEvent["status"] }
    | undefined;

  if (existingTodayEvent) {
    return {
      result: {
        ok: existingTodayEvent.status === "pending",
        points: 0,
        syncStatus:
          existingTodayEvent.status === "confirmed" ? "confirmed" : "pending",
      },
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const existingPending = db
    .prepare(
      "SELECT id FROM check_in_events WHERE source_message_hash = ? OR chain_tx_hash = ?",
    )
    .get(input.txHash, input.txHash) as { id: string } | undefined;

  if (!existingPending) {
    db.prepare(`
      INSERT INTO check_in_events (
        id, wallet_address, date_key, amount_ton, source_message_hash, created_at,
        points_awarded, streak_after_check_in, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      `checkin-pending-${input.walletAddress}-${input.txHash}`,
      input.walletAddress,
      today,
      Number(CHECK_IN_CONFIRM_TON_AMOUNT),
      input.txHash,
      new Date().toISOString(),
      0,
      current.streak,
    );
  }

  await syncOnchainCheckInTransactions(db, input.walletAddress, {
    targetMessageHash: input.txHash,
  });

  const pendingState = hydrateStore(db);
  const event = pendingState.checkInEvents.find(
    (item) =>
      item.walletAddress === input.walletAddress &&
      item.sourceMessageHash === input.txHash,
  );

  return {
    result: {
      ok: true,
      points: event?.status === "confirmed" ? event.pointsAwarded : 0,
      syncStatus: event?.status === "confirmed" ? "confirmed" : "pending",
    },
    state: buildCommunityState(pendingState, input.walletAddress),
  };
}

export async function syncCheckInTransaction(input: {
  walletAddress: string;
  txHash: string;
}) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);

  await syncOnchainCheckInTransactions(db, input.walletAddress, {
    targetMessageHash: input.txHash,
  });

  const store = hydrateStore(db);
  const event = store.checkInEvents.find(
    (item) =>
      item.walletAddress === input.walletAddress &&
      (item.sourceMessageHash === input.txHash ||
        item.chainTxHash === input.txHash),
  );

  return {
    result: event?.status === "confirmed",
    syncStatus:
      event?.status === "confirmed"
        ? "confirmed"
        : event
          ? "pending"
          : "missing",
    state: buildCommunityState(store, input.walletAddress),
  };
}

export async function addPoolComment(input: {
  walletAddress: string;
  poolId: string;
  text: string;
}) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);
  const current = getProfileRow(db, input.walletAddress);
  const normalizedText = input.text.trim().slice(0, 200);

  if (!current || !normalizedText) {
    return {
      result: false,
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const commentId = `${input.walletAddress}-${Date.now()}`;
  const createdAt = new Date().toISOString();

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO comments (id, pool_id, wallet_address, author, text, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      commentId,
      input.poolId,
      input.walletAddress,
      current.display_name,
      normalizedText,
      createdAt,
    );

    db.prepare(`
      UPDATE profiles
      SET comments_count = comments_count + 1,
          total_points = total_points + ?
      WHERE wallet_address = ?
    `).run(COMMENT_POINTS, input.walletAddress);

    pushActivity(db, {
      type: "comment_added",
      walletAddress: input.walletAddress,
      author: current.display_name,
      createdAt,
      title: "Left a pool comment",
      detail: normalizedText,
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return {
    result: true,
    state: buildCommunityState(hydrateStore(db), input.walletAddress),
  };
}

export async function toggleReaction(input: {
  walletAddress: string;
  poolId: string;
  commentId: string;
  emoji: CommentReactionEmoji;
}) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);
  const current = getProfileRow(db, input.walletAddress);

  if (!current) {
    return buildCommunityState(hydrateStore(db), input.walletAddress);
  }

  const existing = db
    .prepare(`
      SELECT 1 AS found
      FROM comment_reactions
      WHERE comment_id = ? AND emoji = ? AND wallet_address = ?
    `)
    .get(input.commentId, input.emoji, input.walletAddress) as
    | { found: number }
    | undefined;

  if (existing) {
    db.prepare(`
      DELETE FROM comment_reactions
      WHERE comment_id = ? AND emoji = ? AND wallet_address = ?
    `).run(input.commentId, input.emoji, input.walletAddress);
  } else {
    db.prepare(`
      INSERT INTO comment_reactions (comment_id, emoji, wallet_address)
      VALUES (?, ?, ?)
    `).run(input.commentId, input.emoji, input.walletAddress);
  }

  pushActivity(db, {
    type: "reaction_added",
    walletAddress: input.walletAddress,
    author: current.display_name,
    createdAt: new Date().toISOString(),
    title: "Reacted to a pool comment",
    detail: `${existing ? "Removed" : "Added"} ${input.emoji} reaction.`,
  });

  return buildCommunityState(hydrateStore(db), input.walletAddress);
}

export async function addPrediction(input: {
  walletAddress: string;
  pairId: string;
  label: string;
  direction: PredictionDirection;
  amount: number;
  txHash?: string;
}) {
  const canonicalPairId = canonicalizePredictionMarketId(input.pairId);

  if (input.txHash) {
    return registerPendingPredictionTransaction({
      ...input,
      pairId: canonicalPairId,
      txHash: input.txHash,
    });
  }

  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);
  const current = getProfileRow(db, input.walletAddress);

  if (!current || !Number.isFinite(input.amount) || input.amount <= 0) {
    return {
      result: false,
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const round = ensureRoundState(db, canonicalPairId, input.label);

  if (round.status !== "open") {
    return {
      result: false,
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const existing = db
    .prepare(`
      SELECT direction
      FROM prediction_positions
      WHERE pair_id = ? AND wallet_address = ?
    `)
    .get(canonicalPairId, input.walletAddress) as
    | { direction: PredictionDirection }
    | undefined;

  if (existing?.direction === input.direction) {
    return {
      result: false,
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const createdAt = new Date().toISOString();
  const betId = `${input.walletAddress}-${Date.now()}`;

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT OR REPLACE INTO prediction_positions (pair_id, wallet_address, direction)
      VALUES (?, ?, ?)
    `).run(canonicalPairId, input.walletAddress, input.direction);

    db.prepare(`
      INSERT INTO prediction_bets (
        id,
        round_id,
        pair_id,
        pair_label,
        wallet_address,
        author,
        amount,
        direction,
        created_at,
        source_message_hash,
        source_kind
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      betId,
      round.id,
      canonicalPairId,
      input.label,
      input.walletAddress,
      current.display_name,
      Math.round(input.amount * 100) / 100,
      input.direction,
      createdAt,
      input.txHash ?? null,
      input.txHash ? "wallet_signed" : "offchain",
    );

    db.prepare(`
      UPDATE profiles
      SET predictions_count = predictions_count + 1,
          total_points = total_points + ?
      WHERE wallet_address = ?
    `).run(PREDICTION_POINTS, input.walletAddress);

    pushActivity(db, {
      type: "prediction_added",
      walletAddress: input.walletAddress,
      author: current.display_name,
      createdAt,
      title: "Placed a prediction bet",
      detail: `${input.direction === "up" ? "Bullish" : "Bearish"} on ${input.label} for ${input.amount.toFixed(2)} points.`,
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return {
    result: true,
    state: buildCommunityState(hydrateStore(db), input.walletAddress),
  };
}

export async function registerPendingPredictionTransaction(input: {
  walletAddress: string;
  pairId: string;
  label: string;
  direction: PredictionDirection;
  amount: number;
  txHash: string;
}) {
  const canonicalPairId = canonicalizePredictionMarketId(input.pairId);
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);
  const current = getProfileRow(db, input.walletAddress);

  if (
    !current ||
    !Number.isFinite(input.amount) ||
    input.amount <= 0 ||
    !input.txHash.trim()
  ) {
    return {
      result: false,
      syncStatus: "failed" as const,
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const round = ensureRoundState(db, canonicalPairId, input.label);

  if (round.status !== "open") {
    return {
      result: false,
      syncStatus: "failed" as const,
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const existingBet = db
    .prepare(
      `
      SELECT id, source_kind
      FROM prediction_bets
      WHERE source_message_hash = ?
         OR chain_tx_hash = ?
    `,
    )
    .get(input.txHash, input.txHash) as
    | {
        id: string;
        source_kind: "offchain" | "wallet_signed" | "pending" | "onchain_sync";
      }
    | undefined;

  if (!existingBet) {
    db.prepare(`
      INSERT INTO prediction_bets (
        id,
        round_id,
        pair_id,
        pair_label,
        wallet_address,
        author,
        amount,
        direction,
        created_at,
        source_message_hash,
        chain_tx_hash,
        confirmed_at,
        source_kind
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `pending-${input.txHash}`,
      round.id,
      canonicalPairId,
      input.label,
      input.walletAddress,
      current.display_name,
      Math.round(input.amount * 100) / 100,
      input.direction,
      new Date().toISOString(),
      input.txHash,
      null,
      null,
      "pending",
    );
  }

  await syncOnchainPredictionTransactions(db, input.walletAddress, {
    targetMessageHash: input.txHash,
  });

  let syncedBet = db
    .prepare(
      `
      SELECT source_kind
      FROM prediction_bets
      WHERE source_message_hash = ?
         OR chain_tx_hash = ?
    `,
    )
    .get(input.txHash, input.txHash) as
    | {
        source_kind: "offchain" | "wallet_signed" | "pending" | "onchain_sync";
      }
    | undefined;

  if (syncedBet?.source_kind !== "onchain_sync") {
    await syncOnchainPredictionTransactions(db, input.walletAddress);
    syncedBet = db
      .prepare(
        `
        SELECT source_kind
        FROM prediction_bets
        WHERE source_message_hash = ?
           OR chain_tx_hash = ?
      `,
      )
      .get(input.txHash, input.txHash) as
      | {
          source_kind:
            | "offchain"
            | "wallet_signed"
            | "pending"
            | "onchain_sync";
        }
      | undefined;
  }

  return {
    result: Boolean(syncedBet),
    syncStatus:
      syncedBet?.source_kind === "onchain_sync"
        ? ("confirmed" as const)
        : ("pending" as const),
    state: buildCommunityState(hydrateStore(db), input.walletAddress),
  };
}

export async function syncPredictionTransaction(input: {
  walletAddress: string;
  txHash: string;
}) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);

  await syncOnchainPredictionTransactions(db, input.walletAddress, {
    targetMessageHash: input.txHash,
  });

  let bet = db
    .prepare(
      `
      SELECT source_kind
      FROM prediction_bets
      WHERE source_message_hash = ?
         OR chain_tx_hash = ?
    `,
    )
    .get(input.txHash, input.txHash) as
    | {
        source_kind: "offchain" | "wallet_signed" | "pending" | "onchain_sync";
      }
    | undefined;

  if (bet?.source_kind !== "onchain_sync") {
    await syncOnchainPredictionTransactions(db, input.walletAddress);
    bet = db
      .prepare(
        `
        SELECT source_kind
        FROM prediction_bets
        WHERE source_message_hash = ?
           OR chain_tx_hash = ?
      `,
      )
      .get(input.txHash, input.txHash) as
      | {
          source_kind:
            | "offchain"
            | "wallet_signed"
            | "pending"
            | "onchain_sync";
        }
      | undefined;
  }

  return {
    result: Boolean(bet),
    syncStatus:
      bet?.source_kind === "onchain_sync"
        ? ("confirmed" as const)
        : bet?.source_kind === "pending"
          ? ("pending" as const)
          : ("missing" as const),
    state: buildCommunityState(hydrateStore(db), input.walletAddress),
  };
}

export async function settlePredictionRound(input: {
  pairId: string;
  direction: PredictionDirection;
  walletAddress: string;
}) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);
  const current = getProfileRow(db, input.walletAddress);

  if (!current) {
    return {
      result: false,
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const round = ensureRoundState(db, input.pairId, input.pairId);

  if (!round || round.status === "open") {
    return {
      result: false,
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const hydratedBeforeSettlement = hydrateStore(db);
  const prediction = hydratedBeforeSettlement.predictions[input.pairId];

  if (!prediction) {
    return {
      result: false,
      state: buildCommunityState(hydrateStore(db), input.walletAddress),
    };
  }

  const totalPool = prediction.bets.reduce((sum, bet) => sum + bet.amount, 0);
  const winningPool = prediction.bets
    .filter((bet) => bet.direction === input.direction)
    .reduce((sum, bet) => sum + bet.amount, 0);

  const payoutMap = new Map<
    string,
    Omit<PredictionPayoutPreview, "estimatedPayout">
  >();

  for (const bet of prediction.bets.filter(
    (item) => item.direction === input.direction,
  )) {
    const currentPayout = payoutMap.get(bet.walletAddress) ?? {
      walletAddress: bet.walletAddress,
      author: bet.author,
      totalStake: 0,
    };

    currentPayout.totalStake += bet.amount;
    payoutMap.set(bet.walletAddress, currentPayout);
  }

  const payouts = winningPool
    ? [...payoutMap.values()]
        .map((item) => ({
          ...item,
          estimatedPayout: Number(
            ((item.totalStake / winningPool) * totalPool).toFixed(2),
          ),
        }))
        .sort((a, b) => b.estimatedPayout - a.estimatedPayout)
    : [];

  db.prepare(`
    UPDATE prediction_rounds
    SET status = 'settled',
        settlement_direction = ?,
        resolved_at = ?
    WHERE pair_id = ?
  `).run(input.direction, new Date().toISOString(), input.pairId);

  db.prepare(`
    INSERT OR REPLACE INTO prediction_settlements (
      round_id, pair_id, pair_label, settlement_direction, settled_at, total_pool, payouts_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    getRoundIdentifier(round),
    input.pairId,
    prediction.label,
    input.direction,
    new Date().toISOString(),
    totalPool,
    JSON.stringify(payouts),
  );

  pushActivity(db, {
    type: "prediction_settled",
    walletAddress: input.walletAddress,
    author: current.display_name,
    createdAt: new Date().toISOString(),
    title: "Settled a prediction round",
    detail: `${input.direction === "up" ? "Up" : "Down"} side won the round.`,
  });

  return {
    result: true,
    state: buildCommunityState(hydrateStore(db), input.walletAddress),
  };
}

export async function startTrackedActivity(input: {
  walletAddress: string;
  track: ActivityTrack;
}) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);
  const current = getProfileRow(db, input.walletAddress);

  if (!current) {
    return buildCommunityState(hydrateStore(db), input.walletAddress);
  }

  const activities = parseJson<Partial<Record<ActivityTrack, string>>>(
    current.activities_json,
    {},
  );

  if (!activities[input.track]) {
    activities[input.track] = new Date().toISOString();

    db.exec("BEGIN");
    try {
      db.prepare(`
        UPDATE profiles
        SET total_points = total_points + ?,
            activities_json = ?
        WHERE wallet_address = ?
      `).run(TRACK_POINTS, JSON.stringify(activities), input.walletAddress);

      pushActivity(db, {
        type: "track_started",
        walletAddress: input.walletAddress,
        author: current.display_name,
        createdAt: new Date().toISOString(),
        title: "Started a tracked position",
        detail: `Now tracking ${input.track} progress for achievements.`,
      });

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  return buildCommunityState(hydrateStore(db), input.walletAddress);
}

export async function toggleWatchlist(input: {
  walletAddress: string;
  poolId: string;
  poolLabel: string;
}) {
  const db = await ensureDatabase();
  refreshPredictionRounds(db);
  ensureProfile(db, input.walletAddress);
  const current = getProfileRow(db, input.walletAddress);

  if (!current) {
    return buildCommunityState(hydrateStore(db), input.walletAddress);
  }

  const existing = db
    .prepare(`
      SELECT 1 AS found
      FROM watchlists
      WHERE wallet_address = ? AND pool_id = ?
    `)
    .get(input.walletAddress, input.poolId) as { found: number } | undefined;

  if (existing) {
    db.prepare(`
      DELETE FROM watchlists
      WHERE wallet_address = ? AND pool_id = ?
    `).run(input.walletAddress, input.poolId);
  } else {
    db.prepare(`
      INSERT INTO watchlists (wallet_address, pool_id, pool_label, created_at)
      VALUES (?, ?, ?, ?)
    `).run(
      input.walletAddress,
      input.poolId,
      input.poolLabel,
      new Date().toISOString(),
    );

    pushActivity(db, {
      type: "watchlist_added",
      walletAddress: input.walletAddress,
      author: current.display_name,
      createdAt: new Date().toISOString(),
      title: "Added a pool to watchlist",
      detail: input.poolLabel,
    });
  }

  return buildCommunityState(hydrateStore(db), input.walletAddress);
}
