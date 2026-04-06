"use client";

import { useEffect, useState } from "react";

const DEV_PREVIEW_WALLET_PARAM = "previewWallet";

export function useDevPreviewWallet() {
  const [previewWalletAddress, setPreviewWalletAddress] = useState("");

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const syncFromLocation = () => {
      const nextPreviewWalletAddress =
        new URLSearchParams(window.location.search)
          .get(DEV_PREVIEW_WALLET_PARAM)
          ?.trim() ?? "";

      setPreviewWalletAddress(nextPreviewWalletAddress);
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);

    return () => {
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return {
      isPreviewMode: false,
      previewWalletAddress: "",
    };
  }

  return {
    isPreviewMode: previewWalletAddress.length > 0,
    previewWalletAddress,
  };
}
