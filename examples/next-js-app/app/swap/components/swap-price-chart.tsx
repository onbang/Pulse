"use client";

import { useEffect, useMemo, useState } from "react";
import { Dot, TrendingDown, TrendingUp } from "lucide-react";

import { AssetSelect } from "@/components/asset-select";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type AssetInfo, useAssetsQuery } from "@/hooks/use-assets-query";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { useCommunityProfile } from "@/components/community/community-provider";

import { useSwapSimulation } from "../hooks/swap-simulation-query";
import { useSwapForm } from "../providers/swap-form";

const TIMEFRAMES = [
  {
    key: "1M",
    candles: 28,
    labelKey: "swap.chart.timeframe.1M",
    liveStepMs: 60_000,
    driftScale: 1.15,
    noiseScale: 1.1,
  },
  {
    key: "5M",
    candles: 26,
    labelKey: "swap.chart.timeframe.5M",
    liveStepMs: 5 * 60_000,
    driftScale: 0.95,
    noiseScale: 0.9,
  },
  {
    key: "15M",
    candles: 24,
    labelKey: "swap.chart.timeframe.15M",
    liveStepMs: 15 * 60_000,
    driftScale: 0.78,
    noiseScale: 0.74,
  },
  {
    key: "1H",
    candles: 22,
    labelKey: "swap.chart.timeframe.1H",
    liveStepMs: 60 * 60_000,
    driftScale: 0.56,
    noiseScale: 0.55,
  },
  {
    key: "4H",
    candles: 20,
    labelKey: "swap.chart.timeframe.4H",
    liveStepMs: 4 * 60 * 60_000,
    driftScale: 0.38,
    noiseScale: 0.4,
  },
  {
    key: "1D",
    candles: 18,
    labelKey: "swap.chart.timeframe.1D",
    liveStepMs: 24 * 60 * 60_000,
    driftScale: 0.24,
    noiseScale: 0.26,
  },
] as const;

type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
};

type ChartSignal = {
  tone: "bullish" | "bearish" | "neutral";
  titleKey:
    | "swap.chart.signalBullish"
    | "swap.chart.signalBearish"
    | "swap.chart.signalNeutral";
  bodyKey:
    | "swap.chart.signalBodyBullish"
    | "swap.chart.signalBodyBearish"
    | "swap.chart.signalBodyNeutral";
};

function normalizeLabel(label?: string | null) {
  return label?.trim() || "token";
}

function hashSeed(value: string) {
  let seed = 0;

  for (const char of value) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }

  return seed || 1;
}

function createCandles({
  seed,
  currentPrice,
  candles,
  bullishBias,
  volatility,
  liveOffset,
  driftScale,
  noiseScale,
}: {
  seed: number;
  currentPrice: number;
  candles: number;
  bullishBias: number;
  volatility: number;
  liveOffset: number;
  driftScale: number;
  noiseScale: number;
}) {
  const data: Candle[] = [];
  let previousClose = currentPrice * (0.94 + (seed % 9) / 100);

  for (let index = 0; index < candles; index += 1) {
    const pulse = Math.sin((index + liveOffset + (seed % 5)) / 2.8);
    const wave = Math.cos((index + liveOffset + (seed % 11)) / 4.4);
    const directionalDrift =
      bullishBias *
      currentPrice *
      0.045 *
      driftScale *
      (index / Math.max(candles, 1) - 0.4);
    const driftNoise =
      ((seed % (index + 7)) - (index % 5)) *
      volatility *
      currentPrice *
      0.012 *
      noiseScale;
    const close = Math.max(
      currentPrice * 0.45,
      previousClose +
        pulse * currentPrice * volatility * 0.34 * noiseScale +
        wave * currentPrice * volatility * 0.18 * noiseScale +
        directionalDrift +
        driftNoise,
    );
    const open =
      previousClose +
      Math.sin((index + seed) / 3.6) *
        currentPrice *
        volatility *
        0.08 *
        noiseScale;
    const high =
      Math.max(open, close) +
      currentPrice *
        volatility *
        noiseScale *
        (0.08 + ((index + seed) % 5) * 0.02);
    const low =
      Math.min(open, close) -
      currentPrice *
        volatility *
        noiseScale *
        (0.08 + ((index + seed) % 4) * 0.018);

    data.push({
      open,
      close,
      high: Math.max(high, open, close),
      low: Math.max(currentPrice * 0.38, Math.min(low, open, close)),
    });

    previousClose = close;
  }

  const last = data[data.length - 1];

  if (last) {
    last.close = currentPrice;
    last.high = Math.max(last.high, currentPrice);
    last.low = Math.min(last.low, currentPrice);
  }

  return data;
}

