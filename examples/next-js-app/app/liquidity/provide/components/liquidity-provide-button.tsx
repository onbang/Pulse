"use client";

import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useState } from "react";

import { useCommunityProfile } from "@/components/community/community-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { buildLpTransaction } from "../actions/build-lp-transaction";
import { useLiquiditySimulationQuery } from "../hooks/liquidity-simulation-query";
import { useLiquidityProvideForm } from "../providers/liquidity-provide-form";

export const LiquidityProvideButton = () => {
  const { t } = useI18n();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { trackActivity } = useCommunityProfile();
  const { toast } = useToast();
  const { assetA, assetB, pool, assetAUnits, assetBUnits } =
    useLiquidityProvideForm();
  const lpSimulationQuery = useLiquiditySimulationQuery();
  const [isClicked, setIsClicked] = useState(false);

  const handleLiquidityProvide = async () => {
    if (!lpSimulationQuery.data || !walletAddress) {
      toast({
        title: t("liquidity.provide.unavailable"),
        description: t("liquidity.provide.unavailableBody"),
      });
      return;
    }

    try {
      setIsClicked(true);
      const messages = await buildLpTransaction(
        lpSimulationQuery.data,
        walletAddress,
      );

      if (messages.length === 0) {
        throw new Error("No liquidity transaction messages were generated.");
      }

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes
        messages,
      });
      toast({
        title: t("liquidity.provide.sent"),
        description: t("liquidity.provide.sentBody"),
      });
      void trackActivity("liquidity");
    } catch (error) {
      toast({
        title: t("liquidity.provide.failed"),
        description:
          error instanceof Error && error.message
            ? error.message
            : t("liquidity.provide.failedBody"),
      });
    } finally {
      setIsClicked(false);
    }
  };

  if (!walletAddress) {
    return (
      <Button
        variant="default"
        className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-white shadow-[0_20px_44px_-24px_rgba(1,128,255,0.55)] hover:opacity-95"
        onClick={() => tonConnectUI.openModal()}
      >
        {t("swap.button.connect")}
      </Button>
    );
  }

  if (!assetA || !assetB) {
    return (
      <Button
        variant="default"
        disabled
        className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,rgba(1,128,255,0.3),rgba(61,177,255,0.3))] text-white/95 shadow-[0_20px_44px_-24px_rgba(1,128,255,0.2)] disabled:opacity-100"
      >
        {t("liquidity.provide.cta")}
      </Button>
    );
  }

  if (!pool) {
    return (
      <Button
        variant="default"
        disabled
        className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,rgba(1,128,255,0.3),rgba(61,177,255,0.3))] text-white/95 shadow-[0_20px_44px_-24px_rgba(1,128,255,0.2)] disabled:opacity-100"
      >
        {t("liquidity.provide.cta")}
      </Button>
    );
  }

  if (!assetAUnits && !assetBUnits) {
    return (
      <Button
        variant="default"
        disabled
        className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,rgba(1,128,255,0.3),rgba(61,177,255,0.3))] text-white/95 shadow-[0_20px_44px_-24px_rgba(1,128,255,0.2)] disabled:opacity-100"
      >
        {t("liquidity.provide.cta")}
      </Button>
    );
  }

  if (lpSimulationQuery.isFetching) {
    return (
      <Button
        variant="default"
        disabled
        className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-white disabled:opacity-100"
      >
        {t("liquidity.provide.loading")}
      </Button>
    );
  }

  if (!lpSimulationQuery.data) {
    return (
      <Button
        variant="destructive"
        disabled
        className="h-12 w-full rounded-2xl"
      >
        {t("liquidity.provide.simulationFailed")}
      </Button>
    );
  }

  return (
    <Button
      disabled={!lpSimulationQuery.data || isClicked}
      className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-white shadow-[0_20px_44px_-24px_rgba(1,128,255,0.55)] hover:opacity-95"
      onClick={handleLiquidityProvide}
    >
      {isClicked ? t("liquidity.provide.loading") : t("liquidity.provide.cta")}
    </Button>
  );
};
