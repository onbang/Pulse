"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Dot, TrendingDown, TrendingUp } from "lucide-react";

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
  { key: "1H", points: 18, label: "Fast pulse" },
  { key: "4H", points: 24, label: "Session move" },
  { key: "1D", points: 32, label: "Daily structure" },
] as const;

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

function createSeries({
  seed,
  currentPrice,
  points,
  bullishBias,
  volatility,
}: {
  seed: number;
  currentPrice: number;
  points: number;
  bullishBias: number;
  volatility: number;
}) {
  const values: number[] = [];
  let value = currentPrice * (0.92 + (seed % 13) / 100);

  for (let index = 0; index < points; index += 1) {
    const waveA = Math.sin((index + (seed % 7)) / 2.4) * volatility * 0.55;
    const waveB = Math.cos((index + (seed % 11)) / 4.6) * volatility * 0.34;
    const drift = bullishBias * (index / points - 0.35) * currentPrice * 0.08;
    const noise =
      ((((seed >> (index % 16)) & 1) === 1 ? 1 : -1) *
        volatility *
        currentPrice *
        0.12) /
      points;

    value = Math.max(
      currentPrice * 0.42,
      value + waveA + waveB + drift / points + noise,
    );

    values.push(value);
  }

  values[values.length - 1] = currentPrice;

  return values;
}

