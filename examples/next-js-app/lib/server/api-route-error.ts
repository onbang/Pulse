import { NextResponse } from "next/server";

import { logRuntimeError } from "@/lib/server/runtime-logger";

export async function jsonRouteError(input: {
  request: Request;
  scope: string;
  error: unknown;
  fallbackMessage: string;
  status?: number;
  metadata?: Record<string, unknown>;
}) {
  const url = new URL(input.request.url);

  await logRuntimeError({
    scope: input.scope,
    error: input.error,
    fallbackMessage: input.fallbackMessage,
    path: url.pathname,
    method: input.request.method,
    metadata: {
      search: url.search,
      ...input.metadata,
    },
  });

  return NextResponse.json(
    {
      error:
        input.error instanceof Error
          ? input.error.message
          : input.fallbackMessage,
    },
    { status: input.status ?? 500 },
  );
}