function formatChartValue(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: value < 1 ? 6 : 2,
    minimumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

function analyzeChartSignal(candles: Candle[]): ChartSignal {
  if (candles.length < 4) {
    return {
      tone: "neutral",
      titleKey: "swap.chart.signalNeutral",
      bodyKey: "swap.chart.signalBodyNeutral",
    };
  }

  const closes = candles.map((candle) => candle.close);
  const recent = closes.slice(-4);
  const previous = closes.slice(-8, -4);
  const recentAverage =
    recent.reduce((sum, value) => sum + value, 0) / Math.max(recent.length, 1);
  const previousAverage =
    previous.reduce((sum, value) => sum + value, 0) / Math.max(previous.length, 1);
  const lastClose = closes[closes.length - 1] ?? 0;
  const firstClose = closes[0] ?? lastClose;
  const totalMove = ((lastClose - firstClose) / Math.max(firstClose, 0.000001)) * 100;
  const shortMove =
    ((lastClose - previousAverage) / Math.max(previousAverage, 0.000001)) * 100;

  if (recentAverage > previousAverage && totalMove > 0.6 && shortMove > 0.2) {
    return {
      tone: "bullish",
      titleKey: "swap.chart.signalBullish",
      bodyKey: "swap.chart.signalBodyBullish",
    };
  }

  if (recentAverage < previousAverage && totalMove < -0.6 && shortMove < -0.2) {
    return {
      tone: "bearish",
      titleKey: "swap.chart.signalBearish",
      bodyKey: "swap.chart.signalBodyBearish",
    };
  }

  return {
    tone: "neutral",
    titleKey: "swap.chart.signalNeutral",
    bodyKey: "swap.chart.signalBodyNeutral",
  };
}

export function SwapPriceChart() {
  const { t } = useI18n();
  const [timeframe, setTimeframe] =
    useState<(typeof TIMEFRAMES)[number]["key"]>("5M");
  const [liveTick, setLiveTick] = useState(0);
  const [selectedChartAsset, setSelectedChartAsset] =
    useState<AssetInfo | null>(null);
  const { offerAsset, askAsset } = useSwapForm();
  const { data: simulation } = useSwapSimulation();
  const { getPrediction } = useCommunityProfile();
  const assetsQuery = useAssetsQuery();

  useEffect(() => {
    const currentFrame = TIMEFRAMES.find((frame) => frame.key === timeframe);

    if (!currentFrame) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLiveTick((tick) => tick + 1);
    }, currentFrame.liveStepMs);

    return () => window.clearInterval(intervalId);
  }, [timeframe]);

  const trackedAsset = selectedChartAsset ?? offerAsset ?? askAsset ?? null;
  const trackedLabel = trackedAsset
    ? normalizeLabel(trackedAsset.meta?.symbol)
    : "";
  const chartId = trackedAsset ? `token:${trackedAsset.contractAddress}` : null;
  const chartLabel = trackedAsset ? trackedLabel : "";
  const prediction = chartId ? getPrediction(chartId) : null;
  const bullishBias =
    ((prediction?.up.length ?? 0) - (prediction?.down.length ?? 0)) /
    Math.max((prediction?.up.length ?? 0) + (prediction?.down.length ?? 0), 1);

  const basePrice =
    trackedAsset?.dexPriceUsd && Number.isFinite(Number(trackedAsset.dexPriceUsd))
      ? Number(trackedAsset.dexPriceUsd)
      : 0;

  const currentFrame = TIMEFRAMES.find((frame) => frame.key === timeframe)!;
  const livePrice = trackedAsset
    ? basePrice *
      (1 +
        Math.sin(liveTick / 2.6 + bullishBias) *
          Math.max(Number(simulation?.priceImpact ?? 0.004), 0.003) *
          currentFrame.driftScale *
          0.18)
    : 0;

  const volatilityBase = Math.max(
    trackedAsset ? Number(simulation?.priceImpact ?? 0.01) : 0.012,
    0.012,
  );
  const volatility = Math.min(volatilityBase * 2.4, 0.16);

  const candles = useMemo(() => {
    return createCandles({
      seed: hashSeed(`${chartId ?? "no-token"}:${timeframe}`),
      currentPrice: livePrice,
      candles: currentFrame.candles,
      bullishBias,
      volatility,
      liveOffset: liveTick,
      driftScale: currentFrame.driftScale,
      noiseScale: currentFrame.noiseScale,
    });
  }, [
    bullishBias,
    currentFrame.candles,
    currentFrame.driftScale,
    currentFrame.noiseScale,
    livePrice,
    liveTick,
    chartId,
    timeframe,
    volatility,
  ]);

  const high = trackedAsset ? Math.max(...candles.map((candle) => candle.high)) : 0;
  const low = trackedAsset ? Math.min(...candles.map((candle) => candle.low)) : 0;
  const range = trackedAsset ? Math.max(high - low, livePrice * 0.02) : 1;
  const firstOpen = trackedAsset ? (candles[0]?.open ?? livePrice) : 0;
  const priceDirection = trackedAsset && livePrice >= firstOpen ? "up" : "down";
  const delta = trackedAsset ? livePrice - firstOpen : 0;
  const deltaPercent = trackedAsset
    ? (delta / Math.max(firstOpen, 0.000001)) * 100
    : 0;
  const chartSignal = analyzeChartSignal(candles);
  const liveColor = priceDirection === "up" ? "#5ad66f" : "#ff6d5a";
  const gridLevels = [high, high - range * 0.33, high - range * 0.66, low];

  return (
    <Card className="overflow-hidden rounded-[34px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(246,250,255,0.97))] text-slate-900 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.16)]">
      <CardHeader className="border-b border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,248,255,0.6))] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 rounded-full border border-sky-100 bg-white shadow-[0_16px_34px_-18px_rgba(59,130,246,0.28)]">
              <AvatarImage
                src={trackedAsset?.meta?.imageUrl}
                alt={
                  trackedAsset
                    ? normalizeLabel(
                        trackedAsset.meta?.displayName ?? trackedLabel,
                      )
                    : t("swap.chart.selectTokenTitle")
                }
                className="object-cover"
              />
              <AvatarFallback className="bg-[linear-gradient(135deg,#7354F2,#3DB1FF)] text-lg font-semibold text-white">
                {(trackedLabel || "T").slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                  {trackedAsset
                    ? normalizeLabel(
                        trackedAsset.meta?.displayName ?? trackedLabel,
                      )
                    : t("swap.chart.selectTokenTitle")}
                </CardTitle>
                {trackedAsset ? (
                  <>
                    <Badge className="border border-sky-100 bg-white text-slate-700">
                      {chartLabel}
                    </Badge>
                    <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                      {t("swap.chart.live")}
                    </Badge>
                  </>
                ) : null}
              </div>
              <CardDescription className="mt-1 max-w-xl text-slate-600">
                {trackedAsset
                  ? t("swap.chart.liveDescription")
                  : t("swap.chart.selectTokenDescription")}
              </CardDescription>
            </div>
          </div>

          <div className="flex w-full min-w-[280px] max-w-[420px] flex-col gap-3">
            <AssetSelect
              className="h-14 rounded-[20px] border-sky-100 bg-white px-4 text-base shadow-none"
              assets={(assetsQuery.data ?? []).slice(0, 24)}
              selectedAsset={selectedChartAsset}
              onAssetSelect={setSelectedChartAsset}
              loading={assetsQuery.isLoading}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 md:p-6">
        {!trackedAsset ? (
          <div className="rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,251,255,0.82))] p-4 md:p-5">
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-sky-200 bg-white/70 px-6 text-center">
              <div className="mx-auto max-w-sm">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#3DB1FF]/80">
                  {t("swap.chart.selectTokenEyebrow")}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  {t("swap.chart.selectTokenPrompt")}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {t("swap.chart.selectTokenBody")}
                </p>
              </div>
            </div>
          </div>
        ) : (
        <>
        <div className="rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,251,255,0.82))] p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {t("swap.chart.priceInUsd")}
              </p>
              <p className="text-5xl font-semibold tracking-tight text-slate-950">
                ${formatChartValue(livePrice)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge
                  className={cn(
                    "border-0 text-base",
                    priceDirection === "up"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600",
                  )}
                >
                  {priceDirection === "up" ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {deltaPercent >= 0 ? "+" : ""}
                  {deltaPercent.toFixed(2)}%
                </Badge>
                <span
                  className={cn(
                    "text-2xl font-semibold",
                    priceDirection === "up" ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {delta >= 0 ? "+" : ""}
                  {formatChartValue(Math.abs(delta))}
                </span>
                <span className="text-2xl font-semibold text-slate-500">
                  {timeframe}
                </span>
              </div>
            </div>

            <div className="min-w-[190px] rounded-[22px] border border-sky-100 bg-white px-4 py-3 text-right">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {t("swap.chart.forecastPulse")}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {t(chartSignal.titleKey)}
              </p>
              <p className="mt-2 max-w-[15rem] text-sm leading-6 text-slate-500">
                {t(chartSignal.bodyKey, { timeframe })}
              </p>
              <div
                className={cn(
                  "mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                  chartSignal.tone === "bullish" &&
                    "bg-emerald-500/10 text-emerald-500",
                  chartSignal.tone === "bearish" && "bg-rose-500/10 text-rose-500",
                  chartSignal.tone === "neutral" &&
                    "bg-slate-100 text-slate-500",
                )}
              >
                <Dot className="-mx-1 h-5 w-5 animate-pulse" />
                {t("swap.chart.basedOnChart")}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_90px]">
            <div className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-white p-4 md:p-5">
              <svg
                viewBox="0 0 100 100"
                className="h-[360px] w-full md:h-[420px]"
                preserveAspectRatio="none"
                aria-label={`${chartLabel} live candlestick chart`}
              >
                {gridLevels.map((level, index) => {
                  const y = 100 - ((level - low) / range) * 100;

                  return (
                    <line
                      key={index}
                      x1="0"
                      x2="100"
                      y1={y}
                      y2={y}
                      stroke="rgba(148,163,184,0.35)"
                      strokeDasharray="2.8 3.4"
                    />
                  );
                })}

                {candles.map((candle, index) => {
                  const candleWidth = 100 / Math.max(candles.length, 1);
                  const xCenter = candleWidth * index + candleWidth / 2;
                  const bodyWidth = candleWidth * 0.56;
                  const openY = 100 - ((candle.open - low) / range) * 100;
                  const closeY = 100 - ((candle.close - low) / range) * 100;
                  const highY = 100 - ((candle.high - low) / range) * 100;
                  const lowY = 100 - ((candle.low - low) / range) * 100;
                  const isBull = candle.close >= candle.open;
                  const bodyTop = Math.min(openY, closeY);
                  const bodyHeight = Math.max(Math.abs(openY - closeY), 1.8);
                  const color = isBull ? "#5ad66f" : "#ff6d5a";

                  return (
                    <g key={`${index}-${candle.open}-${candle.close}`}>
                      <line
                        x1={xCenter}
                        x2={xCenter}
                        y1={highY}
                        y2={lowY}
                        stroke={color}
                        strokeWidth="0.7"
                        strokeLinecap="round"
                      />
                      <rect
                        x={xCenter - bodyWidth / 2}
                        y={bodyTop}
                        width={bodyWidth}
                        height={bodyHeight}
                        rx="0.8"
                        fill={color}
                      />
                    </g>
                  );
                })}

                <line
                  x1="0"
                  x2="100"
                  y1={100 - ((livePrice - low) / range) * 100}
                  y2={100 - ((livePrice - low) / range) * 100}
                  stroke={liveColor}
                  strokeDasharray="3 2.6"
                  strokeWidth="0.55"
                />
              </svg>

              <div className="mt-5 rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,255,0.96))] p-2">
                <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                  {TIMEFRAMES.map((frame) => (
                    <button
                      key={frame.key}
                      type="button"
                      onClick={() => setTimeframe(frame.key)}
                      className={cn(
                        "flex h-12 items-center justify-center rounded-full px-3 text-base font-semibold transition-all",
                        frame.key === timeframe
                          ? "bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-white shadow-[0_12px_24px_-18px_rgba(1,128,255,0.45)]"
                          : "border border-transparent bg-slate-50/80 text-slate-600 hover:bg-sky-50 hover:text-slate-900",
                      )}
                    >
                      {frame.key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-slate-500">
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-slate-700">
                  {t("swap.chart.candles")}
                </span>
                <span>{t(currentFrame.labelKey)}</span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1",
                    priceDirection === "up"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600",
                  )}
                >
                  {t("swap.chart.liveValue", {
                    value: formatChartValue(livePrice),
                  })}
                </span>
              </div>
            </div>

            <div className="flex flex-row justify-between rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,248,255,0.82))] px-4 py-3 text-right lg:flex-col lg:px-3 lg:py-4">
              {gridLevels.map((level, index) => (
                <span key={index} className="text-sm font-medium text-slate-500">
                  {formatChartValue(level)}
                </span>
              ))}
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-center text-lg font-semibold",
                  priceDirection === "up"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600",
                )}
              >
                {formatChartValue(livePrice)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex min-h-[180px] flex-col rounded-[24px] border border-sky-100 bg-white p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {t("swap.chart.structureHigh")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {formatChartValue(high)}
            </p>
            <p className="mt-2 max-w-[16rem] text-sm leading-6 text-slate-500">
              {t("swap.chart.upperBand")}
            </p>
          </div>
          <div className="flex min-h-[180px] flex-col rounded-[24px] border border-sky-100 bg-white p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {t("swap.chart.structureLow")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {formatChartValue(low)}
            </p>
            <p className="mt-2 max-w-[16rem] text-sm leading-6 text-slate-500">
              {t("swap.chart.lowerBand")}
            </p>
          </div>
          <div className="flex min-h-[180px] flex-col rounded-[24px] border border-sky-100 bg-white p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {t("swap.chart.routeImpact")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {(Number(simulation?.priceImpact ?? 0) * 100).toFixed(2)}%
            </p>
            <p className="mt-2 max-w-[16rem] text-sm leading-6 text-slate-500">
              {trackedAsset
                ? t("swap.chart.impactLive")
                : t("swap.chart.impactPreview")}
            </p>
          </div>
          <div className="flex min-h-[180px] flex-col rounded-[26px] border border-white/8 bg-[linear-gradient(135deg,rgba(1,128,255,0.18),rgba(115,84,242,0.18))] p-4 shadow-[0_24px_60px_-34px_rgba(1,128,255,0.45)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {t("swap.chart.tradeLens")}
            </p>
            <p className="mt-3 max-w-[15rem] text-xl font-semibold leading-8 text-slate-900">
              {t("swap.chart.tradeLensTitle")}
            </p>
            <p className="mt-3 max-w-[16rem] text-sm leading-6 text-slate-600">
              {t("swap.chart.tradeLensBodyLive")}
            </p>
          </div>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
