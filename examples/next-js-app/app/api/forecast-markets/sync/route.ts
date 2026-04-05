import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { syncForecastMarket } from "@/lib/server/forecast-market-store";

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    pairId?: string;
    marketAddress?: string;
    syncCursor?: string;
  };

  if (!body.walletAddress || (!body.pairId && !body.marketAddress)) {
    return NextResponse.json(
      { error: "Missing forecast sync payload" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await syncForecastMarket({
        walletAddress: body.walletAddress,
        pairId: body.pairId,
        marketAddress: body.marketAddress,
        syncCursor: body.syncCursor,
      }),
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.forecast-markets.sync",
      error,
      fallbackMessage: "Failed to sync forecast market",
    });
  }
}
