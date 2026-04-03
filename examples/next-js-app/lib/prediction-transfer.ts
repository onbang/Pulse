import {
  buildPredictionBetComment,
  parsePredictionBetComment,
} from "@ston-pulse/prediction-sdk";

import type { PredictionDirection } from "@/lib/community";

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
