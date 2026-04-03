import { resolvePredictionTreasuryAddress } from "@ston-pulse/prediction-sdk";

export function getPredictionTreasuryAddress() {
  return resolvePredictionTreasuryAddress(
    process.env.NEXT_PUBLIC_PREDICTION_TREASURY_ADDRESS,
  );
}
