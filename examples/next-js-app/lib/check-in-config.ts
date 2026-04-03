const DEFAULT_CHECK_IN_TREASURY_ADDRESS =
  "UQCgKml7bxoGETrbA7dHKzttwluVTM4OT_K3WG-el_epHllC";

export const CHECK_IN_CONFIRM_TON_AMOUNT = "0.001";

export function getCheckInTreasuryAddress() {
  return (
    process.env.NEXT_PUBLIC_CHECKIN_TREASURY_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_PREDICTION_TREASURY_ADDRESS?.trim() ||
    DEFAULT_CHECK_IN_TREASURY_ADDRESS
  );
}

export function buildCheckInTransferComment(input: {
  walletAddress: string;
  dateKey: string;
}) {
  return ["PULSE_CHECKIN", input.dateKey, input.walletAddress].join("|");
}
