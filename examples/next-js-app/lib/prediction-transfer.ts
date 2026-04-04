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
import {
  buildPredictionTokenRoundId,
  getPredictionTimeframeCode,
  getPredictionTimeframeSeconds,
  parsePredictionTokenMarketId,
  resolvePredictionRoundStartTimestamp,
} from "@/lib/prediction-timeframes";

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
  const parsedMarket = parsePredictionTokenMarketId(input.pairId);

  if (isPredictionContractModeEnabled() && parsedMarket) {
    const roundStartTimestamp = resolvePredictionRoundStartTimestamp(
      parsedMarket.timeframe,
    );

    return buildPredictionPlaceBetTransferMessage({
      contractAddress: getPredictionMarketAddress(),
      roundId: buildPredictionTokenRoundId(
        parsedMarket.contractAddress,
        parsedMarket.timeframe,
      ),
      marketId: input.pairId,
      label: input.label,
      tokenAddress: parsedMarket.contractAddress,
      timeframeId: parsedMarket.timeframe,
      timeframeCode: getPredictionTimeframeCode(parsedMarket.timeframe),
      roundDurationSeconds: getPredictionTimeframeSeconds(
        parsedMarket.timeframe,
      ),
      roundStartTimestamp,
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
