const deploymentId = process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID?.trim() ?? "";
const skewProtectionEnabled =
  process.env.NEXT_PUBLIC_VERCEL_SKEW_PROTECTION_ENABLED === "1" ||
  process.env.NEXT_PUBLIC_VERCEL_SKEW_PROTECTION_ENABLED === "true";

function shouldPinInternalRequest(url: string) {
  if (!skewProtectionEnabled || !deploymentId) {
    return false;
  }

  if (url.startsWith("/api/")) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const parsed = new URL(url, window.location.origin);

    return (
      parsed.origin === window.location.origin &&
      parsed.pathname.startsWith("/api/")
    );
  } catch {
    return false;
  }
}

export function withPinnedDeploymentUrl(url: string) {
  if (!shouldPinInternalRequest(url)) {
    return url;
  }

  if (typeof window === "undefined") {
    return url;
  }

  const parsed = new URL(url, window.location.origin);
  parsed.searchParams.set("dpl", deploymentId);

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function withPinnedDeploymentHeaders(headers?: HeadersInit) {
  const merged = new Headers(headers);

  if (skewProtectionEnabled && deploymentId) {
    merged.set("x-deployment-id", deploymentId);
  }

  return merged;
}

export function withPinnedDeploymentRequestInit(init: RequestInit = {}) {
  return {
    ...init,
    headers: withPinnedDeploymentHeaders(init.headers),
  };
}

export async function fetchInternalApi(url: string, init?: RequestInit) {
  return fetch(
    withPinnedDeploymentUrl(url),
    withPinnedDeploymentRequestInit(init),
  );
}
