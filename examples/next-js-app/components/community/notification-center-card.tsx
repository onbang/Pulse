"use client";

import { Bell, CheckCircle2, Sparkles } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCommunityProfile } from "./community-provider";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function NotificationCenterCard() {
  const {
    profile,
    recentActivity,
    settledPredictions,
    walletAddress,
    updateNotificationPreferences,
    isSyncing,
  } = useCommunityProfile();

  if (!profile) {
    return null;
  }

  const watchLabels = new Set(
    profile.watchedPools.map((item) => item.poolLabel),
  );
  const settlementAlerts = profile.notificationPreferences.predictionSettlements
    ? settledPredictions
        .filter((item) =>
          item.payouts.some((payout) => payout.walletAddress === walletAddress),
        )
        .slice(0, 3)
        .map((item) => ({
          id: `settlement-${item.roundId}`,
          title: `${item.pairLabel} round settled`,
          detail: `Winning side: ${item.settlementDirection === "up" ? "Up" : "Down"}. Your payout preview is available in profile history.`,
          createdAt: item.settledAt,
          kind: "settlement" as const,
        }))
    : [];
  const watchlistAlerts = profile.notificationPreferences.watchlistAlerts
    ? recentActivity
        .filter((item) =>
          [...watchLabels].some(
            (label) =>
              item.detail.includes(label) || item.title.includes(label),
          ),
        )
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.detail,
          createdAt: item.createdAt,
          kind: "watchlist" as const,
        }))
    : [];
  const shouldRemindCheckIn =
    profile.notificationPreferences.dailyCheckInReminders &&
    profile.lastCheckInDate !== getTodayKey();
  const checkInAlert = shouldRemindCheckIn
    ? [
        {
          id: "check-in-reminder",
          title: "Daily check-in is ready",
          detail: "Claim today's points to keep your streak and climb faster.",
          createdAt: new Date().toISOString(),
          kind: "check-in" as const,
        },
      ]
    : [];

  const alerts = [...checkInAlert, ...settlementAlerts, ...watchlistAlerts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const preferences = [
    {
      id: "dailyCheckInReminders" as const,
      label: "Daily check-in reminders",
      description: "Nudge the user when a new streak claim is available.",
      checked: profile.notificationPreferences.dailyCheckInReminders,
    },
    {
      id: "watchlistAlerts" as const,
      label: "Watchlist alerts",
      description: "Highlight activity tied to pools saved in watchlist.",
      checked: profile.notificationPreferences.watchlistAlerts,
    },
    {
      id: "predictionSettlements" as const,
      label: "Prediction settlements",
      description: "Surface winning round results and payout previews faster.",
      checked: profile.notificationPreferences.predictionSettlements,
    },
    {
      id: "telegramBotMessages" as const,
      label: "Telegram bot nudges",
      description:
        "Keep Telegram-ready prompts and bot-focused product hints enabled.",
      checked: profile.notificationPreferences.telegramBotMessages,
    },
  ];

  return (
    <Card className="surface-panel overflow-hidden">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/70">
          Control Room
        </p>
        <CardTitle className="mt-2">Notification center</CardTitle>
        <CardDescription className="max-w-2xl">
          Tune what matters and keep the most important product moments visible
          across your profile, watchlist, and prediction rounds.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          {preferences.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.45)]"
            >
              <div>
                <p className="font-medium text-slate-800">{item.label}</p>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
              <Switch
                checked={item.checked}
                disabled={isSyncing}
                onCheckedChange={(checked) =>
                  void updateNotificationPreferences({ [item.id]: checked })
                }
                aria-label={item.label}
              />
            </div>
          ))}
        </div>
        <div className="rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-sky-100 p-2 text-sky-700">
              <Bell className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Priority alerts</h3>
              <p className="text-sm text-slate-600">
                Your highest-signal moments, refreshed from live app activity.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                No active alerts yet. Add pools to your watchlist or join
                prediction rounds to light this feed up.
              </div>
            ) : (
              alerts.map((alert) => (
                <article
                  key={alert.id}
                  className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.4)]"
                >
                  <div className="mb-2 flex items-center gap-2 text-slate-900">
                    {alert.kind === "check-in" ? (
                      <Sparkles className="size-4 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    )}
                    <strong className="text-sm">{alert.title}</strong>
                  </div>
                  <p className="text-sm text-slate-600">{alert.detail}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
