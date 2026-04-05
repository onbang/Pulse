import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { createForecastLockIntent } from "@/lib/server/forecast-market-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    marketAddress?: string;
  };

  if (!body.walletAddress || !body.marketAddress) {
    return NextResponse.json(
      { error: "Missing forecast lock payload" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await createForecastLockIntent({
        walletAddress: body.walletAddress,
        marketAddress: body.marketAddress,
      }),
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.forecast-markets.lock-intent",
      error,
      fallbackMessage: "Failed to create forecast lock intent",
    });
  }
}
