"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCommunityProfile } from "./community-provider";

export function ProfileBetHistory() {
  const { profile, settledPredictions, userBets, walletAddress } =
    useCommunityProfile();

  if (!profile) {
    return null;
  }

  const userSettlements = settledPredictions
    .map((settlement) => ({
      ...settlement,
      payout:
        settlement.payouts.find(
          (item) => item.walletAddress === walletAddress,
        ) ?? null,
    }))
    .filter((settlement) => settlement.payout !== null);

  return (
    <Card className="surface-panel overflow-hidden">
      <CardHeader>
        <CardTitle>Bet history</CardTitle>
        <CardDescription>
          Prediction activity tied to your connected profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-800">
              Active and recent bets
            </h4>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {userBets.length} entries
            </span>
          </div>
          {userBets.length === 0 ? (
            <p className="text-sm text-slate-500">
              No prediction bets yet. Head to swap and place your first view on
              a pair.
            </p>
          ) : (
            userBets.slice(0, 8).map((bet) => (
              <div
                key={bet.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-slate-800">{bet.pairLabel}</strong>
                  <span className="text-xs text-slate-500">
                    {new Date(bet.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {bet.direction === "up" ? "Bullish" : "Bearish"} ·{" "}
                  {bet.amount.toFixed(2)} pts
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-800">
              Settled rounds
            </h4>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {userSettlements.length} results
            </span>
          </div>
          {userSettlements.length === 0 ? (
            <p className="text-sm text-slate-500">
              No settled rounds involving your wallet yet.
            </p>
          ) : (
            userSettlements.slice(0, 6).map((settlement) => (
              <div
                key={settlement.roundId}
                className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-slate-800">
                    {settlement.pairLabel}
                  </strong>
                  <span className="text-xs text-slate-500">
                    {new Date(settlement.settledAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  Winner:{" "}
                  {settlement.settlementDirection === "up" ? "Up" : "Down"}
                </p>
                <p className="text-sm font-medium text-emerald-700">
                  Your payout preview:{" "}
                  {settlement.payout?.estimatedPayout.toFixed(2)} pts
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
