"use client";

import { SwapPredictionMarketsHub } from "./components/swap-prediction-markets-hub";
import { SwapQuoteSync } from "./components/swap-quote-sync";

export default function Home() {
  return (
    <section className="page-shell max-w-[1380px]">
      <SwapQuoteSync />
      <SwapPredictionMarketsHub />
    </section>
  );
}
