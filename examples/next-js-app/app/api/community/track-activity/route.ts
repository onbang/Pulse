import { NextResponse } from "next/server";

import { startTrackedActivity } from "@/lib/server/community-store";
import type { ActivityTrack } from "@/lib/community";

export async function POST(request: Request) {
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
}
