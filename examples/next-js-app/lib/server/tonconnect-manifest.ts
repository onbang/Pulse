const TONCONNECT_MANIFEST_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=0, must-revalidate",
} as const;

function resolveBaseOrigin(requestUrl: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  return new URL(requestUrl).origin;
}

export function buildTonConnectManifest(requestUrl: string) {
  const origin = resolveBaseOrigin(requestUrl);

  return {
    url: origin,
    name: "STON Pulse",
    iconUrl: `${origin}/pulse-logo.png`,
  };
}

export function getTonConnectManifestHeaders() {
  return TONCONNECT_MANIFEST_HEADERS;
}
