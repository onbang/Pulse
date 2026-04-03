"use client";

import { PoolComments } from "@/components/community/pool-comments";

import { useLiquidityProvideForm } from "../providers/liquidity-provide-form";

export function PoolCommentsSection() {
  const { pool, assetA, assetB } = useLiquidityProvideForm();
  const poolLabel =
    assetA?.meta?.symbol && assetB?.meta?.symbol
      ? `${assetA.meta.symbol}/${assetB.meta.symbol}`
      : "selected pool";

  return <PoolComments poolId={pool?.address} poolLabel={poolLabel} />;
}
