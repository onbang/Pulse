"use client";

import Link from "next/link";
import { AssetTag } from "@ston-fi/api";
import { useQuery } from "@tanstack/react-query";
import { useTonAddress } from "@tonconnect/ui-react";
import {
  Activity,
  ArrowUpRight,
  ChartCandlestick,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { PricePredictionCard } from "@/components/community/price-prediction-card";
import { useCommunityProfile } from "@/components/community/community-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { type PairPrediction } from "@/lib/community";
import { type AssetInfo } from "@/hooks/use-assets-query";
import { useStonApi } from "@/hooks/use-ston-api";
import { Formatter } from "@/lib/formatter";
import {
  buildPredictionTokenMarketId,
  getPredictionTimeframeSeconds,
  PREDICTION_TIMEFRAMES,
  type PredictionTimeframeId,
} from "@/lib/prediction-timeframes";
import { cn } from "@/lib/utils";
import { fetchInternalApi } from "@/lib/vercel-internal-fetch";

import { useSwapForm, useSwapFormDispatch } from "../providers/swap-form";

import { SwapButton } from "./swap-button";
import { SwapForm } from "./swap-form";
import { SwapMarketIntelligence } from "./swap-market-intelligence";
import { SwapPriceChart } from "./swap-price-chart";
import { SwapSettings } from "./swap-settings";
import { SwapSimulationPreview } from "./swap-simulation";

type ForecastMarketSummary = {
  contractAddress: string;
  pairId: string;
  label: string;
  tokenAddress: string;
  tokenSymbol: string;
  timeframeId: string;
  timeframeSeconds: number;
  thresholdBps: number;
  referencePriceE9: number;
  createdAt: string;
  closeTime: string;
  status: string;
  finalPriceE9: number | null;
  resolvedAt: string | null;
};

type ForecastMarketContext = {
  pairId: string;
  tokenAddress: string;
  tokenSymbol: string;
  timeframeId: PredictionTimeframeId;
  timeframeSeconds: number;
  currentPriceUsd: number;
  currentPriceE9: number;
  thresholdPresetsBps: number[];
  canCreate: boolean;
  activeMarket: ForecastMarketSummary | null;
};

type MarketFilter = "all" | "live" | "ready" | "closed" | "resolved";
type DisplayMarketStatus = "live" | "ready" | "closed" | "resolved" | "pending";

type MarketEntry = {
  asset: AssetInfo;
  context: ForecastMarketContext;
  pairId: string;
  label: string;
  displayName: string;
  symbol: string;
  status: Exclude<MarketFilter, "all">;
  displayStatus: DisplayMarketStatus;
  prediction: PairPrediction | null;
  totalPoolTon: number;
  totalConfirmedBets: number;
  totalParticipants: number;
  upShare: number;
  downShare: number;
  upPoolTon: number;
  downPoolTon: number;
  myPositionTon: number;
  referencePriceUsd: number;
};

const FEATURED_PRIORITY_SYMBOLS = [
  "TON",
  "USDT",
  "USDC",
  "STON",
  "NOT",
  "DOGS",
] as const;
const FEATURED_MARKET_LIMIT = 10;

function normalizeSymbol(asset: AssetInfo) {
  return asset.meta?.symbol?.trim() || "TOKEN";
}

function normalizeDisplayName(asset: AssetInfo) {
  return asset.meta?.displayName?.trim() || normalizeSymbol(asset);
}

function formatUsd(value?: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return "n/a";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
    minimumFractionDigits: value < 1 ? 2 : 2,
  }).format(value);
}

