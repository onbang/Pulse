import { resolvePredictionTreasuryAddress } from "@ston-pulse/prediction-sdk";

function isPredictionContractFeatureEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_PREDICTION_CONTRACT_MODE === "true";
}

export function getPredictionMarketAddress() {
  if (!isPredictionContractFeatureEnabled()) {
    return "";
  }

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
  return getPredictionMarketAddress().length > 0;
}
