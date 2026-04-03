import { NextResponse } from "next/server";

import { toggleReaction } from "@/lib/server/community-store";
import type { CommentReactionEmoji } from "@/lib/community";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    poolId?: string;
    commentId?: string;
    emoji?: CommentReactionEmoji;
  };

  if (!body.walletAddress || !body.poolId || !body.commentId || !body.emoji) {
    return NextResponse.json(
      { error: "Missing reaction payload" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    await toggleReaction({
      walletAddress: body.walletAddress,
      poolId: body.poolId,
      commentId: body.commentId,
      emoji: body.emoji,
    }),
  );
}
