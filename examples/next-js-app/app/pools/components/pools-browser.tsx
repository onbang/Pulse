"use client";

import type { AssetInfoV2, PoolInfo } from "@ston-fi/api";
import { useQueries } from "@tanstack/react-query";
import { Activity, ArrowUpRight, Star, Waves } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useCommunityProfile } from "@/components/community/community-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { useAssetsQuery } from "@/hooks/use-assets-query";
import { useStonApi } from "@/hooks/use-ston-api";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";

type PoolCardEntry = {
  id: string;
  pool: PoolInfo;
  assetA: AssetInfoV2;
  assetB: AssetInfoV2;
  liquidityUsd: number;
  pairLabel: string;
  priceRatio: number;
  popularityScore: number;
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
  };
}

export function PoolsBrowser() {
  const client = useStonApi();
  const { walletAddress, profile, toggleWatchlist } = useCommunityProfile();
  const assetsQuery = useAssetsQuery();

  const curatedAssets = useMemo(
    () => buildCuratedAssets(assetsQuery.data ?? []),
    [assetsQuery.data],
  );
  const pairCandidates = useMemo(
    () => buildPairCandidates(curatedAssets),
    [curatedAssets],
  );

  const poolQueries = useQueries({
    queries: pairCandidates.map(({ assetA, assetB }) => ({
      queryKey: ["pools-browser", assetA.contractAddress, assetB.contractAddress],
      queryFn: async () => {
        const pools = await client.getPoolsByAssetPair({
          asset0Address: assetA.contractAddress,
          asset1Address: assetB.contractAddress,
        });

        return { pools, assetA, assetB };
      },
      staleTime: 60_000,
    })),
  });

  const pools = useMemo(() => {
    const entries = new Map<string, PoolCardEntry>();

    for (const query of poolQueries) {
      if (!query.data) {
        continue;
      }

      const bestPool = [...query.data.pools].sort((left, right) => {
        return Number(right.lpTotalSupplyUsd ?? 0) - Number(left.lpTotalSupplyUsd ?? 0);
      })[0];

      if (!bestPool) {
        continue;
      }

      const entry = toPoolCardEntry({
        pool: bestPool,
        assetA: query.data.assetA,
        assetB: query.data.assetB,
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
  }, [poolQueries]);

  const isLoading = assetsQuery.isLoading || poolQueries.some((query) => query.isLoading);
  const isFetched = assetsQuery.isFetched && poolQueries.every((query) => query.isFetched);
  const totalLiquidity = pools.reduce((sum, pool) => sum + pool.liquidityUsd, 0);
  const watchedCount = profile?.watchedPools.length ?? 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="surface-panel border-white/70 bg-white/82">
            <CardContent className="p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-700/70">
                Live shortlist
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {pools.length}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Current high-signal pools surfaced from STON pair data.
              </p>
            </CardContent>
          </Card>

          <Card className="surface-panel border-white/70 bg-white/82">
            <CardContent className="p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-700/70">
                Total depth
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {Formatter.fiatAmount(totalLiquidity || 0)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Combined liquidity represented by the visible pool set.
              </p>
            </CardContent>
          </Card>

          <Card className="surface-panel border-white/70 bg-white/82">
            <CardContent className="p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-700/70">
                Watchlist
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {watchedCount}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Pools already saved for quick return from your profile.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="surface-panel overflow-hidden border-white/70 bg-white/84">
          <CardHeader className="border-b border-slate-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(241,248,255,0.82))]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-700/70">
                  Pool board
                </p>
                <CardTitle className="mt-2 text-2xl">Curated pool lineup</CardTitle>
                <CardDescription className="mt-1 max-w-2xl">
                  A cleaner way to browse where liquidity is concentrated right now.
                </CardDescription>
              </div>

              <Button asChild className="rounded-full px-5">
                <Link href={ROUTES.liquidityProvide}>
                  Provide liquidity
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
                    className="mesh-card min-h-[196px] animate-pulse border-white/80 bg-white/75"
                  />
                ))}
              </div>
            ) : null}

            {!isLoading && isFetched && pools.length === 0 ? (
              <div className="mesh-card p-8 text-center">
                <div className="relative z-10">
                  <p className="text-lg font-semibold text-slate-900">
                    No pools surfaced yet.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Refresh in a moment or open the liquidity tab to explore a
                    specific asset pair.
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
                          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#082f49,#0ea5e9)] text-lg font-semibold text-white shadow-[0_18px_40px_-20px_rgba(2,132,199,0.82)]">
                            #{index + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                                {entry.pairLabel}
                              </h3>
                              <Badge className="border-0 bg-sky-100 text-sky-700">
                                {intensity}
                              </Badge>
                            </div>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                              {getDisplayName(entry.assetA)} paired with{" "}
                              {getDisplayName(entry.assetB)}. Built for users who
                              want to spot depth before committing LP capital.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className={cn(
                              "rounded-full border-white/70 bg-white/70",
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
                              ? "Watching"
                              : walletAddress
                                ? "Watch pool"
                                : "Connect to watch"}
                          </Button>

                          <Button asChild className="rounded-full">
                            <Link href={ROUTES.liquidityProvide}>
                              Open LP flow
                              <ArrowUpRight />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-[22px] border border-white/70 bg-white/72 px-4 py-4">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Liquidity
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                            {Formatter.fiatAmount(entry.liquidityUsd || 0)}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-white/70 bg-white/72 px-4 py-4">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Pair ratio
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                            {formatRatio(entry.priceRatio)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getSymbol(entry.assetB)} per {getSymbol(entry.assetA)}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-white/70 bg-white/72 px-4 py-4">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                            LP supply
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                            {Number(entry.pool.lpTotalSupply ?? 0).toLocaleString(
                              "en",
                              { maximumFractionDigits: 0 },
                            )}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-white/70 bg-white/72 px-4 py-4">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Router
                          </p>
                          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
                            {Formatter.address(entry.pool.routerAddress, {
                              truncateSize: 5,
                            })}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Pool{" "}
                            {Formatter.address(entry.pool.address, {
                              truncateSize: 5,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-[24px] border border-white/75 bg-[linear-gradient(135deg,rgba(8,47,73,0.92),rgba(2,132,199,0.86))] px-5 py-5 text-white">
                          <div className="flex items-center gap-2">
                            <Waves className="h-4 w-4" />
                            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-white/70">
                              Pulse read
                            </p>
                          </div>
                          <p className="mt-3 text-xl font-semibold tracking-tight">
                            {entry.pairLabel} is showing{" "}
                            {intensity.toLowerCase()}.
                          </p>
                          <p className="mt-2 max-w-xl text-sm leading-6 text-white/78">
                            Use this route when you want visible depth and a
                            cleaner starting point before joining liquidity
                            positions.
                          </p>
                        </div>

                        <div className="rounded-[24px] border border-slate-200/80 bg-white/74 px-5 py-5">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-sky-700" />
                            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                              Quick actions
                            </p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              asChild
                              variant="outline"
                              className="rounded-full border-white/70 bg-white/76"
                            >
                              <Link href={ROUTES.swap}>Forecast this pair</Link>
                            </Button>
                            <Button
                              asChild
                              variant="outline"
                              className="rounded-full border-white/70 bg-white/76"
                            >
                              <Link href={ROUTES.community}>Open community</Link>
                            </Button>
                          </div>
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
        <Card className="surface-panel overflow-hidden border-white/70 bg-white/84">
          <CardHeader className="border-b border-slate-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(241,248,255,0.82))]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-700/70">
              Discovery flow
            </p>
            <CardTitle className="mt-2 text-2xl">How to use this view</CardTitle>
            <CardDescription className="mt-1">
              A simpler path from scanning pools to opening a position.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {[
              "Check which pairs have the strongest visible liquidity.",
              "Save interesting pools to your watchlist for quick return.",
              "Jump into the LP flow once the route feels strong enough.",
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,248,255,0.7))] px-4 py-4"
              >
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-panel-dark overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/60">
              Why this matters
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              Pools should feel explorable, not hidden behind forms.
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/72">
              This board turns raw pair lookup into a visual shortlist so users
              can discover where to act before they commit liquidity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
