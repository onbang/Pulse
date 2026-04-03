"use client";

import { ActivityFeed } from "@/components/community/activity-feed";
import { LeaderboardPanel } from "@/components/community/leaderboard-panel";

export default function LeaderboardPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6">
      <div className="hero-shell">
        <p className="eyebrow">Season Race</p>
        <h1 className="page-heading mt-3">
          Consistency, insight, and community energy on one board.
        </h1>
        <p className="page-subheading mt-4">
          Rankings combine points, streaks, comments, and prediction
          participation to spotlight the wallets that shape the social layer of
          STON Pulse.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <LeaderboardPanel />
        <ActivityFeed />
      </div>
    </section>
  );
}
