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
import { ROUTES } from "@/constants";
import { useCommunityProfile } from "./community-provider";
import { useI18n } from "@/components/i18n/i18n-provider";

export function ActivePredictionsPanel() {
  const { t } = useI18n();
  const { userBets, getPrediction } = useCommunityProfile();

  const activeBets = userBets.filter((bet) => {
    const prediction = getPrediction(bet.pairId);
    const round = prediction?.round;

    if (!round || round.id !== bet.roundId) {
      return false;
    }

    return round.status === "open" || round.status === "closed";
  });

  return (
    <Card className="surface-panel overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{t("profile.activePredictions.title")}</CardTitle>
            <CardDescription>
              {t("profile.activePredictions.subtitle")}
            </CardDescription>
          </div>
          <Badge className="border-sky-100 bg-sky-50 text-slate-700">
            {activeBets.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
          activeBets.slice(0, 6).map((bet) => {
            const prediction = getPrediction(bet.pairId);
            const round = prediction?.round;

            return (
              <div
                key={bet.id}
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.18)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {bet.pairLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {bet.direction === "up"
                        ? t("prediction.bullish")
                        : t("prediction.bearish")}{" "}
                      · {bet.amount.toFixed(2)} TON
                    </p>
                  </div>
                  <Badge className="border-sky-100 bg-sky-50 text-slate-700">
                    {round?.status === "closed"
                      ? t("prediction.awaitingSettlement")
                      : t("prediction.roundStatusOpen")}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(bet.createdAt).toLocaleString()}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
