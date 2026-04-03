"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouters } from "@/hooks/use-routers";
import { Formatter } from "@/lib/formatter";
import { useCommunityProfile } from "@/components/community/community-provider";

import { useSwapSimulation } from "../hooks/swap-simulation-query";
import { useSwapForm } from "../providers/swap-form";
import { useSwapSettings } from "../providers/swap-settings";

function normalizeLabel(label?: string | null) {
  return label?.trim() || "token";
}

function getImpactTone(priceImpact: number) {
  if (priceImpact >= 0.05) {
    return {
      label: "High impact",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (priceImpact >= 0.02) {
    return {
      label: "Medium impact",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Efficient route",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export function SwapMarketIntelligence() {
  const { offerAsset, askAsset } = useSwapForm();
  const { autoSlippageTolerance } = useSwapSettings();
  const { data: simulation, isFetching, isFetched } = useSwapSimulation();
  const { data: routers } = useRouters();
  const { getPrediction } = useCommunityProfile();

  if (!offerAsset || !askAsset) {
    return null;
  }

  const offerLabel = normalizeLabel(offerAsset.meta?.symbol);
  const askLabel = normalizeLabel(askAsset.meta?.symbol);
  const pairId = `${offerAsset.contractAddress}:${askAsset.contractAddress}`;
  const pairLabel = `${offerLabel}/${askLabel}`;
  const sentiment = getPrediction(pairId);
  const totalVotes =
    (sentiment?.up.length ?? 0) + (sentiment?.down.length ?? 0);
  const bullishShare =
    totalVotes > 0
      ? Math.round(((sentiment?.up.length ?? 0) / totalVotes) * 100)
      : 0;
  const bearishShare = totalVotes > 0 ? 100 - bullishShare : 0;

  if (!isFetched && !isFetching) {
    return null;
  }

  if (!simulation) {
    return (
      <Card className="border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#ffffff)]">
        <CardHeader>
          <CardTitle>Swap intelligence</CardTitle>
          <CardDescription>
            Market context for {pairLabel} will appear after the first
            simulation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const router = routers?.get(simulation.routerAddress);
  const priceImpact = Number(simulation.priceImpact);
  const impactTone = getImpactTone(priceImpact);
  const activeSlippage = Number(
    autoSlippageTolerance
      ? simulation.slippageTolerance
      : simulation.recommendedSlippageTolerance,
  );

  return (
    <Card className="border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#ffffff)]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Swap intelligence</CardTitle>
            <CardDescription>
              Official STON simulation context for {pairLabel}.
            </CardDescription>
          </div>
          <Badge className={impactTone.className}>{impactTone.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Route
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {router ? `DEX v${router.majorVersion}` : "STON route"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {router?.routerType ?? "Aggregated path"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Price impact
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {(priceImpact * 100).toFixed(2)}%
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Based on the current simulated route.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Active slippage
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {(activeSlippage * 100).toFixed(2)}%
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {autoSlippageTolerance
                ? "Auto-adjusted for current route."
                : "Pinned by the user setting."}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Est. gas
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {Formatter.units(simulation.gasParams.estimatedGasConsumption, 9)}{" "}
              TON
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Estimated by STON simulation.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Community conviction
              </h4>
              <Badge variant="secondary">{totalVotes} votes</Badge>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-emerald-700">Bullish</span>
                  <strong>{bullishShare}%</strong>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${bullishShare}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-rose-700">Bearish</span>
                  <strong>{bearishShare}%</strong>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-rose-500"
                    style={{ width: `${bearishShare}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Execution notes
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                {priceImpact >= 0.05
                  ? "Large trade relative to route depth. Consider lowering size or splitting the trade."
                  : "Route depth looks acceptable for the current simulated amount."}
              </li>
              <li>
                Minimum received:{" "}
                {Formatter.units(
                  simulation.minAskUnits,
                  askAsset.meta?.decimals ?? 9,
                )}{" "}
                {askLabel}
              </li>
              <li>
                Simulated output:{" "}
                {Formatter.units(
                  simulation.askUnits,
                  askAsset.meta?.decimals ?? 9,
                )}{" "}
                {askLabel}
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
