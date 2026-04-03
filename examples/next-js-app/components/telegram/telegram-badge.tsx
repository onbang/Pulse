"use client";

import { Badge } from "@/components/ui/badge";
import { useTelegramMiniApp } from "./telegram-mini-app-provider";

export function TelegramBadge() {
  const { isTelegramMiniApp, user } = useTelegramMiniApp();

  if (!isTelegramMiniApp) {
    return <Badge variant="outline">Web App</Badge>;
  }

  return (
    <Badge variant="secondary">
      Telegram {user?.username ? `@${user.username}` : "Mini App"}
    </Badge>
  );
}
