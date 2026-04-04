import { NextResponse } from "next/server";

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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create forecast resolve intent",
      },
      { status: 500 },
    );
  }
}
