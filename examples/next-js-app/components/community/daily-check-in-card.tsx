"use client";

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
import { DAILY_CHECK_IN_POINTS } from "@/lib/community";
import { useCommunityProfile } from "./community-provider";

export function DailyCheckInCard() {
  const { t } = useI18n();
  const { profile, checkIn } = useCommunityProfile();
  const [message, setMessage] = useState(
    t("checkin.messageDefault"),
  );

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
        <Button
          className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#082f49,#0284c7)] px-5 text-base shadow-[0_16px_40px_-22px_rgba(2,132,199,0.8)]"
          disabled={hasCheckedInToday}
          onClick={async () => {
            const result = await checkIn();
            setMessage(
              result.ok
                ? t("checkin.messageSuccess", {
                    points: String(result.points),
                  })
                : t("checkin.messageAlready"),
            );
          }}
        >
          {hasCheckedInToday ? t("checkin.claimed") : t("checkin.claim")}
        </Button>
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
