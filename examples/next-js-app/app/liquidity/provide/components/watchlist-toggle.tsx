"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCommunityProfile } from "@/components/community/community-provider";
import { useLiquidityProvideForm } from "../providers/liquidity-provide-form";

export function WatchlistToggle() {
  const { pool, assetA, assetB } = useLiquidityProvideForm();
  const { profile, walletAddress, toggleWatchlist } = useCommunityProfile();

  if (!pool || !walletAddress) {
    return null;
  }

  const poolLabel =
    assetA?.meta?.symbol && assetB?.meta?.symbol
      ? `${assetA.meta.symbol}/${assetB.meta.symbol}`
      : pool.address;
  const isWatched = !!profile?.watchedPools.some(
    (item) => item.poolId === pool.address,
  );

  return (
    <Button
      variant="outline"
      onClick={() => void toggleWatchlist({ poolId: pool.address, poolLabel })}
    >
      <Star className={isWatched ? "fill-current" : ""} />
      {isWatched ? "Watching pool" : "Add to watchlist"}
    </Button>
  );
}
