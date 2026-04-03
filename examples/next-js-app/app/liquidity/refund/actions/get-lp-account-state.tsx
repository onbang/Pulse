"use server";

import { dexFactory } from "@ston-fi/sdk";

import { getRouter } from "@/lib/routers-repository";
import { tonApiClient } from "@/lib/ton-api-client";

export const getLpAccountData = async (
  routerAddress: string,
  lpAccountAddress: string,
) => {
  try {
    const routerInfo = await getRouter(routerAddress);

    if (!routerInfo) {
      throw new Error(`Router "${routerAddress}" not found`);
    }

    const { LpAccount } = dexFactory(routerInfo);

    const lpAccount = tonApiClient.open(LpAccount.create(lpAccountAddress));
    const typedLpAccount = lpAccount as {
      getLpAccountData: () => Promise<{
        userAddress: { toString(): string };
        poolAddress: { toString(): string };
        amount0: bigint;
        amount1: bigint;
      }>;
    };

    const lpAccountData = await typedLpAccount.getLpAccountData();

    return {
      routerAddress: routerAddress,
      lpAccountAddress: lpAccountAddress,
      userAddress: lpAccountData.userAddress.toString(),
      poolAddress: lpAccountData.poolAddress.toString(),
      amount0: lpAccountData.amount0.toString(),
      amount1: lpAccountData.amount1.toString(),
    };
  } catch (error) {
    console.error("Error fetching LP account data:", error);
    return null;
  }
};

export type LpAccountData = Awaited<ReturnType<typeof getLpAccountData>>;