function formatChartValue(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 6,
    minimumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

export function SwapPriceChart() {
  const [timeframe, setTimeframe] =
    useState<(typeof TIMEFRAMES)[number]["key"]>("4H");
  const { offerAsset, askAsset } = useSwapForm();
  const { data: simulation } = useSwapSimulation();
  const { getPrediction } = useCommunityProfile();

  if (!offerAsset || !askAsset) {
    return null;
  }

  const offerLabel = normalizeLabel(offerAsset.meta?.symbol);
  const askLabel = normalizeLabel(askAsset.meta?.symbol);
  const pairId = `${offerAsset.contractAddress}:${askAsset.contractAddress}`;
  const pairLabel = `${offerLabel}/${askLabel}`;
  const prediction = getPrediction(pairId);
  const bullishBias =
    ((prediction?.up.length ?? 0) - (prediction?.down.length ?? 0)) /
    Math.max((prediction?.up.length ?? 0) + (prediction?.down.length ?? 0), 1);

  const currentPrice =
    simulation?.swapRate && Number.isFinite(Number(simulation.swapRate))
      ? Number(simulation.swapRate)
      : offerAsset.dexPriceUsd && askAsset.dexPriceUsd
        ? Number(offerAsset.dexPriceUsd) / Number(askAsset.dexPriceUsd)
        : 1;

  const currentFrame = TIMEFRAMES.find((frame) => frame.key === timeframe)!;
  const volatilityBase = Math.max(
    Number(simulation?.priceImpact ?? 0.012),
    0.012,
  );
  const volatility = Math.min(volatilityBase * 2.8, 0.18);

  const series = useMemo(() => {
    return createSeries({
      seed: hashSeed(`${pairId}:${timeframe}`),
      currentPrice,
      points: currentFrame.points,
      bullishBias,
      volatility,
    });
  }, [
    bullishBias,
    currentFrame.points,
    currentPrice,
    pairId,
    timeframe,
    volatility,
  ]);

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(max - min, currentPrice * 0.02);

  const chartPath = series
    .map((value, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaPath = `${chartPath} L 100 100 L 0 100 Z`;
  const firstValue = series[0] ?? currentPrice;
  const priceDirection = currentPrice >= firstValue ? "up" : "down";
  const deltaPercent = ((currentPrice - firstValue) / firstValue) * 100;
  const forecastDirection =
    bullishBias === 0 ? null : bullishBias > 0 ? "up" : "down";
  const forecastLabel =
    forecastDirection === "up"
      ? "Bullish bias"
      : forecastDirection === "down"
        ? "Bearish bias"
        : "Neutral bias";

  return (
    <Card className="surface-panel overflow-hidden border-white/70">
      <CardHeader className="border-b border-slate-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(241,248,255,0.76))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-700/70">
              Market canvas
            </p>
            <CardTitle className="mt-2 text-2xl">{pairLabel}</CardTitle>
            <CardDescription className="mt-1 max-w-xl">
              Visual trend layer for the token pair you are forecasting.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIMEFRAMES.map((frame) => (
              <button
                key={frame.key}
                type="button"
                onClick={() => setTimeframe(frame.key)}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all",
                  frame.key === timeframe
                    ? "bg-[linear-gradient(135deg,#082f49,#0284c7)] text-white shadow-[0_16px_34px_-18px_rgba(2,132,199,0.8)]"
                    : "border border-slate-200 bg-white/85 text-slate-500 hover:text-slate-900",
                )}
              >
                {frame.key}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="mesh-card p-4 md:p-5">
          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">
                    {formatChartValue(currentPrice)}
                  </p>
                  <span className="text-sm font-medium text-slate-500">
                    {askLabel} per {offerLabel}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      "border-0",
                      priceDirection === "up"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700",
                    )}
                  >
                    {priceDirection === "up" ? (
                      <TrendingUp className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="mr-1 h-3.5 w-3.5" />
                    )}
                    {deltaPercent >= 0 ? "+" : ""}
                    {deltaPercent.toFixed(2)}%
                  </Badge>
                  <Badge variant="secondary">{currentFrame.label}</Badge>
                  <Badge className="border border-sky-200 bg-sky-50 text-sky-700">
                    Live quote <Dot className="mx-1 h-4 w-4" /> forecast overlay
                  </Badge>
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 text-right">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Forecast pulse
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {forecastLabel}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Based on community positioning
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(8,47,73,0.06),rgba(255,255,255,0.72))] p-4">
              <div className="pointer-events-none absolute inset-x-0 top-4 h-px border-t border-dashed border-slate-200" />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px border-t border-dashed border-slate-200" />
              <div className="pointer-events-none absolute inset-x-0 bottom-4 h-px border-t border-dashed border-slate-200" />

              <svg
                viewBox="0 0 100 100"
                className="h-[280px] w-full"
                preserveAspectRatio="none"
                aria-label={`${pairLabel} chart`}
              >
                <defs>
                  <linearGradient
                    id="pulse-area"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(14,165,233,0.35)" />
                    <stop offset="100%" stopColor="rgba(14,165,233,0.02)" />
                  </linearGradient>
                  <linearGradient
                    id="pulse-line"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="60%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                <path d={areaPath} fill="url(#pulse-area)" />
                <path
                  d={chartPath}
                  fill="none"
                  stroke="url(#pulse-line)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="100"
                  cy={100 - ((currentPrice - min) / range) * 100}
                  r="2.8"
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
              </svg>

              <div className="mt-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                <span>{TIMEFRAMES[0].key}</span>
                <span>{timeframe}</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="stat-pill">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Range high
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatChartValue(max)}
            </p>
            <p className="mt-1 text-sm text-slate-500">Upper reaction zone</p>
          </div>
          <div className="stat-pill">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Range low
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatChartValue(min)}
            </p>
            <p className="mt-1 text-sm text-slate-500">Lower reaction zone</p>
          </div>
          <div className="stat-pill">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Route impact
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {(Number(simulation?.priceImpact ?? 0) * 100).toFixed(2)}%
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Friction in the current quote path
            </p>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(135deg,#082f49,#0f766e)] px-4 py-4 text-white shadow-[0_24px_60px_-34px_rgba(8,47,73,0.7)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
              Trade lens
            </p>
            <p className="mt-2 text-lg font-semibold">
              Forecast the next move with chart context
            </p>
            <p className="mt-2 text-sm text-white/72">
              Use the curve, route impact, and community bias together before
              placing your prediction.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-100">
              Open prediction round
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
