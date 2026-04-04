const DEFAULT_CHECK_IN_TREASURY_ADDRESS =
  "UQCgKml7bxoGETrbA7dHKzttwluVTM4OT_K3WG-el_epHllC";

export const CHECK_IN_CONFIRM_TON_AMOUNT = "0.0001";

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

export function parseCheckInTransferComment(comment?: string | null) {
  if (!comment) {
    return null;
  }

  const [prefix, dateKey, walletAddress] = comment.split("|");

  if (
    prefix !== "PULSE_CHECKIN" ||
    !dateKey ||
    !walletAddress ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)
  ) {
    return null;
  }

  return {
    dateKey,
    walletAddress,
  };
}
