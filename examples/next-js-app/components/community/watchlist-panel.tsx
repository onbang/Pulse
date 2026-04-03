"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCommunityProfile } from "./community-provider";

export function WatchlistPanel() {
  const { profile } = useCommunityProfile();

  if (!profile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
        <CardDescription>
          Keep an eye on pools you care about and return to them faster.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.watchedPools.length === 0 ? (
          <p className="text-sm text-slate-500">No watched pools yet.</p>
        ) : (
          profile.watchedPools.map((pool) => (
            <div
              key={pool.poolId}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <p className="font-medium text-slate-800">{pool.poolLabel}</p>
              <p className="text-xs text-slate-500">
                Added {new Date(pool.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
