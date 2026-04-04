export const PREDICTION_TIMEFRAMES = [
  { id: "5M", minutes: 5, code: 1 },
  { id: "15M", minutes: 15, code: 2 },
  { id: "1H", minutes: 60, code: 3 },
  { id: "4H", minutes: 240, code: 4 },
  { id: "1D", minutes: 1440, code: 5 },
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

export function getPredictionTimeframeMinutes(
  timeframe: PredictionTimeframeId,
) {
  return (
    PREDICTION_TIMEFRAMES.find((item) => item.id === timeframe)?.minutes ?? 60
  );
}

export function getPredictionTimeframeCode(timeframe: PredictionTimeframeId) {
  return PREDICTION_TIMEFRAMES.find((item) => item.id === timeframe)?.code ?? 3;
}

export function getPredictionTimeframeSeconds(
  timeframe: PredictionTimeframeId,
) {
  return getPredictionTimeframeMinutes(timeframe) * 60;
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

export function resolvePredictionRoundStartTimestamp(
  timeframe: PredictionTimeframeId,
  date: Date = new Date(),
) {
  const seconds = getPredictionTimeframeSeconds(timeframe);
  const unixSeconds = Math.floor(date.getTime() / 1000);

  return Math.floor(unixSeconds / seconds) * seconds;
}

export function buildPredictionTokenRoundId(
  contractAddress: string,
  timeframe: PredictionTimeframeId,
  date: Date = new Date(),
) {
  const marketId = buildPredictionTokenMarketId(contractAddress, timeframe);
  const roundStartTimestamp = resolvePredictionRoundStartTimestamp(
    timeframe,
    date,
  );

  return `${marketId}:${roundStartTimestamp}`;
}

export function parsePredictionTokenRoundId(value: string) {
  const parts = value.split(":");

  if (parts.length !== 4 || parts[0] !== "prediction") {
    return null;
  }

  const [, contractAddress = "", timeframe = "", roundStart = ""] = parts;
  const roundStartTimestamp = Number(roundStart);

  if (
    !contractAddress ||
    !isPredictionTimeframeId(timeframe) ||
    !Number.isFinite(roundStartTimestamp) ||
    roundStartTimestamp <= 0
  ) {
    return null;
  }

  return {
    contractAddress,
    timeframe,
    roundStartTimestamp,
    marketId: buildPredictionTokenMarketId(contractAddress, timeframe),
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
