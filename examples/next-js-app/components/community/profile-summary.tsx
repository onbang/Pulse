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
import { getAchievementScore, getUserLevel } from "@/lib/community";
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

  const achievementScore = Math.round(getAchievementScore(achievements));
  const userLevel = getUserLevel(achievementScore);

  return (
    <Card className="surface-panel overflow-hidden border-white/70">
      <CardHeader className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(8,47,73,0.96),rgba(3,105,161,0.9)_46%,rgba(16,185,129,0.54))] pb-8 text-white">
        <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_68%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.25fr,0.75fr] lg:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border border-white/30 bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white shadow-xl">
              <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
                Profile Identity
              </p>
              <CardTitle className="text-3xl text-white md:text-4xl">
                {profile.displayName}
              </CardTitle>
              <CardDescription className="max-w-lg text-sm text-white/76">
                Connected through TON Connect. This profile powers comments,
                predictions, check-ins, and achievement progress.
              </CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge className={`border-0 ${userLevel.accentClassName}`}>
                  {userLevel.label}
                </Badge>
                <Badge className="border-0 bg-white text-slate-950">
                  {profile.totalPoints} points
                </Badge>
                <Badge className="border border-white/25 bg-white/10 text-white">
                  {profile.streak} day streak
                </Badge>
                <Badge className="border border-white/25 bg-white/10 text-white">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                Achievement power
              </p>
              <p className="mt-2 text-3xl font-semibold">{achievementScore}</p>
              <p className="mt-1 text-sm text-white/72">
                Signals profile maturity
              </p>
            </div>
            <div className="rounded-[24px] border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                Social reach
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {profile.commentsCount}
              </p>
              <p className="mt-1 text-sm text-white/72">
                Pool comments published
              </p>
            </div>
            <div className="rounded-[24px] border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                Market calls
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {profile.predictionsCount}
              </p>
              <p className="mt-1 text-sm text-white/72">
                Predictions submitted
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-6 md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-3">
          <label className="space-y-2 text-sm font-medium">
            Display name
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={32}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Bio
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
            Save profile
          </Button>
        </div>

        <div className="grid gap-3">
          <Card className="mesh-card shadow-none">
            <CardContent className="p-4 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Level
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {userLevel.label}
              </p>
              <p>{achievementScore} achievement power</p>
            </CardContent>
          </Card>
          <Card className="mesh-card shadow-none">
            <CardContent className="p-4 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Social footprint
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {profile.commentsCount}
              </p>
              <p>Comments posted</p>
            </CardContent>
          </Card>
          <Card className="mesh-card shadow-none">
            <CardContent className="p-4 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Market reads
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {profile.predictionsCount}
              </p>
              <p>Predictions submitted</p>
            </CardContent>
          </Card>
          <Card className="mesh-card shadow-none">
            <CardContent className="p-4 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Since
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {new Date(profile.joinedAt).toLocaleDateString()}
              </p>
              <p>Joined STON Pulse</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
