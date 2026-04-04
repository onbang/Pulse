import { NextResponse } from "next/server";

import { createForecastMarketIntent } from "@/lib/server/forecast-market-store";
import { isPredictionTimeframeId } from "@/lib/prediction-timeframes";
import type { PredictionDirection } from "@/lib/community";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    tokenAddress?: string;
    timeframeId?: string;
    direction?: PredictionDirection;
    amountTon?: number;
    thresholdBps?: number;
  };

  if (
    !body.walletAddress ||
    !body.tokenAddress ||
    !body.timeframeId ||
    !isPredictionTimeframeId(body.timeframeId) ||
    !body.direction ||
    typeof body.amountTon !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing forecast market create payload" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await createForecastMarketIntent({
        walletAddress: body.walletAddress,
        tokenAddress: body.tokenAddress,
        timeframeId: body.timeframeId,
        direction: body.direction,
        amountTon: body.amountTon,
        thresholdBps: body.thresholdBps,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create forecast market intent",
      },
      { status: 500 },
    );
  }
}
