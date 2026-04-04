import { NextResponse } from "next/server";

import {
  registerPendingCheckInTransaction,
  syncCheckInTransaction,
} from "@/lib/server/community-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    txHash?: string;
  };

  if (!body.walletAddress || !body.txHash) {
    return NextResponse.json(
      { error: "Missing walletAddress or txHash" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    await registerPendingCheckInTransaction({
      walletAddress: body.walletAddress,
      txHash: body.txHash,
    }),
  );
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    txHash?: string;
  };

  if (!body.walletAddress || !body.txHash) {
    return NextResponse.json(
      { error: "Missing walletAddress or txHash" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    await syncCheckInTransaction({
      walletAddress: body.walletAddress,
      txHash: body.txHash,
    }),
  );
}
