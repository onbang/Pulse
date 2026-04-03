import type { PredictionDirection } from "@/lib/community";

const MACHINE_PREFIX = "PULSE_PREDICTION";

export function buildPredictionTransferComment(input: {
  pairId: string;
  label: string;
  direction: PredictionDirection;
  amount: number;
}) {
  return [
    MACHINE_PREFIX,
    input.pairId,
    encodeURIComponent(input.label),
    input.direction,
    input.amount.toFixed(2),
  ].join("|");
}

export function parsePredictionTransferComment(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith(`${MACHINE_PREFIX}|`)) {
    const [, pairId, encodedLabel, direction, amount] = trimmed.split("|");

    if (
      !pairId ||
      (direction !== "up" && direction !== "down") ||
      !amount ||
      !Number.isFinite(Number(amount))
    ) {
      return null;
    }

    return {
      pairId,
      label: decodeURIComponent(encodedLabel ?? ""),
      direction,
      amount: Number(amount),
      source: "machine" as const,
    };
  }

  const legacyMatch = trimmed.match(
    /^Pulse(?: pool)? prediction \| (.+) \| (UP|DOWN) \| ([\d.]+) TON$/i,
  );

  if (!legacyMatch) {
    return null;
  }

  const [, label, directionRaw, amountRaw] = legacyMatch;

  if (!label || !directionRaw || !amountRaw) {
    return null;
  }

  const direction = directionRaw.toLowerCase();
  const amount = Number(amountRaw);

  if ((direction !== "up" && direction !== "down") || !Number.isFinite(amount)) {
    return null;
  }

  return {
    pairId: null,
    label,
    direction,
    amount,
    source: "legacy" as const,
  };
}
