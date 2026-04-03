"use client";

import { AchievementsPanel } from "@/components/community/achievements-panel";
import { useCommunityProfile } from "@/components/community/community-provider";
import { DailyCheckInCard } from "@/components/community/daily-check-in-card";
import { LevelProgressCard } from "@/components/community/level-progress-card";
import { NotificationCenterCard } from "@/components/community/notification-center-card";
import { ProfileBetHistory } from "@/components/community/profile-bet-history";
import { ProfileSummary } from "@/components/community/profile-summary";
import { ProfileTonPanel } from "@/components/community/profile-ton-panel";
import { WatchlistPanel } from "@/components/community/watchlist-panel";
import { useI18n } from "@/components/i18n/i18n-provider";
import { TelegramLaunchCard } from "@/components/telegram/telegram-launch-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletGuard } from "@/components/wallet-guard";

function ProfileCheckInHistory() {
  const { t } = useI18n();
  const { profile } = useCommunityProfile();

  if (!profile) {
    return null;
  }

  return (
    <Card className="surface-panel">
      <CardHeader className="pb-3">
        <p className="eyebrow">{t("profile.history.eyebrow")}</p>
        <CardTitle className="text-slate-950">
          {t("profile.history.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {profile.checkInDates.length === 0 ? (
          <p className="text-sm text-slate-500">{t("profile.history.empty")}</p>
        ) : (
          profile.checkInDates
            .slice(-14)
            .reverse()
            .map((date) => (
              <div
                key={date}
                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-slate-700"
              >
                {new Date(date).toLocaleDateString()}
              </div>
            ))
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { t } = useI18n();

  return (
    <WalletGuard
      fallback={
        <Card className="surface-panel mx-auto mt-10 max-w-xl">
          <CardContent className="p-8 text-center text-slate-600">
            {t("profile.walletGuard")}
          </CardContent>
        </Card>
      }
    >
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6">
        <div className="hero-shell">
          <p className="eyebrow">{t("profile.hero.eyebrow")}</p>
          <h1 className="page-heading mt-3">
            {t("profile.hero.title")}
          </h1>
          <p className="page-subheading mt-4">
            {t("profile.hero.subtitle")}
          </p>
        </div>
        <ProfileSummary />
        <DailyCheckInCard />
        <ProfileCheckInHistory />
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
