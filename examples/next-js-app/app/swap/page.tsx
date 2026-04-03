import { ReferralForm } from "./components/referral-form";
import { SwapButton } from "./components/swap-button";
import { SwapForm } from "./components/swap-form";
import { SwapFormHeader } from "./components/swap-form-header";
import { SwapMarketIntelligence } from "./components/swap-market-intelligence";
import { SwapPriceChart } from "./components/swap-price-chart";
import { SwapSimulationPreview } from "./components/swap-simulation";
import { SwapPredictionPanel } from "./components/swap-prediction-panel";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4 md:py-10">
      <SwapFormHeader />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
        <div className="space-y-6">
          <div className="mesh-card p-5 md:p-6">
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-300/60">
                    Trade ticket
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    Execute with confidence
                  </h2>
                </div>
                <div className="stat-pill px-3 py-2 text-right">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Mode
                  </p>
                  <p className="text-sm font-semibold text-white">
                    Wallet-grade flow
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
          <SwapMarketIntelligence />
          <SwapPredictionPanel />
        </div>
      </div>
    </section>
  );
}
