"use client";

import { DailyCheckInCard } from "@/components/community/daily-check-in-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletGuard } from "@/components/wallet-guard";
import { useCommunityProfile } from "@/components/community/community-provider";

function CheckInHistory() {
  const { profile } = useCommunityProfile();

  if (!profile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent check-ins</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {profile.checkInDates.length === 0 ? (
          <p className="text-sm text-slate-500">No check-ins yet.</p>
        ) : (
          profile.checkInDates
            .slice(-14)
            .reverse()
            .map((date) => (
              <div
                key={date}
                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm"
              >
                {new Date(date).toLocaleDateString()}
              </div>
            ))
        )}
      </CardContent>
    </Card>
  );
}

export default function CheckInPage() {
  return (
    <WalletGuard
      fallback={
        <Card className="surface-panel mx-auto mt-10 max-w-xl">
          <CardContent className="p-8 text-center text-slate-600">
            Connect your wallet to start earning daily points.
          </CardContent>
        </Card>
      }
    >
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-6">
        <div className="hero-shell">
          <p className="eyebrow">Daily Ritual</p>
          <h1 className="page-heading mt-3">
            Turn daily activity into momentum.
          </h1>
          <p className="page-subheading mt-4">
            Keep your streak alive, collect points, and build a stronger profile
            every day you show up inside the app.
          </p>
        </div>
        <DailyCheckInCard />
        <CheckInHistory />
      </section>
    </WalletGuard>
  );
}
