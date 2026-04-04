"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ROUTES } from "@/constants";
import { useCommunityProfile } from "./community-provider";

export function ProfileBetHistory() {
  const { t } = useI18n();
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
    <Card className="surface-panel h-full overflow-hidden border-white/70">
      <CardHeader className="border-b border-sky-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.95))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{t("profile.betHistory.title")}</CardTitle>
            <CardDescription>
              {t("profile.betHistory.subtitle")}
            </CardDescription>
          </div>
          <Badge className="border-sky-100 bg-sky-50 text-slate-700">
            {userBets.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-800">
              {t("profile.betHistory.recent")}
            </h4>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t("profile.betHistory.recentCount", {
                count: String(userBets.length),
              })}
            </span>
          </div>
          {userBets.length === 0 ? (
            <div className="empty-state-panel">
              <p className="empty-state-title">
                {t("profile.betHistory.recent")}
              </p>
              <p className="text-sm leading-6 text-slate-600">
                {t("profile.betHistory.empty")}
              </p>
              <Button asChild variant="outline">
                <Link href={ROUTES.swap}>{t("profile.betHistory.cta")}</Link>
              </Button>
            </div>
          ) : (
            userBets.slice(0, 8).map((bet) => (
              <div
                key={bet.id}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.16)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-slate-800">{bet.pairLabel}</strong>
                  <span className="text-xs text-slate-500">
                    {new Date(bet.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {bet.direction === "up"
                    ? t("prediction.bullish")
                    : t("prediction.bearish")}{" "}
                  · {bet.amount.toFixed(2)} TON
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-800">
              {t("profile.betHistory.settled")}
            </h4>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t("profile.betHistory.settledCount", {
                count: String(userSettlements.length),
              })}
            </span>
          </div>
          {userSettlements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-4">
              <p className="text-sm text-slate-600">
                {t("profile.betHistory.settledEmpty")}
              </p>
            </div>
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
                  {t("prediction.winner")}:{" "}
                  {settlement.settlementDirection === "up"
                    ? t("prediction.up")
                    : t("prediction.down")}
                </p>
                <p className="text-sm font-medium text-emerald-700">
                  {t("prediction.potentialPayout")}:{" "}
                  {settlement.payout?.estimatedPayout.toFixed(2)} TON
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
