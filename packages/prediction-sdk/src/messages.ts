import { Address, beginCell, Cell, toNano } from "@ton/core";

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
  ParsedTonForecastContractPayload,
  ParsedPredictionContractPayload,
  PredictionClaimInput,
  PredictionCloseRoundInput,
  ParsedPredictionBetTransfer,
  PredictionBetTransferInput,
  PredictionDirection,
  PredictionSettleRoundInput,
  TonForecastDirection,
} from "./types";

const TON_FORECAST_OP_BET_YES = 1413896497;
const TON_FORECAST_OP_BET_NO = 1413893681;
const TON_FORECAST_OP_LOCK_MARKET = 1413893169;
const TON_FORECAST_OP_RESOLVE_MARKET = 1413894705;
const TON_FORECAST_OP_CLAIM_REWARD = 1413890865;
const TON_FORECAST_OP_CLAIM_REWARD_FOR = 1413891633;

export function resolvePredictionTreasuryAddress(value?: string | null) {
  return value?.trim() || DEFAULT_PREDICTION_TREASURY_ADDRESS;
}

export function buildPredictionBetComment(input: PredictionBetTransferInput) {
  return [
    PREDICTION_COMMENT_PREFIX,
    input.marketId,
    input.roundId ?? "",
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
    const [, marketId, , encodedLabel, direction, amount] = trimmed.split("|");

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
  roundId: string;
  marketId: string;
  label: string;
  tokenAddress: string;
  timeframeId: string;
  timeframeCode: number;
  roundDurationSeconds: number;
  roundStartTimestamp: number;
  direction: PredictionDirection;
}) {
  const detailsCell = beginCell()
    .storeStringRefTail(input.label)
    .storeAddress(Address.parse(input.tokenAddress))
    .storeStringRefTail(input.timeframeId)
    .storeUint(input.timeframeCode, 8)
    .storeUint(input.roundDurationSeconds, 32)
    .storeUint(input.roundStartTimestamp, 32)
    .storeUint(input.direction === "up" ? 1 : 0, 8)
    .endCell();

  return beginCell()
    .storeUint(PREDICTION_OP_PLACE_BET, 32)
    .storeStringRefTail(input.roundId)
    .storeStringRefTail(input.marketId)
    .storeRef(detailsCell)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildPredictionPlaceBetTransferMessage(input: {
  contractAddress: string;
  roundId: string;
  marketId: string;
  label: string;
  tokenAddress: string;
  timeframeId: string;
  timeframeCode: number;
  roundDurationSeconds: number;
  roundStartTimestamp: number;
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
      roundId: input.roundId,
      marketId: input.marketId,
      label: input.label,
      tokenAddress: input.tokenAddress,
      timeframeId: input.timeframeId,
      timeframeCode: input.timeframeCode,
      roundDurationSeconds: input.roundDurationSeconds,
      roundStartTimestamp: input.roundStartTimestamp,
      direction: input.direction,
    }),
  };
}

