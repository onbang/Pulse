import { beginCell, toNano } from "@ton/core";

import {
  DEFAULT_PREDICTION_TREASURY_ADDRESS,
  PREDICTION_COMMENT_PREFIX,
} from "./constants";
import type {
  ParsedPredictionBetTransfer,
  PredictionBetTransferInput,
  PredictionDirection,
} from "./types";

export function resolvePredictionTreasuryAddress(value?: string | null) {
  return value?.trim() || DEFAULT_PREDICTION_TREASURY_ADDRESS;
}

export function buildPredictionBetComment(input: PredictionBetTransferInput) {
  return [
    PREDICTION_COMMENT_PREFIX,
    input.marketId,
    encodeURIComponent(input.label),
    input.direction,
    input.amount.toFixed(2),
  ].join("|");
}

export function parsePredictionBetComment(
  value?: string | null,
): ParsedPredictionBetTransfer | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith(`${PREDICTION_COMMENT_PREFIX}|`)) {
    const [, marketId, encodedLabel, direction, amount] = trimmed.split("|");

    if (
      !marketId ||
      !isPredictionDirection(direction) ||
      !amount ||
      !Number.isFinite(Number(amount))
    ) {
      return null;
    }

    return {
      marketId,
      label: decodeURIComponent(encodedLabel ?? ""),
      direction,
      amount: Number(amount),
      source: "machine",
    };
  }

  const legacyMatch = trimmed.match(
    /^Pulse(?: pool)? prediction \| (.+) \| (UP|DOWN) \| ([\d.]+) TON$/i,
  );

  if (!legacyMatch) {
    return null;
  }

  const [, label, directionRaw, amountRaw] = legacyMatch;
  const direction = directionRaw?.toLowerCase();
  const amount = Number(amountRaw);

  if (!label || !isPredictionDirection(direction) || !Number.isFinite(amount)) {
    return null;
  }

  return {
    marketId: null,
    label,
    direction,
    amount,
    source: "legacy",
  };
}

export function buildPredictionBetPayloadBase64(
  input: PredictionBetTransferInput,
) {
  return beginCell()
    .storeUint(0, 32)
    .storeStringTail(buildPredictionBetComment(input))
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildPredictionBetTransferMessage(input: {
  treasuryAddress?: string | null;
  marketId: string;
  label: string;
  direction: PredictionDirection;
  amountTon: number | string;
}) {
  const numericAmount =
    typeof input.amountTon === "string"
      ? Number(input.amountTon)
      : input.amountTon;

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Prediction stake amount must be a positive TON value.");
  }

  return {
    address: resolvePredictionTreasuryAddress(input.treasuryAddress),
    amount: toNano(numericAmount).toString(),
    payload: buildPredictionBetPayloadBase64({
      marketId: input.marketId,
      label: input.label,
      direction: input.direction,
      amount: numericAmount,
    }),
  };
}

function isPredictionDirection(
  value?: string | null,
): value is PredictionDirection {
  return value === "up" || value === "down";
}
