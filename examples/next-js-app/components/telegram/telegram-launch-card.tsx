"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createTelegramMiniAppLink,
  TELEGRAM_START_PARAMS,
} from "@/lib/telegram-links";

const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export function TelegramLaunchCard() {
  if (!botUsername) {
    return null;
  }

  const miniAppLink = createTelegramMiniAppLink(botUsername);
  const quickLinks = [
    {
      label: "Swap",
      href: createTelegramMiniAppLink(botUsername, TELEGRAM_START_PARAMS.swap),
    },
    {
      label: "Profile",
      href: createTelegramMiniAppLink(
        botUsername,
        TELEGRAM_START_PARAMS.profile,
      ),
    },
    {
      label: "Leaderboard",
      href: createTelegramMiniAppLink(
        botUsername,
        TELEGRAM_START_PARAMS.leaderboard,
      ),
    },
    {
      label: "Check-in",
      href: createTelegramMiniAppLink(
        botUsername,
        TELEGRAM_START_PARAMS.checkIn,
      ),
    },
  ];
  const shareText = encodeURIComponent(
    "Check out STON Pulse: swaps, bets, community, and on-chain profile inside Telegram.",
  );
  const shareLink = `https://t.me/share/url?url=${encodeURIComponent(miniAppLink)}&text=${shareText}`;

  return (
    <Card className="border-sky-200 bg-[linear-gradient(135deg,#eff6ff,#ffffff)]">
      <CardHeader>
        <CardTitle>Telegram Mini App</CardTitle>
        <CardDescription>
          Launch STON Pulse from Telegram or share the Mini App entrypoint with
          your community.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={miniAppLink} target="_blank" rel="noreferrer">
              Open in Telegram
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={shareLink} target="_blank" rel="noreferrer">
              Share Mini App
            </a>
          </Button>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Quick entrypoints
          </p>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((item) => (
              <Button key={item.label} variant="ghost" size="sm" asChild>
                <a href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
