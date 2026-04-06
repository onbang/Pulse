"use client";

import Link from "next/link";

import { BookmarkCheck, Compass } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ROUTES } from "@/constants";
import { useCommunityProfile } from "./community-provider";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function WatchlistPanel() {
  const { t } = useI18n();
  const { profile } = useCommunityProfile();

  if (!profile) {
    return null;
  }

  return (
    <Card className="surface-panel h-full overflow-hidden border-white/70">
      <CardHeader className="border-b border-sky-100/70 bg-[radial-gradient(circle_at_top_right,rgba(1,128,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))]">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-xl">
            <CardTitle className="text-2xl">
              {t("profile.watchlist.title")}
            </CardTitle>
            <CardDescription className="mt-2">
              {t("profile.watchlist.subtitle")}
            </CardDescription>
          </div>
          <Badge className="border-sky-100 bg-sky-50 px-4 py-2 text-slate-700">
            {profile.watchedPools.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {profile.watchedPools.length === 0 ? (
          <div className="empty-state-panel">
            <p className="text-sm leading-6 text-slate-600">
              {t("profile.watchlist.empty")}
            </p>
            <Button asChild variant="outline">
              <Link href={ROUTES.pools}>{t("profile.watchlist.cta")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {profile.watchedPools.slice(0, 5).map((pool) => (
                <div
                  key={pool.poolId}
                  className="subtle-panel flex items-start justify-between gap-3 bg-white/88 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <BookmarkCheck className="h-4 w-4 text-sky-700" />
                      <p className="font-semibold text-slate-900">
                        {pool.poolLabel}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {formatTimestamp(pool.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] text-slate-600">
                    <Compass className="h-4 w-4" />
                  </span>
                </div>
              ))}
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full rounded-[18px] border-slate-200/90 bg-white/84 hover:bg-white"
            >
              <Link href={ROUTES.pools}>{t("profile.watchlist.cta")}</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