function formatTon(value: number) {
  return `${new Intl.NumberFormat("en", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
    minimumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value)} TON`;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function formatShortDate(value?: string | null) {
  if (!value) {
    return "n/a";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "n/a";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildFeaturedAssets(assets: AssetInfo[]) {
  const uniqueAssets = new Map<string, AssetInfo>();

  for (const asset of assets) {
    if (!uniqueAssets.has(asset.contractAddress)) {
      uniqueAssets.set(asset.contractAddress, asset);
    }
  }

  return [...uniqueAssets.values()]
    .filter((asset) => Number(asset.dexPriceUsd ?? 0) > 0)
    .sort((left, right) => {
      const leftPriority = FEATURED_PRIORITY_SYMBOLS.indexOf(
        normalizeSymbol(left).toUpperCase() as never,
      );
      const rightPriority = FEATURED_PRIORITY_SYMBOLS.indexOf(
        normalizeSymbol(right).toUpperCase() as never,
      );

      if (leftPriority !== -1 || rightPriority !== -1) {
        if (leftPriority === -1) return 1;
        if (rightPriority === -1) return -1;

        return leftPriority - rightPriority;
      }

      return (right.popularityIndex ?? 0) - (left.popularityIndex ?? 0);
    })
    .slice(0, FEATURED_MARKET_LIMIT);
}

function sortAssetsByPopularity(assets: AssetInfo[]) {
  return [...assets].sort((left, right) => {
    if (left.popularityIndex && right.popularityIndex) {
      return right.popularityIndex - left.popularityIndex;
    }

    if (left.popularityIndex && !right.popularityIndex) return -1;
    if (!left.popularityIndex && right.popularityIndex) return 1;

    return 0;
  });
}

function createFallbackContext(
  asset: AssetInfo,
  timeframeId: PredictionTimeframeId,
): ForecastMarketContext {
  const currentPriceUsd = Number(asset.dexPriceUsd ?? 0);

  return {
    pairId: buildPredictionTokenMarketId(asset.contractAddress, timeframeId),
    tokenAddress: asset.contractAddress,
    tokenSymbol: normalizeSymbol(asset),
    timeframeId,
    timeframeSeconds: getPredictionTimeframeSeconds(timeframeId),
    currentPriceUsd,
    currentPriceE9: Math.round(currentPriceUsd * 1_000_000_000),
    thresholdPresetsBps: [],
    canCreate: true,
    activeMarket: null,
  };
}

function resolveDisplayStatus(
  context: ForecastMarketContext,
): DisplayMarketStatus {
  const status = context.activeMarket?.status;

  if (!status) {
    return "ready";
  }

  if (status === "pending") {
    return "pending";
  }

  if (status === "locked") {
    return "closed";
  }

  if (
    status === "resolved_yes" ||
    status === "resolved_no" ||
    status === "resolved_draw"
  ) {
    return "resolved";
  }

  return "live";
}

function resolveFilterStatus(displayStatus: DisplayMarketStatus) {
  if (displayStatus === "pending") {
    return "live" as const;
  }

  return displayStatus;
}

function resolveCounterAsset(assets: AssetInfo[], selectedAddress: string) {
  const tonAsset = assets.find(
    (asset) =>
      normalizeSymbol(asset).toUpperCase() === "TON" &&
      asset.contractAddress !== selectedAddress,
  );

  if (tonAsset) {
    return tonAsset;
  }

  return (
    assets.find((asset) => asset.contractAddress !== selectedAddress) ?? null
  );
}

function buildFallbackMarketLabel(
  asset: AssetInfo,
  timeframeId: PredictionTimeframeId,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  return t("swap.marketHub.question", {
    symbol: normalizeSymbol(asset),
    timeframe: timeframeId,
  });
}

function buildMarketEntry(input: {
  asset: AssetInfo;
  context: ForecastMarketContext;
  prediction: PairPrediction | null;
  walletAddress: string;
  fallbackLabel: string;
}) {
  const confirmedBets = (input.prediction?.bets ?? []).filter(
    (bet) => bet.sourceKind !== "pending",
  );
  const upPoolTon = confirmedBets
    .filter((bet) => bet.direction === "up")
    .reduce((sum, bet) => sum + bet.amount, 0);
  const downPoolTon = confirmedBets
    .filter((bet) => bet.direction === "down")
    .reduce((sum, bet) => sum + bet.amount, 0);
  const totalPoolTon = upPoolTon + downPoolTon;
  const totalParticipants = new Set(
    confirmedBets.map((bet) => bet.walletAddress),
  ).size;
  const myPositionTon = confirmedBets
    .filter((bet) => bet.walletAddress === input.walletAddress)
    .reduce((sum, bet) => sum + bet.amount, 0);
  const referencePriceUsd =
    input.context.activeMarket?.referencePriceE9 != null
      ? input.context.activeMarket.referencePriceE9 / 1_000_000_000
      : input.context.currentPriceUsd;
  const displayStatus = resolveDisplayStatus(input.context);
  const status = resolveFilterStatus(displayStatus);

  return {
    asset: input.asset,
    context: input.context,
    pairId: input.context.pairId,
    label: input.context.activeMarket?.label ?? input.fallbackLabel,
    displayName: normalizeDisplayName(input.asset),
    symbol: normalizeSymbol(input.asset),
    status,
    displayStatus,
    prediction: input.prediction,
    totalPoolTon,
    totalConfirmedBets: confirmedBets.length,
    totalParticipants,
    upShare:
      totalPoolTon > 0 ? Math.round((upPoolTon / totalPoolTon) * 100) : 50,
    downShare:
      totalPoolTon > 0
        ? 100 - Math.round((upPoolTon / totalPoolTon) * 100)
        : 50,
    upPoolTon,
    downPoolTon,
    myPositionTon,
    referencePriceUsd,
  } satisfies MarketEntry;
}

function getStatusBadge(
  displayStatus: DisplayMarketStatus,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  switch (displayStatus) {
    case "ready":
      return {
        label: t("swap.marketHub.card.ready"),
        className: "border-[#71c4ef]/30 bg-[#71c4ef]/12 text-[#9bdcff]",
      };
    case "pending":
      return {
        label: t("swap.marketHub.card.pending"),
        className: "border-[#71c4ef]/30 bg-[#71c4ef]/12 text-[#9bdcff]",
      };
    case "closed":
      return {
        label: t("swap.marketHub.card.closed"),
        className: "border-[#f59e0b]/30 bg-[#f59e0b]/12 text-[#f6cd7d]",
      };
    case "resolved":
      return {
        label: t("swap.marketHub.card.resolved"),
        className: "border-[#fb2c36]/25 bg-[#fb2c36]/12 text-[#ffafb3]",
      };
    default:
      return {
        label: t("swap.marketHub.card.live"),
        className: "border-[#10b68b]/30 bg-[#10b68b]/12 text-[#6ee5c2]",
      };
  }
}

function resolveOutcomeLabel(
  entry: MarketEntry,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const status = entry.context.activeMarket?.status;

  if (status === "resolved_yes") {
    return t("prediction.upWon");
  }

  if (status === "resolved_no") {
    return t("prediction.downWon");
  }

  if (status === "resolved_draw") {
    return t("prediction.draw");
  }

  return t("swap.marketHub.card.noSide");
}

function renderTimeMeta(
  entry: MarketEntry,
  now: number,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (!entry.context.activeMarket) {
    return {
      title: t("swap.marketHub.detail.next"),
      value: t("prediction.nextRoundReadyNow"),
      body: t("swap.marketHub.detail.nextBody"),
    };
  }

  if (entry.displayStatus === "live" || entry.displayStatus === "pending") {
    return {
      title: t("prediction.timeLeft"),
      value: formatCountdown(
        new Date(entry.context.activeMarket.closeTime).getTime() - now,
      ),
      body: t("prediction.roundClosesBody"),
    };
  }

  if (entry.displayStatus === "closed") {
    return {
      title: t("prediction.awaitingSettlement"),
      value: formatShortDate(entry.context.activeMarket.closeTime),
      body: t("prediction.autoResolveBody"),
    };
  }

  return {
    title: t("prediction.settledAt"),
    value: formatShortDate(
      entry.context.activeMarket.resolvedAt ??
        entry.context.activeMarket.closeTime,
    ),
    body: t("prediction.autoPayoutBody"),
  };
}

function MarketStatCard(props: {
  icon: ReactNode;
  label: string;
  value: string | number;
  body: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.045] p-3.5 shadow-[0_20px_44px_-30px_rgba(0,0,0,0.76)] backdrop-blur-xl">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-black/22 text-[#6ee5c2]">
        {props.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-white/44">
          {props.label}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-2xl font-semibold tracking-tight text-white">
            {props.value}
          </p>
          <p className="truncate text-xs text-white/46">{props.body}</p>
        </div>
      </div>
    </div>
  );
}

function MarketBoardCard(props: {
  entry: MarketEntry;
  selected: boolean;
  now: number;
  onSelect: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const statusBadge = getStatusBadge(props.entry.displayStatus, props.t);
  const timeMeta = renderTimeMeta(props.entry, props.now, props.t);

  return (
    <button
      type="button"
      onClick={props.onSelect}
      className={cn(
        "group w-full rounded-[24px] border p-4 text-left transition-all duration-200",
        props.selected
          ? "border-[#10b68b]/35 bg-[linear-gradient(135deg,rgba(16,182,139,0.16),rgba(113,196,239,0.12))] shadow-[0_28px_60px_-36px_rgba(16,182,139,0.34)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.05]",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-12 rounded-[16px] border border-white/10 bg-black/25 shadow-[0_18px_34px_-22px_rgba(0,0,0,0.8)]">
          <AvatarImage
            src={props.entry.asset.meta?.imageUrl}
            alt={props.entry.displayName}
          />
          <AvatarFallback className="rounded-[16px] bg-[linear-gradient(135deg,#10b68b,#71c4ef)] text-sm font-semibold text-slate-950">
            {props.entry.symbol.slice(0, 1)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                statusBadge.className,
              )}
            >
              {statusBadge.label}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
              {props.entry.context.timeframeId}
            </span>
            {props.entry.myPositionTon > 0 ? (
              <span className="rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/72">
                {props.t("swap.marketHub.card.you")}{" "}
                {formatTon(props.entry.myPositionTon)}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="line-clamp-2 text-lg font-semibold leading-6 tracking-tight text-white">
                {props.entry.label}
              </p>
              <p className="mt-1 truncate text-sm text-white/54">
                {props.entry.displayName} / {props.entry.context.timeframeId}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/42">
                {props.t("swap.marketHub.detail.price")}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {formatUsd(props.entry.context.currentPriceUsd)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-[18px] border border-white/8 bg-black/18 p-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/42">
            {props.t("swap.marketHub.card.pool")}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatTon(props.entry.totalPoolTon)}
          </p>
        </div>
        <div className="rounded-[18px] border border-white/8 bg-black/18 p-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/42">
            {props.t("swap.marketHub.card.traders")}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {props.entry.totalParticipants}
          </p>
        </div>
        <div className="rounded-[18px] border border-white/8 bg-black/18 p-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/42">
            {timeMeta.title}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {timeMeta.value}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-[18px] border border-white/8 bg-black/18 p-3">
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="text-[#6ee5c2]">
            {props.t("prediction.up")} {props.entry.upShare}%
          </span>
          <span className="text-[#ffafb3]">
            {props.t("prediction.down")} {props.entry.downShare}%
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full bg-[linear-gradient(90deg,#10b68b,#6ee5c2)]"
            style={{ width: `${props.entry.upShare}%` }}
          />
          <div
            className="h-full bg-[linear-gradient(90deg,#ff8d93,#fb2c36)]"
            style={{ width: `${props.entry.downShare}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-white/56">
            {props.t("swap.marketHub.card.volumeHint", {
              count: props.entry.totalConfirmedBets,
            })}
          </span>
          <span className="text-white/78">
            {props.entry.displayStatus === "resolved"
              ? resolveOutcomeLabel(props.entry, props.t)
              : props.entry.displayStatus === "ready"
                ? props.t("swap.marketHub.card.firstBet")
                : props.entry.displayStatus === "pending"
                  ? props.t("swap.marketHub.card.waiting")
                  : props.t("prediction.crowdSplit")}
          </span>
        </div>
      </div>
    </button>
  );
}

export function SwapPredictionMarketsHub() {
  const { t } = useI18n();
  const { getPrediction, userBets, walletAddress } = useCommunityProfile();
  const { offerAsset } = useSwapForm();
  const dispatch = useSwapFormDispatch();
  const stonApi = useStonApi();
  const connectedWalletAddress = useTonAddress();
  const [timeframeFilter, setTimeframeFilter] =
    useState<PredictionTimeframeId>("15M");
  const [statusFilter, setStatusFilter] = useState<MarketFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [myMarketsOnly, setMyMarketsOnly] = useState(false);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [swapTicketPairId, setSwapTicketPairId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const boardAssetsQuery = useQuery({
    queryKey: ["swap-market-assets", connectedWalletAddress],
    staleTime: 60_000,
    queryFn: async () => {
      const assets = await stonApi.queryAssets({
        condition: [
          AssetTag.LiquidityVeryHigh,
          AssetTag.LiquidityHigh,
          AssetTag.LiquidityMedium,
          AssetTag.WalletHasBalance,
        ].join(" | "),
        walletAddress: connectedWalletAddress || undefined,
      });

      return sortAssetsByPopularity(assets);
    },
  });

  const featuredAssets = useMemo(
    () => buildFeaturedAssets(boardAssetsQuery.data ?? []),
    [boardAssetsQuery.data],
  );
  const myMarketIds = useMemo(
    () => new Set(userBets.map((bet) => bet.pairId)),
    [userBets],
  );

  const contextsQuery = useQuery({
    queryKey: [
      "swap-market-hub",
      timeframeFilter,
      ...featuredAssets.map((asset) => asset.contractAddress),
    ],
    enabled: boardAssetsQuery.isFetched && featuredAssets.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      return Promise.all(
        featuredAssets.map(async (asset) => {
          const url = `/api/forecast-markets/context?tokenAddress=${encodeURIComponent(asset.contractAddress)}&timeframeId=${timeframeFilter}`;

          try {
            const response = await fetchInternalApi(url, {
              cache: "no-store",
            });

            if (!response.ok) {
              throw new Error(`Failed to load ${asset.contractAddress}`);
            }

            const context = (await response.json()) as ForecastMarketContext;

            return { asset, context };
          } catch {
            return {
              asset,
              context: createFallbackContext(asset, timeframeFilter),
            };
          }
        }),
      );
    },
  });

  const marketEntries = useMemo(() => {
    return (contextsQuery.data ?? [])
      .map(({ asset, context }) =>
        buildMarketEntry({
          asset,
          context,
          prediction: getPrediction(context.pairId),
          walletAddress,
          fallbackLabel: buildFallbackMarketLabel(
            asset,
            context.timeframeId,
            t,
          ),
        }),
      )
      .sort((left, right) => {
        const statusRank = {
          live: 0,
          ready: 1,
          closed: 2,
          resolved: 3,
        } satisfies Record<Exclude<MarketFilter, "all">, number>;

        if (statusRank[left.status] !== statusRank[right.status]) {
          return statusRank[left.status] - statusRank[right.status];
        }

        if (right.totalPoolTon !== left.totalPoolTon) {
          return right.totalPoolTon - left.totalPoolTon;
        }

        return (
          (right.asset.popularityIndex ?? 0) - (left.asset.popularityIndex ?? 0)
        );
      });
  }, [contextsQuery.data, getPrediction, t, walletAddress]);

  const filteredEntries = useMemo(() => {
    return marketEntries.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) {
        return false;
      }

      if (myMarketsOnly && !myMarketIds.has(entry.pairId)) {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const haystack = [
        entry.symbol,
        entry.displayName,
        entry.label,
        entry.context.timeframeId,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(deferredSearch);
    });
  }, [deferredSearch, marketEntries, myMarketIds, myMarketsOnly, statusFilter]);

  useEffect(() => {
    const firstEntry = filteredEntries[0];

    if (filteredEntries.length === 0) {
      if (selectedPairId) {
        setSelectedPairId(null);
      }

      return;
    }

    if (!selectedPairId && firstEntry) {
      setSelectedPairId(firstEntry.pairId);
      return;
    }

    const selectedStillVisible = filteredEntries.some(
      (entry) => entry.pairId === selectedPairId,
    );

    if (!selectedStillVisible && firstEntry) {
      setSelectedPairId(firstEntry.pairId);
    }
  }, [filteredEntries, selectedPairId]);

  const selectedEntry =
    filteredEntries.find((entry) => entry.pairId === selectedPairId) ??
    filteredEntries[0] ??
    null;
  const selectedTimeMeta = selectedEntry
    ? renderTimeMeta(selectedEntry, now, t)
    : null;
  const selectedStatusBadge = selectedEntry
    ? getStatusBadge(selectedEntry.displayStatus, t)
    : null;
  const visiblePoolTon = marketEntries.reduce(
    (sum, entry) => sum + entry.totalPoolTon,
    0,
  );
  const liveCount = marketEntries.filter(
    (entry) => entry.status === "live",
  ).length;
  const myMarketsCount = marketEntries.filter((entry) =>
    myMarketIds.has(entry.pairId),
  ).length;
  const selectedLoadedIntoSwap = selectedEntry?.pairId === swapTicketPairId;

  useEffect(() => {
    if (!selectedEntry || swapTicketPairId) {
      return;
    }

    const selectedAsset = selectedEntry.asset;
    const nextOfferAsset =
      offerAsset && offerAsset.contractAddress !== selectedAsset.contractAddress
        ? offerAsset
        : resolveCounterAsset(
            boardAssetsQuery.data ?? [],
            selectedAsset.contractAddress,
          );

    if (
      nextOfferAsset &&
      nextOfferAsset.contractAddress !== selectedAsset.contractAddress
    ) {
      dispatch({ type: "SET_OFFER_ASSET", payload: nextOfferAsset });
    }

    dispatch({ type: "SET_ASK_ASSET", payload: selectedAsset });
    dispatch({ type: "SET_OFFER_AMOUNT", payload: "" });
    dispatch({ type: "SET_ASK_AMOUNT", payload: "" });
    setSwapTicketPairId(selectedEntry.pairId);
  }, [
    boardAssetsQuery.data,
    dispatch,
    offerAsset,
    selectedEntry,
    swapTicketPairId,
  ]);

  const loadSelectedIntoSwapTicket = () => {
    if (!selectedEntry) {
      return;
    }

    const selectedAsset = selectedEntry.asset;
    const nextOfferAsset =
      offerAsset && offerAsset.contractAddress !== selectedAsset.contractAddress
        ? offerAsset
        : resolveCounterAsset(
            boardAssetsQuery.data ?? [],
            selectedAsset.contractAddress,
          );

    if (
      nextOfferAsset &&
      nextOfferAsset.contractAddress !== selectedAsset.contractAddress
    ) {
      dispatch({ type: "SET_OFFER_ASSET", payload: nextOfferAsset });
    }

    dispatch({ type: "SET_ASK_ASSET", payload: selectedAsset });
    dispatch({ type: "SET_OFFER_AMOUNT", payload: "" });
    dispatch({ type: "SET_ASK_AMOUNT", payload: "" });
    setSwapTicketPairId(selectedEntry.pairId);
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[36px] border border-slate-900/60 bg-[#161a18] text-white shadow-[0_48px_140px_-68px_rgba(0,0,0,0.85)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(113,196,239,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,182,139,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.22))]" />

        <div className="relative z-10 flex flex-col gap-5 p-5 md:p-6 xl:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#9bdcff]/75">
                {t("swap.marketHub.eyebrow")}
              </p>
              <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-white md:text-[2.65rem]">
                {t("swap.marketHub.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/62">
                {t("swap.marketHub.subtitle")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void contextsQuery.refetch()}
                className="h-10 rounded-full border-white/12 bg-white/[0.06] px-4 text-white hover:bg-white/[0.1]"
              >
                <RefreshCw
                  className={cn(
                    "mr-2 size-4",
                    contextsQuery.isFetching && "animate-spin",
                  )}
                />
                {t("swap.marketHub.refresh")}
              </Button>

              <Link
                href={ROUTES.pools}
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-black/28"
              >
                {t("swap.marketHub.openPools")}
              </Link>

              <Link
                href={ROUTES.profile}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#10b68b]/22 bg-[#10b68b]/14 px-4 text-sm font-semibold text-[#6ee5c2] transition-all duration-200 hover:bg-[#10b68b]/18"
              >
                {t("swap.marketHub.openProfile")}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MarketStatCard
              icon={<ChartCandlestick className="size-5" />}
              label={t("swap.marketHub.stats.total")}
              value={marketEntries.length}
              body={t("swap.marketHub.stats.totalBody")}
            />
            <MarketStatCard
              icon={<Activity className="size-5" />}
              label={t("swap.marketHub.stats.live")}
              value={liveCount}
              body={t("swap.marketHub.stats.liveBody")}
            />
            <MarketStatCard
              icon={<Sparkles className="size-5" />}
              label={t("swap.marketHub.stats.volume")}
              value={formatTon(visiblePoolTon)}
              body={t("swap.marketHub.stats.volumeBody")}
            />
            <MarketStatCard
              icon={<Wallet className="size-5" />}
              label={t("swap.marketHub.stats.mine")}
              value={myMarketsCount}
              body={t("swap.marketHub.stats.mineBody")}
            />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_20px_44px_-28px_rgba(0,0,0,0.76)] backdrop-blur-xl md:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(0,0.76fr)]">
              <div className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/46">
                  {t("swap.marketHub.filter.allMarkets")}
                </p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/32" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("swap.marketHub.searchPlaceholder")}
                    className="h-12 rounded-2xl border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/28"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["all", "live", "ready", "closed", "resolved"] as const
                  ).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                        statusFilter === filter
                          ? "border-[#10b68b]/32 bg-[#10b68b]/16 text-[#6ee5c2]"
                          : "border-white/10 bg-black/18 text-white/62 hover:bg-white/[0.07] hover:text-white",
                      )}
                    >
                      {t(`swap.marketHub.filter.${filter}`)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMyMarketsOnly((value) => !value)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                      myMarketsOnly
                        ? "border-[#71c4ef]/32 bg-[#71c4ef]/14 text-[#9bdcff]"
                        : "border-white/10 bg-black/18 text-white/62 hover:bg-white/[0.07] hover:text-white",
                    )}
                  >
                    {t("swap.marketHub.filter.mine")}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/46">
                  {t("swap.marketHub.filter.horizon")}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {PREDICTION_TIMEFRAMES.map((timeframe) => (
                    <button
                      key={timeframe.id}
                      type="button"
                      onClick={() => setTimeframeFilter(timeframe.id)}
                      className={cn(
                        "rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                        timeframeFilter === timeframe.id
                          ? "border-[#71c4ef]/36 bg-[linear-gradient(135deg,rgba(113,196,239,0.24),rgba(16,182,139,0.22))] text-white shadow-[0_22px_40px_-28px_rgba(16,182,139,0.36)]"
                          : "border-white/10 bg-black/18 text-white/62 hover:bg-white/[0.07] hover:text-white",
                      )}
                    >
                      {timeframe.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
            <div className="rounded-[30px] border border-white/10 bg-black/15 p-3 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.86)] md:p-4">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/44">
                    {t("swap.marketHub.boardTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    {t("swap.marketHub.boardBody")}
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/58">
                  {filteredEntries.length}
                </div>
              </div>

              {contextsQuery.isLoading || boardAssetsQuery.isLoading ? (
                <div className="grid gap-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[214px] animate-pulse rounded-[28px] border border-white/8 bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : null}

              {!contextsQuery.isLoading &&
              !boardAssetsQuery.isLoading &&
              filteredEntries.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
                  <p className="text-xl font-semibold text-white">
                    {t("swap.marketHub.emptyTitle")}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/56">
                    {t("swap.marketHub.emptyBody")}
                  </p>
                </div>
              ) : null}

              {!contextsQuery.isLoading && filteredEntries.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2">
                  {filteredEntries.map((entry) => (
                    <MarketBoardCard
                      key={entry.pairId}
                      entry={entry}
                      selected={entry.pairId === selectedEntry?.pairId}
                      now={now}
                      onSelect={() => setSelectedPairId(entry.pairId)}
                      t={t}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-5 xl:sticky xl:top-[118px] xl:self-start">
              {selectedEntry ? (
                <>
                  <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5 shadow-[0_26px_60px_-36px_rgba(0,0,0,0.86)] md:p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="size-16 rounded-[22px] border border-white/10 bg-black/25 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.76)]">
                        <AvatarImage
                          src={selectedEntry.asset.meta?.imageUrl}
                          alt={selectedEntry.displayName}
                        />
                        <AvatarFallback className="rounded-[22px] bg-[linear-gradient(135deg,#10b68b,#71c4ef)] text-base font-semibold text-slate-950">
                          {selectedEntry.symbol.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/44">
                          {t("swap.marketHub.detail.eyebrow")}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-3xl font-semibold tracking-tight text-white">
                            {selectedEntry.label}
                          </h2>
                          {selectedStatusBadge ? (
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                                selectedStatusBadge.className,
                              )}
                            >
                              {selectedStatusBadge.label}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/58">
                          {selectedEntry.displayName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-white/8 bg-black/18 p-4">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                          {t("swap.marketHub.detail.price")}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {formatUsd(selectedEntry.context.currentPriceUsd)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/56">
                          {t("swap.marketHub.detail.referenceBody")}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-white/8 bg-black/18 p-4">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                          {t("swap.marketHub.detail.reference")}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {formatUsd(selectedEntry.referencePriceUsd)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/56">
                          {t("swap.marketHub.detail.referenceBody")}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-white/8 bg-black/18 p-4">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                          {selectedTimeMeta?.title}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {selectedTimeMeta?.value}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/56">
                          {selectedTimeMeta?.body}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-white/8 bg-black/18 p-4">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                          {t("swap.marketHub.detail.contract")}
                        </p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {selectedEntry.context.activeMarket?.contractAddress
                            ? Formatter.address(
                                selectedEntry.context.activeMarket
                                  .contractAddress,
                                { truncateSize: 6 },
                              )
                            : t("swap.marketHub.detail.noContract")}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/56">
                          {selectedEntry.context.activeMarket?.contractAddress
                            ? t("swap.marketHub.detail.contractBody")
                            : t("swap.marketHub.detail.noContractBody")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <PricePredictionCard
                    key={selectedEntry.pairId}
                    pairId={selectedEntry.pairId}
                    label={selectedEntry.label}
                  />
                </>
              ) : (
                <div className="rounded-[30px] border border-white/10 bg-black/15 p-8 text-center text-white/60">
                  {t("swap.marketHub.emptyBody")}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[36px] border border-slate-900/60 bg-[#141816] text-white shadow-[0_48px_120px_-72px_rgba(0,0,0,0.88)]">
        <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <SwapPriceChart
            assetOverride={selectedEntry?.asset ?? null}
            hideSelector
            className="h-full"
          />

          <div className="space-y-6">
            <div className="surface-panel-dark overflow-hidden p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#9bdcff]/72">
                    {t("swap.marketHub.trade.eyebrow")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {t("swap.marketHub.trade.title")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {t("swap.marketHub.trade.body")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={loadSelectedIntoSwapTicket}
                    className={cn(
                      "rounded-full px-4 text-white shadow-[0_22px_40px_-24px_rgba(16,182,139,0.45)]",
                      selectedLoadedIntoSwap
                        ? "bg-[linear-gradient(135deg,#71c4ef,#10b68b)] text-slate-950"
                        : "bg-[linear-gradient(135deg,#10b68b,#71c4ef)]",
                    )}
                  >
                    {selectedLoadedIntoSwap
                      ? t("swap.marketHub.trade.loaded")
                      : t("swap.marketHub.trade.load")}
                    <ArrowUpRight className="ml-2 size-4" />
                  </Button>

                  <SwapSettings
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-white/12 bg-white/[0.06] p-0 text-white hover:bg-white/[0.1]"
                      >
                        <Settings2 className="size-4" />
                      </Button>
                    }
                  />
                </div>
              </div>

              <div className="mt-5 rounded-[26px] border border-white/10 bg-black/18 p-4 md:p-5">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/42">
                    {t("swap.marketHub.trade.ticket")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    {t("swap.marketHub.trade.ticketBody")}
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <SwapForm className="border-white/10 bg-white/[0.04]" />
                  <SwapSimulationPreview className="rounded-[22px] border-white/10 bg-black/15 text-white/80" />
                  <SwapButton />
                </div>
              </div>
            </div>

            <SwapMarketIntelligence />
          </div>
        </div>
      </section>
    </div>
  );
}
