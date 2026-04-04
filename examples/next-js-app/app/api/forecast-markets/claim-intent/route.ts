import { NextResponse } from "next/server";

import { createForecastClaimIntent } from "@/lib/server/forecast-market-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    marketAddress?: string;
  };

  if (!body.walletAddress || !body.marketAddress) {
    return NextResponse.json(
      { error: "Missing forecast claim payload" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await createForecastClaimIntent({
        walletAddress: body.walletAddress,
        marketAddress: body.marketAddress,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create forecast claim intent",
      },
      { status: 500 },
    );
  }
}
