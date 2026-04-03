import type { Config } from "@ton/blueprint";

const endpoint = process.env.TONCENTER_RPC_ENDPOINT?.trim();
const apiKey = process.env.TONCENTER_API_KEY?.trim();

export const config: Config = endpoint
  ? {
      network: {
        endpoint,
        version: "v2",
        ...(apiKey ? { key: apiKey } : {}),
      },
    }
  : {};

export default config;
