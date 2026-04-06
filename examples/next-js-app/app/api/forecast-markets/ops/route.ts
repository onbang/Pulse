import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { getForecastOperationsSnapshot } from "@/lib/server/forecast-market-store";
import { getRuntimeLogReadSecret } from "@/lib/server/runtime-logger";

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
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...(await getForecastOperationsSnapshot()),
    });
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.forecast-markets.ops",
      error,
      fallbackMessage: "Failed to build forecast operations snapshot",
    });
  }
}
