import { NextResponse } from "next/server";

import { getCommunityState } from "@/lib/server/community-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("wallet");

  return NextResponse.json(await getCommunityState(walletAddress));
}
