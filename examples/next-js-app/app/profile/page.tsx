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
import { WalletGuard } from "@/components/wallet-guard";

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
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <DailyCheckInCard />
          <ProfileSummary />
        </div>
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
