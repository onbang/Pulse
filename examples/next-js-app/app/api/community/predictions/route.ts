import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import {
  addPrediction,
  syncPredictionTransaction,
  settlePredictionRound,
} from "@/lib/server/community-store";
import type { PredictionDirection } from "@/lib/community";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      walletAddress?: string;
      pairId?: string;
      label?: string;
      direction?: PredictionDirection;
      amount?: number;
      txHash?: string;
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
        txHash: body.txHash,
      }),
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.community.predictions.post",
      error,
      fallbackMessage: "Failed to add prediction",
    });
  }
}

export async function PATCH(request: Request) {
  try {
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
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.community.predictions.patch",
      error,
      fallbackMessage: "Failed to settle prediction round",
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      walletAddress?: string;
      txHash?: string;
    };

    if (!body.walletAddress || !body.txHash) {
      return NextResponse.json(
        { error: "Missing prediction sync payload" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await syncPredictionTransaction({
        walletAddress: body.walletAddress,
        txHash: body.txHash,
      }),
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.community.predictions.put",
      error,
      fallbackMessage: "Failed to sync prediction transaction",
    });
  }
}
