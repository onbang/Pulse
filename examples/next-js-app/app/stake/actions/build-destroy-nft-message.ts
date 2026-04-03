"use server";

import { StakeNftItem } from "@ston-fi/stake-sdk";
import type { SendTransactionRequest } from "@tonconnect/ui-react";

import { tonApiClient } from "@/lib/ton-api-client";

export async function buildDestroyNftMessage(
  nftAddress: string,
): Promise<SendTransactionRequest["messages"][number]> {
  const nftContract = tonApiClient.open(StakeNftItem.create(nftAddress));
  const typedNftContract = nftContract as {
    getDestroyTxParams: () => Promise<{
      to: { toString(): string };
      value: bigint;
      body?: { toBoc(): Buffer };
    }>;
  };
  const txParams = await typedNftContract.getDestroyTxParams();

  return {
    address: txParams.to.toString(),
    amount: txParams.value.toString(),
    payload: txParams.body?.toBoc().toString("base64"),
  };
}
