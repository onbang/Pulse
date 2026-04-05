import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { toggleWatchlist } from "@/lib/server/community-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      walletAddress?: string;
      poolId?: string;
      poolLabel?: string;
    };

    if (!body.walletAddress || !body.poolId || !body.poolLabel) {
      return NextResponse.json(
        { error: "Missing watchlist payload" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await toggleWatchlist({
        walletAddress: body.walletAddress,
        poolId: body.poolId,
        poolLabel: body.poolLabel,
      }),
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.community.watchlist.post",
      error,
      fallbackMessage: "Failed to toggle watchlist item",
    });
  }
}
