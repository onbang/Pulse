"use client";

import { Clock3, Coins, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { fetchInternalApi } from "@/lib/vercel-internal-fetch";
import { useCommunityProfile } from "./community-provider";

type TonProfileResponse = {
  ok: boolean;
  error?: string;
  account: {
    address: string;
    name: string | null;
    balance: string;
    status: string;
    lastActivity: number;
  };
  jettons: Array<{
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    image: string | null;
  }>;
  events: Array<{
    eventId: string;
    timestamp: number;
    isScam: boolean;
    inProgress: boolean;
    actions: Array<{
      type: string;
      status: string;
      description: string;
      name: string;
      value: string | null;
    }>;
  }>;
};

function formatUnits(value: string, decimals: number) {
  const padded = value.padStart(decimals + 1, "0");
  const integer = padded.slice(0, -decimals) || "0";
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${integer}.${fraction.slice(0, 3)}` : integer;
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value * 1000));
}

export function ProfileTonPanel() {
  const { t } = useI18n();
  const { walletAddress } = useCommunityProfile();
  const [data, setData] = useState<TonProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setError(null);
        const response = await fetchInternalApi(
          `/api/ton/profile/${encodeURIComponent(walletAddress)}`,
        );
        const payload = (await response.json()) as TonProfileResponse;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Failed to load TON profile");
        }

        if (isMounted) {
          setData(payload);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load TON profile",
          );
        }
      }
    };

    if (walletAddress) {
      void load();
    }

    return () => {
      isMounted = false;
    };
  }, [walletAddress]);

  const topJettons = data?.jettons.slice(0, 3) ?? [];
  const recentEvents = data?.events.slice(0, 3) ?? [];

  return (
    <Card className="surface-panel overflow-hidden border-white/70">
      <CardHeader className="border-b border-sky-100/70 bg-[radial-gradient(circle_at_top_right,rgba(1,128,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))]">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <CardTitle className="text-2xl">{t("profile.ton.title")}</CardTitle>
            <CardDescription className="mt-2">
              {t("profile.ton.subtitle")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        {error ? (
          <div className="empty-state-panel">
            <p className="empty-state-title">{t("profile.ton.title")}</p>
            <p className="text-sm leading-6 text-slate-600">
              {t("profile.ton.error", { message: error })}
            </p>
          </div>
        ) : !data ? (
          <div className="empty-state-panel">
            <p className="empty-state-title">{t("profile.ton.title")}</p>
            <p className="text-sm leading-6 text-slate-600">
              {t("profile.ton.loading")}
            </p>
          </div>
        ) : (
          <>
            <div className="surface-panel-dark overflow-hidden px-5 py-6 md:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/70">
                    {t("profile.ton.balance")}
                  </p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                    {formatUnits(data.account.balance, 9)} TON
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    {t("profile.ton.subtitle")}
                  </p>
                </div>
                <Badge className="border border-white/14 bg-white/10 text-white">
                  {data.account.status}
                </Badge>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-white/78">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                      {t("profile.ton.lastActivity")}
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-white">
                    {formatTimestamp(data.account.lastActivity)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-white/78">
                    <Coins className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                      {t("profile.ton.jettons")}
                    </p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    {data.jettons.length}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-white/78">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                      {t("profile.ton.events")}
                    </p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    {data.events.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
              <div className="rounded-[28px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,250,255,0.92))] p-5 shadow-[0_22px_52px_-34px_rgba(15,23,42,0.16)] md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="text-xl font-semibold tracking-tight text-slate-950">
                      {t("profile.ton.jettons")}
                    </p>
                  </div>
                  <Badge className="border-slate-200/90 bg-white/84 text-slate-700">
                    {data.jettons.length}
                  </Badge>
                </div>

                {topJettons.length === 0 ? (
                  <div className="empty-state-panel mt-4">
                    <p className="text-sm leading-6 text-slate-600">
                      {t("profile.ton.jettonsEmpty")}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {topJettons.map((jetton) => (
                      <div
                        key={`${jetton.symbol}-${jetton.balance}`}
                        className="subtle-panel flex items-center justify-between gap-3 bg-white/88 p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {jetton.symbol}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {jetton.name}
                          </p>
                        </div>
                        <strong className="shrink-0 text-slate-950">
                          {formatUnits(jetton.balance, jetton.decimals)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,250,255,0.92))] p-5 shadow-[0_22px_52px_-34px_rgba(15,23,42,0.16)] md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="text-xl font-semibold tracking-tight text-slate-950">
                      {t("profile.ton.events")}
                    </p>
                  </div>
                  <Badge className="border-slate-200/90 bg-white/84 text-slate-700">
                    {data.events.length}
                  </Badge>
                </div>

                {recentEvents.length === 0 ? (
                  <div className="empty-state-panel mt-4">
                    <p className="text-sm leading-6 text-slate-600">
                      {t("profile.ton.eventsEmpty")}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {recentEvents.map((event) => (
                      <article
                        key={event.eventId}
                        className="rounded-[24px] border border-slate-200/80 bg-white/84 p-4 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.14)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {event.actions[0]?.name ??
                                t("profile.ton.eventFallback")}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {formatTimestamp(event.timestamp)}
                            </p>
                          </div>
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#eff6ff,#dbeafe)] text-sky-700">
                            <Sparkles className="h-4 w-4" />
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {event.actions[0]?.description}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
