"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ROUTES } from "@/constants";
import { useCommunityProfile } from "./community-provider";

export function WatchlistPanel() {
  const { t } = useI18n();
  const { profile } = useCommunityProfile();

  if (!profile) {
    return null;
  }

  return (
    <Card className="surface-panel h-full overflow-hidden border-white/70">
      <CardHeader className="border-b border-sky-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.95))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{t("profile.watchlist.title")}</CardTitle>
            <CardDescription>{t("profile.watchlist.subtitle")}</CardDescription>
          </div>
          <Badge className="border-sky-100 bg-sky-50 text-slate-700">
            {profile.watchedPools.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.watchedPools.length === 0 ? (
          <div className="empty-state-panel">
            <p className="empty-state-title">{t("profile.watchlist.title")}</p>
            <p className="text-sm leading-6 text-slate-600">
              {t("profile.watchlist.empty")}
            </p>
            <Button asChild variant="outline">
              <Link href={ROUTES.pools}>{t("profile.watchlist.cta")}</Link>
            </Button>
          </div>
        ) : (
          profile.watchedPools.map((pool) => (
            <div
              key={pool.poolId}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.16)]"
            >
              <p className="font-medium text-slate-800">{pool.poolLabel}</p>
              <p className="text-xs text-slate-500">
                {new Date(pool.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
