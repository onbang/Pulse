"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getUserLevelProgress } from "@/lib/community";
import { useCommunityProfile } from "./community-provider";

export function LevelProgressCard() {
  const { t } = useI18n();
  const { profile } = useCommunityProfile();

  if (!profile) {
    return null;
  }

  const progress = getUserLevelProgress(profile.totalPoints);

  return (
    <Card className="surface-panel overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
              {t("profile.progression.eyebrow")}
            </p>
            <CardTitle className="mt-2">
              {t("profile.progression.title")}
            </CardTitle>
          </div>
          <Badge className={`border-0 ${progress.current.accentClassName}`}>
            {t(`profile.level.${progress.current.id}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr,auto,1fr] sm:items-center">
          <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t("profile.progression.current")}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {t(`profile.level.${progress.current.id}`)}
            </p>
            <p className="text-sm text-slate-600">
              {t("profile.summary.pointsCount", {
                count: String(profile.totalPoints),
              })}
            </p>
          </div>
          <div className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t("profile.progression.next")}
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t("profile.progression.target")}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {progress.next
                ? t(`profile.level.${progress.next.id}`)
                : t("profile.progression.maxReached")}
            </p>
            <p className="text-sm text-slate-600">
              {progress.next
                ? t("profile.progression.pointsLeft", {
                    count: String(progress.remainingScore),
                  })
                : t("profile.progression.maxUnlocked")}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">
              {t("profile.progression.progress")}
            </span>
            <strong>{progress.progressPercent.toFixed(0)}%</strong>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-[linear-gradient(90deg,#0284c7,#2dd4bf)]"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
