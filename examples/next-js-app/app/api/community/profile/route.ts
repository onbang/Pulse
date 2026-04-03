import { NextResponse } from "next/server";

import type { NotificationPreferences } from "@/lib/community";
import { upsertProfile } from "@/lib/server/community-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    walletAddress?: string;
    displayName?: string;
    bio?: string;
    telegramDisplayName?: string | null;
    notificationPreferences?: Partial<NotificationPreferences>;
  };

  if (!body.walletAddress) {
    return NextResponse.json(
      { error: "Missing walletAddress" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    await upsertProfile({
      walletAddress: body.walletAddress,
      displayName: body.displayName ?? "",
      bio: body.bio ?? "",
      telegramDisplayName: body.telegramDisplayName ?? null,
      notificationPreferences: body.notificationPreferences ?? undefined,
    }),
  );
}
