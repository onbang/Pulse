import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { getForecastOperationsSummary } from "@/lib/server/forecast-market-store";
import { getRuntimeStorageDiagnostics } from "@/lib/server/runtime-storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const storage = getRuntimeStorageDiagnostics();
    const forecast = await getForecastOperationsSummary();
    const storageHealthy = !(
      storage.requireDurableStorage && storage.databaseLikelyEphemeral
    );

    return NextResponse.json(
      {
        ok: true,
        service: "ston-pulse-web",
        timestamp: new Date().toISOString(),
        storage: {
          healthy: storageHealthy,
          mode: storage.mode,
          databaseLikelyEphemeral: storage.databaseLikelyEphemeral,
          runtimeLogLikelyEphemeral: storage.runtimeLogLikelyEphemeral,
          requireDurableStorage: storage.requireDurableStorage,
          warnings: storage.warnings,
        },
        forecast: {
          ...forecast,
          healthy: forecast.lastRun?.status !== "failed",
        },
      },
      {
        status: storageHealthy ? 200 : 503,
      },
    );
  } catch (error) {
    return jsonRouteError({
      request,
      scope: "api.health",
      error,
      fallbackMessage: "Failed to build health response",
    });
  }
}
