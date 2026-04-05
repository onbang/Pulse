import { join } from "node:path";

function resolveWritableDataRoot() {
  const explicitRoot = process.env.STON_PULSE_DATA_DIR?.trim();

  if (explicitRoot) {
    return explicitRoot;
  }

  const runningOnServerlessReadonlyFs =
    process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");

  if (runningOnServerlessReadonlyFs) {
    return join(process.env.TMPDIR || "/tmp", "ston-pulse");
  }

  return join(process.cwd(), ".data");
}

export function resolveWritableDataRootPath() {
  return resolveWritableDataRoot();
}

export function resolveCommunityDatabaseFile() {
  return (
    process.env.STON_PULSE_DB_FILE ??
    join(resolveWritableDataRoot(), "community.sqlite")
  );
}

export function resolveLegacyCommunityJsonFile() {
  return (
    process.env.STON_PULSE_DATA_FILE ??
    join(resolveWritableDataRoot(), "community.json")
  );
}

export function resolveRuntimeLogFile() {
  return (
    process.env.STON_PULSE_LOG_FILE ??
    join(resolveWritableDataRoot(), "runtime-errors.log")
  );
}
