"use client";

import Link from "next/link";
import { RefreshCw, Settings } from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

import { useSwapSimulation } from "../hooks/swap-simulation-query";

import { SwapSettings } from "./swap-settings";

export const SwapFormHeader = () => {
  const swapSimulationQuery = useSwapSimulation();
  const { t } = useI18n();

  return (
    <div className="hero-shell">
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="mr-auto space-y-3">
            <p className="eyebrow">{t("swap.hero.eyebrow")}</p>
            <div className="space-y-2">
              <h1 className="page-heading text-4xl md:text-5xl">
                {t("swap.hero.title")}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-600 md:text-base">
                {t("swap.hero.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="glass-strip size-10 border-sky-100 bg-white/90 p-0 text-slate-700 hover:bg-sky-50 hover:text-slate-900"
              disabled={
                !swapSimulationQuery.isFetched || swapSimulationQuery.isFetching
              }
              onClick={() => swapSimulationQuery.refetch()}
            >
              <RefreshCw
                size={18}
                className={swapSimulationQuery.isLoading ? "animate-spin" : ""}
              />
            </Button>
            <SwapSettings
              trigger={
                <Button
                  variant="outline"
                  className="glass-strip size-10 border-sky-100 bg-white/90 p-0 text-slate-700 hover:bg-sky-50 hover:text-slate-900"
                >
                  <Settings size={18} />
                </Button>
              }
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="stat-pill">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-500/80">
              {t("swap.hero.execution")}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {t("swap.hero.executionTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t("swap.hero.executionBody")}
            </p>
          </div>
          <div className="stat-pill">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-500/80">
              {t("swap.hero.community")}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {t("swap.hero.communityTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t("swap.hero.communityBody")}
            </p>
          </div>
          <div className="stat-pill">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-500/80">
              {t("swap.hero.precision")}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {swapSimulationQuery.isFetching
                ? t("swap.hero.precisionLoading")
                : t("swap.hero.precisionTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t("swap.hero.precisionBody")}
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-sky-100 bg-white/82 p-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="max-w-2xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-500/80">
                {t("swap.onboarding.eyebrow")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {t("swap.onboarding.title")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t("swap.onboarding.body")}
              </p>
            </div>

            <div className="subtle-panel">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("swap.onboarding.guidanceTitle")}
              </p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <p>{t("swap.onboarding.guidancePrimary")}</p>
                <p>{t("swap.onboarding.guidanceSecondary")}</p>
                <p>{t("swap.onboarding.guidanceTertiary")}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={ROUTES.pools}
                  className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  {t("swap.onboarding.secondary")}
                </Link>
                <Link
                  href={ROUTES.profile}
                  className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  {t("swap.onboarding.tertiary")}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[20px] border border-sky-100/90 bg-sky-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white">
                  1
                </div>
                <p className="text-base font-semibold text-slate-950">
                  {t("swap.onboarding.step1.title")}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t("swap.onboarding.step1.body")}
              </p>
            </div>

            <div className="rounded-[20px] border border-sky-100/90 bg-sky-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white">
                  2
                </div>
                <p className="text-base font-semibold text-slate-950">
                  {t("swap.onboarding.step2.title")}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t("swap.onboarding.step2.body")}
              </p>
            </div>

            <div className="rounded-[20px] border border-sky-100/90 bg-sky-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white">
                  3
                </div>
                <p className="text-base font-semibold text-slate-950">
                  {t("swap.onboarding.step3.title")}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t("swap.onboarding.step3.body")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
