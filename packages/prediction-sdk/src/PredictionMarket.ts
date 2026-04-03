import { Address } from "@ton/core";

import { buildPredictionBetTransferMessage } from "./messages";
import type { PredictionDirection } from "./types";

export class PredictionMarket {
  readonly address: Address;

  constructor(address: Address | string) {
    this.address =
      typeof address === "string" ? Address.parse(address) : address;
  }

  createBetTransfer(input: {
    marketId: string;
    label: string;
    direction: PredictionDirection;
    amountTon: number | string;
  }) {
    return buildPredictionBetTransferMessage({
      treasuryAddress: this.address.toString(),
      marketId: input.marketId,
      label: input.label,
      direction: input.direction,
      amountTon: input.amountTon,
    });
  }
}
