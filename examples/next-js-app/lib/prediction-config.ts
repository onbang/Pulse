import { resolvePredictionTreasuryAddress } from "@ston-pulse/prediction-sdk";

export function getPredictionMarketAddress() {
  return process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS?.trim() || "";
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
