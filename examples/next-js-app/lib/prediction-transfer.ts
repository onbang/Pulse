import {
  buildPredictionBetComment,
  buildPredictionBetTransferMessage,
  buildPredictionPlaceBetTransferMessage,
  parsePredictionBetComment,
} from "@ston-pulse/prediction-sdk";

import type { PredictionDirection } from "@/lib/community";
import {
  getPredictionMarketAddress,
  getPredictionTreasuryAddress,
  isPredictionContractModeEnabled,
} from "@/lib/prediction-config";

export function buildPredictionTransferComment(input: {
  pairId: string;
  label: string;
  direction: PredictionDirection;
  amount: number;
}) {
  return buildPredictionBetComment({
    marketId: input.pairId,
    label: input.label,
    direction: input.direction,
    amount: input.amount,
  });
}

export function parsePredictionTransferComment(value?: string | null) {
  const parsed = parsePredictionBetComment(value);

  if (!parsed) {
    return null;
  }

  return {
    pairId: parsed.marketId,
    label: parsed.label,
    direction: parsed.direction,
    amount: parsed.amount,
    source: parsed.source,
  };
}

export function buildPredictionTransferMessage(input: {
  pairId: string;
  label: string;
  direction: PredictionDirection;
  amountTon: number | string;
}) {
  if (isPredictionContractModeEnabled()) {
    return buildPredictionPlaceBetTransferMessage({
      contractAddress: getPredictionMarketAddress(),
      marketId: input.pairId,
      label: input.label,
      direction: input.direction,
      amountTon: input.amountTon,
    });
  }

  return buildPredictionBetTransferMessage({
    treasuryAddress: getPredictionTreasuryAddress(),
    marketId: input.pairId,
    label: input.label,
    direction: input.direction,
    amountTon: input.amountTon,
  });
}
