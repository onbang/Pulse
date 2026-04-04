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
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
            {t("profile.achievements.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {t("profile.achievements.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {t("profile.achievements.subtitle")}
          </p>
        </div>
        <Badge className="border-0 bg-[linear-gradient(135deg,#082f49,#0284c7)] text-white">
          {t("profile.achievements.unlockedCount", {
            unlocked: String(
              achievements.filter((achievement) => achievement.unlocked).length,
            ),
            total: String(achievements.length),
          })}
        </Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`overflow-hidden border-white/70 transition-transform duration-200 hover:-translate-y-1 ${
              achievement.unlocked
                ? "surface-panel"
                : "rounded-[28px] border border-slate-200 bg-white/55 shadow-[0_20px_70px_-48px_rgba(15,23,42,0.45)]"
            }`}
          >
            <CardHeader
              className={`${
                achievement.unlocked
                  ? "bg-[linear-gradient(135deg,#eff6ff,#f0fdfa)]"
                  : "bg-[linear-gradient(135deg,#f8fafc,#ffffff)]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-2xl shadow-sm">
                    {achievement.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {t(
                        `profile.achievements.category.${achievement.category}`,
                      )}
                    </p>
                    <CardTitle className="text-lg">
                      {achievement.label}
                    </CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={achievement.level > 0 ? "default" : "outline"}>
                  {achievement.milestone}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-6">
              <div className="flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold">
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
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${tierBarClassName(achievement.tier)}`}
                  style={{
                    width: `${Math.min((achievement.progress / Math.max(achievement.target, 1)) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-sm text-slate-600">{achievement.highlight}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
