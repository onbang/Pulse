"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCommunityProfile } from "./community-provider";

export function LeaderboardPanel() {
  const { leaderboard, walletAddress } = useCommunityProfile();

  return (
    <Card className="surface-panel overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
              Rankings
            </p>
            <CardTitle className="mt-2">Season leaderboard</CardTitle>
          </div>
          <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
            Top {leaderboard.length || 0}
          </div>
        </div>
        <CardDescription className="max-w-xl">
          Top community profiles ranked by points and consistency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.length === 0 ? (
          <p className="text-sm text-slate-500">No players on the board yet.</p>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.walletAddress}
              className={`grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-[24px] border px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5 ${
                entry.walletAddress === walletAddress
                  ? "border-sky-300 bg-[linear-gradient(135deg,#eff6ff,#f0fdfa)]"
                  : index === 0
                    ? "border-amber-200 bg-[linear-gradient(135deg,#fff7ed,#fffbeb)]"
                    : "border-slate-200 bg-white/80"
              }`}
            >
              <strong className="text-slate-500">#{index + 1}</strong>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-800">
                    {entry.displayName}
                  </p>
                  <Badge
                    className={`border-0 ${entry.userLevel.accentClassName}`}
                  >
                    {entry.userLevel.label}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {entry.commentsCount} comments · {entry.predictionsCount}{" "}
                  predictions
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  {entry.achievementScore} power
                </p>
                <p className="font-semibold">{entry.totalPoints} pts</p>
                <p className="text-xs text-slate-500">{entry.streak}d streak</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
