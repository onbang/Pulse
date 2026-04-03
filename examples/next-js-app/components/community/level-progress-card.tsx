"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAchievementScore, getUserLevelProgress } from "@/lib/community";
import { useCommunityProfile } from "./community-provider";

export function LevelProgressCard() {
  const { achievements } = useCommunityProfile();
  const achievementScore = Math.round(getAchievementScore(achievements));
  const progress = getUserLevelProgress(achievementScore);

  return (
    <Card className="surface-panel overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
              Progression
            </p>
            <CardTitle className="mt-2">Level journey</CardTitle>
          </div>
          <Badge className={`border-0 ${progress.current.accentClassName}`}>
            {progress.current.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr,auto,1fr] sm:items-center">
          <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Current
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {progress.current.label}
            </p>
            <p className="text-sm text-slate-600">
              {achievementScore} achievement power
            </p>
          </div>
          <div className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Next
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Target
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {progress.next?.label ?? "Legend reached"}
            </p>
            <p className="text-sm text-slate-600">
              {progress.next
                ? `${progress.remainingScore} power left`
                : "Maximum user level unlocked"}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">Level progress</span>
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
