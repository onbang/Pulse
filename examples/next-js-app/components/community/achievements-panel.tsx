"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCommunityProfile } from "./community-provider";

export function AchievementsPanel() {
  const { t } = useI18n();
  const { achievements } = useCommunityProfile();

  const tierBarClassName = (tier: string) => {
    switch (tier) {
      case "legendary":
        return "bg-[linear-gradient(90deg,#f59e0b,#facc15)]";
      case "gold":
        return "bg-[linear-gradient(90deg,#fb7185,#f59e0b)]";
      case "silver":
        return "bg-[linear-gradient(90deg,#38bdf8,#22d3ee)]";
      case "bronze":
        return "bg-[linear-gradient(90deg,#0284c7,#2dd4bf)]";
      default:
        return "bg-slate-300";
    }
  };

  return (
    <Card className="surface-panel overflow-hidden border-white/70">
      <CardHeader className="border-b border-sky-100/70 bg-[radial-gradient(circle_at_top_right,rgba(1,128,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
              {t("profile.achievements.eyebrow")}
            </p>
            <CardTitle className="mt-2">
              {t("profile.achievements.title")}
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl">
              {t("profile.achievements.subtitle")}
            </CardDescription>
          </div>
          <Badge className="border-0 bg-[linear-gradient(135deg,#082f49,#0284c7)] px-4 py-2 text-white">
            {t("profile.achievements.unlockedCount", {
              unlocked: String(
                achievements.filter((achievement) => achievement.unlocked)
                  .length,
              ),
              total: String(achievements.length),
            })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`h-full rounded-[26px] border p-5 transition-transform duration-200 hover:-translate-y-1 ${
              achievement.unlocked
                ? "border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,249,255,0.94))] shadow-[0_22px_56px_-40px_rgba(15,23,42,0.2)]"
                : "border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.74))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.22)]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-2xl shadow-sm">
                  {achievement.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t(`profile.achievements.category.${achievement.category}`)}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                    {achievement.label}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {achievement.description}
                  </p>
                </div>
              </div>
              <Badge variant={achievement.level > 0 ? "default" : "outline"}>
                {achievement.milestone}
              </Badge>
            </div>

            <div className="mt-5 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight text-slate-950">
                {achievement.progress}
                {achievement.suffix}
              </p>
              <p className="text-sm font-medium text-slate-500">
                {t("profile.achievements.target", {
                  count: String(achievement.target),
                })}
                {achievement.suffix}
              </p>
            </div>

            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${tierBarClassName(achievement.tier)}`}
                style={{
                  width: `${Math.min((achievement.progress / Math.max(achievement.target, 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {achievement.highlight}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
