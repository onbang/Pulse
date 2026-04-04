import { resolvePredictionTreasuryAddress } from "@ston-pulse/prediction-sdk";

const DEFAULT_PREDICTION_MARKET_ADDRESS =
  "EQDMMbmN1GhNJjMWOf8F83LvkUo2gO9C9KrqhwsFt0Kx6Veb";

function isPredictionContractFeatureEnabled() {
  return process.env.NEXT_PUBLIC_DISABLE_PREDICTION_CONTRACT_MODE !== "true";
}

export function getPredictionMarketAddress() {
  if (!isPredictionContractFeatureEnabled()) {
    return "";
  }

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
  return getPredictionMarketAddress().length > 0;
}
