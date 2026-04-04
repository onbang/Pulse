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
import { PageIntro } from "@/components/page-intro";
import { TelegramLaunchCard } from "@/components/telegram/telegram-launch-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";
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
            <div className="empty-state-panel w-full">
              <p className="empty-state-title">{t("profile.history.title")}</p>
              <p className="text-sm text-slate-600">
                {t("profile.history.empty")}
              </p>
            </div>
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
            <div className="empty-state-panel">
              <p className="empty-state-title">{t("checkin.recentRewards")}</p>
              <p className="text-sm text-slate-600">
                {t("checkin.recentRewardsEmpty")}
              </p>
            </div>
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
  const { profile } = useCommunityProfile();

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
      <section className="page-shell">
        <PageIntro
          eyebrow={t("profile.hero.eyebrow")}
          title={t("profile.hero.title")}
          subtitle={t("profile.hero.subtitle")}
          actions={[
            {
              href: ROUTES.swap,
              label: t("profile.hero.primaryAction"),
            },
            {
              href: ROUTES.pools,
              label: t("profile.hero.secondaryAction"),
              variant: "outline",
            },
          ]}
          stats={
            profile
              ? [
                  {
                    label: t("checkin.totalPoints"),
                    value: String(profile.totalPoints),
                    body: t("profile.summary.pointsCount", {
                      count: String(profile.totalPoints),
                    }),
                  },
                  {
                    label: t("checkin.currentStreak"),
                    value: String(profile.streak),
                    body: t("checkin.daysInRow", {
                      count: String(profile.streak),
                    }),
                  },
                  {
                    label: t("checkin.totalCheckIns"),
                    value: String(profile.totalCheckIns),
                    body: t("profile.summary.totalCheckInsBody"),
                  },
                ]
              : []
          }
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <DailyCheckInCard />
          <div className="space-y-6">
            <LevelProgressCard />
            <ProfileCheckInHistory />
          </div>
        </div>
        <ProfileSummary />
        <AchievementsPanel />
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivePredictionsPanel />
          <ProfileBetHistory />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <WatchlistPanel />
          <ProfileTonPanel />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <TelegramLaunchCard />
          <NotificationCenterCard />
        </div>
      </section>
    </WalletGuard>
  );
}
