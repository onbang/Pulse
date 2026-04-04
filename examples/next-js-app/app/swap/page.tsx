"use client";

import { useI18n } from "@/components/i18n/i18n-provider";

import { ReferralForm } from "./components/referral-form";
import { SwapButton } from "./components/swap-button";
import { SwapForm } from "./components/swap-form";
import { SwapFormHeader } from "./components/swap-form-header";
import { SwapMarketIntelligence } from "./components/swap-market-intelligence";
import { SwapPriceChart } from "./components/swap-price-chart";
import { SwapQuoteSync } from "./components/swap-quote-sync";
import { SwapSimulationPreview } from "./components/swap-simulation";
import { SwapPredictionPanel } from "./components/swap-prediction-panel";

export default function Home() {
  const { t } = useI18n();

  return (
    <section className="page-shell">
      <SwapQuoteSync />
      <SwapFormHeader />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
        <div className="space-y-6">
          <div className="mesh-card p-5 md:p-6">
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-500/75">
                    {t("swap.layout.primary")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {t("swap.ticket.title")}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    {t("swap.layout.primaryBody")}
                  </p>
                </div>
                <div className="stat-pill px-3 py-2 text-right">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {t("swap.ticket.mode")}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {t("swap.ticket.modeValue")}
                  </p>
                </div>
              </div>
              <SwapForm />
              <ReferralForm />
              <SwapButton />
            </div>
          </div>
          <SwapSimulationPreview />
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/85 bg-white/75 px-5 py-4 text-sm text-slate-600 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.16)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-500/75">
              {t("swap.layout.secondary")}
            </p>
            <p className="mt-2 leading-6">{t("swap.layout.secondaryBody")}</p>
          </div>
          <SwapPriceChart />
          <SwapPredictionPanel />
          <SwapMarketIntelligence />
        </div>
      </div>
    </section>
  );
}
