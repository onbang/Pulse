"use client";

import { useTonAddress } from "@tonconnect/ui-react";
import type React from "react";

import { useDevPreviewWallet } from "@/hooks/use-dev-preview-wallet";

export const WalletGuard: React.FC<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>
> = ({ children, fallback = null }) => {
  const walletAddress = useTonAddress();
  const { isPreviewMode } = useDevPreviewWallet();

  if (!walletAddress && !isPreviewMode) {
    return fallback;
  }

  return children;
};
