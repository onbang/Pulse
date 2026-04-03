"use client";

import { AchievementsPanel } from "@/components/community/achievements-panel";
import { LevelProgressCard } from "@/components/community/level-progress-card";
import { NotificationCenterCard } from "@/components/community/notification-center-card";
import { ProfileBetHistory } from "@/components/community/profile-bet-history";
import { ProfileSummary } from "@/components/community/profile-summary";
import { ProfileTonPanel } from "@/components/community/profile-ton-panel";
import { WatchlistPanel } from "@/components/community/watchlist-panel";
import { TelegramLaunchCard } from "@/components/telegram/telegram-launch-card";
import { Card, CardContent } from "@/components/ui/card";
import { WalletGuard } from "@/components/wallet-guard";

export default function ProfilePage() {
  return (
    <WalletGuard
      fallback={
        <Card className="surface-panel mx-auto mt-10 max-w-xl">
          <CardContent className="p-8 text-center text-slate-600">
            Connect your wallet to unlock your STON profile, achievements, and
            community activity.
          </CardContent>
        </Card>
      }
    >
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6">
        <div className="hero-shell">
          <p className="eyebrow">Profile Hub</p>
          <h1 className="page-heading mt-3">
            Build your onchain identity inside STON Pulse.
          </h1>
          <p className="page-subheading mt-4">
            Track points, achievements, watched pools, prediction history, and
            wallet activity in one polished personal dashboard.
          </p>
        </div>
        <ProfileSummary />
        <LevelProgressCard />
        <TelegramLaunchCard />
        <NotificationCenterCard />
        <AchievementsPanel />
        <div className="grid gap-6 lg:grid-cols-2">
          <WatchlistPanel />
          <ProfileBetHistory />
        </div>
        <ProfileTonPanel />
      </section>
    </WalletGuard>
  );
}
