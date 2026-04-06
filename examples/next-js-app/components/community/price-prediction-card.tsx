"use client";

import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useEffect, useMemo, useState } from "react";
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
import { fetchInternalApi } from "@/lib/vercel-internal-fetch";
import { useCommunityProfile } from "./community-provider";

type PredictionSubmissionState =
  | "idle"
  | "sending"
  | "waiting_confirmation"
  | "syncing"
  | "synced"
  | "failed";

type PredictionClaimState =
  | "idle"
  | "requesting"
  | "waiting_confirmation"
  | "syncing"
  | "claimed"
  | "failed";

type PredictionOperatorAction = "lock" | "resolve";

type PredictionOperatorState =
  | "idle"
  | "requesting"
  | "waiting_confirmation"
  | "syncing"
  | "completed"
  | "failed";

type ForecastTonConnectMessage = {
  address: string;
  amount: string;
  payload?: string;
  stateInit?: string;
};

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

type ForecastViewerState = {
  walletAddress: string;
  hasPosition: boolean;
  yesStakeTon: number;
  noStakeTon: number;
  totalStakeTon: number;
  claimed: boolean;
  claimable: boolean;
  winningSide: "up" | "down" | "draw" | null;
  isResolver: boolean;
  canLock: boolean;
  canResolve: boolean;
};

type ForecastIntentResponse = {
  ok: boolean;
  reason?: string;
  market?: ForecastMarketSummary | null;
  viewer?: ForecastViewerState | null;
  resolution?: {
    finalPriceE9: number;
    finalPriceUsd?: number | null;
    resolvedAt: number;
  };
  tonConnect?: {
    validUntil: number;
    messages: ForecastTonConnectMessage[];
  };
  syncCursor?: string;
};

