"use client";

import { PageIntro } from "@/components/page-intro";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ROUTES } from "@/constants";

import { PoolsBrowser } from "./components/pools-browser";

export default function PoolsPage() {
  const { t } = useI18n();

  return (
    <section className="page-shell">
      <PageIntro
        eyebrow={t("pools.hero.eyebrow")}
        title={t("pools.hero.title")}
        subtitle={t("pools.hero.subtitle")}
        actions={[
          {
            href: ROUTES.liquidityProvide,
            label: t("pools.board.provide"),
          },
          {
            href: ROUTES.profile,
            label: t("nav.profile"),
            variant: "outline",
          },
        ]}
        stats={[
          {
            label: t("pools.hero.coverage"),
            value: t("pools.hero.coverageValue"),
            body: t("pools.hero.coverageBody"),
          },
          {
            label: t("pools.hero.signal"),
            value: t("pools.hero.signalValue"),
            body: t("pools.hero.signalBody"),
          },
          {
            label: t("pools.hero.goal"),
            value: t("pools.hero.goalValue"),
            body: t("pools.hero.goalBody"),
          },
        ]}
      />
      <PoolsBrowser />
    </section>
  );
}
