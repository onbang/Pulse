import { NextResponse } from "next/server";

import {
  addPrediction,
  settlePredictionRound,
} from "@/lib/server/community-store";
import type { PredictionDirection } from "@/lib/community";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    pairId?: string;
    label?: string;
    direction?: PredictionDirection;
    amount?: number;
  };

  if (
    !body.walletAddress ||
    !body.pairId ||
    !body.label ||
    !body.direction ||
    typeof body.amount !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing prediction payload" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    await addPrediction({
      walletAddress: body.walletAddress,
      pairId: body.pairId,
      label: body.label,
      direction: body.direction,
      amount: body.amount,
    }),
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    pairId?: string;
    direction?: PredictionDirection;
  };

  if (!body.walletAddress || !body.pairId || !body.direction) {
    return NextResponse.json(
      { error: "Missing settlement payload" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    await settlePredictionRound({
      walletAddress: body.walletAddress,
      pairId: body.pairId,
      direction: body.direction,
    }),
  );
}
