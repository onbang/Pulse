import { NextResponse } from "next/server";

import { startTrackedActivity } from "@/lib/server/community-store";
import type { ActivityTrack } from "@/lib/community";
import { jsonRouteError } from "@/lib/server/api-route-error";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      walletAddress?: string;
      track?: ActivityTrack;
    };

    if (!body.walletAddress || !body.track) {
      return NextResponse.json(
        { error: "Missing track payload" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await startTrackedActivity({
        walletAddress: body.walletAddress,
        track: body.track,
      }),
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.community.track-activity.post",
      error,
      fallbackMessage: "Failed to track community activity",
    });
  }
}
