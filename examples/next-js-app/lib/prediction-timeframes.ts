export const PREDICTION_TIMEFRAMES = [
  { id: "5M", minutes: 5 },
  { id: "15M", minutes: 15 },
  { id: "1H", minutes: 60 },
  { id: "4H", minutes: 240 },
  { id: "1D", minutes: 1440 },
] as const;

export type PredictionTimeframeId =
  (typeof PREDICTION_TIMEFRAMES)[number]["id"];

const PREDICTION_TIMEFRAME_PREFIX = "prediction:";

export function isPredictionTimeframeId(
  value: string | null | undefined,
): value is PredictionTimeframeId {
  return PREDICTION_TIMEFRAMES.some((item) => item.id === value);
}

export function buildPredictionTokenMarketId(
  contractAddress: string,
  timeframe: PredictionTimeframeId,
) {
  return `${PREDICTION_TIMEFRAME_PREFIX}${contractAddress}:${timeframe}`;
}

export function parsePredictionTokenMarketId(value: string) {
  if (!value.startsWith(PREDICTION_TIMEFRAME_PREFIX)) {
    return null;
  }

  const [, contractAddress = "", timeframe = ""] = value.split(":");

  if (!contractAddress || !isPredictionTimeframeId(timeframe)) {
    return null;
  }

  return {
    contractAddress,
    timeframe,
  };
}

export function resolvePredictionDurationMinutes(pairId: string) {
  const parsed = parsePredictionTokenMarketId(pairId);

  if (!parsed) {
    return 240;
  }

  return (
    PREDICTION_TIMEFRAMES.find((item) => item.id === parsed.timeframe)
      ?.minutes ?? 240
  );
}
