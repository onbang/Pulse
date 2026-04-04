import { NextResponse } from "next/server";

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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build forecast market context",
      },
      { status: 500 },
    );
  }
}
