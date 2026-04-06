"use client";

import { Address, beginCell, toNano } from "@ton/core";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { CalendarCheck2, Gem, Sparkles, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { useToast } from "@/hooks/use-toast";
import {
  buildCheckInTransferComment,
  CHECK_IN_CONFIRM_TON_AMOUNT,
  getCheckInTreasuryAddress,
} from "@/lib/check-in-config";
import { getMessageHashFromSignedBoc } from "@/lib/ton-message-hash";
import { useCommunityProfile } from "./community-provider";

type CheckInUiState =
  | "idle"
  | "sending"
  | "waiting_confirmation"
  | "syncing"
  | "synced"
  | "failed";

const CHECK_IN_SYNC_ATTEMPTS = 12;
const CHECK_IN_SYNC_DELAY_MS = 2500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWalletKey(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    return Address.parse(value).toString();
  } catch {
    return value;
  }
}

export function DailyCheckInCard() {
  const { t } = useI18n();
  const {
    profile,
    rewardLedger,
    checkInEvents,
    checkIn,
    syncCheckInTransaction,
  } = useCommunityProfile();
  const [tonConnectUI] = useTonConnectUI();
  const tonConnectFromAddress = useTonAddress(false);
  const { toast } = useToast();
  const [status, setStatus] = useState<CheckInUiState>("idle");
  const [statusMessage, setStatusMessage] = useState(
    t("checkin.messageDefault"),
  );

  const todayKey = new Date().toISOString().slice(0, 10);
  const normalizedProfileWallet = normalizeWalletKey(profile?.walletAddress);

  const confirmedToday = useMemo(
    () =>
      checkInEvents.some(
        (event) =>
          normalizeWalletKey(event.walletAddress) === normalizedProfileWallet &&
          event.dateKey === todayKey &&
          event.status === "confirmed",
      ),
    [checkInEvents, normalizedProfileWallet, todayKey],
  );
  const pendingToday = useMemo(
    () =>
      checkInEvents.some(
        (event) =>
          normalizeWalletKey(event.walletAddress) === normalizedProfileWallet &&
          event.dateKey === todayKey &&
          event.status === "pending",
      ),
    [checkInEvents, normalizedProfileWallet, todayKey],
  );

  const lastReward = useMemo(() => {
    return (
      rewardLedger.find(
        (entry) =>
          normalizeWalletKey(entry.walletAddress) === normalizedProfileWallet,
      ) ?? null
    );
  }, [normalizedProfileWallet, rewardLedger]);
  const isBusy =
    status === "sending" ||
    status === "waiting_confirmation" ||
    status === "syncing";
  const isDisabled = confirmedToday || pendingToday || isBusy;
  const statusLabel = confirmedToday
    ? t("checkin.claimed")
    : pendingToday || status === "waiting_confirmation"
      ? t("checkin.waitingConfirmation")
      : t("checkin.ready");
  const statusBadgeClassName = confirmedToday
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : pendingToday || status === "waiting_confirmation"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-sky-200 bg-sky-50 text-sky-700";

  const ctaLabel = confirmedToday
    ? t("checkin.claimed")
    : pendingToday || status === "waiting_confirmation"
      ? t("checkin.waitingConfirmation")
      : status === "syncing"
        ? t("checkin.syncing")
        : status === "sending"
          ? t("checkin.processing")
          : t("checkin.claim");

  useEffect(() => {
    if (!profile || !pendingToday || isBusy) {
      return;
    }

    const pendingEvent = checkInEvents.find(
      (event) =>
        normalizeWalletKey(event.walletAddress) === normalizedProfileWallet &&
        event.dateKey === todayKey &&
        event.status === "pending" &&
        (event.sourceMessageHash || event.chainTxHash),
    );

    const txHash = pendingEvent?.sourceMessageHash ?? pendingEvent?.chainTxHash;

    if (!txHash) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setStatus("waiting_confirmation");
      setStatusMessage(t("checkin.messagePendingConfirmation"));

      for (let attempt = 0; attempt < CHECK_IN_SYNC_ATTEMPTS; attempt += 1) {
        await wait(CHECK_IN_SYNC_DELAY_MS);

        if (cancelled) {
          return;
        }

        setStatus("syncing");
        setStatusMessage(t("checkin.messageSyncing"));

        const syncResult = await syncCheckInTransaction({ txHash });

        if (cancelled) {
          return;
        }

        if (syncResult.syncStatus === "confirmed") {
          setStatus("synced");
          setStatusMessage(t("checkin.messageSuccess", { points: "10" }));
          return;
        }
      }

      if (!cancelled) {
        setStatus("waiting_confirmation");
        setStatusMessage(t("checkin.messagePendingConfirmation"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    checkInEvents,
    isBusy,
    normalizedProfileWallet,
    pendingToday,
    t,
    todayKey,
  ]);

  if (!profile) {
    return null;
  }

  const streakTarget =
    profile.streak >= 30 ? 90 : profile.streak >= 14 ? 30 : 7;
  const streakProgress = Math.min((profile.streak / streakTarget) * 100, 100);
  const nextMilestoneLabel =
    streakTarget === 7
      ? t("checkin.goal7")
      : streakTarget === 30
        ? t("checkin.goal30")
        : t("checkin.goal90");

  return (
    <Card className="surface-panel overflow-hidden border-white/70">
      <CardHeader className="border-b border-sky-100/80 bg-[radial-gradient(circle_at_top_right,rgba(1,128,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
              {t("checkin.eyebrow")}
            </p>
            <CardTitle className="text-2xl text-slate-950">
              {t("checkin.title")}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6">
              {t("checkin.subtitle")}
            </CardDescription>
          </div>
          <Badge
            className={`px-4 py-2 text-sm font-semibold ${statusBadgeClassName}`}
          >
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(330px,0.9fr)] xl:items-start">
          <div className="mesh-card p-5 md:p-6">
            <div className="relative z-10 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-white shadow-[0_14px_34px_-18px_rgba(1,128,255,0.65)]">
                      <CalendarCheck2 className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                        {t("checkin.confirmLabel")}
                      </p>
                      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                        {CHECK_IN_CONFIRM_TON_AMOUNT} TON
                      </p>
                    </div>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-slate-600">
                    {t("checkin.confirmBody")}
                  </p>
                </div>

                <div className="subtle-panel min-w-[188px] bg-white/85 text-right">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    {t("checkin.todayReward")}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    +10
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {lastReward
                      ? t("checkin.lastReward", {
                          count: String(lastReward.points),
                        })
                      : t("checkin.rewardBody")}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-sky-100/80 bg-white/82 p-4 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {t("checkin.actionCard")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {statusLabel}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#eff6ff,#ede9fe)] text-slate-700">
                    {confirmedToday ? (
                      <Sparkles className="h-5 w-5" />
                    ) : pendingToday ? (
                      <TimerReset className="h-5 w-5" />
                    ) : (
                      <Gem className="h-5 w-5" />
                    )}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {statusMessage}
                </p>
                <Button
                  className="mt-5 h-[52px] w-full rounded-[20px] bg-[linear-gradient(135deg,#071a31,#0b75d5,#34d3ff)] text-base font-semibold text-white shadow-[0_20px_46px_-22px_rgba(11,117,213,0.58)] hover:translate-y-[-1px] disabled:bg-[linear-gradient(135deg,rgba(7,26,49,0.34),rgba(11,117,213,0.34),rgba(52,211,255,0.34))] disabled:text-white/90 disabled:opacity-100"
                  disabled={isDisabled}
                  onClick={async () => {
                    if (isDisabled) {
                      return;
                    }

                    try {
                      setStatus("sending");
                      setStatusMessage(t("checkin.messageWalletOpening"));

                      const payload = beginCell()
                        .storeUint(0, 32)
                        .storeStringTail(
                          buildCheckInTransferComment({
                            walletAddress: profile.walletAddress,
                            dateKey: todayKey,
                          }),
                        )
                        .endCell()
                        .toBoc()
                        .toString("base64");

                      const txResult = await tonConnectUI.sendTransaction({
                        validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
                        ...(tonConnectFromAddress
                          ? { from: tonConnectFromAddress }
                          : {}),
                        messages: [
                          {
                            address: getCheckInTreasuryAddress(),
                            amount: toNano(
                              CHECK_IN_CONFIRM_TON_AMOUNT,
                            ).toString(),
                            payload,
                          },
                        ],
                      });

                      const txHash = getMessageHashFromSignedBoc(txResult.boc);
                      if (!txHash) {
                        throw new Error("missing-check-in-message-hash");
                      }

                      setStatus("waiting_confirmation");
                      setStatusMessage(t("checkin.messageWaitingConfirmation"));

                      const registered = await checkIn({ txHash });
                      if (!registered.ok) {
                        throw new Error("check-in-registration-failed");
                      }

                      let syncStatus:
                        | "pending"
                        | "confirmed"
                        | "failed"
                        | "missing" = registered.syncStatus;
                      let pointsAwarded = registered.points;

                      if (syncStatus !== "confirmed") {
                        for (
                          let attempt = 0;
                          attempt < CHECK_IN_SYNC_ATTEMPTS;
                          attempt += 1
                        ) {
                          await wait(CHECK_IN_SYNC_DELAY_MS);
                          setStatus("syncing");
                          setStatusMessage(t("checkin.messageSyncing"));

                          const syncResult = await syncCheckInTransaction({
                            txHash,
                          });
                          syncStatus = syncResult.syncStatus;

                          if (syncStatus === "confirmed") {
                            pointsAwarded =
                              rewardLedger.find(
                                (entry) =>
                                  normalizeWalletKey(entry.walletAddress) ===
                                  normalizedProfileWallet,
                              )?.points ?? registered.points;
                            break;
                          }
                        }
                      }

                      if (syncStatus !== "confirmed") {
                        setStatus("waiting_confirmation");
                        setStatusMessage(
                          t("checkin.messagePendingConfirmation"),
                        );
                        toast({
                          title: t("checkin.waitingConfirmation"),
                          description: t("checkin.messagePendingConfirmation"),
                        });
                        return;
                      }

                      setStatus("synced");
                      setStatusMessage(
                        t("checkin.messageSuccess", {
                          points: String(pointsAwarded || 10),
                        }),
                      );
                      toast({
                        title: t("checkin.claimed"),
                        description: t("checkin.messageSuccess", {
                          points: String(pointsAwarded || 10),
                        }),
                      });
                    } catch (error) {
                      setStatus("failed");
                      const description =
                        error instanceof Error &&
                        error.message === "missing-check-in-message-hash"
                          ? t("checkin.messageHashMissing")
                          : t("checkin.messageWalletCancelled");
                      setStatusMessage(description);
                      toast({
                        title: t("checkin.txFailed"),
                        description,
                      });
                    }
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  {ctaLabel}
                </Button>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {t("checkin.footer")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="subtle-panel flex min-h-[148px] flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t("checkin.currentStreak")}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {profile.streak}
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-500">
                {t("checkin.daysInRow", { count: String(profile.streak) })}
              </p>
            </div>
            <div className="subtle-panel flex min-h-[148px] flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t("checkin.longestStreak")}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {profile.longestStreak}
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-500">
                {t("checkin.bestSeries")}
              </p>
            </div>
            <div className="subtle-panel flex min-h-[148px] flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t("checkin.totalCheckIns")}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {profile.totalCheckIns}
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-500">
                {t("checkin.totalCheckInsBody")}
              </p>
            </div>
            <div className="subtle-panel flex min-h-[148px] flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t("checkin.todayReward")}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  +10
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-500">
                {lastReward
                  ? t("checkin.lastReward", {
                      count: String(lastReward.points),
                    })
                  : t("checkin.rewardBody")}
              </p>
            </div>
          </div>
        </div>

        <div className="subtle-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t("checkin.streakDuration")}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-950">
                {profile.streak} / {streakTarget} {t("checkin.days")}
              </p>
            </div>
            <p className="text-sm font-medium text-sky-700/80">
              {t("checkin.nextGoal", { goal: nextMilestoneLabel })}
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-sky-100">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0180FF,#3DB1FF,#7354F2)] transition-all duration-500"
              style={{ width: `${streakProgress}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>{t("checkin.started")}</span>
            <span>
              {t("checkin.activeSeries", { count: String(profile.streak) })}
            </span>
            <span>{nextMilestoneLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
