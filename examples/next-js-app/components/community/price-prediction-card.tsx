"use client";

import { useTonConnectUI } from "@tonconnect/ui-react";
import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { getPredictionEntryAddress } from "@/lib/prediction-config";
import { parsePredictionTokenMarketId } from "@/lib/prediction-timeframes";
import { buildPredictionTransferMessage } from "@/lib/prediction-transfer";
import { getMessageHashFromSignedBoc } from "@/lib/ton-message-hash";
import { validateFloatValue } from "@/lib/utils";
import { useCommunityProfile } from "./community-provider";

type PredictionSubmissionState =
  | "idle"
  | "sending"
  | "waiting_confirmation"
  | "syncing"
  | "synced"
  | "failed";

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function PricePredictionCard(props: {
  pairId: string;
  label: string;
  disabled?: boolean;
  stakeAmount?: string;
  onStakeAmountChange?: (value: string) => void;
  showStakeInput?: boolean;
}) {
  const { t } = useI18n();
  const [internalStakeAmount, setInternalStakeAmount] = useState("10");
  const [submissionState, setSubmissionState] =
    useState<PredictionSubmissionState>("idle");
  const [tonConnectUI] = useTonConnectUI();
  const { toast } = useToast();
  const {
    getPrediction,
    submitPrediction,
    syncPredictionTransaction,
    settlePredictionRound,
    walletAddress,
  } = useCommunityProfile();
  const stakeAmount = props.stakeAmount ?? internalStakeAmount;
  const setStakeAmount = props.onStakeAmountChange ?? setInternalStakeAmount;
  const prediction = getPrediction(props.pairId);
  const round = prediction?.round;
  const bets = prediction?.bets ?? [];
  const confirmedBets = useMemo(
    () => bets.filter((bet) => bet.sourceKind !== "pending"),
    [bets],
  );
  const pendingBets = useMemo(
    () => bets.filter((bet) => bet.sourceKind === "pending"),
    [bets],
  );
  const confirmedUpVoters = useMemo(
    () =>
      Array.from(
        new Set(
          confirmedBets
            .filter((bet) => bet.direction === "up")
            .map((bet) => bet.walletAddress),
        ),
      ),
    [confirmedBets],
  );
  const confirmedDownVoters = useMemo(
    () =>
      Array.from(
        new Set(
          confirmedBets
            .filter((bet) => bet.direction === "down")
            .map((bet) => bet.walletAddress),
        ),
      ),
    [confirmedBets],
  );
  const upVotes = confirmedUpVoters.length;
  const downVotes = confirmedDownVoters.length;
  const totalVotes = upVotes + downVotes;
  const upShare =
    totalVotes === 0 ? 0 : Math.round((upVotes / totalVotes) * 100);
  const downShare = totalVotes === 0 ? 0 : 100 - upShare;
  const upPool = confirmedBets
    .filter((bet) => bet.direction === "up")
    .reduce((sum, bet) => sum + bet.amount, 0);
  const downPool = confirmedBets
    .filter((bet) => bet.direction === "down")
    .reduce((sum, bet) => sum + bet.amount, 0);
  const totalPool = upPool + downPool;
  const topBets = useMemo(
    () => [...confirmedBets].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [confirmedBets],
  );
  const topPayouts = (prediction?.payoutPreviews ?? []).slice(0, 5);
  const myBets = useMemo(
    () => confirmedBets.filter((bet) => bet.walletAddress === walletAddress),
    [confirmedBets, walletAddress],
  );
  const myPendingBets = useMemo(
    () => pendingBets.filter((bet) => bet.walletAddress === walletAddress),
    [pendingBets, walletAddress],
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
  const latestPendingBet = myPendingBets[0] ?? null;
  const hasPendingConfirmation = myPendingBets.length > 0;
  const numericStake = Number(stakeAmount);
  const isStakeValid =
    stakeAmount.trim().length > 0 &&
    validateFloatValue(stakeAmount, 2) &&
    Number.isFinite(numericStake) &&
    numericStake > 0;
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
  const previewUpPayout = isStakeValid
    ? (numericStake / Math.max(upPool + numericStake, numericStake)) *
      (totalPool + numericStake)
    : 0;
  const previewDownPayout = isStakeValid
    ? (numericStake / Math.max(downPool + numericStake, numericStake)) *
      (totalPool + numericStake)
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
  const showStakeInput = props.showStakeInput ?? true;
  const isDisabled = props.disabled || !walletAddress;
  const upOdds = upPool > 0 ? totalPool / upPool : 0;
  const downOdds = downPool > 0 ? totalPool / downPool : 0;
  const isRoundOpen = round?.status === "open";
  const isRoundClosed = round?.status === "closed";
  const isRoundSettled = round?.status === "settled";
  const predictionEntryAddress = getPredictionEntryAddress();
  const isTokenPrediction = props.pairId.startsWith("prediction:");
  const canAutoReopenRound = isTokenPrediction && (!round || isRoundSettled);
  const canPlacePrediction =
    !isDisabled &&
    isStakeValid &&
    submissionState !== "sending" &&
    submissionState !== "waiting_confirmation" &&
    submissionState !== "syncing" &&
    !hasPendingConfirmation &&
    !!predictionEntryAddress &&
    (isRoundOpen || canAutoReopenRound);
  const predictionUnavailableReason = !walletAddress
    ? "wallet"
    : !predictionEntryAddress
      ? "entry"
      : !isStakeValid
        ? "stake"
        : hasPendingConfirmation
          ? "pending"
          : !(isRoundOpen || canAutoReopenRound)
            ? "round"
            : submissionState === "sending" ||
                submissionState === "waiting_confirmation" ||
                submissionState === "syncing"
              ? "submitting"
              : null;
  const timeLeftMs = round
    ? Math.max(new Date(round.closesAt).getTime() - Date.now(), 0)
    : 0;
  const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
  const previewUpPool = upPool + (isStakeValid ? numericStake : 0);
  const previewDownPool = downPool + (isStakeValid ? numericStake : 0);
  const previewTotalPool = totalPool + (isStakeValid ? numericStake : 0);
  const displayedUpShare =
    previewTotalPool > 0
      ? Math.round((previewUpPool / previewTotalPool) * 100)
      : upShare;
  const displayedDownShare =
    previewTotalPool > 0
      ? Math.round((previewDownPool / previewTotalPool) * 100)
      : downShare;
  const displayedUpOdds =
    isStakeValid && previewUpPool > 0
      ? previewTotalPool / previewUpPool
      : upOdds;
  const displayedDownOdds =
    isStakeValid && previewDownPool > 0
      ? previewTotalPool / previewDownPool
      : downOdds;
  const upSplitWidth = totalPool > 0 ? upShare : 50;
  const downSplitWidth = totalPool > 0 ? downShare : 50;
  const parsedMarket = parsePredictionTokenMarketId(props.pairId);
  const [tokenLabelPart, timeframeLabelPart] = props.label
    .split("•")
    .map((part) => part.trim());
  const marketTokenLabel = tokenLabelPart || props.label;
  const marketTimeframeLabel =
    parsedMarket?.timeframe ?? timeframeLabelPart ?? t("prediction.pending");
  const currentMarketSplit = `${upSplitWidth}% / ${downSplitWidth}%`;
  const statusText =
    submissionState === "sending"
      ? t("prediction.txSending")
      : submissionState === "waiting_confirmation"
        ? t("prediction.txWaitingConfirmation")
        : submissionState === "syncing"
          ? t("prediction.txSyncing")
          : submissionState === "synced"
            ? t("prediction.txSynced")
            : hasPendingConfirmation
              ? t("prediction.txPendingRefresh")
              : null;

  const placePrediction = async (direction: "up" | "down") => {
    if (!walletAddress) {
      tonConnectUI.openModal();
      toast({
        title: t("swap.button.connect"),
        description: t("prediction.connectToVote"),
      });
      return;
    }

    if (!predictionEntryAddress) {
      toast({
        title: t("prediction.txFailed"),
        description: t("prediction.txUnexpectedFailure"),
      });
      return;
    }

    if (!isStakeValid) {
      toast({
        title: t("prediction.stakeAmount"),
        description: t("prediction.enterStakeHint"),
      });
      return;
    }

    if (hasPendingConfirmation) {
      toast({
        title: t("prediction.txPendingTitle"),
        description: t("prediction.txPendingBody", {
          amount: numericStake.toFixed(2),
        }),
      });
      return;
    }

    if (isRoundClosed) {
      toast({
        title: t("prediction.awaitingSettlement"),
        description: t("prediction.settleBody"),
      });
      return;
    }

    if (!(isRoundOpen || canAutoReopenRound)) {
      toast({
        title: t("prediction.pending"),
        description: t("prediction.roundPendingBody"),
      });
      return;
    }

    if (
      submissionState === "sending" ||
      submissionState === "waiting_confirmation" ||
      submissionState === "syncing"
    ) {
      return;
    }

    const predictionInput = {
      pairId: props.pairId,
      label: props.label,
      direction,
      amount: numericStake,
    } as const;

    try {
      setSubmissionState("sending");
      let message;

      try {
        message = buildPredictionTransferMessage({
          pairId: props.pairId,
          label: props.label,
          direction,
          amountTon: numericStake,
        });
      } catch (error) {
        setSubmissionState("failed");
        toast({
          title: t("prediction.txFailed"),
          description:
            error instanceof Error && error.message
              ? error.message
              : t("prediction.txUnexpectedFailure"),
        });
        return;
      }

      let messageHash: string | undefined;

      try {
        const txResult = await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
          messages: [message],
        });

        messageHash = getMessageHashFromSignedBoc(txResult.boc) ?? undefined;
      } catch {
        setSubmissionState("failed");
        toast({
          title: t("prediction.txFailed"),
          description: t("prediction.txFailedBody"),
        });
        return;
      }

      if (!messageHash) {
        setSubmissionState("failed");
        toast({
          title: t("prediction.txFailed"),
          description: t("prediction.txHashMissing"),
        });
        return;
      }

      setSubmissionState("waiting_confirmation");

      const submitted = await submitPrediction({
        ...predictionInput,
        txHash: messageHash,
      });

      if (!submitted.ok) {
        setSubmissionState("failed");
        toast({
          title: t("prediction.txFailed"),
          description: t("prediction.txPendingRegistrationFailed"),
        });
        return;
      }

      let syncStatus: "pending" | "confirmed" | "failed" | "missing" =
        submitted.syncStatus;

      if (syncStatus !== "confirmed") {
        for (let attempt = 0; attempt < 15; attempt += 1) {
          await wait(2000);
          try {
            const syncResult = await syncPredictionTransaction({
              txHash: messageHash,
            });
            syncStatus = syncResult.syncStatus;
          } catch {
            syncStatus = "pending";
          }

          if (syncStatus === "confirmed") {
            break;
          }
        }
      }

      if (syncStatus === "confirmed") {
        setSubmissionState("syncing");
        try {
          await syncPredictionTransaction({
            txHash: messageHash,
          });
        } catch {
          setSubmissionState("failed");
          toast({
            title: t("prediction.txFailed"),
            description: t("prediction.txSyncFailed"),
          });
          return;
        }
        setSubmissionState("synced");
        toast({
          title: t("prediction.txSyncedTitle"),
          description: t("prediction.txSyncedBody", {
            amount: numericStake.toFixed(2),
          }),
        });
        setStakeAmount("10");
        window.setTimeout(() => setSubmissionState("idle"), 1800);
        return;
      }

      setSubmissionState("waiting_confirmation");
      toast({
        title: t("prediction.txPendingTitle"),
        description: t("prediction.txPendingBody", {
          amount: numericStake.toFixed(2),
        }),
      });
    } catch {
      setSubmissionState("failed");
      toast({
        title: t("prediction.txFailed"),
        description: t("prediction.txUnexpectedFailure"),
      });
    }
  };

  return (
    <Card className="overflow-hidden rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.96))] text-slate-900 shadow-[0_32px_90px_-52px_rgba(15,23,42,0.14)]">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-slate-950">
              {t("prediction.title")}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {t("prediction.subtitle", { label: props.label })}
            </CardDescription>
          </div>
          <Badge className="border-sky-100 bg-white text-slate-700">
            {round?.status === "settled"
              ? t("prediction.settled")
              : round?.status === "closed"
                ? t("prediction.awaitingSettlement")
                : `${totalVotes} votes`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-[26px] border border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.95))] p-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("prediction.marketContract")}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {marketTokenLabel}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {marketTimeframeLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("prediction.roundStatus")}
            </p>
            <p className="mt-2 text-lg font-semibold capitalize text-slate-950">
              {round
                ? t(
                    `prediction.roundStatus${round.status.charAt(0).toUpperCase()}${round.status.slice(1)}`,
                  )
                : t("prediction.pending")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {round?.status === "settled"
                ? t("prediction.awaitingSettlement")
                : t("prediction.marketLiquidityBody")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("prediction.timeLeft")}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {round && isRoundOpen
                ? `${hoursLeft}h ${minutesLeft}m`
                : round
                  ? t("prediction.closed")
                  : t("prediction.pending")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t("prediction.marketClockBody")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("prediction.totalPool")}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {totalPool.toFixed(2)} TON
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t("prediction.marketLiquidityBody")}
            </p>
          </div>
        </div>
        {round ? (
          <div className="grid gap-3 rounded-2xl border border-sky-100 bg-white p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("prediction.winner")}
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {round.settlementDirection
                  ? round.settlementDirection === "up"
                    ? t("prediction.up")
                    : t("prediction.down")
                  : t("prediction.pending")}
              </p>
            </div>
          </div>
        ) : null}
        <div className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,255,0.94))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {t("prediction.crowdSplit")}
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-semibold tracking-tight text-slate-950">
                  {currentMarketSplit}
                </span>
                <span className="text-sm text-slate-500">
                  {t("prediction.marketSplitBody")}
                </span>
              </div>
            </div>
            <div className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
              {t("prediction.chooseDirection")}
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="flex h-full w-full">
              <div
                className="h-full bg-[linear-gradient(90deg,#34d399,#22c55e)]"
                style={{ width: `${upSplitWidth}%` }}
              />
              <div
                className="h-full bg-[linear-gradient(90deg,#fb7185,#f43f5e)]"
                style={{ width: `${downSplitWidth}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              disabled={predictionUnavailableReason === "submitting"}
              className="h-auto min-h-[168px] flex-col items-start rounded-[28px] border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(220,252,231,0.86))] p-5 text-left text-slate-900 hover:bg-emerald-100"
              onClick={() => void placePrediction("up")}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-base font-semibold">
                  <TrendingUp className="text-emerald-600" />
                  {t("prediction.bullish")}
                </span>
                <Badge className="border-emerald-200 bg-white/80 text-emerald-700">
                  {displayedUpOdds > 0 ? `${displayedUpOdds.toFixed(2)}x` : "-"}
                </Badge>
              </div>
              <div className="mt-5 flex items-end gap-3">
                <span className="text-4xl font-semibold tracking-tight text-slate-950">
                  {displayedUpShare}%
                </span>
                <span className="pb-1 text-sm font-medium text-slate-500">
                  {t("prediction.upsideBody")}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {isStakeValid
                  ? t("prediction.previewReturn", {
                      amount: previewUpPayout.toFixed(2),
                    })
                  : t("prediction.enterStakeHint")}
              </p>
              <div className="mt-5 flex w-full items-center justify-between text-xs font-medium text-slate-500">
                <span>
                  {isStakeValid
                    ? t("prediction.stakeLine", {
                        amount: numericStake.toFixed(2),
                      })
                    : t("prediction.stakeAmount")}
                </span>
                <span>
                  {displayedUpOdds > 0 ? `${displayedUpOdds.toFixed(2)}x` : "-"}
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              disabled={predictionUnavailableReason === "submitting"}
              className="h-auto min-h-[168px] flex-col items-start rounded-[28px] border-rose-200 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,228,230,0.88))] p-5 text-left text-slate-900 hover:bg-rose-100"
              onClick={() => void placePrediction("down")}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-base font-semibold">
                  <TrendingDown className="text-rose-600" />
                  {t("prediction.bearish")}
                </span>
                <Badge className="border-rose-200 bg-white/80 text-rose-700">
                  {displayedDownOdds > 0
                    ? `${displayedDownOdds.toFixed(2)}x`
                    : "-"}
                </Badge>
              </div>
              <div className="mt-5 flex items-end gap-3">
                <span className="text-4xl font-semibold tracking-tight text-slate-950">
                  {displayedDownShare}%
                </span>
                <span className="pb-1 text-sm font-medium text-slate-500">
                  {t("prediction.downsideBody")}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {isStakeValid
                  ? t("prediction.previewReturn", {
                      amount: previewDownPayout.toFixed(2),
                    })
                  : t("prediction.enterStakeHint")}
              </p>
              <div className="mt-5 flex w-full items-center justify-between text-xs font-medium text-slate-500">
                <span>
                  {isStakeValid
                    ? t("prediction.stakeLine", {
                        amount: numericStake.toFixed(2),
                      })
                    : t("prediction.stakeAmount")}
                </span>
                <span>
                  {displayedDownOdds > 0
                    ? `${displayedDownOdds.toFixed(2)}x`
                    : "-"}
                </span>
              </div>
            </Button>
          </div>
        </div>
        {walletAddress ? (
          <div className="grid gap-3 rounded-2xl border border-sky-100 bg-[linear-gradient(135deg,#eef6ff,#f6f2ff)] p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("prediction.yourSide")}
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {hasPendingConfirmation
                  ? t("prediction.pendingConfirmation")
                  : myDirection
                    ? myDirection === "up"
                      ? t("prediction.bullish")
                      : t("prediction.bearish")
                    : t("prediction.noPosition")}
              </p>
              <p className="text-sm text-slate-600">
                {hasPendingConfirmation && latestPendingBet
                  ? t("prediction.pendingStakeLine", {
                      amount: latestPendingBet.amount.toFixed(2),
                    })
                  : myStake > 0
                    ? t("prediction.pointsCommitted", {
                        amount: myStake.toFixed(2),
                      })
                    : t("prediction.reputationHint")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("prediction.potentialPayout")}
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {hasPendingConfirmation && latestPendingBet
                  ? t("prediction.pendingPayout")
                  : myPotentialPayout > 0
                    ? `${myPotentialPayout.toFixed(2)} TON`
                    : isStakeValid
                      ? t("prediction.previewPayoutSplit", {
                          up: previewUpPayout.toFixed(2),
                          down: previewDownPayout.toFixed(2),
                        })
                      : "-"}
              </p>
              <p className="text-sm text-slate-600">
                {hasPendingConfirmation
                  ? t("prediction.txWaitingConfirmation")
                  : myPotentialPayout > 0
                    ? t("prediction.potentialPreview")
                    : isStakeValid
                      ? t("prediction.potentialPreviewBeforeBet")
                      : t("prediction.potentialPreview")}
              </p>
            </div>
          </div>
        ) : null}
        {showStakeInput ? (
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor={`${props.pairId}-stake`}
            >
              {t("prediction.stakeAmount")}
            </label>
            <Input
              className="h-13 rounded-2xl border-sky-100 bg-white text-slate-900 placeholder:text-slate-400"
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
              placeholder={t("prediction.stakePlaceholder")}
            />
            <p className="text-xs text-slate-500">
              {t("prediction.payoutHint")}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">{t("prediction.payoutHint")}</p>
        )}
        {isRoundClosed ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {t("prediction.settleTitle")}
                </h4>
                <p className="text-sm text-slate-600">
                  {t("prediction.settleBody")}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="border-emerald-200 text-slate-900 hover:bg-emerald-100"
                onClick={() =>
                  void settlePredictionRound({
                    pairId: props.pairId,
                    direction: "up",
                  })
                }
              >
                {t("prediction.settleUp")}
              </Button>
              <Button
                variant="outline"
                className="border-rose-200 text-slate-900 hover:bg-rose-100"
                onClick={() =>
                  void settlePredictionRound({
                    pairId: props.pairId,
                    direction: "down",
                  })
                }
              >
                {t("prediction.settleDown")}
              </Button>
            </div>
          </div>
        ) : null}
        <div className="rounded-2xl border border-sky-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-900">
              {t("prediction.history")}
            </h4>
            <Badge className="border-sky-100 bg-sky-50 text-slate-700">
              {t("prediction.betsCount", { count: confirmedBets.length })}
            </Badge>
          </div>
          <div className="space-y-2">
            {topBets.length === 0 ? (
              <p className="text-sm text-slate-500">{t("prediction.noBets")}</p>
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
                    {bet.direction === "up"
                      ? t("prediction.up")
                      : t("prediction.down")}
                  </Badge>
                  <span className="font-semibold">
                    {bet.amount.toFixed(2)} TON
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
                {t("prediction.winnersPreview")}
              </h4>
              <Badge variant="outline">
                {t("prediction.winnersCount", { count: topPayouts.length })}
              </Badge>
            </div>
            <div className="space-y-2">
              {topPayouts.length === 0 ? (
                <p className="text-sm text-slate-600">
                  {t("prediction.noWinningBets")}
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
                        {t("prediction.stakeLine", {
                          amount: item.totalStake.toFixed(2),
                        })}
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-700">
                      {item.estimatedPayout.toFixed(2)} TON
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
                  {t("prediction.latestSettlement")}
                </h4>
                <p className="text-sm text-slate-600">
                  {t("prediction.lastResolvedView", { label: props.label })}
                </p>
              </div>
              <Badge variant="outline">
                {latestSettlement.settlementDirection === "up"
                  ? t("prediction.upWon")
                  : t("prediction.downWon")}
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("prediction.settledAt")}
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(latestSettlement.settledAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("prediction.totalRoundPool")}
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {latestSettlement.totalPool.toFixed(2)} TON
                </p>
              </div>
            </div>
          </div>
        ) : null}
        <p className="text-sm text-slate-600">{t("prediction.disclaimer")}</p>
        {!walletAddress ? (
          <p className="text-sm text-slate-500">
            {t("prediction.connectToVote")}
          </p>
        ) : !predictionEntryAddress ? (
          <p className="text-sm text-amber-600">
            {t("prediction.treasuryMissing")}
          </p>
        ) : hasPendingConfirmation || statusText ? (
          <p className="text-sm text-sky-700">{statusText}</p>
        ) : !isRoundOpen ? (
          <p className="text-sm text-slate-500">
            {t("prediction.openRoundEnded")}
          </p>
        ) : !isStakeValid ? (
          <p className="text-sm text-slate-500">
            {t("prediction.validStakeHint")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
