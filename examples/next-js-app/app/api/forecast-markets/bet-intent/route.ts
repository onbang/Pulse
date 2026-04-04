import { NextResponse } from "next/server";

import { createForecastBetIntent } from "@/lib/server/forecast-market-store";
import type { PredictionDirection } from "@/lib/community";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    pairId?: string;
    direction?: PredictionDirection;
    amountTon?: number;
  };

  if (
    !body.walletAddress ||
    !body.pairId ||
    !body.direction ||
    typeof body.amountTon !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing forecast bet payload" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await createForecastBetIntent({
        walletAddress: body.walletAddress,
        pairId: body.pairId,
        direction: body.direction,
        amountTon: body.amountTon,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create forecast bet intent",
      },
      { status: 500 },
    );
  }
}
