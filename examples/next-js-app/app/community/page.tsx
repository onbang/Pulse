"use client";

import { ActivityFeed } from "@/components/community/activity-feed";
import { Card, CardContent } from "@/components/ui/card";
import { WalletGuard } from "@/components/wallet-guard";

export default function CommunityPage() {
  return (
    <WalletGuard
      fallback={
        <Card className="surface-panel mx-auto mt-10 max-w-xl">
          <CardContent className="p-8 text-center text-slate-600">
            Connect your wallet to personalize your community feed and
            watchlist.
          </CardContent>
        </Card>
      }
    >
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6">
        <div className="hero-shell">
          <p className="eyebrow">Community Pulse</p>
          <h1 className="page-heading mt-3">
            See how STON Pulse moves in real time.
          </h1>
          <p className="page-subheading mt-4">
            Follow check-ins, comments, reactions, farming moves, and prediction
            bets from the most active wallets in the app.
          </p>
        </div>
        <ActivityFeed />
      </section>
    </WalletGuard>
  );
}
