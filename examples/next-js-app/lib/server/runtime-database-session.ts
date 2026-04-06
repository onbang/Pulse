import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

import {
  getExternalDatabaseConnectionString,
  requireDurableRuntimeStorage,
  resolveCommunityDatabaseFile,
} from "@/lib/server/runtime-storage";

const { Client } = pg;

const SNAPSHOT_TABLE_NAME = "ston_pulse_sqlite_snapshots";

type RuntimeDatabaseSession = {
  db: DatabaseSync;
  initializedScopes: Set<string>;
};

const runtimeDatabaseSessionStorage =
  new AsyncLocalStorage<RuntimeDatabaseSession>();

let localDatabase: DatabaseSync | null = null;

function configureDatabase(
  db: DatabaseSync,
  mode: "local" | "external-postgres",
) {
  db.exec(
    mode === "external-postgres"
      ? "PRAGMA journal_mode = DELETE;"
      : "PRAGMA journal_mode = WAL;",
  );
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
}

function resolveSnapshotNamespace() {
  const rawNamespace =
    process.env.STON_PULSE_DATABASE_NAMESPACE?.trim() ||
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV?.trim() ||
    "default";

  return rawNamespace.replace(/\s+/g, "-");
}

function resolveSnapshotKey() {
  return `ston-pulse:${resolveSnapshotNamespace()}:shared-sqlite`;
}

function resolveSnapshotLockKey() {
  const digest = createHash("sha256").update(resolveSnapshotKey()).digest();

  return digest.readBigInt64BE(0).toString();
}

function resolveExternalSessionFile() {
  return join(
    process.env.TMPDIR || "/tmp",
    "ston-pulse",
    "postgres-sessions",
    `${randomUUID()}.sqlite`,
  );
}

async function cleanupExternalSessionFiles(sessionFile: string) {
  await Promise.allSettled([
    rm(sessionFile, { force: true }),
    rm(`${sessionFile}-wal`, { force: true }),
    rm(`${sessionFile}-shm`, { force: true }),
  ]);
}

async function getOrCreateLocalDatabase() {
  requireDurableRuntimeStorage();
  const databaseFile = resolveCommunityDatabaseFile();

  await mkdir(dirname(databaseFile), { recursive: true });

  if (!localDatabase) {
    localDatabase = new DatabaseSync(databaseFile);
    configureDatabase(localDatabase, "local");
  }

  return localDatabase;
}

async function createExternalSnapshotSession() {
  const connectionString = getExternalDatabaseConnectionString();

  if (!connectionString) {
    throw new Error(
      "STON_PULSE_DATABASE_URL is required to start an external Postgres runtime session.",
    );
  }

  const client = new Client({
    connectionString,
    application_name: "ston-pulse-runtime",
  });
  const sessionFile = resolveExternalSessionFile();
  let database: DatabaseSync | null = null;

  await mkdir(dirname(sessionFile), { recursive: true });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SNAPSHOT_TABLE_NAME} (
        snapshot_key TEXT PRIMARY KEY,
        sqlite_bytes BYTEA NOT NULL,
        sqlite_sha256 TEXT NOT NULL,
        byte_size INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [
      resolveSnapshotLockKey(),
    ]);

    const snapshotResult = await client.query<{
      sqlite_bytes: Buffer;
    }>(
      `
        SELECT sqlite_bytes
        FROM ${SNAPSHOT_TABLE_NAME}
        WHERE snapshot_key = $1
        LIMIT 1
      `,
      [resolveSnapshotKey()],
    );
    const snapshotBytes = snapshotResult.rows[0]?.sqlite_bytes;

    if (snapshotBytes) {
      await writeFile(sessionFile, snapshotBytes);
    }

    database = new DatabaseSync(sessionFile);
    configureDatabase(database, "external-postgres");

    return {
      client,
      database,
      sessionFile,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    await client.end().catch(() => undefined);
    if (database) {
      try {
        database.close();
      } catch {}
    }
    await cleanupExternalSessionFiles(sessionFile);
    throw error;
  }
}

async function persistExternalSnapshot(
  client: InstanceType<typeof Client>,
  sessionFile: string,
) {
  const sqliteBytes = await readFile(sessionFile);
  const sqliteSha256 = createHash("sha256").update(sqliteBytes).digest("hex");

  await client.query(
    `
      INSERT INTO ${SNAPSHOT_TABLE_NAME} (
        snapshot_key,
        sqlite_bytes,
        sqlite_sha256,
        byte_size
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (snapshot_key) DO UPDATE
      SET sqlite_bytes = EXCLUDED.sqlite_bytes,
          sqlite_sha256 = EXCLUDED.sqlite_sha256,
          byte_size = EXCLUDED.byte_size,
          updated_at = NOW()
    `,
    [resolveSnapshotKey(), sqliteBytes, sqliteSha256, sqliteBytes.byteLength],
  );
}

async function withLocalRuntimeDatabaseSession<T>(
  callback: (db: DatabaseSync) => Promise<T> | T,
) {
  const activeSession = runtimeDatabaseSessionStorage.getStore();

  if (activeSession) {
    return callback(activeSession.db);
  }

  const database = await getOrCreateLocalDatabase();

  return runtimeDatabaseSessionStorage.run(
    {
      db: database,
      initializedScopes: new Set<string>(),
    },
    async () => callback(database),
  );
}

async function withExternalRuntimeDatabaseSession<T>(
  callback: (db: DatabaseSync) => Promise<T> | T,
) {
  const activeSession = runtimeDatabaseSessionStorage.getStore();

  if (activeSession) {
    return callback(activeSession.db);
  }

  const { client, database, sessionFile } =
    await createExternalSnapshotSession();

  try {
    const result = await runtimeDatabaseSessionStorage.run(
      {
        db: database,
        initializedScopes: new Set<string>(),
      },
      async () => callback(database),
    );

    try {
      database.exec("PRAGMA optimize;");
    } catch {}

    await persistExternalSnapshot(client, sessionFile);
    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    try {
      database.close();
    } catch {}

    await client.end().catch(() => undefined);
    await cleanupExternalSessionFiles(sessionFile);
  }
}

export async function withRuntimeDatabaseSession<T>(
  callback: (db: DatabaseSync) => Promise<T> | T,
) {
  if (runtimeDatabaseSessionStorage.getStore()) {
    return callback(runtimeDatabaseSessionStorage.getStore()!.db);
  }

  if (getExternalDatabaseConnectionString()) {
    return withExternalRuntimeDatabaseSession(callback);
  }

  return withLocalRuntimeDatabaseSession(callback);
}

export async function ensureRuntimeDatabaseScopeInitialized(
  scope: string,
  initialize: (db: DatabaseSync) => Promise<void> | void,
) {
  const activeSession = runtimeDatabaseSessionStorage.getStore();

  if (!activeSession) {
    throw new Error(
      "Runtime database scope initialization requires an active database session.",
    );
  }

  if (!activeSession.initializedScopes.has(scope)) {
    await initialize(activeSession.db);
    activeSession.initializedScopes.add(scope);
  }

  return activeSession.db;
}
