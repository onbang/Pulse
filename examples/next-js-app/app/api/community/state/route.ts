import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { runForecastAutoCycle } from "@/lib/server/forecast-market-store";
import { getCommunityState } from "@/lib/server/community-store";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get("wallet");

    await runForecastAutoCycle();
    return NextResponse.json(await getCommunityState(walletAddress));
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.community.state.get",
      error,
      fallbackMessage: "Failed to build community state",
    });
  }
}
