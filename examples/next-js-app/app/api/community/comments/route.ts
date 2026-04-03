import { NextResponse } from "next/server";

import { addPoolComment } from "@/lib/server/community-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    poolId?: string;
    text?: string;
  };

  if (!body.walletAddress || !body.poolId) {
    return NextResponse.json(
      { error: "Missing walletAddress or poolId" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    await addPoolComment({
      walletAddress: body.walletAddress,
      poolId: body.poolId,
      text: body.text ?? "",
    }),
  );
}
