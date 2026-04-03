"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const { walletAddress } = useCommunityProfile();
  const [data, setData] = useState<TonProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setError(null);
        const response = await fetch(
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
    <Card>
      <CardHeader>
        <CardTitle>TON portfolio</CardTitle>
        <CardDescription>
          Live wallet view powered by TON API account, jetton, and event data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-slate-500">{error}</p>
        ) : !data ? (
          <p className="text-sm text-slate-500">Loading TON portfolio...</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  TON balance
                </p>
                <p className="text-2xl font-semibold">
                  {formatUnits(data.account.balance, 9)} TON
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Account status
                </p>
                <p className="text-2xl font-semibold capitalize">
                  {data.account.status}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Last activity
                </p>
                <p className="text-sm font-medium">
                  {new Date(data.account.lastActivity * 1000).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-800">
                Top jettons
              </h4>
              {data.jettons.length === 0 ? (
                <p className="text-sm text-slate-500">No jettons found.</p>
              ) : (
                data.jettons.map((jetton) => (
                  <div
                    key={`${jetton.symbol}-${jetton.balance}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {jetton.symbol}
                      </p>
                      <p className="text-xs text-slate-500">{jetton.name}</p>
                    </div>
                    <strong>
                      {formatUnits(jetton.balance, jetton.decimals)}
                    </strong>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-800">
                Latest on-chain events
              </h4>
              {data.events.length === 0 ? (
                <p className="text-sm text-slate-500">No recent events.</p>
              ) : (
                data.events.map((event) => (
                  <article
                    key={event.eventId}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <strong className="text-slate-800">
                        {event.actions[0]?.name ?? "TON event"}
                      </strong>
                      <span className="text-xs text-slate-500">
                        {new Date(event.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                    {event.actions.map((action) => (
                      <p
                        key={`${event.eventId}-${action.type}`}
                        className="text-sm text-slate-600"
                      >
                        {action.description}
                      </p>
                    ))}
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
