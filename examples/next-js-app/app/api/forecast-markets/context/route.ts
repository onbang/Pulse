import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { getForecastMarketContext } from "@/lib/server/forecast-market-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get("tokenAddress");
  const timeframeId = searchParams.get("timeframeId");

  if (!tokenAddress || !timeframeId) {
    return NextResponse.json(
      { error: "Missing forecast market context params" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await getForecastMarketContext({
        tokenAddress,
        timeframeId,
      }),
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.forecast-markets.context",
      error,
      fallbackMessage: "Failed to build forecast market context",
    });
  }
}
