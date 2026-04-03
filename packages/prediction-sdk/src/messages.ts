import { beginCell, Cell, toNano } from "@ton/core";

import {
  DEFAULT_PREDICTION_TREASURY_ADDRESS,
  PREDICTION_COMMENT_PREFIX,
} from "./constants";
import {
  PREDICTION_OP_CLAIM,
  PREDICTION_OP_CLOSE_ROUND,
  PREDICTION_OP_PLACE_BET,
  PREDICTION_OP_SETTLE_ROUND,
} from "./opcodes";
import type {
  ParsedPredictionContractPayload,
  PredictionClaimInput,
  PredictionCloseRoundInput,
  ParsedPredictionBetTransfer,
  PredictionBetTransferInput,
  PredictionDirection,
  PredictionSettleRoundInput,
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

export function buildPredictionPlaceBetPayloadBase64(input: {
  marketId: string;
  label: string;
  direction: PredictionDirection;
}) {
  return beginCell()
    .storeUint(PREDICTION_OP_PLACE_BET, 32)
    .storeStringRefTail(input.marketId)
    .storeStringRefTail(input.label)
    .storeUint(input.direction === "up" ? 1 : 0, 8)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildPredictionPlaceBetTransferMessage(input: {
  contractAddress: string;
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
    address: input.contractAddress,
    amount: toNano(numericAmount).toString(),
    payload: buildPredictionPlaceBetPayloadBase64({
      marketId: input.marketId,
      label: input.label,
      direction: input.direction,
    }),
  };
}

export function buildPredictionCloseRoundPayloadBase64(
  input: PredictionCloseRoundInput,
) {
  return beginCell()
    .storeUint(PREDICTION_OP_CLOSE_ROUND, 32)
    .storeStringRefTail(input.marketId)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildPredictionSettleRoundPayloadBase64(
  input: PredictionSettleRoundInput,
) {
  return beginCell()
    .storeUint(PREDICTION_OP_SETTLE_ROUND, 32)
    .storeStringRefTail(input.marketId)
    .storeUint(input.result === "up" ? 1 : 0, 8)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildPredictionClaimPayloadBase64(input: PredictionClaimInput) {
  return beginCell()
    .storeUint(PREDICTION_OP_CLAIM, 32)
    .storeStringRefTail(input.marketId)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function parsePredictionContractPayloadBase64(
  value?: string | null,
): ParsedPredictionContractPayload | null {
  if (!value) {
    return null;
  }

  try {
    const slice = Cell.fromBase64(value).beginParse();
    const opcode = slice.loadUint(32);

    if (opcode === PREDICTION_OP_PLACE_BET) {
      const marketId = slice.loadStringRefTail();
      const label = slice.loadStringRefTail();
      const direction = slice.loadUint(8) === 1 ? "up" : "down";

      if (!marketId || !label) {
        return null;
      }

      return {
        type: "place_bet",
        marketId,
        label,
        direction,
      };
    }

    if (opcode === PREDICTION_OP_CLOSE_ROUND) {
      const marketId = slice.loadStringRefTail();

      return marketId
        ? {
            type: "close_round",
            marketId,
          }
        : null;
    }

    if (opcode === PREDICTION_OP_SETTLE_ROUND) {
      const marketId = slice.loadStringRefTail();
      const result = slice.loadUint(8) === 1 ? "up" : "down";

      return marketId
        ? {
            type: "settle_round",
            marketId,
            result,
          }
        : null;
    }

    if (opcode === PREDICTION_OP_CLAIM) {
      const marketId = slice.loadStringRefTail();

      return marketId
        ? {
            type: "claim",
            marketId,
          }
        : null;
    }

    return null;
  } catch {
    return null;
  }
}

function isPredictionDirection(
  value?: string | null,
): value is PredictionDirection {
  return value === "up" || value === "down";
}
