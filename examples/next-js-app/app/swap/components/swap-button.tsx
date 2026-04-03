"use client";

import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useState } from "react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { buildSwapTransaction } from "../actions/build-swap-transaction";
import { useSwapSimulation } from "../hooks/swap-simulation-query";
import { useSwapStatusNotifications } from "../hooks/swap-status-notifications";
import { useSwapStatusQuery } from "../hooks/swap-status-query";
import { useSwapForm } from "../providers/swap-form";
import { useSwapSettings } from "../providers/swap-settings";
import { useSetSwapTransactionDetails } from "../providers/swap-transaction";

export function SwapButton() {
  const { t } = useI18n();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const {
    offerAmount,
    offerAsset,
    askAsset,
    askAmount,
    referralValue,
    referralAddress,
  } = useSwapForm();
  const { autoSlippageTolerance } = useSwapSettings();
  const swapSimulationQuery = useSwapSimulation();
  const setSwapTransaction = useSetSwapTransactionDetails();
  const swapStatusQuery = useSwapStatusQuery();
  const [isClicked, setIsClicked] = useState(false);
  const { toast } = useToast();

  useSwapStatusNotifications();

  const handleSwap = async () => {
    if (!swapSimulationQuery.data || !walletAddress) {
      return;
    }

    try {
      const queryId = Date.now();
      setIsClicked(true);
      const messages = await buildSwapTransaction(
        swapSimulationQuery.data,
        walletAddress,
        {
          queryId,
          referralAddress,
          referralValue,
          useRecommendedSlippage: autoSlippageTolerance,
        },
      );

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes
        messages,
      });
      toast({ title: t("swap.button.sent") });
      setSwapTransaction({
        queryId,
        ownerAddress: walletAddress,
        routerAddress: swapSimulationQuery.data.routerAddress,
      });
    } catch {
      setSwapTransaction(null);
    } finally {
      setIsClicked(false);
    }
  };

  if (!walletAddress) {
    return (
      <Button
        variant="outline"
        disabled
        className="h-12 w-full rounded-2xl border-sky-100 bg-slate-50 text-slate-500"
      >
        {t("swap.button.connect")}
      </Button>
    );
  }

  if (!offerAsset || !askAsset) {
    return (
      <Button
        variant="outline"
        disabled
        className="h-12 w-full rounded-2xl border-sky-100 bg-slate-50 text-slate-500"
      >
        {t("swap.button.selectAsset")}
      </Button>
    );
  }

  if (!offerAmount && !askAmount) {
    return (
      <Button
        variant="outline"
        disabled
        className="h-12 w-full rounded-2xl border-sky-100 bg-slate-50 text-slate-500"
      >
        {t("swap.button.enterAmount")}
      </Button>
    );
  }

  if (swapSimulationQuery.isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="h-12 w-full rounded-2xl border-sky-100 bg-slate-50 text-slate-500"
      >
        {t("swap.button.loading")}
      </Button>
    );
  }

  if (!swapSimulationQuery.data) {
    return (
      <Button variant="destructive" className="h-12 w-full rounded-2xl">
        {t("swap.button.invalid")}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-white shadow-[0_20px_44px_-24px_rgba(1,128,255,0.55)] hover:opacity-95"
      onClick={handleSwap}
      disabled={
        isClicked ||
        swapSimulationQuery.isFetching ||
        swapStatusQuery.isFetching
      }
    >
      {t("swap.button.submit")}
    </Button>
  );
}
