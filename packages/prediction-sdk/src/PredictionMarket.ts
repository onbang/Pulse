import { Address } from "@ton/core";

import {
  buildPredictionClaimPayloadBase64,
  buildPredictionCloseRoundPayloadBase64,
  buildPredictionPlaceBetTransferMessage,
  buildPredictionSettleRoundPayloadBase64,
} from "./messages";
import type {
  PredictionClaimInput,
  PredictionCloseRoundInput,
  PredictionDirection,
  PredictionSettleRoundInput,
} from "./types";

export class PredictionMarket {
  readonly address: Address;

  constructor(address: Address | string) {
    this.address =
      typeof address === "string" ? Address.parse(address) : address;
  }

  createBetTransfer(input: {
    roundId: string;
    marketId: string;
    label: string;
    tokenAddress: string;
    timeframeId: string;
    timeframeCode: number;
    roundDurationSeconds: number;
    roundStartTimestamp: number;
    direction: PredictionDirection;
    amountTon: number | string;
  }) {
    return buildPredictionPlaceBetTransferMessage({
      contractAddress: this.address.toString(),
      roundId: input.roundId,
      marketId: input.marketId,
      label: input.label,
      tokenAddress: input.tokenAddress,
      timeframeId: input.timeframeId,
      timeframeCode: input.timeframeCode,
      roundDurationSeconds: input.roundDurationSeconds,
      roundStartTimestamp: input.roundStartTimestamp,
      direction: input.direction,
      amountTon: input.amountTon,
    });
  }

  createCloseRoundMessage(input: PredictionCloseRoundInput) {
    return {
      address: this.address.toString(),
      amount: "0",
      payload: buildPredictionCloseRoundPayloadBase64(input),
    };
  }

  createSettleRoundMessage(input: PredictionSettleRoundInput) {
    return {
      address: this.address.toString(),
      amount: "0",
      payload: buildPredictionSettleRoundPayloadBase64(input),
    };
  }

  createClaimMessage(input: PredictionClaimInput) {
    return {
      address: this.address.toString(),
      amount: "0",
      payload: buildPredictionClaimPayloadBase64(input),
    };
  }
}
