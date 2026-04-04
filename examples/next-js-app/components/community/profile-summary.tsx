"use client";

import { ShieldCheck, Sparkles, Trophy, Wallet } from "lucide-react";
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
import { getUserLevel } from "@/lib/community";
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
  const localizedLevel = t(`profile.level.${userLevel.id}`);
  const walletPreview = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <Card className="surface-panel overflow-hidden border-white/70">
      <CardHeader className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(8,47,73,0.96),rgba(3,105,161,0.9)_46%,rgba(16,185,129,0.54))] pb-8 text-white">
        <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_68%)]" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] xl:items-center">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border border-white/30 bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white shadow-xl">
              <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
                  {t("profile.summary.identity")}
                </p>
                <CardTitle className="mt-2 text-3xl text-white md:text-4xl">
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
                <Badge className="border-0 bg-white text-slate-950">
                  {t("profile.summary.points", {
                    count: String(profile.totalPoints),
                  })}
                </Badge>
                <Badge className="border border-white/25 bg-white/10 text-white">
                  {t("profile.summary.streak", {
                    count: String(profile.streak),
                  })}
                </Badge>
                <Badge className="border border-white/25 bg-white/10 text-white">
                  {walletPreview}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                {t("profile.summary.longestStreak")}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {profile.longestStreak}
              </p>
              <p className="mt-1 text-sm text-white/72">
                {t("profile.summary.longestStreakBody")}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                {t("profile.summary.unlockedBadges")}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {unlockedAchievements}
              </p>
              <p className="mt-1 text-sm text-white/72">
                {t("profile.summary.unlockedBadgesBody")}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                {t("profile.summary.totalCheckIns")}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {profile.totalCheckIns}
              </p>
              <p className="mt-1 text-sm text-white/72">
                {t("profile.summary.totalCheckInsBody")}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                {t("profile.summary.rewardEntries")}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {Math.max(profile.totalCheckIns, 0)}
              </p>
              <p className="mt-1 text-sm text-white/72">
                {t("profile.summary.rewardEntriesBody")}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <div className="mesh-card p-5 shadow-none">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t("profile.summary.editTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t("profile.summary.editBody")}
            </p>
          </div>
          <div className="space-y-3">
            <label className="space-y-2 text-sm font-medium">
              {t("profile.summary.displayName")}
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={32}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              {t("profile.summary.bio")}
              <Textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={160}
              />
            </label>
            <Button
              className="rounded-full bg-[linear-gradient(135deg,#082f49,#0284c7)] px-5 shadow-[0_16px_40px_-22px_rgba(2,132,199,0.8)]"
              onClick={() => void updateProfile({ displayName, bio })}
            >
              {t("profile.summary.save")}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="mesh-card shadow-none sm:col-span-2">
            <CardContent className="p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {t("profile.summary.level")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {localizedLevel}
                  </p>
                  <p>
                    {t("profile.summary.pointsCount", {
                      count: String(profile.totalPoints),
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mesh-card shadow-none">
            <CardContent className="p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {t("profile.summary.unlockedBadges")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {unlockedAchievements}
                  </p>
                  <p>{t("profile.summary.unlockedBadgesBody")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mesh-card shadow-none">
            <CardContent className="p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Wallet className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {t("profile.summary.wallet")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {walletPreview}
                  </p>
                  <p>{t("profile.summary.walletBody")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mesh-card shadow-none">
            <CardContent className="p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {t("profile.summary.since")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {new Date(profile.joinedAt).toLocaleDateString()}
                  </p>
                  <p>{t("profile.summary.joined")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
