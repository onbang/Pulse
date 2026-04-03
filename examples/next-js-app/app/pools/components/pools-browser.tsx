"use client";

import { beginCell, toNano } from "@ton/core";
import type { AssetInfoV2, PoolInfo } from "@ston-fi/api";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowUpRight, Star, Waves } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";

import { useCommunityProfile } from "@/components/community/community-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { useAssetsQuery } from "@/hooks/use-assets-query";
import { useStonApi } from "@/hooks/use-ston-api";
import { useToast } from "@/hooks/use-toast";
import { Formatter } from "@/lib/formatter";
import { getPredictionTreasuryAddress } from "@/lib/prediction-config";
import { cn, validateFloatValue } from "@/lib/utils";

type PoolCardEntry = {
  id: string;
  pool: PoolInfo;
  assetA: AssetInfoV2;
  assetB: AssetInfoV2;
  liquidityUsd: number;
  pairLabel: string;
  priceRatio: number;
  popularityScore: number;
  routerLabel: string;
  poolLabel: string;
  lpSupplyLabel: string;
};

const PRIORITY_SYMBOLS = ["TON", "USDT", "USDC", "STON", "NOT", "DOGS"] as const;

function getSymbol(asset: AssetInfoV2) {
  return asset.meta?.symbol?.trim() || "TOKEN";
}

function getDisplayName(asset: AssetInfoV2) {
  return asset.meta?.displayName?.trim() || getSymbol(asset);
}

