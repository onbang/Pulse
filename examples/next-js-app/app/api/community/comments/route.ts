import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { addPoolComment } from "@/lib/server/community-store";

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.community.comments.post",
      error,
      fallbackMessage: "Failed to add pool comment",
    });
  }
}
