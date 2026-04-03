"use client";

import { useI18n } from "@/components/i18n/i18n-provider";

import { PoolsBrowser } from "./components/pools-browser";

export default function PoolsPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4 md:py-10">
      <div className="hero-shell">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">{t("pools.hero.eyebrow")}</p>
            <h1 className="page-heading mt-3">{t("pools.hero.title")}</h1>
            <p className="page-subheading mt-4">
              {t("pools.hero.subtitle")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-sky-100 bg-white/88 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t("pools.hero.coverage")}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {t("pools.hero.coverageValue")}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {t("pools.hero.coverageBody")}
              </p>
            </div>
            <div className="rounded-[24px] border border-sky-100 bg-white/88 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t("pools.hero.signal")}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {t("pools.hero.signalValue")}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {t("pools.hero.signalBody")}
              </p>
            </div>
            <div className="rounded-[24px] border border-sky-100 bg-white/88 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t("pools.hero.goal")}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {t("pools.hero.goalValue")}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {t("pools.hero.goalBody")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <PoolsBrowser />
    </section>
  );
}
