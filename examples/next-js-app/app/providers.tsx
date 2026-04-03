"use client";

import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { THEME, TonConnectUIProvider } from "@tonconnect/ui-react";
import type React from "react";

import { CommunityProvider } from "@/components/community/community-provider";
import { TelegramMiniAppProvider } from "@/components/telegram/telegram-mini-app-provider";
import { TelegramStartParamRouter } from "@/components/telegram/telegram-start-param-router";

export const queryClient = new QueryClient();

function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

function TonConnectProvider({ children }: { children: React.ReactNode }) {
  const manifestUrl = useMemo(() => {
    const configuredUrl =
      process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL?.trim();

    if (configuredUrl) {
      return configuredUrl;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (appUrl) {
      return new URL("/tonconnect-manifest.json", appUrl).toString();
    }

    if (typeof window !== "undefined") {
      return new URL(
        "/tonconnect-manifest.json",
        window.location.origin,
      ).toString();
    }

    return "/tonconnect-manifest.json";
  }, []);

  return (
    <TonConnectUIProvider
      uiPreferences={{
        borderRadius: "s",
        theme: THEME.LIGHT,
      }}
      manifestUrl={manifestUrl}
    >
      {children}
    </TonConnectUIProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectProvider>
      <TelegramMiniAppProvider>
        <QueryProvider>
          <TelegramStartParamRouter />
          <CommunityProvider>{children}</CommunityProvider>
        </QueryProvider>
      </TelegramMiniAppProvider>
    </TonConnectProvider>
  );
}
