"use client";

import { fromUnits } from "@ston-fi/sdk";
import { useEffect } from "react";

import { useSwapSimulation } from "../hooks/swap-simulation-query";
import { useSwapForm, useSwapFormDispatch } from "../providers/swap-form";

function normalizeQuotedAmount(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (!trimmed.includes(".")) {
    return trimmed;
  }

  return trimmed.replace(/\.?0+$/, "");
}

export function SwapQuoteSync() {
  const { data: simulation } = useSwapSimulation();
  const { offerAmount, askAmount, offerAsset, askAsset } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  useEffect(() => {
    if (!simulation || !offerAsset || !askAsset) {
      return;
    }

    if (offerAmount) {
      const nextAskAmount = normalizeQuotedAmount(
        fromUnits(BigInt(simulation.askUnits), askAsset.meta?.decimals ?? 9),
      );

      if (nextAskAmount !== askAmount) {
        dispatch({ type: "SYNC_ASK_AMOUNT", payload: nextAskAmount });
      }

      return;
    }

    if (askAmount) {
      const nextOfferAmount = normalizeQuotedAmount(
        fromUnits(
          BigInt(simulation.offerUnits),
          offerAsset.meta?.decimals ?? 9,
        ),
      );

      if (nextOfferAmount !== offerAmount) {
        dispatch({ type: "SYNC_OFFER_AMOUNT", payload: nextOfferAmount });
      }
    }
  }, [
    askAmount,
    askAsset,
    dispatch,
    offerAmount,
    offerAsset,
    simulation,
  ]);

  return null;
}
