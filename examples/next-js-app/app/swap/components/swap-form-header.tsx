"use client";

import { RefreshCw, Settings } from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";

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
              <p className="max-w-xl text-sm leading-6 text-white/78 md:text-base">
                {t("swap.hero.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="glass-strip size-10 border-white/20 bg-white/10 p-0 text-white hover:bg-white/20 hover:text-white"
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
                  className="glass-strip size-10 border-white/20 bg-white/10 p-0 text-white hover:bg-white/20 hover:text-white"
                >
                  <Settings size={18} />
                </Button>
              }
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="stat-pill border-white/20 bg-white/10 text-white">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              {t("swap.hero.execution")}
            </p>
            <p className="mt-2 text-lg font-semibold">
              {t("swap.hero.executionTitle")}
            </p>
            <p className="mt-1 text-sm text-white/72">
              {t("swap.hero.executionBody")}
            </p>
          </div>
          <div className="stat-pill border-white/20 bg-white/10 text-white">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              {t("swap.hero.community")}
            </p>
            <p className="mt-2 text-lg font-semibold">
              {t("swap.hero.communityTitle")}
            </p>
            <p className="mt-1 text-sm text-white/72">
              {t("swap.hero.communityBody")}
            </p>
          </div>
          <div className="stat-pill border-white/20 bg-white/10 text-white">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              {t("swap.hero.precision")}
            </p>
            <p className="mt-2 text-lg font-semibold">
              {swapSimulationQuery.isFetching
                ? t("swap.hero.precisionLoading")
                : t("swap.hero.precisionTitle")}
            </p>
            <p className="mt-1 text-sm text-white/72">
              {t("swap.hero.precisionBody")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
