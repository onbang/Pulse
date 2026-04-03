"use client";

import { useEffect, useMemo, useState } from "react";
import { Dot, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { useCommunityProfile } from "@/components/community/community-provider";

import { useSwapSimulation } from "../hooks/swap-simulation-query";
import { useSwapForm } from "../providers/swap-form";

const TIMEFRAMES = [
  { key: "1M", candles: 24, label: "Scalp mode", liveStepMs: 1600 },
  { key: "5M", candles: 28, label: "Live session", liveStepMs: 2200 },
  { key: "15M", candles: 24, label: "Momentum", liveStepMs: 2800 },
  { key: "1H", candles: 22, label: "Structure", liveStepMs: 3600 },
  { key: "4H", candles: 20, label: "Trend", liveStepMs: 4200 },
  { key: "1D", candles: 18, label: "Swing", liveStepMs: 5200 },
] as const;

type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
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
}: {
  seed: number;
  currentPrice: number;
  candles: number;
  bullishBias: number;
  volatility: number;
  liveOffset: number;
}) {
  const data: Candle[] = [];
  let previousClose = currentPrice * (0.94 + (seed % 9) / 100);

  for (let index = 0; index < candles; index += 1) {
    const pulse = Math.sin((index + liveOffset + (seed % 5)) / 2.8);
    const wave = Math.cos((index + liveOffset + (seed % 11)) / 4.4);
    const directionalDrift =
      bullishBias * currentPrice * 0.045 * (index / Math.max(candles, 1) - 0.4);
    const driftNoise =
      ((seed % (index + 7)) - (index % 5)) *
      volatility *
      currentPrice *
      0.012;
    const close = Math.max(
      currentPrice * 0.45,
      previousClose +
        pulse * currentPrice * volatility * 0.34 +
        wave * currentPrice * volatility * 0.18 +
        directionalDrift +
        driftNoise,
    );
    const open =
      previousClose +
      Math.sin((index + seed) / 3.6) * currentPrice * volatility * 0.08;
    const high =
      Math.max(open, close) +
      currentPrice * volatility * (0.08 + ((index + seed) % 5) * 0.02);
    const low =
      Math.min(open, close) -
      currentPrice * volatility * (0.08 + ((index + seed) % 4) * 0.018);

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

function getAssetTone(symbol: string) {
  const upper = symbol.toUpperCase();

  if (upper === "BTC" || upper === "WBTC") {
    return "from-amber-400 to-orange-500";
  }

  if (upper === "TON") {
    return "from-sky-400 to-blue-500";
  }

  if (upper === "USDT" || upper === "USDC") {
    return "from-emerald-400 to-teal-500";
  }

  return "from-fuchsia-500 to-sky-500";
}

export function SwapPriceChart() {
  const [timeframe, setTimeframe] =
    useState<(typeof TIMEFRAMES)[number]["key"]>("5M");
  const [liveTick, setLiveTick] = useState(0);
  const { offerAsset, askAsset } = useSwapForm();
  const { data: simulation } = useSwapSimulation();
  const { getPrediction } = useCommunityProfile();

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

  const hasSelectedPair = Boolean(offerAsset && askAsset);
  const offerLabel = hasSelectedPair
    ? normalizeLabel(offerAsset?.meta?.symbol)
    : "TON";
  const askLabel = hasSelectedPair
    ? normalizeLabel(askAsset?.meta?.symbol)
    : "USDT";
  const pairId = hasSelectedPair
    ? `${offerAsset!.contractAddress}:${askAsset!.contractAddress}`
    : "pulse:preview-ton-usdt";
  const pairLabel = `${offerLabel}/${askLabel}`;
  const prediction = getPrediction(pairId);
  const bullishBias =
    ((prediction?.up.length ?? 0) - (prediction?.down.length ?? 0)) /
    Math.max((prediction?.up.length ?? 0) + (prediction?.down.length ?? 0), 1);

  const basePrice =
    hasSelectedPair &&
    simulation?.swapRate &&
    Number.isFinite(Number(simulation.swapRate))
      ? Number(simulation.swapRate)
      : hasSelectedPair && offerAsset?.dexPriceUsd && askAsset?.dexPriceUsd
        ? Number(offerAsset.dexPriceUsd) / Number(askAsset.dexPriceUsd)
        : 3.42;

  const livePrice =
    basePrice *
    (1 +
      Math.sin(liveTick / 2.6 + bullishBias) *
        Math.max(Number(simulation?.priceImpact ?? 0.004), 0.003) *
        0.18);

  const currentFrame = TIMEFRAMES.find((frame) => frame.key === timeframe)!;
  const volatilityBase = Math.max(
    Number(simulation?.priceImpact ?? 0.012),
    0.012,
  );
  const volatility = Math.min(volatilityBase * 2.4, 0.16);

  const candles = useMemo(() => {
    return createCandles({
      seed: hashSeed(`${pairId}:${timeframe}`),
      currentPrice: livePrice,
      candles: currentFrame.candles,
      bullishBias,
      volatility,
      liveOffset: liveTick,
    });
  }, [
    bullishBias,
    currentFrame.candles,
    livePrice,
    liveTick,
    pairId,
    timeframe,
    volatility,
  ]);

  const high = Math.max(...candles.map((candle) => candle.high));
  const low = Math.min(...candles.map((candle) => candle.low));
  const range = Math.max(high - low, livePrice * 0.02);
  const lastCandle = candles[candles.length - 1];
  const firstOpen = candles[0]?.open ?? livePrice;
  const priceDirection = livePrice >= firstOpen ? "up" : "down";
  const delta = livePrice - firstOpen;
  const deltaPercent = (delta / Math.max(firstOpen, 0.000001)) * 100;
  const forecastDirection =
    bullishBias === 0 ? null : bullishBias > 0 ? "up" : "down";
  const forecastLabel =
    forecastDirection === "up"
      ? "Bullish flow"
      : forecastDirection === "down"
        ? "Bearish flow"
        : "Neutral flow";
  const liveColor = priceDirection === "up" ? "#5ad66f" : "#ff6d5a";
  const gridLevels = [high, high - range * 0.33, high - range * 0.66, low];

  return (
    <Card className="overflow-hidden rounded-[34px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.96))] text-slate-900 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.16)]">
      <CardHeader className="border-b border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,248,255,0.6))] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-lg font-semibold text-white shadow-[0_16px_34px_-18px_rgba(59,130,246,0.75)]",
                getAssetTone(offerLabel),
              )}
            >
              {offerLabel.slice(0, 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                  {hasSelectedPair
                    ? normalizeLabel(offerAsset?.meta?.displayName ?? offerLabel)
                    : "Pulse market"}
                </CardTitle>
                <Badge className="border border-sky-100 bg-white text-slate-700">
                  {pairLabel}
                </Badge>
                <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                  {hasSelectedPair ? "Live" : "Preview"}
                </Badge>
              </div>
              <CardDescription className="mt-1 max-w-xl text-slate-600">
                {hasSelectedPair
                  ? "Real-time styled execution chart for the pair you are forecasting."
                  : "Select a token pair to switch this preview into a live pair-specific market chart."}
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 rounded-full border border-sky-100 bg-white p-1">
            {TIMEFRAMES.map((frame) => (
              <button
                key={frame.key}
                type="button"
                onClick={() => setTimeframe(frame.key)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                  frame.key === timeframe
                    ? "bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-white shadow-[0_12px_24px_-18px_rgba(1,128,255,0.45)]"
                    : "text-slate-500 hover:bg-sky-50 hover:text-slate-900",
                )}
              >
                {frame.key}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 md:p-6">
        <div className="rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,251,255,0.82))] p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-5xl font-semibold tracking-tight text-slate-950">
                {formatChartValue(livePrice)}
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
                {!hasSelectedPair ? (
                  <span className="rounded-full border border-sky-100 bg-white px-3 py-1 text-sm font-medium text-slate-600">
                    Waiting for pair selection
                  </span>
                ) : null}
              </div>
            </div>

            <div className="min-w-[190px] rounded-[22px] border border-sky-100 bg-white px-4 py-3 text-right">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Forecast pulse
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {forecastLabel}
              </p>
              <div className="mt-2 inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <Dot className="-mx-1 h-5 w-5 animate-pulse" />
                {hasSelectedPair ? "Live mode" : "Preview mode"}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_90px]">
            <div className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-white p-4 md:p-5">
              <svg
                viewBox="0 0 100 100"
                className="h-[360px] w-full md:h-[420px]"
                preserveAspectRatio="none"
                aria-label={`${pairLabel} live candlestick chart`}
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

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-slate-500">
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-slate-700">
                  Candles
                </span>
                <span>{currentFrame.label}</span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1",
                    priceDirection === "up"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600",
                  )}
                >
                  Live {formatChartValue(livePrice)}
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
          <div className="rounded-[24px] border border-sky-100 bg-white p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Structure high
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {formatChartValue(high)}
            </p>
            <p className="mt-1 text-sm text-slate-500">Upper intraday band</p>
          </div>
          <div className="rounded-[24px] border border-sky-100 bg-white p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Structure low
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {formatChartValue(low)}
            </p>
            <p className="mt-1 text-sm text-slate-500">Lower support zone</p>
          </div>
          <div className="rounded-[24px] border border-sky-100 bg-white p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Route impact
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {(Number(simulation?.priceImpact ?? 0) * 100).toFixed(2)}%
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {hasSelectedPair
                ? "Friction in the current quote path"
                : "Indicative impact until the pair is selected"}
            </p>
          </div>
          <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(135deg,rgba(1,128,255,0.18),rgba(115,84,242,0.18))] p-4 shadow-[0_24px_60px_-34px_rgba(1,128,255,0.45)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Trade lens
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              Read momentum before you place the next prediction
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {hasSelectedPair
                ? "Candles, live quote pulse, and community bias now sit in one market panel."
                : "The market panel is always visible now, and it upgrades into a live pair chart as soon as you choose tokens."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
