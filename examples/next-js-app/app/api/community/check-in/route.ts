import { NextResponse } from "next/server";

import { performCheckIn } from "@/lib/server/community-store";

export async function POST(request: Request) {
  const body = (await request.json()) as { walletAddress?: string };

  if (!body.walletAddress) {
    return NextResponse.json(
      { error: "Missing walletAddress" },
      { status: 400 },
    );
  }

  return NextResponse.json(await performCheckIn(body.walletAddress));
}
