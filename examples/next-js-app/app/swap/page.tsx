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
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4 md:py-10">
      <SwapQuoteSync />
      <SwapFormHeader />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
        <div className="space-y-6">
          <div className="mesh-card p-5 md:p-6">
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-300/60">
                    {t("swap.ticket.eyebrow")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {t("swap.ticket.title")}
                  </h2>
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
          <SwapPriceChart />
          <SwapPredictionPanel />
          <SwapMarketIntelligence />
        </div>
      </div>
    </section>
  );
}
