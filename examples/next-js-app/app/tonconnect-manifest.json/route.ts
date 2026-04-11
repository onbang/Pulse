import { NextResponse } from "next/server";
import {
  buildTonConnectManifest,
  getTonConnectManifestHeaders,
} from "@/lib/server/tonconnect-manifest";

export async function GET(request: Request) {
  return NextResponse.json(buildTonConnectManifest(request.url), {
    headers: getTonConnectManifestHeaders(),
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: getTonConnectManifestHeaders(),
  });
}
