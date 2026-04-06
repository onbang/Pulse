import { join, resolve } from "node:path";

type RuntimeStorageMode =
  | "explicit-files"
  | "explicit-data-dir"
  | "workspace-local"
  | "serverless-tmp";

export type RuntimeStorageDiagnostics = {
  mode: RuntimeStorageMode;
  dataRoot: string;
  databaseFile: string;
  legacyJsonFile: string;
  runtimeLogFile: string;
  serverless: boolean;
  databaseLikelyEphemeral: boolean;
  runtimeLogLikelyEphemeral: boolean;
  requireDurableStorage: boolean;
  warnings: string[];
};

function parseBooleanFlag(value?: string | null) {
  if (!value?.trim()) {
    return false;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function isServerlessReadonlyFs() {
  return process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");
}

function resolveWritableDataRoot() {
  const explicitRoot = process.env.STON_PULSE_DATA_DIR?.trim();

  if (explicitRoot) {
    return explicitRoot;
  }

  if (isServerlessReadonlyFs()) {
    return join(process.env.TMPDIR || "/tmp", "ston-pulse");
  }

  return join(process.cwd(), ".data");
}

function resolveCommunityDatabasePath() {
  return (
    process.env.STON_PULSE_DB_FILE ??
    join(resolveWritableDataRoot(), "community.sqlite")
  );
}

function resolveLegacyCommunityJsonPath() {
  return (
    process.env.STON_PULSE_DATA_FILE ??
    join(resolveWritableDataRoot(), "community.json")
  );
}

function resolveRuntimeLogPath() {
  return (
    process.env.STON_PULSE_LOG_FILE ??
    join(resolveWritableDataRoot(), "runtime-errors.log")
  );
}

function isLikelyEphemeralPath(path: string) {
  const normalizedPath = resolve(path);
  const ephemeralRoots = [
    process.env.TMPDIR?.trim(),
    "/tmp",
    "/var/folders",
  ].filter(Boolean) as string[];

  return ephemeralRoots.some((root) => {
    const normalizedRoot = resolve(root);

    return (
      normalizedPath === normalizedRoot ||
      normalizedPath.startsWith(`${normalizedRoot}/`)
    );
  });
}

function isLikelyServerlessWritablePath(path: string) {
  return isLikelyEphemeralPath(path);
}

export function resolveWritableDataRootPath() {
  return resolveWritableDataRoot();
}

export function resolveCommunityDatabaseFile() {
  return resolveCommunityDatabasePath();
}

export function resolveLegacyCommunityJsonFile() {
  return resolveLegacyCommunityJsonPath();
}

export function resolveRuntimeLogFile() {
  return resolveRuntimeLogPath();
}

export function getRuntimeStorageDiagnostics(): RuntimeStorageDiagnostics {
  const dataRoot = resolveWritableDataRoot();
  const databaseFile = resolveCommunityDatabasePath();
  const legacyJsonFile = resolveLegacyCommunityJsonPath();
  const runtimeLogFile = resolveRuntimeLogPath();
  const serverless = isServerlessReadonlyFs();
  const databaseLikelyEphemeral =
    serverless || isLikelyEphemeralPath(databaseFile);
  const runtimeLogLikelyEphemeral =
    serverless || isLikelyEphemeralPath(runtimeLogFile);
  const requireDurableStorage = parseBooleanFlag(
    process.env.STON_PULSE_REQUIRE_DURABLE_STORAGE,
  );
  const mode: RuntimeStorageMode =
    process.env.STON_PULSE_DB_FILE?.trim() ||
    process.env.STON_PULSE_LOG_FILE?.trim()
      ? "explicit-files"
      : process.env.STON_PULSE_DATA_DIR?.trim()
        ? "explicit-data-dir"
        : serverless
          ? "serverless-tmp"
          : "workspace-local";
  const warnings: string[] = [];

  if (serverless) {
    warnings.push(
      "Vercel Functions do not provide durable local filesystem storage. STON_PULSE_DB_FILE and STON_PULSE_DATA_DIR can only point SQLite at temporary function storage here.",
    );

    if (!isLikelyServerlessWritablePath(databaseFile)) {
      warnings.push(
        "The configured SQLite database path is outside the temporary writable directory and may be read-only on Vercel.",
      );
    }

    if (!isLikelyServerlessWritablePath(runtimeLogFile)) {
      warnings.push(
        "The configured runtime log path is outside the temporary writable directory and may be read-only on Vercel.",
      );
    }
  } else if (databaseLikelyEphemeral) {
    warnings.push(
      "SQLite currently resolves to a temporary path and may not survive restarts on this machine.",
    );
  }

  if (runtimeLogLikelyEphemeral) {
    warnings.push(
      "Runtime logs resolve to temporary storage and may disappear between deploys or restarts.",
    );
  }

  if (requireDurableStorage && databaseLikelyEphemeral) {
    warnings.push(
      "STON_PULSE_REQUIRE_DURABLE_STORAGE is enabled, but the active database path is still ephemeral.",
    );
  }

  return {
    mode,
    dataRoot,
    databaseFile,
    legacyJsonFile,
    runtimeLogFile,
    serverless,
    databaseLikelyEphemeral,
    runtimeLogLikelyEphemeral,
    requireDurableStorage,
    warnings,
  };
}

export function requireDurableRuntimeStorage() {
  const diagnostics = getRuntimeStorageDiagnostics();

  if (
    diagnostics.requireDurableStorage &&
    diagnostics.databaseLikelyEphemeral
  ) {
    throw new Error(
      diagnostics.serverless
        ? "Durable storage is required, but this Vercel runtime only offers temporary local filesystem storage. Use external durable storage instead of STON_PULSE_DB_FILE / STON_PULSE_DATA_DIR."
        : "Durable storage is required, but STON_PULSE_DB_FILE / STON_PULSE_DATA_DIR still points to ephemeral storage.",
    );
  }

  return diagnostics;
}
