"use client";

import {
  CalendarClock,
  PenSquare,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { useToast } from "@/hooks/use-toast";
import { getUserLevel, getUserLevelProgress } from "@/lib/community";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCommunityProfile } from "./community-provider";

const DISPLAY_NAME_LIMIT = 32;
const BIO_LIMIT = 160;

function initials(name: string) {
  const normalized = name.trim();

  if (!normalized) {
    return "SP";
  }

  return normalized
    .split(/\s+/)
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileSummary() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { achievements, profile, walletAddress, updateProfile } =
    useCommunityProfile();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [isSaving, setIsSaving] = useState(false);

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
  const normalizedDisplayName = displayName.trim();
  const normalizedBio = bio.trim();
  const previewName = normalizedDisplayName || profile.displayName;
  const previewBio =
    normalizedBio || profile.bio || t("profile.summary.connected");
  const walletPreviewSource = profile.walletAddress || walletAddress;
  const walletPreview = `${walletPreviewSource.slice(0, 6)}...${walletPreviewSource.slice(-4)}`;
  const isDirty =
    normalizedDisplayName !== profile.displayName ||
    normalizedBio !== profile.bio;
  const saveDisabled =
    isSaving || normalizedDisplayName.length === 0 || !isDirty;
  const joinedDate = useMemo(() => {
    const parsedDate = new Date(profile.joinedAt);

    if (Number.isNaN(parsedDate.getTime())) {
      return profile.joinedAt;
    }

    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(parsedDate);
  }, [profile.joinedAt]);
  const formStatusLabel = isDirty
    ? t("profile.summary.editorDirty")
    : t("profile.summary.editorSynced");
  const formStatusClassName = isDirty
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const handleReset = () => {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
  };

  const handleSave = async () => {
    if (saveDisabled) {
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile({
        displayName: normalizedDisplayName,
        bio: normalizedBio,
      });

      toast({
        title: t("profile.summary.saveSuccessTitle"),
        description: t("profile.summary.saveSuccessBody"),
      });
    } catch (error) {
      toast({
        title: t("profile.summary.saveErrorTitle"),
        description:
          error instanceof Error && error.message.trim()
            ? error.message
            : t("profile.summary.saveErrorBody"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="surface-panel overflow-hidden border-white/75">
      <CardHeader className="relative isolate overflow-hidden border-b border-white/15 bg-[linear-gradient(135deg,rgba(4,25,45,0.98),rgba(2,91,160,0.93)_45%,rgba(20,184,166,0.66))] px-6 pb-7 pt-6 text-white">
        <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
        <div className="absolute -left-16 top-6 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(61,177,255,0.28),transparent_72%)]" />
        <div className="absolute -right-12 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.24),transparent_68%)]" />
        <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_72%)]" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Avatar className="h-24 w-24 border border-white/30 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] text-white shadow-[0_22px_48px_-24px_rgba(2,132,199,0.55)]">
                <AvatarFallback className="bg-transparent text-2xl font-semibold text-white">
                  {initials(previewName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-100/80">
                    {t("profile.summary.identity")}
                  </p>
                  <CardTitle className="mt-3 text-3xl leading-tight text-white md:text-4xl">
                    {previewName}
                  </CardTitle>
                  <CardDescription className="mt-3 max-w-2xl text-sm leading-7 text-white/82 md:text-[0.98rem]">
                    {previewBio}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={`border-0 ${userLevel.accentClassName}`}>
                    {localizedLevel}
                  </Badge>
                  <Badge className="border border-white/20 bg-white/10 text-white backdrop-blur-xl">
                    {t("profile.summary.points", {
                      count: String(profile.totalPoints),
                    })}
                  </Badge>
                  <Badge className="border border-white/20 bg-white/10 text-white backdrop-blur-xl">
                    {t("profile.summary.totalCheckIns", {
                      count: String(profile.totalCheckIns),
                    })}
                  </Badge>
                  <Badge className="border border-white/20 bg-white/10 text-white backdrop-blur-xl">
                    {t("profile.summary.streak", {
                      count: String(profile.streak),
                    })}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="w-full max-w-[300px] rounded-[28px] border border-white/20 bg-white/10 p-4 backdrop-blur-2xl shadow-[0_20px_44px_-30px_rgba(3,7,18,0.46)]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/66">
                {t("profile.summary.pulseId")}
              </p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-white">
                {walletPreview}
              </p>
              <div className="mt-4 grid gap-3 rounded-[22px] border border-white/14 bg-slate-950/18 p-3">
                <div className="flex items-center gap-2 text-white/78">
                  <CalendarClock className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.18em]">
                    {t("profile.summary.since")}
                  </span>
                </div>
                <p className="text-sm font-medium leading-6 text-white">
                  {joinedDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 p-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] xl:items-start">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="subtle-panel min-h-[156px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("profile.summary.wallet")}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {walletPreview}
                </p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#eff6ff,#dbeafe)] text-sky-700">
                <Wallet className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              {t("profile.summary.walletBody")}
            </p>
          </div>

          <div className="subtle-panel min-h-[156px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("profile.summary.since")}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {joinedDate}
                </p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ecfeff,#cffafe)] text-cyan-700">
                <CalendarClock className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              {t("profile.summary.joined")}
            </p>
          </div>

          <div className="subtle-panel min-h-[156px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("profile.summary.unlockedBadges")}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {unlockedAchievements}
                </p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fefce8,#fef3c7)] text-amber-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              {t("profile.summary.unlockedBadgesBody")}
            </p>
          </div>

          <div className="subtle-panel min-h-[156px] sm:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("profile.progression.title")}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {localizedLevel}
                </p>
              </div>
              <Badge className={cn("border", userLevel.accentClassName)}>
                {profile.totalPoints} pts
              </Badge>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {levelProgress.next
                ? t("checkin.progressNext", {
                    count: String(levelProgress.remainingScore),
                    level: t(`profile.level.${levelProgress.next.id}`),
                  })
                : t("profile.progression.maxUnlocked")}
            </p>

            <div className="mt-5 h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-[linear-gradient(90deg,#0284c7,#22d3ee,#34d399)] shadow-[0_12px_26px_-14px_rgba(2,132,199,0.48)]"
                style={{ width: `${levelProgress.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mesh-card p-5 shadow-none md:p-6">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {t("profile.summary.editTitle")}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("profile.summary.editBody")}
                </p>
              </div>

              <Badge
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  formStatusClassName,
                )}
              >
                {formStatusLabel}
              </Badge>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                  <span>{t("profile.summary.displayName")}</span>
                  <span className="text-xs font-semibold text-slate-400">
                    {displayName.length}/{DISPLAY_NAME_LIMIT}
                  </span>
                </div>
                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={DISPLAY_NAME_LIMIT}
                  placeholder={t("profile.summary.displayNamePlaceholder")}
                  className="h-12 rounded-[18px] border-white/80 bg-white/88 px-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.18)]"
                />
              </label>

              <label className="block space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                  <span>{t("profile.summary.bio")}</span>
                  <span className="text-xs font-semibold text-slate-400">
                    {bio.length}/{BIO_LIMIT}
                  </span>
                </div>
                <Textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={BIO_LIMIT}
                  placeholder={t("profile.summary.bioPlaceholder")}
                  className="min-h-[136px] rounded-[22px] border-white/80 bg-white/88 px-4 py-3 leading-6 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.18)]"
                />
              </label>

              <div className="rounded-[24px] border border-sky-100/80 bg-white/80 p-4 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.12)]">
                <div className="flex items-center gap-2 text-slate-500">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]">
                    {t("profile.summary.preview")}
                  </p>
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {previewName}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {previewBio}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="h-12 rounded-[18px] bg-[linear-gradient(135deg,#061a31,#0b75d5,#33c3f0)] px-5 shadow-[0_20px_44px_-24px_rgba(11,117,213,0.58)]"
                  disabled={saveDisabled}
                  onClick={() => void handleSave()}
                >
                  {isSaving ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {t("profile.summary.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {t("profile.summary.save")}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-[18px] border-slate-200/90 bg-white/84 px-5 text-slate-700 hover:bg-slate-50"
                  disabled={!isDirty || isSaving}
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("profile.summary.reset")}
                </Button>
              </div>

              <div className="rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,250,255,0.86))] p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#eff6ff,#dbeafe)] text-sky-700">
                    <PenSquare className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {t("profile.summary.editorHintTitle")}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {t("profile.summary.editorHintBody")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
