"use client";

import { fromUnits } from "@ston-fi/sdk";
import type { ChangeEvent } from "react";

import { AssetSelect } from "@/components/asset-select";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type AssetInfo, useAssetsQuery } from "@/hooks/use-assets-query";
import { cn, validateFloatValue } from "@/lib/utils";

import { useSwapForm, useSwapFormDispatch } from "../providers/swap-form";

function assetUsdValue(asset: AssetInfo) {
  const balance = asset.balance;
  const decimals = asset.meta?.decimals ?? 9;
  const priceUsd = asset.dexPriceUsd;

  if (!balance || !priceUsd) return 0;

  return Number(fromUnits(BigInt(balance), decimals)) * Number(priceUsd);
}

function sortAssets(a: AssetInfo, b: AssetInfo): number {
  const aUsdValue = assetUsdValue(a);
  const bUsdValue = assetUsdValue(b);

  if (aUsdValue && bUsdValue) {
    return bUsdValue - aUsdValue;
  }

  if (aUsdValue && !bUsdValue) return -1;
  if (!aUsdValue && bUsdValue) return 1;

  return 0;
}

export const SwapForm = (props: { className?: string }) => {
  return (
    <Card
      {...props}
      className={cn(
        "overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-none",
        props.className,
      )}
    >
      <CardContent className="flex flex-col gap-4 p-4 md:p-5">
        <section className="rounded-[22px] border border-sky-100 bg-white p-4">
          <OfferAssetHeader className="mb-2" />
          <div className="flex gap-2">
            <OfferAssetSelect className="min-w-[160px] w-[36%] max-w-[180px]" />
            <OfferAssetInput className="h-13 rounded-2xl border-sky-100 bg-white text-slate-900 placeholder:text-slate-400" />
          </div>
        </section>

        <section className="rounded-[22px] border border-sky-100 bg-white p-4">
          <AskAssetHeader />
          <div className="mt-2 flex gap-2">
            <AskAssetSelect className="min-w-[160px] w-[36%] max-w-[180px]" />
            <AskAssetInput className="h-13 rounded-2xl border-sky-100 bg-white text-slate-900 placeholder:text-slate-400" />
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

const OfferAssetHeader = (props: { className?: string }) => {
  const { t } = useI18n();

  return (
    <div
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 text-sm text-muted-foreground",
        "text-slate-600",
        props.className,
      )}
    >
      {t("swap.form.offer")}
    </div>
  );
};

const OfferAssetSelect = (props: { className?: string }) => {
  const { offerAsset } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const { data, isLoading } = useAssetsQuery({
    select: (data) => data.sort(sortAssets),
  });

  const handleAssetSelect = (asset: AssetInfo | null) => {
    dispatch({ type: "SET_OFFER_ASSET", payload: asset });
  };

  return (
    <AssetSelect
      {...props}
      assets={data}
      selectedAsset={offerAsset}
      onAssetSelect={handleAssetSelect}
      loading={isLoading}
    />
  );
};

const OfferAssetInput = (props: { className?: string }) => {
  const { offerAsset, offerAmount } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({ target }: ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_OFFER_AMOUNT", payload: target.value });
  };

  return (
    <Input
      {...props}
      disabled={!offerAsset}
      value={offerAmount}
      onChange={handleInputUpdate}
    />
  );
};

const AskAssetHeader = (props: { className?: string }) => {
  const { t } = useI18n();

  return (
    <div
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 text-sm text-muted-foreground",
        "text-slate-600",
        props.className,
      )}
    >
      {t("swap.form.ask")}
    </div>
  );
};

const AskAssetSelect = (props: { className?: string }) => {
  const { askAsset, offerAsset } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const { data, isLoading } = useAssetsQuery({
    select: (data) =>
      data
        .filter((a) => a.contractAddress !== offerAsset?.contractAddress)
        .sort(sortAssets),
  });

  const handleAssetSelect = (asset: AssetInfo | null) => {
    dispatch({ type: "SET_ASK_ASSET", payload: asset });
  };

  return (
    <AssetSelect
      {...props}
      assets={data}
      selectedAsset={askAsset}
      onAssetSelect={handleAssetSelect}
      loading={isLoading}
    />
  );
};

const AskAssetInput = (props: { className?: string }) => {
  const { askAsset, askAmount } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({ target }: ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_ASK_AMOUNT", payload: target.value });
  };

  return (
    <Input
      {...props}
      disabled={!askAsset}
      value={askAmount}
      onChange={handleInputUpdate}
    />
  );
};
