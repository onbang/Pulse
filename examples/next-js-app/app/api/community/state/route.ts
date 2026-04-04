import { NextResponse } from "next/server";

import { runForecastAutoCycle } from "@/lib/server/forecast-market-store";
import { getCommunityState } from "@/lib/server/community-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("wallet");

  await runForecastAutoCycle();
  return NextResponse.json(await getCommunityState(walletAddress));
}
