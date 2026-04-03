"use client";

import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

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
import { validateFloatValue } from "@/lib/utils";
import { useCommunityProfile } from "./community-provider";

export function PricePredictionCard(props: {
  pairId: string;
  label: string;
  disabled?: boolean;
}) {
  const [stakeAmount, setStakeAmount] = useState("10");
  const {
    getPrediction,
    submitPrediction,
    settlePredictionRound,
    walletAddress,
  } = useCommunityProfile();
  const prediction = getPrediction(props.pairId);
  const round = prediction?.round;
  const upVotes = prediction?.up.length ?? 0;
  const downVotes = prediction?.down.length ?? 0;
  const totalVotes = upVotes + downVotes;
  const upShare =
    totalVotes === 0 ? 0 : Math.round((upVotes / totalVotes) * 100);
  const downShare = totalVotes === 0 ? 0 : 100 - upShare;
  const bets = prediction?.bets ?? [];
  const upPool = bets
    .filter((bet) => bet.direction === "up")
    .reduce((sum, bet) => sum + bet.amount, 0);
  const downPool = bets
    .filter((bet) => bet.direction === "down")
    .reduce((sum, bet) => sum + bet.amount, 0);
  const totalPool = upPool + downPool;
  const topBets = useMemo(
    () => [...bets].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [bets],
  );
  const topPayouts = (prediction?.payoutPreviews ?? []).slice(0, 5);
  const myBets = useMemo(
    () => bets.filter((bet) => bet.walletAddress === walletAddress),
    [bets, walletAddress],
  );
  const myUpStake = myBets
    .filter((bet) => bet.direction === "up")
    .reduce((sum, bet) => sum + bet.amount, 0);
  const myDownStake = myBets
    .filter((bet) => bet.direction === "down")
    .reduce((sum, bet) => sum + bet.amount, 0);
  const myDirection =
    myUpStake === myDownStake ? null : myUpStake > myDownStake ? "up" : "down";
  const myStake =
    myDirection === "up" ? myUpStake : myDirection === "down" ? myDownStake : 0;
  const myPotentialPayout =
    myDirection === "up"
      ? myStake > 0 && upPool > 0
        ? (myStake / upPool) * totalPool
        : 0
      : myDirection === "down"
        ? myStake > 0 && downPool > 0
          ? (myStake / downPool) * totalPool
          : 0
        : 0;
  const latestSettlement = useMemo(() => {
    const settledRound =
      round?.status === "settled" && round.settlementDirection
        ? {
            roundId: round.id,
            settlementDirection: round.settlementDirection,
            settledAt: round.resolvedAt ?? round.closesAt,
            totalPool,
          }
        : null;

    return settledRound;
  }, [round, totalPool]);
  const isDisabled = props.disabled || !walletAddress;
  const numericStake = Number(stakeAmount);
  const isStakeValid =
    stakeAmount.trim().length > 0 &&
    validateFloatValue(stakeAmount, 2) &&
    Number.isFinite(numericStake) &&
    numericStake > 0;
  const upOdds = upPool > 0 ? totalPool / upPool : 0;
  const downOdds = downPool > 0 ? totalPool / downPool : 0;
  const isRoundOpen = round?.status === "open";
  const isRoundClosed = round?.status === "closed";
  const isRoundSettled = round?.status === "settled";
  const timeLeftMs = round
    ? Math.max(new Date(round.closesAt).getTime() - Date.now(), 0)
    : 0;
  const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));

  const placePrediction = async (direction: "up" | "down") => {
    if (isDisabled || !isStakeValid || !isRoundOpen) {
      return;
    }

    const submitted = await submitPrediction({
      pairId: props.pairId,
      label: props.label,
      direction,
      amount: numericStake,
    });

    if (submitted) {
      setStakeAmount("10");
    }
  };

  return (
    <Card className="border-sky-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)]">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Community price outlook</CardTitle>
            <CardDescription>
              Vote where the market moves next for {props.label}.
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {round?.status === "settled"
              ? "Settled"
              : round?.status === "closed"
                ? "Awaiting settlement"
                : `${totalVotes} votes`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {round ? (
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Round status
              </p>
              <p className="text-lg font-semibold capitalize">{round.status}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Time left
              </p>
              <p className="text-lg font-semibold">
                {isRoundOpen ? `${hoursLeft}h ${minutesLeft}m` : "Closed"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Winner
              </p>
              <p className="text-lg font-semibold">
                {round.settlementDirection
                  ? round.settlementDirection === "up"
                    ? "Up"
                    : "Down"
                  : "Pending"}
              </p>
            </div>
          </div>
        ) : null}
        <div className="grid gap-3 rounded-2xl border border-sky-100 bg-white/80 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Total pool
            </p>
            <p className="text-2xl font-semibold">{totalPool.toFixed(2)} pts</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Up odds
            </p>
            <p className="text-2xl font-semibold">
              {upOdds > 0 ? `${upOdds.toFixed(2)}x` : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Down odds
            </p>
            <p className="text-2xl font-semibold">
              {downOdds > 0 ? `${downOdds.toFixed(2)}x` : "-"}
            </p>
          </div>
        </div>
        {walletAddress ? (
          <div className="grid gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Your active side
              </p>
              <p className="text-lg font-semibold">
                {myDirection
                  ? myDirection === "up"
                    ? "Bullish"
                    : "Bearish"
                  : "No position yet"}
              </p>
              <p className="text-sm text-slate-600">
                {myStake > 0
                  ? `${myStake.toFixed(2)} pts committed in this round.`
                  : "Join the round to start earning prediction reputation."}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Potential payout
              </p>
              <p className="text-lg font-semibold">
                {myPotentialPayout > 0
                  ? `${myPotentialPayout.toFixed(2)} pts`
                  : "-"}
              </p>
              <p className="text-sm text-slate-600">
                Live preview based on the current pool split and your existing
                exposure.
              </p>
            </div>
          </div>
        ) : null}
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor={`${props.pairId}-stake`}
          >
            Stake amount
          </label>
          <Input
            id={`${props.pairId}-stake`}
            inputMode="decimal"
            value={stakeAmount}
            onChange={(event) => {
              if (
                event.target.value &&
                !validateFloatValue(event.target.value, 2)
              ) {
                return;
              }

              setStakeAmount(event.target.value);
            }}
            placeholder="Enter stake in points"
          />
          <p className="text-xs text-slate-500">
            Payout coefficient is calculated from the current stake pool on each
            side.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            disabled={isDisabled || !isStakeValid}
            className="h-auto justify-between border-emerald-200 py-4"
            onClick={() => void placePrediction("up")}
          >
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="text-emerald-600" />
              Bullish
            </span>
            <strong>
              {upShare}% · {upOdds > 0 ? `${upOdds.toFixed(2)}x` : "-"}
            </strong>
          </Button>
          <Button
            variant="outline"
            disabled={isDisabled || !isStakeValid}
            className="h-auto justify-between border-rose-200 py-4"
            onClick={() => void placePrediction("down")}
          >
            <span className="inline-flex items-center gap-2">
              <TrendingDown className="text-rose-600" />
              Bearish
            </span>
            <strong>
              {downShare}% · {downOdds > 0 ? `${downOdds.toFixed(2)}x` : "-"}
            </strong>
          </Button>
        </div>
        {isRoundClosed ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Settle closed round
                </h4>
                <p className="text-sm text-slate-600">
                  Lock in the winning side to publish payout previews.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="border-emerald-200"
                onClick={() =>
                  void settlePredictionRound({
                    pairId: props.pairId,
                    direction: "up",
                  })
                }
              >
                Settle Up
              </Button>
              <Button
                variant="outline"
                className="border-rose-200"
                onClick={() =>
                  void settlePredictionRound({
                    pairId: props.pairId,
                    direction: "down",
                  })
                }
              >
                Settle Down
              </Button>
            </div>
          </div>
        ) : null}
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-800">
              Highest stakes history
            </h4>
            <Badge variant="outline">{bets.length} bets</Badge>
          </div>
          <div className="space-y-2">
            {topBets.length === 0 ? (
              <p className="text-sm text-slate-500">
                No bets yet for this pair.
              </p>
            ) : (
              topBets.map((bet, index) => (
                <div
                  key={bet.id}
                  className="grid grid-cols-[auto,1fr,auto,auto] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-slate-500">
                    #{index + 1}
                  </span>
                  <span className="truncate font-medium text-slate-800">
                    {bet.author}
                  </span>
                  <Badge
                    variant={bet.direction === "up" ? "secondary" : "outline"}
                  >
                    {bet.direction === "up" ? "Up" : "Down"}
                  </Badge>
                  <span className="font-semibold">
                    {bet.amount.toFixed(2)} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        {isRoundSettled ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Winners payout preview
              </h4>
              <Badge variant="outline">{topPayouts.length} winners</Badge>
            </div>
            <div className="space-y-2">
              {topPayouts.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No winning bets in this round.
                </p>
              ) : (
                topPayouts.map((item, index) => (
                  <div
                    key={`${item.walletAddress}-${index}`}
                    className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-xl border border-emerald-100 bg-white/85 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-slate-500">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800">
                        {item.author}
                      </p>
                      <p className="text-xs text-slate-500">
                        Stake {item.totalStake.toFixed(2)} pts
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-700">
                      {item.estimatedPayout.toFixed(2)} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
        {latestSettlement ? (
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Latest settlement snapshot
                </h4>
                <p className="text-sm text-slate-600">
                  Last resolved view for {props.label}.
                </p>
              </div>
              <Badge variant="outline">
                {latestSettlement.settlementDirection === "up"
                  ? "Up won"
                  : "Down won"}
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Settled at
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(latestSettlement.settledAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Total round pool
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {latestSettlement.totalPool.toFixed(2)} pts
                </p>
              </div>
            </div>
          </div>
        ) : null}
        <p className="text-sm text-slate-600">
          This is a sentiment widget, not financial advice. Open rounds accept
          bets, closed rounds await settlement, and settled rounds show payout
          previews.
        </p>
        {!walletAddress ? (
          <p className="text-sm text-slate-500">
            Connect your wallet to vote with your profile.
          </p>
        ) : !isRoundOpen ? (
          <p className="text-sm text-slate-500">
            This round is no longer accepting new bets.
          </p>
        ) : !isStakeValid ? (
          <p className="text-sm text-slate-500">
            Enter a valid stake amount above 0 to place a bet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
