"use client";

import { AchievementsPanel } from "@/components/community/achievements-panel";
import { ActivePredictionsPanel } from "@/components/community/active-predictions-panel";
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
  const { profile, checkInEvents, rewardLedger } = useCommunityProfile();

  if (!profile) {
    return null;
  }

  const userEvents = checkInEvents
    .filter((event) => event.walletAddress === profile.walletAddress)
    .slice(0, 8);
  const userRewards = rewardLedger
    .filter((entry) => entry.walletAddress === profile.walletAddress)
    .slice(0, 4);

  return (
    <Card className="surface-panel">
      <CardHeader className="pb-3">
        <p className="eyebrow">{t("profile.history.eyebrow")}</p>
        <CardTitle className="text-slate-950">
          {t("profile.history.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="flex flex-wrap gap-2">
          {userEvents.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t("profile.history.empty")}
            </p>
          ) : (
            userEvents.map((event) => (
              <div
                key={event.id}
                className={`rounded-full border px-3 py-1 text-sm ${
                  event.status === "confirmed"
                    ? "border-sky-200 bg-sky-50 text-slate-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {new Date(event.dateKey).toLocaleDateString()} ·{" "}
                {event.status === "confirmed"
                  ? t("profile.history.confirmed")
                  : t("profile.history.pending")}
              </div>
            ))
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {t("checkin.recentRewards")}
          </p>
          {userRewards.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t("checkin.recentRewardsEmpty")}
            </p>
          ) : (
            userRewards.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm"
              >
                <span className="text-slate-600">{entry.label}</span>
                <strong className="text-emerald-600">+{entry.points}</strong>
              </div>
            ))
          )}
        </div>
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
          <h1 className="page-heading mt-3">{t("profile.hero.title")}</h1>
          <p className="page-subheading mt-4">{t("profile.hero.subtitle")}</p>
        </div>
        <DailyCheckInCard />
        <ProfileSummary />
        <ProfileCheckInHistory />
        <LevelProgressCard />
        <TelegramLaunchCard />
        <NotificationCenterCard />
        <AchievementsPanel />
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivePredictionsPanel />
          <ProfileBetHistory />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <WatchlistPanel />
          <ProfileTonPanel />
        </div>
      </section>
    </WalletGuard>
  );
}
