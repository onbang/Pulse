"use client";

import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { AssetSelect } from "@/components/asset-select";
import { Input } from "@/components/ui/input";
import { validateFloatValue } from "@/lib/utils";
import { useSwapForm } from "../providers/swap-form";

import { PricePredictionCard } from "@/components/community/price-prediction-card";
import { type AssetInfo, useAssetsQuery } from "@/hooks/use-assets-query";

const PREDICTION_ASSET_STORAGE_KEY = "ston-pulse:selected-prediction-asset";

function normalizeLabel(label?: string | null) {
  return label?.trim() || "token";
}

export function SwapPredictionPanel() {
  const { t } = useI18n();
  const { offerAsset, askAsset } = useSwapForm();
  const assetsQuery = useAssetsQuery();
  const [selectedPredictionAsset, setSelectedPredictionAsset] =
    useState<AssetInfo | null>(null);
  const [predictionStakeAmount, setPredictionStakeAmount] = useState("");

  const predictionAssets = useMemo(() => {
    return (assetsQuery.data ?? []).slice(0, 24);
  }, [assetsQuery.data]);

  useEffect(() => {
    if (offerAsset && askAsset) {
      return;
    }

    if (typeof window === "undefined" || selectedPredictionAsset) {
      return;
    }

    const savedAddress = window.localStorage.getItem(PREDICTION_ASSET_STORAGE_KEY);

    if (!savedAddress || predictionAssets.length === 0) {
      return;
    }

    const matchedAsset =
      predictionAssets.find((asset) => asset.contractAddress === savedAddress) ??
      null;

    if (matchedAsset) {
      setSelectedPredictionAsset(matchedAsset);
    }
  }, [offerAsset, askAsset, predictionAssets, selectedPredictionAsset]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (selectedPredictionAsset?.contractAddress) {
      window.localStorage.setItem(
        PREDICTION_ASSET_STORAGE_KEY,
        selectedPredictionAsset.contractAddress,
      );
      return;
    }

    window.localStorage.removeItem(PREDICTION_ASSET_STORAGE_KEY);
  }, [selectedPredictionAsset]);

  const offerLabel = normalizeLabel(offerAsset?.meta?.symbol);
  const askLabel = normalizeLabel(askAsset?.meta?.symbol);
  const selectedAssetLabel = normalizeLabel(selectedPredictionAsset?.meta?.symbol);

  const pairId =
    offerAsset && askAsset
      ? `${offerAsset.contractAddress}:${askAsset.contractAddress}`
      : selectedPredictionAsset
        ? `prediction:${selectedPredictionAsset.contractAddress}`
        : "market-overview";
  const pairLabel =
    offerAsset && askAsset
      ? `${offerLabel}/${askLabel}`
      : selectedPredictionAsset
        ? `${selectedAssetLabel}/TON`
        : "the selected pair";
  const isPredictionEnabled = Boolean(
    (offerAsset && askAsset) || selectedPredictionAsset,
  );
  const showExternalControls = !offerAsset || !askAsset;

  return (
    <div className="space-y-4">
      {showExternalControls ? (
        <div className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.96))] p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.14)]">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {t("swap.prediction.selectorEyebrow")}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {t("swap.prediction.selectorTitle")}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {t("swap.prediction.selectorBody")}
          </p>
          <div className="mt-4 grid items-end gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.75fr)]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t("prediction.tokenLabel")}
              </label>
              <AssetSelect
                assets={predictionAssets}
                selectedAsset={selectedPredictionAsset}
                onAssetSelect={setSelectedPredictionAsset}
                loading={assetsQuery.isLoading}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="prediction-stake-amount"
              >
                {t("prediction.stakeAmount")}
              </label>
              <Input
                className="h-11 rounded-2xl border-sky-100 bg-white text-slate-900 placeholder:text-slate-400"
                id="prediction-stake-amount"
                inputMode="decimal"
                value={predictionStakeAmount}
                disabled={!selectedPredictionAsset}
                onChange={(event) => {
                  if (
                    event.target.value &&
                    !validateFloatValue(event.target.value, 2)
                  ) {
                    return;
                  }

                  setPredictionStakeAmount(event.target.value);
                }}
                placeholder={
                  selectedPredictionAsset
                    ? t("prediction.stakePlaceholder")
                    : t("prediction.selectTokenFirst")
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      <PricePredictionCard
        pairId={pairId}
        label={pairLabel}
        disabled={!isPredictionEnabled}
        stakeAmount={showExternalControls ? predictionStakeAmount : undefined}
        onStakeAmountChange={
          showExternalControls ? setPredictionStakeAmount : undefined
        }
        showStakeInput={!showExternalControls}
      />
    </div>
  );
}
