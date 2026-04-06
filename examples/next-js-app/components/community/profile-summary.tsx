"use client";

import { PenSquare, RotateCcw, Save, Sparkles } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { getUserLevel } from "@/lib/community";
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

function formatProfileDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

export function ProfileSummary() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { isPreviewMode, profile, updateProfile } = useCommunityProfile();
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

  const userLevel = getUserLevel(profile.totalPoints);
  const localizedLevel = t(`profile.level.${userLevel.id}`);
  const normalizedDisplayName = displayName.trim();
  const normalizedBio = bio.trim();
  const previewName = normalizedDisplayName || profile.displayName;
  const previewBio =
    normalizedBio || profile.bio || t("profile.summary.connected");
  const walletPreview = `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}`;
  const isDirty =
    normalizedDisplayName !== profile.displayName ||
    normalizedBio !== profile.bio;
  const saveDisabled =
    isSaving || isPreviewMode || normalizedDisplayName.length === 0 || !isDirty;
  const joinedDate = formatProfileDate(profile.joinedAt);
  const formStatusLabel = isPreviewMode
    ? t("profile.previewMode")
    : isDirty
      ? t("profile.summary.editorDirty")
      : t("profile.summary.editorSynced");
  const formStatusClassName = isPreviewMode
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : isDirty
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
    <Card className="surface-panel h-full overflow-hidden border-white/75">
      <CardHeader className="border-b border-sky-100/70 bg-[radial-gradient(circle_at_top_right,rgba(1,128,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.985),rgba(247,250,255,0.96))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
              {t("profile.summary.identity")}
            </p>
            <CardTitle className="mt-2 text-2xl text-slate-950">
              {t("profile.summary.editTitle")}
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {t("profile.summary.editBody")}
            </CardDescription>
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
      </CardHeader>

      <CardContent className="grid gap-5 p-6 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)] xl:items-start">
        <div className="section-stack">
          <div className="mesh-card p-6 md:p-7">
            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border border-white/80 bg-[linear-gradient(145deg,rgba(1,128,255,0.16),rgba(255,255,255,0.72))] text-slate-950 shadow-[0_24px_48px_-28px_rgba(1,128,255,0.34)]">
                  <AvatarFallback className="bg-transparent text-xl font-semibold text-slate-950">
                    {initials(previewName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                    {t("profile.summary.preview")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-[2rem]">
                    {previewName}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {previewBio}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={`border-0 ${userLevel.accentClassName}`}>
                  {localizedLevel}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="subtle-panel min-h-[156px]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("profile.summary.pulseId")}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {walletPreview}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {t("profile.summary.walletBody")}
              </p>
            </div>

            <div className="subtle-panel min-h-[156px]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("profile.summary.since")}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {joinedDate}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {t("profile.summary.joined")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,255,0.92))] p-5 shadow-[0_22px_52px_-34px_rgba(15,23,42,0.18)] md:p-6">
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
                className="min-h-[156px] rounded-[22px] border-white/80 bg-white/88 px-4 py-3 leading-6 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.18)]"
              />
            </label>

            <div className="flex flex-wrap gap-3 pt-1">
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
                disabled={!isDirty || isPreviewMode || isSaving}
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
                {t("profile.summary.reset")}
              </Button>
            </div>

            {isPreviewMode ? (
              <div className="rounded-[18px] border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-sky-700">
                {t("profile.summary.previewReadOnly")}
              </div>
            ) : null}

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
      </CardContent>
    </Card>
  );
}
