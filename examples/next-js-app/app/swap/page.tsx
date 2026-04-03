import { ReferralForm } from "./components/referral-form";
import { SwapButton } from "./components/swap-button";
import { SwapForm } from "./components/swap-form";
import { SwapFormHeader } from "./components/swap-form-header";
import { SwapMarketIntelligence } from "./components/swap-market-intelligence";
import { SwapSimulationPreview } from "./components/swap-simulation";
import { SwapPredictionPanel } from "./components/swap-prediction-panel";

export default function Home() {
  return (
    <section className="mx-auto w-full max-w-[500px] pt-4 md:pt-12 flex flex-col gap-4">
      <SwapFormHeader />
      <SwapForm />
      <ReferralForm />
      <SwapSimulationPreview />
      <SwapMarketIntelligence />
      <SwapButton />
      <SwapPredictionPanel />
    </section>
  );
}
