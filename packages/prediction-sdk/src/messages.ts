import { Address, beginCell, Cell, fromNano, toNano } from "@ton/core";

import {
  DEFAULT_PREDICTION_TREASURY_ADDRESS,
  PREDICTION_COMMENT_PREFIX,
} from "./constants";
import { PREDICTION_OP_PLACE_BET } from "./opcodes";
import type {
  ParsedTonForecastContractPayload,
  ParsedPredictionContractPayload,
  ParsedPredictionBetTransfer,
  PredictionBetTransferInput,
  PredictionDirection,
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

    return null;
  } catch {
    return null;
  }
}

export function buildTonForecastBetPayloadBase64(input: {
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

  return beginCell()
    .storeUint(
      input.direction === "yes"
        ? TON_FORECAST_OP_BET_YES
        : TON_FORECAST_OP_BET_NO,
      32,
    )
    .storeCoins(toNano(numericAmount))
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
    payload: buildTonForecastBetPayloadBase64({
      direction: input.direction,
      amountTon: numericAmount,
    }),
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
      const stakeAmountTon =
        slice.remainingBits > 0 ? Number(fromNano(slice.loadCoins())) : null;
      return { type: "bet_yes", stakeAmountTon };
    }

    if (opcode === TON_FORECAST_OP_BET_NO) {
      const stakeAmountTon =
        slice.remainingBits > 0 ? Number(fromNano(slice.loadCoins())) : null;
      return { type: "bet_no", stakeAmountTon };
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