export function buildPredictionCloseRoundPayloadBase64(
  input: PredictionCloseRoundInput,
) {
  return beginCell()
    .storeUint(PREDICTION_OP_CLOSE_ROUND, 32)
    .storeStringRefTail(input.roundId)
    .storeAddress(Address.parse(input.tokenAddress))
    .storeUint(input.timeframeCode, 8)
    .storeUint(input.roundStartTimestamp, 32)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildPredictionSettleRoundPayloadBase64(
  input: PredictionSettleRoundInput,
) {
  return beginCell()
    .storeUint(PREDICTION_OP_SETTLE_ROUND, 32)
    .storeStringRefTail(input.roundId)
    .storeAddress(Address.parse(input.tokenAddress))
    .storeUint(input.timeframeCode, 8)
    .storeUint(input.roundStartTimestamp, 32)
    .storeUint(input.result === "up" ? 1 : 0, 8)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildPredictionClaimPayloadBase64(input: PredictionClaimInput) {
  return beginCell()
    .storeUint(PREDICTION_OP_CLAIM, 32)
    .storeStringRefTail(input.roundId)
    .storeAddress(Address.parse(input.tokenAddress))
    .storeUint(input.timeframeCode, 8)
    .storeUint(input.roundStartTimestamp, 32)
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
      const roundId = slice.loadStringRefTail();
      const marketId = slice.loadStringRefTail();
      const detailsSlice = slice.loadRef().beginParse();
      const label = detailsSlice.loadStringRefTail();
      const tokenAddress = detailsSlice.loadAddress().toString();
      const timeframeId = detailsSlice.loadStringRefTail();
      const timeframeCode = Number(detailsSlice.loadUint(8));
      const roundDurationSeconds = Number(detailsSlice.loadUint(32));
      const roundStartTimestamp = Number(detailsSlice.loadUint(32));
      const direction = detailsSlice.loadUint(8) === 1 ? "up" : "down";

      if (
        !roundId ||
        !marketId ||
        !label ||
        !tokenAddress ||
        !timeframeId ||
        !Number.isFinite(timeframeCode) ||
        !Number.isFinite(roundDurationSeconds) ||
        !Number.isFinite(roundStartTimestamp)
      ) {
        return null;
      }

      return {
        type: "place_bet",
        roundId,
        marketId,
        label,
        tokenAddress,
        timeframeId,
        timeframeCode,
        roundDurationSeconds,
        roundStartTimestamp,
        direction,
      };
    }

    if (opcode === PREDICTION_OP_CLOSE_ROUND) {
      const roundId = slice.loadStringRefTail();
      const tokenAddress = slice.loadAddress().toString();
      const timeframeCode = Number(slice.loadUint(8));
      const roundStartTimestamp = Number(slice.loadUint(32));

      return roundId && tokenAddress
        ? {
            type: "close_round",
            roundId,
            tokenAddress,
            timeframeCode,
            roundStartTimestamp,
          }
        : null;
    }

    if (opcode === PREDICTION_OP_SETTLE_ROUND) {
      const roundId = slice.loadStringRefTail();
      const tokenAddress = slice.loadAddress().toString();
      const timeframeCode = Number(slice.loadUint(8));
      const roundStartTimestamp = Number(slice.loadUint(32));
      const result = slice.loadUint(8) === 1 ? "up" : "down";

      return roundId && tokenAddress
        ? {
            type: "settle_round",
            roundId,
            tokenAddress,
            timeframeCode,
            roundStartTimestamp,
            result,
          }
        : null;
    }

    if (opcode === PREDICTION_OP_CLAIM) {
      const roundId = slice.loadStringRefTail();
      const tokenAddress = slice.loadAddress().toString();
      const timeframeCode = Number(slice.loadUint(8));
      const roundStartTimestamp = Number(slice.loadUint(32));

      return roundId && tokenAddress
        ? {
            type: "claim",
            roundId,
            tokenAddress,
            timeframeCode,
            roundStartTimestamp,
          }
        : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function buildTonForecastBetPayloadBase64(
  direction: TonForecastDirection,
) {
  return beginCell()
    .storeUint(
      direction === "yes" ? TON_FORECAST_OP_BET_YES : TON_FORECAST_OP_BET_NO,
      32,
    )
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildTonForecastBetTransferMessage(input: {
  contractAddress: string;
  direction: TonForecastDirection;
  amountTon: number | string;
}) {
  const numericAmount =
    typeof input.amountTon === "string"
      ? Number(input.amountTon)
      : input.amountTon;

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Forecast stake amount must be a positive TON value.");
  }

  return {
    address: input.contractAddress,
    amount: toNano(numericAmount).toString(),
    payload: buildTonForecastBetPayloadBase64(input.direction),
  };
}

export function buildTonForecastLockPayloadBase64() {
  return beginCell()
    .storeUint(TON_FORECAST_OP_LOCK_MARKET, 32)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildTonForecastResolvePayloadBase64(input: {
  finalPriceE9: number;
  resolvedAt: number;
}) {
  return beginCell()
    .storeUint(TON_FORECAST_OP_RESOLVE_MARKET, 32)
    .storeUint(input.finalPriceE9, 64)
    .storeUint(input.resolvedAt, 32)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildTonForecastClaimPayloadBase64() {
  return beginCell()
    .storeUint(TON_FORECAST_OP_CLAIM_REWARD, 32)
    .endCell()
    .toBoc()
    .toString("base64");
}

export function buildTonForecastClaimForPayloadBase64(input: {
  walletAddress: string;
}) {
  return beginCell()
    .storeUint(TON_FORECAST_OP_CLAIM_REWARD_FOR, 32)
    .storeAddress(Address.parse(input.walletAddress))
    .endCell()
    .toBoc()
    .toString("base64");
}

export function parseTonForecastPayloadBase64(
  value?: string | null,
): ParsedTonForecastContractPayload | null {
  if (!value) {
    return null;
  }

  try {
    const slice = Cell.fromBase64(value).beginParse();
    const opcode = slice.loadUint(32);

    if (opcode === TON_FORECAST_OP_BET_YES) {
      return { type: "bet_yes" };
    }

    if (opcode === TON_FORECAST_OP_BET_NO) {
      return { type: "bet_no" };
    }

    if (opcode === TON_FORECAST_OP_LOCK_MARKET) {
      return { type: "lock_market" };
    }

    if (opcode === TON_FORECAST_OP_RESOLVE_MARKET) {
      return {
        type: "resolve_market",
        finalPriceE9: Number(slice.loadUintBig(64)),
        resolvedAt: Number(slice.loadUintBig(32)),
      };
    }

    if (opcode === TON_FORECAST_OP_CLAIM_REWARD) {
      return { type: "claim_reward" };
    }

    if (opcode === TON_FORECAST_OP_CLAIM_REWARD_FOR) {
      return {
        type: "claim_reward_for",
        walletAddress: slice.loadAddress().toString(),
      };
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
