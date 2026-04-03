"use client";

import { RefreshCw, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useSwapSimulation } from "../hooks/swap-simulation-query";

import { SwapSettings } from "./swap-settings";

export const SwapFormHeader = () => {
  const swapSimulationQuery = useSwapSimulation();

  return (
    <div className="hero-shell">
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="mr-auto space-y-3">
            <p className="eyebrow">Live Trade Studio</p>
            <div className="space-y-2">
              <h1 className="page-heading text-4xl md:text-5xl">Swap</h1>
              <p className="max-w-xl text-sm leading-6 text-white/78 md:text-base">
                Execute swaps, read live routing context, and layer community
                conviction on top of every token pair.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="glass-strip size-10 border-white/20 bg-white/10 p-0 text-white hover:bg-white/20 hover:text-white"
              disabled={
                !swapSimulationQuery.isFetched || swapSimulationQuery.isFetching
              }
              onClick={() => swapSimulationQuery.refetch()}
            >
              <RefreshCw
                size={18}
                className={swapSimulationQuery.isLoading ? "animate-spin" : ""}
              />
            </Button>
            <SwapSettings
              trigger={
                <Button
                  variant="outline"
                  className="glass-strip size-10 border-white/20 bg-white/10 p-0 text-white hover:bg-white/20 hover:text-white"
                >
                  <Settings size={18} />
                </Button>
              }
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="stat-pill border-white/20 bg-white/10 text-white">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              Execution
            </p>
            <p className="mt-2 text-lg font-semibold">
              STON route intelligence
            </p>
            <p className="mt-1 text-sm text-white/72">
              Simulation and market context flow into every trade.
            </p>
          </div>
          <div className="stat-pill border-white/20 bg-white/10 text-white">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              Community
            </p>
            <p className="mt-2 text-lg font-semibold">Prediction layer</p>
            <p className="mt-1 text-sm text-white/72">
              Read conviction, place bets, and compare momentum live.
            </p>
          </div>
          <div className="stat-pill border-white/20 bg-white/10 text-white">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              Precision
            </p>
            <p className="mt-2 text-lg font-semibold">
              {swapSimulationQuery.isFetching
                ? "Refreshing route"
                : "Ready to quote"}
            </p>
            <p className="mt-1 text-sm text-white/72">
              Fine-tune slippage, routing, and timing before execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
