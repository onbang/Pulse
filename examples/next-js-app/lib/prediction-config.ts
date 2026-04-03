import { resolvePredictionTreasuryAddress } from "@ston-pulse/prediction-sdk";

const DEFAULT_PREDICTION_MARKET_ADDRESS =
  "EQAGSUKo3TiF8i_TBvBbSgvmkyUgL7-RWSG72ggUszcql-y2";

export function getPredictionMarketAddress() {
  return (
    process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS?.trim() ||
    DEFAULT_PREDICTION_MARKET_ADDRESS
  );
}

export function getPredictionTreasuryAddress() {
  return resolvePredictionTreasuryAddress(
    process.env.NEXT_PUBLIC_PREDICTION_TREASURY_ADDRESS,
  );
}

export function getPredictionEntryAddress() {
  return getPredictionMarketAddress() || getPredictionTreasuryAddress();
}

export function isPredictionContractModeEnabled() {
  return Boolean(getPredictionMarketAddress());
}
