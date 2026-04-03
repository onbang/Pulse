"use client";

import { useSwapForm } from "../providers/swap-form";

import { PricePredictionCard } from "@/components/community/price-prediction-card";

function normalizeLabel(label?: string | null) {
  return label?.trim() || "token";
}

export function SwapPredictionPanel() {
  const { offerAsset, askAsset } = useSwapForm();

  const offerLabel = normalizeLabel(offerAsset?.meta?.symbol);
  const askLabel = normalizeLabel(askAsset?.meta?.symbol);
  const pairId =
    offerAsset && askAsset
      ? `${offerAsset.contractAddress}:${askAsset.contractAddress}`
      : "market-overview";
  const pairLabel =
    offerAsset && askAsset ? `${offerLabel}/${askLabel}` : "the selected pair";

  return (
    <PricePredictionCard
      pairId={pairId}
      label={pairLabel}
      disabled={!offerAsset || !askAsset}
    />
  );
}
