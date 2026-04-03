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
      <CardHeader className="relative flex flex-col gap-6 bg-[linear-gradient(135deg,rgba(8,47,73,0.92),rgba(3,105,161,0.82),rgba(56,189,248,0.42))] pb-8 text-white md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border border-white/30 bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white shadow-xl">
            <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
              Profile Identity
            </p>
            <CardTitle className="text-3xl text-white">
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
          <Card className="border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] shadow-none">
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
          <Card className="border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] shadow-none">
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
          <Card className="border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] shadow-none">
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
          <Card className="border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] shadow-none">
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
