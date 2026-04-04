"use client";

import { useEffect, useState } from "react";

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

  return (
    <Card className="surface-panel overflow-hidden border-white/70">
      <CardHeader className="border-b border-sky-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.95))]">
        <CardTitle>{t("profile.ton.title")}</CardTitle>
        <CardDescription>{t("profile.ton.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <div className="grid gap-3 md:grid-cols-3">
              <div className="subtle-panel">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("profile.ton.balance")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatUnits(data.account.balance, 9)} TON
                </p>
              </div>
              <div className="subtle-panel">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("profile.ton.status")}
                </p>
                <p className="mt-2 text-2xl font-semibold capitalize tracking-tight text-slate-950">
                  {data.account.status}
                </p>
              </div>
              <div className="subtle-panel">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("profile.ton.lastActivity")}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {new Date(data.account.lastActivity * 1000).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.18fr)]">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  {t("profile.ton.jettons")}
                </h4>
                {data.jettons.length === 0 ? (
                  <div className="empty-state-panel">
                    <p className="text-sm leading-6 text-slate-600">
                      {t("profile.ton.jettonsEmpty")}
                    </p>
                  </div>
                ) : (
                  data.jettons.map((jetton) => (
                    <div
                      key={`${jetton.symbol}-${jetton.balance}`}
                      className="subtle-panel flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">
                          {jetton.symbol}
                        </p>
                        <p className="text-xs text-slate-500">{jetton.name}</p>
                      </div>
                      <strong className="shrink-0 text-slate-950">
                        {formatUnits(jetton.balance, jetton.decimals)}
                      </strong>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  {t("profile.ton.events")}
                </h4>
                {data.events.length === 0 ? (
                  <div className="empty-state-panel">
                    <p className="text-sm leading-6 text-slate-600">
                      {t("profile.ton.eventsEmpty")}
                    </p>
                  </div>
                ) : (
                  data.events.map((event) => (
                    <article key={event.eventId} className="subtle-panel">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <strong className="text-slate-800">
                          {event.actions[0]?.name ??
                            t("profile.ton.eventFallback")}
                        </strong>
                        <span className="text-xs text-slate-500">
                          {new Date(event.timestamp * 1000).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {event.actions.map((action) => (
                          <p
                            key={`${event.eventId}-${action.type}`}
                            className="text-sm leading-6 text-slate-600"
                          >
                            {action.description}
                          </p>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
