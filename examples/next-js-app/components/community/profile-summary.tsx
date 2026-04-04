"use client";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getUserLevel, getUserLevelProgress } from "@/lib/community";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCommunityProfile } from "./community-provider";

function initials(name: string) {
  return name
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileSummary() {
  const { t } = useI18n();
  const { achievements, profile, walletAddress, updateProfile } =
    useCommunityProfile();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");

  useEffect(() => {
    setDisplayName(profile?.displayName ?? "");
    setBio(profile?.bio ?? "");
  }, [profile?.bio, profile?.displayName]);

  if (!profile) {
    return null;
  }

  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;
  const userLevel = getUserLevel(profile.totalPoints);
  const levelProgress = getUserLevelProgress(profile.totalPoints);
  const localizedLevel = t(`profile.level.${userLevel.id}`);
  const walletPreview = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  const joinedDate = new Date(profile.joinedAt).toLocaleDateString();

  return (
    <Card className="surface-panel overflow-hidden border-white/70">
      <CardHeader className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(8,47,73,0.96),rgba(3,105,161,0.9)_46%,rgba(16,185,129,0.54))] pb-6 text-white">
        <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_68%)]" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-20 w-20 border border-white/30 bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white shadow-xl">
              <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
                  {t("profile.summary.identity")}
                </p>
                <CardTitle className="mt-2 text-3xl text-white">
                  {profile.displayName}
                </CardTitle>
                <CardDescription className="mt-2 max-w-lg text-sm leading-6 text-white/76">
                  {t("profile.summary.connected")}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={`border-0 ${userLevel.accentClassName}`}>
                  {localizedLevel}
                </Badge>
                <Badge className="border border-white/25 bg-white/10 text-white">
                  {walletPreview}
                </Badge>
                <Badge className="border border-white/25 bg-white/10 text-white">
                  {t("profile.summary.points", {
                    count: String(profile.totalPoints),
                  })}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 xl:grid-cols-[minmax(260px,0.88fr)_minmax(0,1.12fr)] xl:items-start">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="subtle-panel flex min-h-[132px] flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("profile.summary.wallet")}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {walletPreview}
              </p>
            </div>
            <p className="text-sm leading-6 text-slate-500">
              {t("profile.summary.walletBody")}
            </p>
          </div>

          <div className="subtle-panel flex min-h-[132px] flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("profile.summary.unlockedBadges")}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {unlockedAchievements}
              </p>
            </div>
            <p className="text-sm leading-6 text-slate-500">
              {t("profile.summary.unlockedBadgesBody")}
            </p>
          </div>

          <div className="subtle-panel flex min-h-[132px] flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("profile.summary.since")}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {joinedDate}
              </p>
            </div>
            <p className="text-sm leading-6 text-slate-500">
              {t("profile.summary.joined")}
            </p>
          </div>

          <div className="subtle-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("profile.progression.title")}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {localizedLevel}
                </p>
              </div>
              <Badge className={`border ${userLevel.accentClassName}`}>
                {profile.totalPoints} pts
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {levelProgress.next
                ? t("checkin.progressNext", {
                    count: String(levelProgress.remainingScore),
                    level: t(`profile.level.${levelProgress.next.id}`),
                  })
                : t("profile.progression.maxUnlocked")}
            </p>
            <div className="mt-4 h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-[linear-gradient(90deg,#0284c7,#2dd4bf)]"
                style={{ width: `${levelProgress.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mesh-card p-5 shadow-none md:p-6">
          <div className="relative z-10">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t("profile.summary.editTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("profile.summary.editBody")}
              </p>
            </div>
            <div className="space-y-4">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                {t("profile.summary.displayName")}
                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={32}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                {t("profile.summary.bio")}
                <Textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={160}
                />
              </label>
              <div className="flex justify-start">
                <Button
                  className="h-11 rounded-full bg-[linear-gradient(135deg,#082f49,#0284c7)] px-5 shadow-[0_16px_40px_-22px_rgba(2,132,199,0.8)]"
                  onClick={() => void updateProfile({ displayName, bio })}
                >
                  {t("profile.summary.save")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
