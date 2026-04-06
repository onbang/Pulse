"use client";

import { AchievementsPanel } from "@/components/community/achievements-panel";
import { ActivePredictionsPanel } from "@/components/community/active-predictions-panel";
import { DailyCheckInCard } from "@/components/community/daily-check-in-card";
import { ProfileBetHistory } from "@/components/community/profile-bet-history";
import { ProfileSummary } from "@/components/community/profile-summary";
import { ProfileTonPanel } from "@/components/community/profile-ton-panel";
import { WatchlistPanel } from "@/components/community/watchlist-panel";
import { useI18n } from "@/components/i18n/i18n-provider";
import { PageIntro } from "@/components/page-intro";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { useCommunityProfile } from "@/components/community/community-provider";
import { getUserLevelProgress } from "@/lib/community";
import { WalletGuard } from "@/components/wallet-guard";

export default function ProfilePage() {
  const { t } = useI18n();
  const { achievements, profile } = useCommunityProfile();

  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;
  const levelProgress = profile
    ? getUserLevelProgress(profile.totalPoints)
    : null;

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
          stats={
            profile
              ? [
                  {
                    label: t("checkin.totalPoints"),
                    value: String(profile.totalPoints),
                    body: levelProgress?.next
                      ? t("checkin.progressNext", {
                          count: String(levelProgress.remainingScore),
                          level: t(`profile.level.${levelProgress.next.id}`),
                        })
                      : t("profile.progression.maxUnlocked"),
                  },
                  {
                    label: t("checkin.currentStreak"),
                    value: String(profile.streak),
                    body: t("checkin.daysInRow", {
                      count: String(profile.streak),
                    }),
                  },
                  {
                    label: t("profile.summary.unlockedBadges"),
                    value: String(unlockedAchievements),
                    body: t("profile.achievements.unlockedCount", {
                      unlocked: String(unlockedAchievements),
                      total: String(achievements.length),
                    }),
                  },
                ]
              : []
          }
          actions={[
            {
              href: ROUTES.swap,
              label: t("profile.hero.primaryAction"),
              className:
                "bg-[linear-gradient(135deg,#061a31,#0b75d5,#33c3f0)] shadow-[0_22px_50px_-26px_rgba(11,117,213,0.56)]",
            },
            {
              href: ROUTES.pools,
              label: t("profile.hero.secondaryAction"),
              variant: "outline",
              className:
                "border-white/85 bg-white/82 text-slate-900 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.16)]",
            },
          ]}
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)] xl:items-start">
          <DailyCheckInCard />
          <ProfileSummary />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:items-start">
          <ActivePredictionsPanel />
          <ProfileBetHistory />
        </div>
        <AchievementsPanel />
        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)] xl:items-start">
          <WatchlistPanel />
          <ProfileTonPanel />
        </div>
      </section>
    </WalletGuard>
  );
}
