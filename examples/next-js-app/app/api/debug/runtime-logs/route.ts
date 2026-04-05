import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import {
  getRuntimeLogFilePath,
  getRuntimeLogReadSecret,
  logRuntimeMessage,
  readRuntimeLogEntries,
} from "@/lib/server/runtime-logger";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = getRuntimeLogReadSecret();

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-debug-log-secret");
  const requestUrl = new URL(request.url);
  const querySecret = requestUrl.searchParams.get("secret");

  return (
    authHeader === `Bearer ${secret}` ||
    headerSecret === secret ||
    querySecret === secret
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get("limit") ?? "200");
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(500, Math.round(requestedLimit)))
      : 200;
    const entries = await readRuntimeLogEntries(limit);

    return NextResponse.json({
      ok: true,
      file: getRuntimeLogFilePath(),
      count: entries.length,
      entries,
    });
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.debug.runtime-logs.get",
      error,
      fallbackMessage: "Failed to read runtime logs",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      message?: string;
      stack?: string;
      filename?: string;
      lineno?: number;
      colno?: number;
      href?: string;
      userAgent?: string;
    };

    if (!body.message?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Missing runtime log message" },
        { status: 400 },
      );
    }

    await logRuntimeMessage({
      level: "error",
      source: "client",
      scope: `client.${body.type?.trim() || "runtime-error"}`,
      message: body.message.trim(),
      path: body.href?.trim() || undefined,
      method: "CLIENT",
      stack: body.stack?.trim() || undefined,
      metadata: {
        filename: body.filename ?? null,
        lineno: body.lineno ?? null,
        colno: body.colno ?? null,
        userAgent: body.userAgent ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.debug.runtime-logs.post",
      error,
      fallbackMessage: "Failed to persist client runtime log",
    });
  }
}
