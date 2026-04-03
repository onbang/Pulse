"use client";

import { beginCell, toNano } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useState } from "react";

import { useI18n } from "@/components/i18n/i18n-provider";
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
import { DAILY_CHECK_IN_POINTS } from "@/lib/community";
import { useCommunityProfile } from "./community-provider";

export function DailyCheckInCard() {
  const { t } = useI18n();
  const { profile, checkIn } = useCommunityProfile();
  const [tonConnectUI] = useTonConnectUI();
  const { toast } = useToast();
  const [message, setMessage] = useState(
    t("checkin.messageDefault"),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!profile) {
    return null;
  }

  const hasCheckedInToday =
    profile.lastCheckInDate === new Date().toISOString().slice(0, 10);
  const streakTarget = profile.streak >= 30 ? 90 : profile.streak >= 7 ? 30 : 7;
  const streakProgress = Math.min((profile.streak / streakTarget) * 100, 100);
  const nextMilestoneLabel =
    streakTarget === 7
      ? t("checkin.goal7")
      : streakTarget === 30
        ? t("checkin.goal30")
        : t("checkin.goal90");

  return (
    <Card className="surface-panel overflow-hidden">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
          {t("checkin.eyebrow")}
        </p>
        <CardTitle className="mt-2">{t("checkin.title")}</CardTitle>
        <CardDescription>
          {t("checkin.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[28px] border border-sky-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(224,242,254,0.92),rgba(245,243,255,0.94))] p-4 shadow-[0_18px_48px_-28px_rgba(14,116,214,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                {t("checkin.confirmLabel")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-3xl font-semibold text-slate-950">
                  {CHECK_IN_CONFIRM_TON_AMOUNT} TON
                </p>
                <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-sky-700 shadow-sm">
                  +{DAILY_CHECK_IN_POINTS} points
                </span>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                {t("checkin.confirmBody")}
              </p>
            </div>
            <Button
              className="h-12 min-w-[240px] rounded-2xl bg-[linear-gradient(135deg,#0180FF,#3DB1FF,#7354F2)] px-6 text-base text-white shadow-[0_16px_40px_-22px_rgba(1,128,255,0.65)] disabled:bg-[linear-gradient(135deg,rgba(1,128,255,0.35),rgba(61,177,255,0.35),rgba(115,84,242,0.35))] disabled:text-white/85 disabled:opacity-100"
              disabled={hasCheckedInToday || isSubmitting}
              onClick={async () => {
                if (hasCheckedInToday || isSubmitting) {
                  return;
                }

                try {
                  setIsSubmitting(true);

                  const payload = beginCell()
                    .storeUint(0, 32)
                    .storeStringTail(
                      buildCheckInTransferComment({
                        walletAddress: profile.walletAddress,
                        dateKey: new Date().toISOString().slice(0, 10),
                      }),
                    )
                    .endCell()
                    .toBoc()
                    .toString("base64");

                  await tonConnectUI.sendTransaction({
                    validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
                    messages: [
                      {
                        address: getCheckInTreasuryAddress(),
                        amount: toNano(CHECK_IN_CONFIRM_TON_AMOUNT).toString(),
                        payload,
                      },
                    ],
                  });

                  const result = await checkIn();
                  const nextMessage = result.ok
                    ? t("checkin.messageSuccess", {
                        points: String(result.points),
                      })
                    : t("checkin.messageAlready");

                  setMessage(nextMessage);
                  toast({
                    title: result.ok ? t("checkin.claimed") : t("checkin.title"),
                    description: nextMessage,
                  });
                } catch {
                  setMessage(t("checkin.messageWalletCancelled"));
                  toast({
                    title: t("checkin.txFailed"),
                    description: t("checkin.messageWalletCancelled"),
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {hasCheckedInToday
                ? t("checkin.claimed")
                : isSubmitting
                  ? t("checkin.processing")
                  : t("checkin.claim")}
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-sky-200 bg-[linear-gradient(135deg,#eff6ff,#ecfeff)] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-700/70">
                {t("checkin.totalPoints")}
              </p>
              <p className="mt-1 text-4xl font-semibold text-slate-950">
                {profile.totalPoints}
              </p>
            </div>
            <div className="rounded-[24px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5,#f0fdf4)] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700/70">
                {t("checkin.currentStreak")}
              </p>
              <p className="mt-1 text-4xl font-semibold text-slate-950">
                {profile.streak}
              </p>
              <p className="mt-1 text-sm text-emerald-700/80">
                {t("checkin.daysInRow", { count: String(profile.streak) })}
              </p>
            </div>
            <div className="rounded-[24px] border border-violet-200 bg-[linear-gradient(135deg,#f5f3ff,#eff6ff)] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-700/70">
                {t("checkin.todayReward")}
              </p>
              <p className="mt-1 text-4xl font-semibold text-slate-950">
                +{DAILY_CHECK_IN_POINTS}
              </p>
              <p className="mt-1 text-sm text-violet-700/80">
                {t("checkin.rewardBody")}
              </p>
            </div>
          </div>
          <div className="rounded-[24px] border border-sky-200 bg-white/80 px-5 py-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("checkin.streakDuration")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {profile.streak} / {streakTarget} {t("checkin.days")}
                </p>
              </div>
              <p className="text-sm font-medium text-sky-700/80">
                {t("checkin.nextGoal", { goal: nextMilestoneLabel })}
              </p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0180FF,#3DB1FF,#7354F2)] shadow-[0_8px_20px_-10px_rgba(61,177,255,0.85)] transition-all duration-500"
                style={{ width: `${streakProgress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>{t("checkin.started")}</span>
              <span>{t("checkin.activeSeries", { count: String(profile.streak) })}</span>
              <span>{nextMilestoneLabel}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600">{message}</p>
          <p className="text-sm text-slate-500">
            {t("checkin.footer")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
