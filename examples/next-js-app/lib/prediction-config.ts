const DEFAULT_PREDICTION_TREASURY_ADDRESS =
  "UQCgKml7bxoGETrbA7dHKzttwluVTM4OT_K3WG-el_epHllC";

export function getPredictionTreasuryAddress() {
  return (
    process.env.NEXT_PUBLIC_PREDICTION_TREASURY_ADDRESS?.trim() ||
    DEFAULT_PREDICTION_TREASURY_ADDRESS
  );
}
