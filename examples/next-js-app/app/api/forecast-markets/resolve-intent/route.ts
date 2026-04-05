import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { createForecastResolveIntent } from "@/lib/server/forecast-market-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    marketAddress?: string;
    finalPriceE9?: number;
    resolvedAt?: number;
  };

  if (
    !body.walletAddress ||
    !body.marketAddress ||
    typeof body.finalPriceE9 !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing forecast resolve payload" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await createForecastResolveIntent({
        walletAddress: body.walletAddress,
        marketAddress: body.marketAddress,
        finalPriceE9: body.finalPriceE9,
        resolvedAt: body.resolvedAt,
      }),
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.forecast-markets.resolve-intent",
      error,
      fallbackMessage: "Failed to create forecast resolve intent",
    });
  }
}
