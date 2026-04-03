import { Address } from "@ton/core";

export async function resolveContractAddress(ui, value) {
  const trimmed = value?.trim();

  if (trimmed) {
    return Address.parse(trimmed);
  }

  return ui.inputAddress("Prediction market contract address");
}

export async function resolveMarketId(ui, value) {
  const trimmed = value?.trim();

  if (trimmed) {
    return trimmed;
  }

  return ui.input("Market id (for example: prediction:TON)");
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
