import { Address } from "@ton/core";
import type { UIProvider } from "@ton/blueprint";

export async function resolveContractAddress(
  ui: UIProvider,
  value?: string | null,
) {
  const trimmed = value?.trim();

  if (trimmed) {
    return Address.parse(trimmed);
  }

  return ui.inputAddress("Prediction market contract address");
}

export async function resolveMarketId(ui: UIProvider, value?: string | null) {
  const trimmed = value?.trim();

  if (trimmed) {
    return trimmed;
  }

  return ui.input("Market id (for example: prediction:TON)");
}

export async function resolveBigIntInput(
  ui: UIProvider,
  prompt: string,
  value: string | undefined,
  fallback: bigint,
) {
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
