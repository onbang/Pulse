"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCommunityProfile } from "./community-provider";

export function ActivityFeed() {
  const { recentActivity } = useCommunityProfile();

  return (
    <Card className="surface-panel overflow-hidden">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
          Live Stream
        </p>
        <CardTitle className="mt-2">Community feed</CardTitle>
        <CardDescription className="max-w-xl">
          Live pulse of new check-ins, positions, comments, reactions, and bets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          recentActivity.map((item) => (
            <article
              key={item.id}
              className="rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.45)]"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <strong className="text-slate-800">{item.title}</strong>
                <span className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-600">{item.author}</p>
              <p className="text-sm text-slate-700">{item.detail}</p>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
