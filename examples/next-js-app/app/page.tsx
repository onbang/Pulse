"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";

const PRIMARY_PATHS = [
  {
    route: ROUTES.swap,
    titleKey: "landing.path.swap.title",
    bodyKey: "landing.path.swap.body",
    ctaKey: "landing.path.swap.cta",
  },
  {
    route: ROUTES.pools,
    titleKey: "landing.path.pools.title",
    bodyKey: "landing.path.pools.body",
    ctaKey: "landing.path.pools.cta",
  },
  {
    route: ROUTES.profile,
    titleKey: "landing.path.profile.title",
    bodyKey: "landing.path.profile.body",
    ctaKey: "landing.path.profile.cta",
  },
] as const;

const SECONDARY_PATHS = [
  { route: ROUTES.checkIn, labelKey: "nav.checkIn" },
  { route: ROUTES.community, labelKey: "nav.community" },
  { route: ROUTES.leaderboard, labelKey: "nav.leaderboard" },
  { route: ROUTES.liquidityProvide, labelKey: "nav.liquidityProvide" },
  { route: ROUTES.vault, labelKey: "nav.vault" },
  { route: ROUTES.stake, labelKey: "nav.stake" },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    titleKey: "landing.how.step1.title",
    bodyKey: "landing.how.step1.body",
  },
  {
    step: "02",
    titleKey: "landing.how.step2.title",
    bodyKey: "landing.how.step2.body",
  },
  {
    step: "03",
    titleKey: "landing.how.step3.title",
    bodyKey: "landing.how.step3.body",
  },
] as const;

export default function HomePage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4 md:py-10">
      <div className="hero-shell">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_380px] lg:items-end">
          <div>
            <p className="eyebrow">{t("landing.hero.eyebrow")}</p>
            <h1 className="page-heading mt-3">{t("landing.hero.title")}</h1>
            <p className="page-subheading mt-4">{t("landing.hero.subtitle")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={ROUTES.swap}
                className="rounded-full bg-[linear-gradient(135deg,#0180FF,#7354F2)] px-5 py-3 text-sm font-semibold text-white shadow-[0_22px_44px_-24px_rgba(1,128,255,0.45)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                {t("landing.hero.primaryCta")}
              </Link>
              <Link
                href={ROUTES.pools}
                className="rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-sky-50"
              >
                {t("landing.hero.secondaryCta")}
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <Card className="stat-pill border-sky-100 bg-white/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {t("landing.hero.card1.eyebrow")}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {t("landing.hero.card1.title")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t("landing.hero.card1.body")}
                </p>
              </CardContent>
            </Card>
            <Card className="stat-pill border-sky-100 bg-white/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {t("landing.hero.card2.eyebrow")}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {t("landing.hero.card2.title")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t("landing.hero.card2.body")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {PRIMARY_PATHS.map((item) => (
          <Card key={item.route} className="surface-panel overflow-hidden">
            <CardHeader className="pb-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                {t("landing.path.eyebrow")}
              </p>
              <CardTitle className="text-2xl text-slate-950">
                {t(item.titleKey)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                {t(item.bodyKey)}
              </p>
              <Link
                href={item.route}
                className="inline-flex rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-sky-50"
              >
                {t(item.ctaKey)}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="surface-panel overflow-hidden">
        <CardHeader>
          <p className="eyebrow">{t("landing.how.eyebrow")}</p>
          <CardTitle className="mt-2 text-3xl text-slate-950">
            {t("landing.how.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="rounded-[24px] border border-sky-100 bg-white p-5"
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#3DB1FF]/80">
                {item.step}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">
                {t(item.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t(item.bodyKey)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="surface-panel overflow-hidden">
        <CardHeader>
          <p className="eyebrow">{t("landing.explore.eyebrow")}</p>
          <CardTitle className="mt-2 text-3xl text-slate-950">
            {t("landing.explore.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {SECONDARY_PATHS.map((item) => (
            <Link
              key={item.route}
              href={item.route}
              className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-sky-50 hover:text-slate-950"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
