import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  return NextResponse.json({
    url: origin,
    name: "STON Pulse",
    iconUrl: `${origin}/pulse-logo.png`,
  });
}
