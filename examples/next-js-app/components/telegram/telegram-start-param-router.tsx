"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { resolveTelegramStartParamRoute } from "@/lib/telegram-links";
import { useTelegramMiniApp } from "./telegram-mini-app-provider";

export function TelegramStartParamRouter() {
  const { isTelegramMiniApp, isReady, startParam } = useTelegramMiniApp();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !isTelegramMiniApp || pathname !== "/") {
      return;
    }

    const targetRoute = resolveTelegramStartParamRoute(startParam);

    if (targetRoute !== pathname) {
      router.replace(targetRoute);
    }
  }, [isReady, isTelegramMiniApp, pathname, router, startParam]);

  return null;
}
