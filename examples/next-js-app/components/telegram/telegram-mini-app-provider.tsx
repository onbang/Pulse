"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { TelegramMiniAppInitData } from "@/lib/telegram-mini-app";

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initData: string;
  initDataUnsafe?: TelegramMiniAppInitData;
  colorScheme?: "light" | "dark";
  version?: string;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

type TelegramMiniAppContextValue = {
  isTelegramMiniApp: boolean;
  isReady: boolean;
  colorScheme: "light" | "dark";
  initData: string;
  user: TelegramMiniAppInitData["user"] | null;
  startParam?: string;
};

const TelegramMiniAppContext =
  createContext<TelegramMiniAppContextValue | null>(null);

export function TelegramMiniAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TelegramMiniAppContextValue>({
    isTelegramMiniApp: false,
    isReady: false,
    colorScheme: "light",
    initData: "",
    user: null,
  });

  useEffect(() => {
    const telegram = (window as TelegramWindow).Telegram?.WebApp;

    if (!telegram) {
      setState((current) => ({ ...current, isReady: true }));
      return;
    }

    telegram.ready();
    telegram.expand();

    setState({
      isTelegramMiniApp: true,
      isReady: true,
      colorScheme: telegram.colorScheme ?? "light",
      initData: telegram.initData,
      user: telegram.initDataUnsafe?.user ?? null,
      startParam: telegram.initDataUnsafe?.start_param,
    });
  }, []);

  return (
    <TelegramMiniAppContext.Provider value={state}>
      {children}
    </TelegramMiniAppContext.Provider>
  );
}

export function useTelegramMiniApp() {
  const context = useContext(TelegramMiniAppContext);

  if (!context) {
    throw new Error(
      "useTelegramMiniApp must be used within TelegramMiniAppProvider",
    );
  }

  return context;
}