type ForecastSyncResponse = {
  result: boolean;
  syncStatus: "pending" | "confirmed" | "missing";
  market?: ForecastMarketSummary | null;
  viewer?: ForecastViewerState | null;
};

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetchInternalApi(url, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error || `Request failed: ${url}`);
  }

  return (await response.json()) as T;
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
  const [claimState, setClaimState] = useState<PredictionClaimState>("idle");
  const [operatorState, setOperatorState] =
    useState<PredictionOperatorState>("idle");
  const [operatorAction, setOperatorAction] =
    useState<PredictionOperatorAction | null>(null);
  const [forecastViewer, setForecastViewer] =
    useState<ForecastViewerState | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const tonConnectFromAddress = useTonAddress(false);
  const { toast } = useToast();
  const {
    getPrediction,
    submitPrediction,
    syncPredictionTransaction,
    walletAddress,
    refresh,
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
  const myPayoutPreview = useMemo(() => {
    if (!walletAddress) {
      return null;
    }

    return (
      prediction?.payoutPreviews.find(
        (item) => item.walletAddress === walletAddress,
      ) ?? null
    );
  }, [prediction?.payoutPreviews, walletAddress]);
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
  const parsedMarket = parsePredictionTokenMarketId(props.pairId);
  const isRoundOpen = round?.status === "open";
  const isRoundClosed = round?.status === "closed";
  const isRoundSettled = round?.status === "settled";
  const predictionEntryAddress = getPredictionEntryAddress();
  const isTokenPrediction = props.pairId.startsWith("prediction:");
  const canAutoReopenRound = isTokenPrediction && (!round || isRoundSettled);
  const isClaimBusy =
    claimState === "requesting" ||
    claimState === "waiting_confirmation" ||
    claimState === "syncing";
  const isOperatorBusy =
    operatorState === "requesting" ||
    operatorState === "waiting_confirmation" ||
    operatorState === "syncing";
  const hasPredictionTransport = isTokenPrediction
    ? Boolean(parsedMarket)
    : Boolean(predictionEntryAddress);
  const canPlacePrediction =
    !isDisabled &&
    isStakeValid &&
    submissionState !== "sending" &&
    submissionState !== "waiting_confirmation" &&
    submissionState !== "syncing" &&
    !hasPendingConfirmation &&
    hasPredictionTransport &&
    (isRoundOpen || canAutoReopenRound);
  const predictionUnavailableReason = !walletAddress
    ? "wallet"
    : !hasPredictionTransport
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
  useEffect(() => {
    setForecastViewer(null);
    setClaimState("idle");
    setOperatorState("idle");
    setOperatorAction(null);
  }, [props.pairId, round?.id, walletAddress]);
  const [clockNow, setClockNow] = useState(() => Date.now());
  useEffect(() => {
    const timerId = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);
  const timeLeftMs = round
    ? Math.max(new Date(round.closesAt).getTime() - clockNow, 0)
    : 0;
  const roundClosePassed = round
    ? clockNow >= new Date(round.closesAt).getTime()
    : false;
  const countdownLabel = round
    ? formatCountdown(timeLeftMs)
    : t("prediction.pending");
  const nextRoundReadyNow =
    round && !isRoundOpen
      ? clockNow >= new Date(round.closesAt).getTime()
      : false;
  const nextRoundStatusLabel =
    nextRoundReadyNow && canAutoReopenRound
      ? t("prediction.nextRoundReadyNow")
      : isRoundOpen
        ? t("prediction.nextRoundOpensIn", { value: countdownLabel })
        : t("prediction.awaitingSettlement");
  useEffect(() => {
    if (!walletAddress || !round?.id) {
      return;
    }

    if (
      !(
        isRoundClosed ||
        isRoundSettled ||
        hasPendingConfirmation ||
        roundClosePassed ||
        isClaimBusy ||
        isOperatorBusy
      )
    ) {
      return;
    }

    let disposed = false;

    const pollRoundState = async () => {
      try {
        const syncResponse = await requestJson<ForecastSyncResponse>(
          "/api/forecast-markets/sync",
          {
            method: "PUT",
            body: JSON.stringify({
              walletAddress,
              pairId: props.pairId,
              marketAddress: round.id,
            }),
          },
        );

        if (!disposed) {
          setForecastViewer(syncResponse.viewer ?? null);
          await refresh();
        }
      } catch {
        // Keep the existing view and retry on the next tick.
      }
    };

    void pollRoundState();
    const intervalId = window.setInterval(() => {
      void pollRoundState();
    }, 10_000);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [
    hasPendingConfirmation,
    isClaimBusy,
    isOperatorBusy,
    roundClosePassed,
    isRoundClosed,
    isRoundSettled,
    props.pairId,
    refresh,
    round?.id,
    walletAddress,
  ]);
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
  const [tokenLabelPart, timeframeLabelPart] = props.label
    .split("•")
    .map((part) => part.trim());
  const marketTokenLabel = tokenLabelPart || props.label;
  const marketTimeframeLabel =
    parsedMarket?.timeframe ?? timeframeLabelPart ?? t("prediction.pending");
  const currentMarketSplit = `${upSplitWidth}% / ${downSplitWidth}%`;
  const claimStatusText =
    claimState === "requesting"
      ? t("prediction.claimOpeningWallet")
      : claimState === "waiting_confirmation"
        ? t("prediction.claimWaitingConfirmation")
        : claimState === "syncing"
          ? t("prediction.claimSyncing")
          : claimState === "claimed"
            ? t("prediction.claimedStatus")
            : null;
  const operatorStatusText =
    operatorState === "requesting"
      ? operatorAction === "lock"
        ? t("prediction.manualLockOpeningWallet")
        : t("prediction.manualResolveOpeningWallet")
      : operatorState === "waiting_confirmation"
        ? operatorAction === "lock"
          ? t("prediction.manualLockWaitingConfirmation")
          : t("prediction.manualResolveWaitingConfirmation")
        : operatorState === "syncing"
          ? operatorAction === "lock"
            ? t("prediction.manualLockSyncing")
            : t("prediction.manualResolveSyncing")
          : operatorState === "completed"
            ? operatorAction === "lock"
              ? t("prediction.manualLockSynced")
              : t("prediction.manualResolveSynced")
            : null;
  const betStatusText =
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
  const statusText = claimStatusText ?? operatorStatusText ?? betStatusText;
  const winningSideLabel =
    forecastViewer?.winningSide === "up"
      ? t("prediction.up")
      : forecastViewer?.winningSide === "down"
        ? t("prediction.down")
        : forecastViewer?.winningSide === "draw"
          ? t("prediction.draw")
          : t("prediction.pending");
  const showClaimCard =
    Boolean(walletAddress) &&
    isTokenPrediction &&
    isRoundSettled &&
    ((forecastViewer?.hasPosition ?? false) || myStake > 0);
  const showManualSettlementCard =
    Boolean(walletAddress) &&
    isTokenPrediction &&
    Boolean(forecastViewer) &&
    ((forecastViewer?.canLock ?? false) ||
      (forecastViewer?.canResolve ?? false));
  const claimCardTitle =
    forecastViewer == null
      ? t("prediction.claimCheckingTitle")
      : forecastViewer.claimed
        ? t("prediction.claimedTitle")
        : forecastViewer.claimable
          ? t("prediction.claimReadyTitle")
          : t("prediction.claimNoRewardTitle");
  const claimCardBody =
    forecastViewer == null
      ? t("prediction.claimCheckingBody")
      : forecastViewer.claimed
        ? t("prediction.claimedBody")
        : forecastViewer.claimable
          ? t("prediction.claimReadyBody")
          : t("prediction.claimNoRewardBody");
  const claimCardBadgeLabel =
    forecastViewer == null
      ? t("prediction.claimCheckingBadge")
      : forecastViewer.claimed
        ? t("prediction.claimedBadge")
        : forecastViewer.claimable
          ? t("prediction.claimReadyBadge")
          : t("prediction.claimUnavailableBadge");
  const manualSettlementBody =
    forecastViewer?.canLock && forecastViewer?.canResolve
      ? `${t("prediction.manualLockReadyBody")} ${t("prediction.manualResolveReadyBody")}`
      : forecastViewer?.canResolve
        ? t("prediction.manualResolveReadyBody")
        : t("prediction.manualLockReadyBody");
  const manualSettlementBadgeLabel = forecastViewer?.canResolve
    ? t("prediction.resolverBadge")
    : t("prediction.manualLockBadge");

  const placePrediction = async (direction: "up" | "down") => {
    if (!walletAddress) {
      tonConnectUI.openModal();
      toast({
        title: t("swap.button.connect"),
        description: t("prediction.connectToVote"),
      });
      return;
    }

    if (isTokenPrediction) {
      if (!parsedMarket) {
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

      if (
        submissionState === "sending" ||
        submissionState === "waiting_confirmation" ||
        submissionState === "syncing"
      ) {
        return;
      }

      try {
        setSubmissionState("sending");

        const endpointOrder = canAutoReopenRound
          ? (["create", "bet"] as const)
          : (["bet", "create"] as const);
        let intent: ForecastIntentResponse | null = null;

        for (const endpoint of endpointOrder) {
          if (endpoint === "create") {
            const response = await requestJson<ForecastIntentResponse>(
              "/api/forecast-markets/create-intent",
              {
                method: "POST",
                body: JSON.stringify({
                  walletAddress,
                  tokenAddress: parsedMarket.contractAddress,
                  timeframeId: parsedMarket.timeframe,
                  direction,
                  amountTon: numericStake,
                }),
              },
            );

            if (response.ok) {
              intent = response;
              break;
            }

            if (response.reason !== "active_market_exists") {
              continue;
            }
          } else {
            const response = await requestJson<ForecastIntentResponse>(
              "/api/forecast-markets/bet-intent",
              {
                method: "POST",
                body: JSON.stringify({
                  walletAddress,
                  pairId: props.pairId,
                  direction,
                  amountTon: numericStake,
                }),
              },
            );

            if (response.ok) {
              intent = response;
              break;
            }
          }
        }

        if (!intent?.ok || !intent.tonConnect || !intent.market) {
          setSubmissionState("failed");
          toast({
            title: t("prediction.txFailed"),
            description: t("prediction.roundPendingBody"),
          });
          return;
        }

        try {
          await tonConnectUI.sendTransaction({
            validUntil: intent.tonConnect.validUntil,
            ...(tonConnectFromAddress ? { from: tonConnectFromAddress } : {}),
            messages: intent.tonConnect.messages,
          });
        } catch {
          setSubmissionState("failed");
          toast({
            title: t("prediction.txFailed"),
            description: t("prediction.txFailedBody"),
          });
          return;
        }

        setSubmissionState("waiting_confirmation");

        let syncStatus: "pending" | "confirmed" | "missing" = "pending";

        for (let attempt = 0; attempt < 20; attempt += 1) {
          await wait(2500);

          try {
            const syncResponse = await requestJson<ForecastSyncResponse>(
              "/api/forecast-markets/sync",
              {
                method: "PUT",
                body: JSON.stringify({
                  walletAddress,
                  pairId: props.pairId,
                  marketAddress: intent.market.contractAddress,
                  syncCursor: intent.syncCursor,
                }),
              },
            );

            syncStatus = syncResponse.syncStatus;
            setForecastViewer(syncResponse.viewer ?? null);
          } catch {
            syncStatus = "pending";
          }

          if (syncStatus === "confirmed") {
            break;
          }
        }

        if (syncStatus === "confirmed") {
          setSubmissionState("syncing");
          await refresh();
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
        return;
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
          ...(tonConnectFromAddress ? { from: tonConnectFromAddress } : {}),
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

  const claimReward = async () => {
    if (!walletAddress) {
      tonConnectUI.openModal();
      toast({
        title: t("swap.button.connect"),
        description: t("prediction.connectToVote"),
      });
      return;
    }

    if (!round?.id || isClaimBusy) {
      return;
    }

    try {
      setClaimState("requesting");

      const intent = await requestJson<ForecastIntentResponse>(
        "/api/forecast-markets/claim-intent",
        {
          method: "POST",
          body: JSON.stringify({
            walletAddress,
            marketAddress: round.id,
          }),
        },
      );

      setForecastViewer(intent.viewer ?? null);

      if (!intent.ok || !intent.tonConnect || !intent.market) {
        const description =
          intent.reason === "already_claimed"
            ? t("prediction.claimAlreadyClaimed")
            : intent.reason === "position_not_found"
              ? t("prediction.claimPositionMissing")
              : intent.reason === "no_winning_position"
                ? t("prediction.claimNoRewardBody")
                : intent.reason === "market_not_resolved"
                  ? t("prediction.awaitingSettlement")
                  : t("prediction.claimFailedBody");

        setClaimState(
          intent.reason === "already_claimed" ? "claimed" : "failed",
        );
        toast({
          title:
            intent.reason === "already_claimed"
              ? t("prediction.claimedTitle")
              : t("prediction.claimFailedTitle"),
          description,
        });
        return;
      }

      try {
        await tonConnectUI.sendTransaction({
          validUntil: intent.tonConnect.validUntil,
          ...(tonConnectFromAddress ? { from: tonConnectFromAddress } : {}),
          messages: intent.tonConnect.messages,
        });
      } catch {
        setClaimState("failed");
        toast({
          title: t("prediction.claimFailedTitle"),
          description: t("prediction.txFailedBody"),
        });
        return;
      }

      setClaimState("waiting_confirmation");
      let viewer = intent.viewer ?? null;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        await wait(2500);

        try {
          const syncResponse = await requestJson<ForecastSyncResponse>(
            "/api/forecast-markets/sync",
            {
              method: "PUT",
              body: JSON.stringify({
                walletAddress,
                pairId: props.pairId,
                marketAddress: round.id,
              }),
            },
          );

          viewer = syncResponse.viewer ?? viewer;
          setForecastViewer(viewer);
        } catch {
          // Keep waiting for the next sync tick.
        }

        if (viewer?.claimed) {
          break;
        }
      }

      if (viewer?.claimed) {
        setClaimState("syncing");
        await refresh();
        setClaimState("claimed");
        toast({
          title: t("prediction.claimedTitle"),
          description: t("prediction.claimedBody"),
        });
        return;
      }

      setClaimState("waiting_confirmation");
      toast({
        title: t("prediction.claimSentTitle"),
        description: t("prediction.claimSentBody"),
      });
    } catch (error) {
      setClaimState("failed");
      toast({
        title: t("prediction.claimFailedTitle"),
        description:
          error instanceof Error && error.message
            ? error.message
            : t("prediction.claimFailedBody"),
      });
    }
  };

  const settleMarketManually = async (action: PredictionOperatorAction) => {
    if (!walletAddress) {
      tonConnectUI.openModal();
      toast({
        title: t("swap.button.connect"),
        description: t("prediction.connectToVote"),
      });
      return;
    }

    if (!round?.id || isOperatorBusy) {
      return;
    }

    try {
      setOperatorAction(action);
      setOperatorState("requesting");

      const intent = await requestJson<ForecastIntentResponse>(
        action === "lock"
          ? "/api/forecast-markets/lock-intent"
          : "/api/forecast-markets/resolve-intent",
        {
          method: "POST",
          body: JSON.stringify({
            walletAddress,
            marketAddress: round.id,
          }),
        },
      );

      setForecastViewer(intent.viewer ?? null);

      if (!intent.ok || !intent.tonConnect || !intent.market) {
        const description =
          action === "lock"
            ? intent.reason === "market_still_open"
              ? t("prediction.manualSettlementNotReady")
              : t("prediction.manualSettlementAlreadyHandled")
            : intent.reason === "resolver_only"
              ? t("prediction.operatorResolverOnly")
              : intent.reason === "price_unavailable"
                ? t("prediction.operatorPriceUnavailable")
                : intent.reason === "market_still_open"
                  ? t("prediction.manualSettlementNotReady")
                  : t("prediction.manualSettlementAlreadyHandled");

        setOperatorState("failed");
        toast({
          title:
            action === "lock"
              ? t("prediction.manualLockFailedTitle")
              : t("prediction.manualResolveFailedTitle"),
          description,
        });
        return;
      }

      try {
        await tonConnectUI.sendTransaction({
          validUntil: intent.tonConnect.validUntil,
          ...(tonConnectFromAddress ? { from: tonConnectFromAddress } : {}),
          messages: intent.tonConnect.messages,
        });
      } catch {
        setOperatorState("failed");
        toast({
          title:
            action === "lock"
              ? t("prediction.manualLockFailedTitle")
              : t("prediction.manualResolveFailedTitle"),
          description: t("prediction.txFailedBody"),
        });
        return;
      }

      setOperatorState("waiting_confirmation");
      let marketStatus = intent.market.status;
      let viewer = intent.viewer ?? null;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        await wait(2500);

        try {
          const syncResponse = await requestJson<ForecastSyncResponse>(
            "/api/forecast-markets/sync",
            {
              method: "PUT",
              body: JSON.stringify({
                walletAddress,
                pairId: props.pairId,
                marketAddress: round.id,
              }),
            },
          );

          marketStatus = syncResponse.market?.status ?? marketStatus;
          viewer = syncResponse.viewer ?? viewer;
          setForecastViewer(viewer);
        } catch {
          // Keep polling for the next confirmation tick.
        }

        const settled =
          marketStatus === "resolved_yes" ||
          marketStatus === "resolved_no" ||
          marketStatus === "resolved_draw";
        const completed = action === "lock" ? marketStatus !== "open" : settled;

        if (completed) {
          break;
        }
      }

      const settled =
        marketStatus === "resolved_yes" ||
        marketStatus === "resolved_no" ||
        marketStatus === "resolved_draw";
      const completed = action === "lock" ? marketStatus !== "open" : settled;

      if (completed) {
        setOperatorState("syncing");
        await refresh();
        setOperatorState("completed");
        toast({
          title:
            action === "lock"
              ? t("prediction.manualLockDoneTitle")
              : t("prediction.manualResolveDoneTitle"),
          description:
            action === "lock"
              ? t("prediction.manualLockDoneBody")
              : t("prediction.manualResolveDoneBody"),
        });
        window.setTimeout(() => {
          setOperatorState("idle");
          setOperatorAction(null);
        }, 1800);
        return;
      }

      setOperatorState("waiting_confirmation");
      toast({
        title:
          action === "lock"
            ? t("prediction.manualLockSentTitle")
            : t("prediction.manualResolveSentTitle"),
        description:
          action === "lock"
            ? t("prediction.manualLockSentBody")
            : t("prediction.manualResolveSentBody"),
      });
    } catch (error) {
      setOperatorState("failed");
      toast({
        title:
          action === "lock"
            ? t("prediction.manualLockFailedTitle")
            : t("prediction.manualResolveFailedTitle"),
        description:
          error instanceof Error && error.message
            ? error.message
            : action === "lock"
              ? t("prediction.manualLockFailedBody")
              : t("prediction.manualResolveFailedBody"),
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
              {round
                ? isRoundOpen
                  ? countdownLabel
                  : nextRoundReadyNow
                    ? t("prediction.nextRoundReadyNow")
                    : t("prediction.closed")
                : t("prediction.pending")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {isRoundOpen
                ? t("prediction.roundClosesBody")
                : t("prediction.nextRoundBody")}
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
          <div className="grid gap-3 rounded-2xl border border-sky-100 bg-white p-4 sm:grid-cols-2">
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
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("prediction.nextRound")}
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {nextRoundStatusLabel}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {isRoundOpen
                  ? t("prediction.nextRoundOpensIn", {
                      value: countdownLabel,
                    })
                  : canAutoReopenRound
                    ? t("prediction.nextRoundBody")
                    : t("prediction.autoResolveBody")}
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {t("prediction.autoResolveTitle")}
                </h4>
                <p className="text-sm text-slate-600">
                  {t("prediction.autoResolveBody")}
                </p>
              </div>
              <Badge className="border-amber-200 bg-white text-amber-700">
                {t("prediction.awaitingSettlement")}
              </Badge>
            </div>
          </div>
        ) : null}
        {showManualSettlementCard ? (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {t("prediction.manualSettlementTitle")}
                </h4>
                <p className="text-sm text-slate-600">{manualSettlementBody}</p>
              </div>
              <Badge variant="outline">{manualSettlementBadgeLabel}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {forecastViewer?.canLock ? (
                <Button
                  variant="outline"
                  className="rounded-full border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                  disabled={isOperatorBusy}
                  onClick={() => void settleMarketManually("lock")}
                >
                  {operatorAction === "lock" && isOperatorBusy
                    ? t("prediction.manualLockButton")
                    : t("prediction.manualLockButton")}
                </Button>
              ) : null}
              {forecastViewer?.canResolve ? (
                <Button
                  className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
                  disabled={isOperatorBusy}
                  onClick={() => void settleMarketManually("resolve")}
                >
                  {operatorAction === "resolve" && isOperatorBusy
                    ? t("prediction.manualResolveButton")
                    : t("prediction.manualResolveButton")}
                </Button>
              ) : null}
              <p className="text-xs text-slate-500">
                {t("prediction.manualSettlementHint")}
              </p>
            </div>
          </div>
        ) : null}
        {showClaimCard ? (
          <div
            className={
              forecastViewer?.claimed
                ? "rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4"
                : forecastViewer?.claimable
                  ? "rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4"
                  : "rounded-2xl border border-slate-200 bg-slate-50 p-4"
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {claimCardTitle}
                </h4>
                <p className="text-sm text-slate-600">{claimCardBody}</p>
              </div>
              <Badge variant="outline">{claimCardBadgeLabel}</Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("prediction.potentialPayout")}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {myPayoutPreview
                    ? `${myPayoutPreview.estimatedPayout.toFixed(2)} TON`
                    : forecastViewer
                      ? t("prediction.stakeLine", {
                          amount: forecastViewer.totalStakeTon.toFixed(2),
                        })
                      : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("prediction.winner")}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {winningSideLabel}
                </p>
              </div>
            </div>
            {forecastViewer?.claimable ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
                  disabled={isClaimBusy}
                  onClick={() => void claimReward()}
                >
                  {isClaimBusy
                    ? t("prediction.claimInProgress")
                    : t("prediction.claimButton")}
                </Button>
                <p className="text-xs text-slate-500">
                  {t("prediction.claimActionHint")}
                </p>
              </div>
            ) : null}
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
              <div>
                <h4 className="text-sm font-semibold text-slate-800">
                  {t("prediction.winnersPreview")}
                </h4>
                <p className="text-sm text-slate-600">
                  {t("prediction.autoPayoutBody")}
                </p>
              </div>
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
        ) : !hasPredictionTransport ? (
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
