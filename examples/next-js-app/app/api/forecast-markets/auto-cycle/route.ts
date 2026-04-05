import { NextResponse } from "next/server";

import { getForecastCronSecret } from "@/lib/forecast-market-config";
import { jsonRouteError } from "@/lib/server/api-route-error";
import { runForecastAutoCycle } from "@/lib/server/forecast-market-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = getForecastCronSecret();

  if (!secret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

async function handleAutoCycle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const pairId = url.searchParams.get("pairId") ?? undefined;
  const marketAddress = url.searchParams.get("marketAddress") ?? undefined;

  try {
    return NextResponse.json(
      await runForecastAutoCycle({
        pairId,
        marketAddress,
      }),
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.forecast-markets.auto-cycle",
      error,
      fallbackMessage: "Failed to run forecast auto-cycle",
      metadata: {
        pairId,
        marketAddress,
      },
    });
  }
}

export async function GET(request: Request) {
  return handleAutoCycle(request);
}

export async function POST(request: Request) {
  return handleAutoCycle(request);
}
