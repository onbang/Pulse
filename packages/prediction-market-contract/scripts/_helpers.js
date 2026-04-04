import { Address } from "@ton/core";

const TIMEFRAME_CODE = {
  "5M": 1n,
  "15M": 2n,
  "1H": 3n,
  "4H": 4n,
  "1D": 5n,
};

export async function resolveContractAddress(ui, value) {
  const trimmed = value?.trim();

  if (trimmed) {
    return Address.parse(trimmed);
  }

  return ui.inputAddress("Prediction market contract address");
}

export async function resolveRoundId(ui, value) {
  const trimmed = value?.trim();

  if (trimmed) {
    return trimmed;
  }

  return ui.input("Round id (for example: prediction:EQ...:5M:1712236500)");
}

export function parsePredictionRoundId(roundId) {
  const parts = roundId.trim().split(":");

  if (parts.length !== 4 || parts[0] !== "prediction") {
    throw new Error(`Invalid prediction round id: ${roundId}`);
  }

  const [, tokenAddress, timeframeId, roundStartTimestampRaw] = parts;
  const timeframeCode = TIMEFRAME_CODE[timeframeId ?? ""];
  const roundStartTimestamp = BigInt(roundStartTimestampRaw ?? "");

  if (!tokenAddress || !timeframeCode || roundStartTimestamp <= 0n) {
    throw new Error(`Invalid prediction round id: ${roundId}`);
  }

  return {
    token: Address.parse(tokenAddress),
    timeframeId,
    timeframeCode,
    roundStartTimestamp,
  };
}

export async function resolveBigIntInput(ui, prompt, value, fallback) {
  const raw = value?.trim();

  if (raw) {
    return BigInt(raw);
  }

  const entered = (await ui.input(`${prompt} (${fallback.toString()})`)).trim();

  if (!entered) {
    return fallback;
  }

  return BigInt(entered);
}
