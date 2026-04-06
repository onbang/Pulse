"use client";

import Link from "next/link";
import { useState } from "react";

import { Clock3, History, Sparkles, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ROUTES } from "@/constants";
import { useCommunityProfile } from "./community-provider";

const CLOSED_PREDICTION_GRACE_MS = 15 * 60 * 1000;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProfileBetHistory() {
  const { t } = useI18n();
  const {
    profile,
    settledPredictions,
    userBets,
    walletAddress,
    getPrediction,
  } = useCommunityProfile();
  const [currentTimestamp] = useState(() => Date.now());

  if (!profile) {
    return null;
  }

  const activeBets = userBets.filter((bet) => {
    const prediction = getPrediction(bet.pairId);
    const round = prediction?.round;

    if (!round || round.id !== bet.roundId) {
      return false;
    }

    if (round.status === "open") {
      return true;
    }

    if (round.status !== "closed") {
      return false;
    }

    const closesAtTimestamp = new Date(round.closesAt).getTime();

    if (!Number.isFinite(closesAtTimestamp)) {
      return false;
    }

    return currentTimestamp - closesAtTimestamp <= CLOSED_PREDICTION_GRACE_MS;
  });

  const activeBetIds = new Set(activeBets.map((bet) => bet.id));
  const recentBets = userBets.filter((bet) => !activeBetIds.has(bet.id));
  const userSettlements = settledPredictions
    .map((settlement) => ({
      ...settlement,
      payout:
        settlement.payouts.find(
          (item) => item.walletAddress === walletAddress,
        ) ?? null,
    }))
    .filter((settlement) => settlement.payout !== null);

  const tradingStats = [
    {
      label: t("profile.activePredictions.title"),
      value: String(activeBets.length),
      body: t("profile.activePredictions.subtitle"),
      accentClassName:
        "bg-[linear-gradient(135deg,#eff6ff,#dbeafe)] text-sky-700",
      icon: TrendingUp,
    },
    {
      label: t("profile.betHistory.recent"),
      value: String(recentBets.length),
      body: t("profile.betHistory.recentCount", {
        count: String(recentBets.length),
      }),
      accentClassName:
        "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] text-slate-700",
      icon: History,
    },
    {
      label: t("profile.betHistory.settled"),
      value: String(userSettlements.length),
      body: t("profile.betHistory.settledCount", {
        count: String(userSettlements.length),
      }),
      accentClassName:
        "bg-[linear-gradient(135deg,#ecfdf5,#d1fae5)] text-emerald-700",
      icon: Sparkles,
    },
  ];

  return (
    <Card className="surface-panel h-full overflow-hidden border-white/70">
      <CardHeader className="border-b border-sky-100/70 bg-[radial-gradient(circle_at_top_right,rgba(1,128,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))]">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <CardTitle className="text-2xl">
              {t("profile.betHistory.title")}
            </CardTitle>
            <CardDescription className="mt-2">
              {t("profile.betHistory.subtitle")}
            </CardDescription>
          </div>
          <Badge className="border-sky-100 bg-sky-50 px-4 py-2 text-slate-700">
            {userBets.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {tradingStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="stat-pill min-h-[152px] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {stat.value}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${stat.accentClassName}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {stat.body}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:items-start">
          <div className="section-stack">
            <div className="mesh-card p-5 md:p-6">
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="text-xl font-semibold tracking-tight text-slate-950">
                      {t("profile.activePredictions.title")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {t("profile.activePredictions.subtitle")}
                    </p>
                  </div>
                  <Badge className="border-white/85 bg-white/84 text-slate-700">
                    {activeBets.length}
                  </Badge>
                </div>

                {activeBets.length === 0 ? (
                  <div className="empty-state-panel">
                    <p className="empty-state-title">
                      {t("profile.activePredictions.title")}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {t("profile.activePredictions.empty")}
                    </p>
                    <Button asChild variant="outline">
                      <Link href={ROUTES.swap}>
                        {t("profile.activePredictions.cta")}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {activeBets.slice(0, 4).map((bet) => {
                      const prediction = getPrediction(bet.pairId);
                      const round = prediction?.round;

                      return (
                        <div
                          key={bet.id}
                          className="subtle-panel bg-white/88 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-slate-950">
                                {bet.pairLabel}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">
                                {formatTimestamp(bet.createdAt)}
                              </p>
                            </div>
                            <Badge className="border-sky-100 bg-sky-50 text-slate-700">
                              {round?.status === "closed"
                                ? t("prediction.awaitingSettlement")
                                : t("prediction.roundStatusOpen")}
                            </Badge>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                className={
                                  bet.direction === "up"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-rose-200 bg-rose-50 text-rose-700"
                                }
                              >
                                {bet.direction === "up"
                                  ? t("prediction.bullish")
                                  : t("prediction.bearish")}
                              </Badge>
                            </div>
                            <p className="text-lg font-semibold tracking-tight text-slate-950">
                              {bet.amount.toFixed(2)} TON
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,250,255,0.92))] p-5 shadow-[0_22px_52px_-34px_rgba(15,23,42,0.16)] md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="text-xl font-semibold tracking-tight text-slate-950">
                    {t("profile.betHistory.recent")}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {t("profile.betHistory.recentCount", {
                    count: String(recentBets.length),
                  })}
                </span>
              </div>

              {recentBets.length === 0 ? (
                <div className="empty-state-panel mt-4">
                  <p className="empty-state-title">
                    {t("profile.betHistory.recent")}
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    {t("profile.betHistory.recentEmpty")}
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {recentBets.slice(0, 4).map((bet) => (
                    <div
                      key={bet.id}
                      className="rounded-[22px] border border-slate-200/80 bg-white/84 px-4 py-4 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.14)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {bet.pairLabel}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {formatTimestamp(bet.createdAt)}
                          </p>
                        </div>
                        <Badge
                          className={
                            bet.direction === "up"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }
                        >
                          {bet.direction === "up"
                            ? t("prediction.bullish")
                            : t("prediction.bearish")}
                        </Badge>
                      </div>

                      <p className="mt-4 text-lg font-semibold tracking-tight text-slate-950">
                        {bet.amount.toFixed(2)} TON
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-emerald-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.88))] p-5 shadow-[0_24px_56px_-38px_rgba(5,150,105,0.2)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-xl font-semibold tracking-tight text-slate-950">
                  {t("profile.betHistory.settled")}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("profile.betHistory.subtitle")}
                </p>
              </div>
              <Badge className="border-white/85 bg-white/84 text-emerald-700">
                {userSettlements.length}
              </Badge>
            </div>

            {userSettlements.length === 0 ? (
              <div className="empty-state-panel mt-4 border-emerald-200">
                <p className="empty-state-title">
                  {t("profile.betHistory.settled")}
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  {t("profile.betHistory.settledEmpty")}
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {userSettlements.slice(0, 6).map((settlement) => (
                  <article
                    key={settlement.roundId}
                    className="rounded-[24px] border border-emerald-100/90 bg-white/78 p-4 shadow-[0_14px_30px_-24px_rgba(5,150,105,0.18)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950">
                          {settlement.pairLabel}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {formatTimestamp(settlement.settledAt)}
                        </p>
                      </div>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ecfdf5,#d1fae5)] text-emerald-700">
                        <Clock3 className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[18px] bg-emerald-50/80 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/75">
                          {t("prediction.winner")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {settlement.settlementDirection === "up"
                            ? t("prediction.up")
                            : t("prediction.down")}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-emerald-50/80 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/75">
                          {t("prediction.potentialPayout")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {settlement.payout?.estimatedPayout.toFixed(2)} TON
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Button
              asChild
              variant="outline"
              className="mt-5 w-full rounded-[18px] border-emerald-200 bg-white/84 hover:bg-white"
            >
              <Link href={ROUTES.swap}>{t("profile.betHistory.cta")}</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
