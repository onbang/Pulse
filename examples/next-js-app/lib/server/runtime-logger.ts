import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

import { resolveRuntimeLogFile } from "@/lib/server/runtime-storage";

type RuntimeLogLevel = "info" | "warn" | "error";

type RuntimeLogEntry = {
  timestamp: string;
  level: RuntimeLogLevel;
  scope: string;
  source: "server" | "client" | "process";
  message: string;
  path?: string;
  method?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
};

const runtimeLogFile = resolveRuntimeLogFile();

declare global {
  // eslint-disable-next-line no-var
  var __stonPulseRuntimeErrorLoggingInstalled: boolean | undefined;
}

function sanitizeMetadata(
  value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return {
      note: "metadata_serialization_failed",
    };
  }
}

function normalizeErrorMessage(
  error: unknown,
  fallbackMessage: string,
): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      stack: error.stack,
    };
  }

  if (typeof error === "string" && error.trim()) {
    return { message: error.trim() };
  }

  return { message: fallbackMessage };
}

async function appendRuntimeLog(entry: RuntimeLogEntry) {
  await mkdir(dirname(runtimeLogFile), { recursive: true });
  await appendFile(runtimeLogFile, `${JSON.stringify(entry)}\n`, "utf8");
}

function mirrorRuntimeLogToConsole(entry: RuntimeLogEntry) {
  const serializedEntry = JSON.stringify(entry);

  if (entry.level === "error") {
    console.error(serializedEntry);
    return;
  }

  if (entry.level === "warn") {
    console.warn(serializedEntry);
    return;
  }

  console.log(serializedEntry);
}

function installRuntimeProcessErrorLogging() {
  if (globalThis.__stonPulseRuntimeErrorLoggingInstalled) {
    return;
  }

  globalThis.__stonPulseRuntimeErrorLoggingInstalled = true;

  process.on("uncaughtException", (error) => {
    const normalized = normalizeErrorMessage(error, "uncaught_exception");
    void appendRuntimeLog({
      timestamp: new Date().toISOString(),
      level: "error",
      scope: "process.uncaughtException",
      source: "process",
      message: normalized.message,
      stack: normalized.stack,
    });
  });

  process.on("unhandledRejection", (reason) => {
    const normalized = normalizeErrorMessage(reason, "unhandled_rejection");
    void appendRuntimeLog({
      timestamp: new Date().toISOString(),
      level: "error",
      scope: "process.unhandledRejection",
      source: "process",
      message: normalized.message,
      stack: normalized.stack,
    });
  });
}

installRuntimeProcessErrorLogging();

export function getRuntimeLogFilePath() {
  return runtimeLogFile;
}

export function getRuntimeLogReadSecret() {
  return (
    process.env.STON_PULSE_DEBUG_LOG_SECRET?.trim() ||
    process.env.DEBUG_LOG_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.FORECAST_CRON_SECRET?.trim() ||
    ""
  );
}

export async function logRuntimeMessage(input: {
  level?: RuntimeLogLevel;
  scope: string;
  source?: RuntimeLogEntry["source"];
  message: string;
  path?: string;
  method?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: input.level ?? "info",
    scope: input.scope,
    source: input.source ?? "server",
    message: input.message,
    path: input.path,
    method: input.method,
    stack: input.stack,
    metadata: sanitizeMetadata(input.metadata),
  } satisfies RuntimeLogEntry;

  mirrorRuntimeLogToConsole(entry);
  await appendRuntimeLog(entry);
}

export async function logRuntimeError(input: {
  scope: string;
  error: unknown;
  fallbackMessage: string;
  source?: RuntimeLogEntry["source"];
  path?: string;
  method?: string;
  metadata?: Record<string, unknown>;
}) {
  const normalized = normalizeErrorMessage(input.error, input.fallbackMessage);

  await logRuntimeMessage({
    level: "error",
    scope: input.scope,
    source: input.source ?? "server",
    message: normalized.message,
    path: input.path,
    method: input.method,
    stack: normalized.stack,
    metadata: input.metadata,
  });
}

export async function readRuntimeLogEntries(limit = 200) {
  try {
    const contents = await readFile(runtimeLogFile, "utf8");
    const lines = contents
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return lines
      .slice(Math.max(0, lines.length - Math.max(1, limit)))
      .map((line) => {
        try {
          return JSON.parse(line) as RuntimeLogEntry;
        } catch {
          return {
            timestamp: new Date().toISOString(),
            level: "warn" as const,
            scope: "runtime-log.parse",
            source: "server" as const,
            message: line,
          };
        }
      });
  } catch {
    return [] as RuntimeLogEntry[];
  }
}
