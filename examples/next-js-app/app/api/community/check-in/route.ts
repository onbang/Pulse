import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import {
  registerPendingCheckInTransaction,
  syncCheckInTransaction,
} from "@/lib/server/community-store";

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.community.check-in.post",
      error,
      fallbackMessage: "Failed to register pending check-in transaction",
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
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.community.check-in.put",
      error,
      fallbackMessage: "Failed to sync check-in transaction",
    });
  }
}