function formatRatio(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "n/a";
  }

  return new Intl.NumberFormat("en", {
    maximumFractionDigits: value < 1 ? 6 : 4,
    minimumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

function safeAddressLabel(value?: string | null, truncateSize = 5) {
  if (!value) {
    return "n/a";
  }

  return Formatter.address(value, { truncateSize });
}

function safeLpSupplyLabel(value?: bigint | string | number | null) {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return "0";
  }

  return numeric.toLocaleString("en", {
    maximumFractionDigits: 0,
  });
}

function buildCuratedAssets(assets: AssetInfoV2[]) {
  const uniqueAssets = new Map<string, AssetInfoV2>();

  for (const asset of assets) {
    if (!uniqueAssets.has(asset.contractAddress)) {
      uniqueAssets.set(asset.contractAddress, asset);
    }
  }

  return [...uniqueAssets.values()]
    .sort((left, right) => {
      const leftPriority = PRIORITY_SYMBOLS.indexOf(getSymbol(left) as never);
      const rightPriority = PRIORITY_SYMBOLS.indexOf(getSymbol(right) as never);

      if (leftPriority !== -1 || rightPriority !== -1) {
        if (leftPriority === -1) return 1;
        if (rightPriority === -1) return -1;

        return leftPriority - rightPriority;
      }

      return (right.popularityIndex ?? 0) - (left.popularityIndex ?? 0);
    })
    .slice(0, 8);
}

function buildPairCandidates(assets: AssetInfoV2[]) {
  const tonAsset =
    assets.find((asset) => getSymbol(asset).toUpperCase() === "TON") ?? assets[0];

  if (!tonAsset) {
    return [];
  }

  const secondary = assets.filter(
    (asset) => asset.contractAddress !== tonAsset.contractAddress,
  );

  const pairs = secondary.slice(0, 6).map((asset) => ({
    assetA: tonAsset,
    assetB: asset,
  }));

  for (let index = 0; index < Math.min(secondary.length - 1, 3); index += 1) {
    const assetA = secondary[index];
    const assetB = secondary[index + 1];

    if (assetA && assetB) {
      pairs.push({ assetA, assetB });
    }
  }

  return pairs;
}

function toPoolCardEntry({
  pool,
  assetA,
  assetB,
}: {
  pool: PoolInfo;
  assetA: AssetInfoV2;
  assetB: AssetInfoV2;
}): PoolCardEntry {
  const liquidityUsd = Number(pool.lpTotalSupplyUsd ?? 0);
  const priceRatio =
    Number(assetA.dexPriceUsd ?? 0) && Number(assetB.dexPriceUsd ?? 0)
      ? Number(assetA.dexPriceUsd) / Number(assetB.dexPriceUsd)
      : 0;

  return {
    id: pool.address,
    pool,
    assetA,
    assetB,
    liquidityUsd,
    pairLabel: `${getSymbol(assetA)}/${getSymbol(assetB)}`,
    priceRatio,
    popularityScore: (assetA.popularityIndex ?? 0) + (assetB.popularityIndex ?? 0),
    routerLabel: safeAddressLabel(pool.routerAddress),
    poolLabel: safeAddressLabel(pool.address),
    lpSupplyLabel: safeLpSupplyLabel(pool.lpTotalSupply),
  };
}

function PoolQuickPrediction(props: { pairId: string; pairLabel: string }) {
  const { t } = useI18n();
  const { walletAddress, submitPrediction } = useCommunityProfile();
  const { toast } = useToast();
  const [tonConnectUI] = useTonConnectUI();
  const [stakeAmount, setStakeAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const predictionTreasuryAddress = getPredictionTreasuryAddress();
  const numericStake = Number(stakeAmount);
  const isStakeValid =
    stakeAmount.trim().length > 0 &&
    validateFloatValue(stakeAmount, 2) &&
    Number.isFinite(numericStake) &&
    numericStake > 0;

  const placePrediction = async (direction: "up" | "down") => {
    if (
      !walletAddress ||
      !predictionTreasuryAddress ||
      !isStakeValid ||
      isSubmitting
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = beginCell()
        .storeUint(0, 32)
        .storeStringTail(
          `Pulse pool prediction | ${props.pairLabel} | ${direction.toUpperCase()} | ${numericStake} TON`,
        )
        .endCell()
        .toBoc()
        .toString("base64");

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
        messages: [
          {
            address: predictionTreasuryAddress,
            amount: toNano(stakeAmount).toString(),
            payload,
          },
        ],
      });

      const submitted = await submitPrediction({
        pairId: props.pairId,
        label: props.pairLabel,
        direction,
        amount: numericStake,
      });

      if (submitted) {
        toast({
          title: t("prediction.txSent"),
          description: t("prediction.txSentBody", {
            amount: numericStake.toFixed(2),
          }),
        });
        setStakeAmount("");
      }
    } catch {
      toast({
        title: t("prediction.txFailed"),
        description: t("prediction.txFailedBody"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <Input
        className="h-11 rounded-2xl border-sky-100 bg-white text-slate-900 placeholder:text-slate-400"
        inputMode="decimal"
        value={stakeAmount}
        disabled={!walletAddress}
        onChange={(event) => {
          if (event.target.value && !validateFloatValue(event.target.value, 2)) {
            return;
          }

          setStakeAmount(event.target.value);
        }}
        placeholder={
          walletAddress
            ? t("prediction.stakePlaceholder")
            : t("prediction.connectToVote")
        }
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          disabled={
            !walletAddress ||
            !predictionTreasuryAddress ||
            !isStakeValid ||
            isSubmitting
          }
          className="rounded-2xl border-emerald-200 bg-emerald-50 text-slate-900 hover:bg-emerald-100"
          onClick={() => void placePrediction("up")}
        >
          {t("prediction.bullish")}
        </Button>
        <Button
          variant="outline"
          disabled={
            !walletAddress ||
            !predictionTreasuryAddress ||
            !isStakeValid ||
            isSubmitting
          }
          className="rounded-2xl border-rose-200 bg-rose-50 text-slate-900 hover:bg-rose-100"
          onClick={() => void placePrediction("down")}
        >
          {t("prediction.bearish")}
        </Button>
      </div>
    </div>
  );
}

export function PoolsBrowser() {
  const client = useStonApi();
  const { walletAddress, profile, toggleWatchlist } = useCommunityProfile();
  const { t } = useI18n();
  const assetsQuery = useAssetsQuery();

  const curatedAssets = useMemo(
    () => buildCuratedAssets(assetsQuery.data ?? []),
    [assetsQuery.data],
  );
  const pairCandidates = useMemo(
    () => buildPairCandidates(curatedAssets),
    [curatedAssets],
  );

  const poolsQuery = useQuery({
    queryKey: [
      "pools-browser",
      ...pairCandidates.map(
        ({ assetA, assetB }) => `${assetA.contractAddress}:${assetB.contractAddress}`,
      ),
    ],
    enabled: assetsQuery.isFetched && pairCandidates.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const results = await Promise.all(
        pairCandidates.map(async ({ assetA, assetB }) => {
          const pools = await client.getPoolsByAssetPair({
            asset0Address: assetA.contractAddress,
            asset1Address: assetB.contractAddress,
          });

          return { pools, assetA, assetB };
        }),
      );

      const entries = new Map<string, PoolCardEntry>();

      for (const result of results) {
        const bestPool = [...result.pools].sort((left, right) => {
          return Number(right.lpTotalSupplyUsd ?? 0) - Number(left.lpTotalSupplyUsd ?? 0);
        })[0];

        if (!bestPool?.address) {
          continue;
        }

        const entry = toPoolCardEntry({
          pool: bestPool,
          assetA: result.assetA,
          assetB: result.assetB,
        });
        const previous = entries.get(entry.id);

        if (!previous || entry.liquidityUsd > previous.liquidityUsd) {
          entries.set(entry.id, entry);
        }
      }

      return [...entries.values()].sort((left, right) => {
        if (right.liquidityUsd !== left.liquidityUsd) {
          return right.liquidityUsd - left.liquidityUsd;
        }

        return right.popularityScore - left.popularityScore;
      });
    },
  });

  const pools = poolsQuery.data ?? [];
  const isLoading = assetsQuery.isLoading || poolsQuery.isLoading;
  const isFetched = assetsQuery.isFetched && poolsQuery.isFetched;
  const totalLiquidity = pools.reduce((sum, pool) => sum + pool.liquidityUsd, 0);
  const watchedCount = profile?.watchedPools.length ?? 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="surface-panel">
            <CardContent className="p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-300/55">
                {t("pools.stats.shortlist")}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {pools.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("pools.stats.shortlistBody")}
              </p>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardContent className="p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-300/55">
                {t("pools.stats.depth")}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {Formatter.fiatAmount(totalLiquidity || 0)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("pools.stats.depthBody")}
              </p>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardContent className="p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-300/55">
                {t("pools.stats.watchlist")}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {watchedCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("pools.stats.watchlistBody")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="surface-panel overflow-hidden">
          <CardHeader className="border-b border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,248,255,0.6))]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-300/55">
                  {t("pools.board.eyebrow")}
                </p>
                <CardTitle className="mt-2 text-2xl text-slate-950">
                  {t("pools.board.title")}
                </CardTitle>
                <CardDescription className="mt-1 max-w-2xl text-slate-600">
                  {t("pools.board.subtitle")}
                </CardDescription>
              </div>

              <Button
                asChild
                className="rounded-full border border-sky-100 bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] px-5 text-white shadow-[0_16px_36px_-18px_rgba(1,128,255,0.45)]"
              >
                <Link href={ROUTES.liquidityProvide}>
                  {t("pools.board.provide")}
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-4 md:p-5">
            {isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="mesh-card min-h-[196px] animate-pulse"
                  />
                ))}
              </div>
            ) : null}

            {!isLoading && isFetched && pools.length === 0 ? (
              <div className="mesh-card p-8 text-center">
                <div className="relative z-10">
                  <p className="text-lg font-semibold text-slate-950">
                    {t("pools.board.emptyTitle")}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {t("pools.board.emptyBody")}
                  </p>
                </div>
              </div>
            ) : null}

            {!isLoading &&
              pools.map((entry, index) => {
                const isWatched = !!profile?.watchedPools.some(
                  (item) => item.poolId === entry.pool.address,
                );
                const intensity =
                  entry.liquidityUsd > 10_000_000
                    ? "Institutional depth"
                    : entry.liquidityUsd > 1_000_000
                      ? "High signal"
                      : "Emerging route";

                return (
                  <div key={entry.id} className="mesh-card p-5 md:p-6">
                    <div className="relative z-10 flex flex-col gap-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-lg font-semibold text-white shadow-[0_18px_40px_-20px_rgba(1,128,255,0.42)]">
                            #{index + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                                {entry.pairLabel}
                              </h3>
                              <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                                {t(
                                  entry.liquidityUsd > 10_000_000
                                    ? "pools.intensity.institutional"
                                    : entry.liquidityUsd > 1_000_000
                                      ? "pools.intensity.high"
                                      : "pools.intensity.emerging",
                                )}
                              </Badge>
                            </div>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                              {t("pools.card.pairBody", {
                                assetA: getDisplayName(entry.assetA),
                                assetB: getDisplayName(entry.assetB),
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className={cn(
                              "rounded-full border-sky-100 bg-white text-slate-700 hover:bg-sky-50 hover:text-slate-900",
                              isWatched &&
                                "border-amber-200 bg-amber-50 text-amber-700",
                            )}
                            onClick={() =>
                              walletAddress
                                ? void toggleWatchlist({
                                    poolId: entry.pool.address,
                                    poolLabel: entry.pairLabel,
                                  })
                                : undefined
                            }
                            disabled={!walletAddress}
                          >
                            <Star className={cn(isWatched && "fill-current")} />
                            {isWatched
                              ? t("pools.card.watching")
                              : walletAddress
                                ? t("pools.card.watch")
                                : t("pools.card.connectToWatch")}
                          </Button>

                          <Button
                            asChild
                            className="rounded-full border border-sky-100 bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-white shadow-[0_16px_36px_-18px_rgba(1,128,255,0.45)]"
                          >
                            <Link href={ROUTES.liquidityProvide}>
                              {t("pools.card.openLp")}
                              <ArrowUpRight />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-[22px] border border-sky-100 bg-white px-4 py-4">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                            {t("pools.card.liquidity")}
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                            {Formatter.fiatAmount(entry.liquidityUsd || 0)}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-sky-100 bg-white px-4 py-4">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                            {t("pools.card.ratio")}
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                            {formatRatio(entry.priceRatio)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t("pools.card.ratioHint", {
                              base: getSymbol(entry.assetA),
                              quote: getSymbol(entry.assetB),
                            })}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-sky-100 bg-white px-4 py-4">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                            {t("pools.card.lpSupply")}
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                            {entry.lpSupplyLabel}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-sky-100 bg-white px-4 py-4">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                            {t("pools.card.router")}
                          </p>
                          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
                            {entry.routerLabel}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t("pools.card.poolAddress", { address: entry.poolLabel })}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-[24px] border border-sky-100 bg-[linear-gradient(135deg,#eef6ff,#f5f8ff)] px-5 py-5 text-slate-900">
                          <div className="flex items-center gap-2">
                            <Waves className="h-4 w-4 text-sky-600" />
                            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                              {t("pools.card.pulseRead")}
                            </p>
                          </div>
                          <p className="mt-3 text-xl font-semibold tracking-tight">
                            {t("pools.card.pulseTitle", {
                              pair: entry.pairLabel,
                              intensity: t(
                                entry.liquidityUsd > 10_000_000
                                  ? "pools.intensity.institutionalLower"
                                  : entry.liquidityUsd > 1_000_000
                                    ? "pools.intensity.highLower"
                                    : "pools.intensity.emergingLower",
                              ),
                            })}
                          </p>
                          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                            {t("pools.card.pulseBody")}
                          </p>
                        </div>

                        <div className="rounded-[24px] border border-sky-100 bg-white px-5 py-5">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-sky-600" />
                            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                              {t("pools.card.quickActions")}
                            </p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              asChild
                              variant="outline"
                              className="rounded-full border-sky-100 bg-sky-50 text-slate-700 hover:bg-sky-100 hover:text-slate-900"
                            >
                              <Link href={ROUTES.community}>{t("pools.card.community")}</Link>
                            </Button>
                          </div>
                          <PoolQuickPrediction
                            pairId={`pool:${entry.pool.address}`}
                            pairLabel={entry.pairLabel}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="surface-panel overflow-hidden">
          <CardHeader className="border-b border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,248,255,0.6))]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-300/55">
              {t("pools.discovery.eyebrow")}
            </p>
            <CardTitle className="mt-2 text-2xl text-slate-950">
              {t("pools.discovery.title")}
            </CardTitle>
            <CardDescription className="mt-1 text-slate-600">
              {t("pools.discovery.body")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {[
              t("pools.discovery.step1"),
              t("pools.discovery.step2"),
              t("pools.discovery.step3"),
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-[22px] border border-sky-100 bg-white px-4 py-4"
              >
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-sky-300/55">
                  {t("pools.discovery.stepLabel", { step: String(index + 1) })}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-panel overflow-hidden bg-[linear-gradient(145deg,#eef6ff,#f8fbff)]">
          <CardContent className="p-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-300/55">
              {t("pools.why.eyebrow")}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {t("pools.why.title")}
            </h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {t("pools.why.body")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
