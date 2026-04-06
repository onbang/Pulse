"use client";

import { AchievementsPanel } from "@/components/community/achievements-panel";
import { DailyCheckInCard } from "@/components/community/daily-check-in-card";
import { ProfileBetHistory } from "@/components/community/profile-bet-history";
import { ProfileSummary } from "@/components/community/profile-summary";
import { ProfileTonPanel } from "@/components/community/profile-ton-panel";
import { useI18n } from "@/components/i18n/i18n-provider";
import { PageIntro } from "@/components/page-intro";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { useCommunityProfile } from "@/components/community/community-provider";
import { getUserLevel, getUserLevelProgress } from "@/lib/community";
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
  const userLevel = profile ? getUserLevel(profile.totalPoints) : null;
  const nextLevelLabel = levelProgress?.next
    ? t(`profile.level.${levelProgress.next.id}`)
    : t("profile.progression.maxReached");
  const overviewStats = profile
    ? [
        {
          label: t("checkin.totalPoints"),
          value: String(profile.totalPoints),
          body: levelProgress?.next
            ? t("checkin.progressNext", {
                count: String(levelProgress.remainingScore),
                level: nextLevelLabel,
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
    : [];
  const progressBody = levelProgress?.next
    ? t("checkin.progressNext", {
        count: String(levelProgress.remainingScore),
        level: nextLevelLabel,
      })
    : t("profile.progression.maxUnlocked");

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
        {profile && levelProgress && userLevel ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:items-stretch">
            <div className="grid gap-4 md:grid-cols-3">
              {overviewStats.map((stat) => (
                <div
                  key={stat.label}
                  className="stat-pill flex h-full min-h-[156px] flex-col justify-between px-5 py-5"
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {stat.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mesh-card p-5 md:p-6">
              <div className="relative z-10 flex h-full flex-col gap-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
                      {t("profile.progression.eyebrow")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {t(`profile.level.${userLevel.id}`)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {progressBody}
                    </p>
                  </div>
                  <Badge className={`border-0 ${userLevel.accentClassName}`}>
                    {t(`profile.level.${userLevel.id}`)}
                  </Badge>
                </div>

                <div className="subtle-panel bg-white/84">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-500">
                      {t("profile.progression.progress")}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {levelProgress.progressPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-full bg-sky-100">
                    <div
                      className="h-3 rounded-full bg-[linear-gradient(90deg,#0180FF,#3DB1FF,#34d399)] transition-all duration-500"
                      style={{ width: `${levelProgress.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>{profile.totalPoints} pts</span>
                    <span>
                      {t("profile.progression.next")}: {nextLevelLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] xl:items-start">
          <ProfileSummary />
          <DailyCheckInCard />
        </div>
        <ProfileBetHistory />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
          <AchievementsPanel />
          <ProfileTonPanel />
        </div>
      </section>
    </WalletGuard>
  );
}
