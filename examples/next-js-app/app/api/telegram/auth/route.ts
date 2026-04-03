import { NextResponse } from "next/server";

import {
  parseTelegramInitData,
  validateTelegramInitData,
} from "@/lib/telegram-mini-app";

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json(
      { ok: false, error: "Missing TELEGRAM_BOT_TOKEN" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { initData?: string };
  const initData = body.initData?.trim();

  if (!initData) {
    return NextResponse.json(
      { ok: false, error: "Missing initData" },
      { status: 400 },
    );
  }

  const isValid = validateTelegramInitData(initData, botToken);

  if (!isValid) {
    return NextResponse.json(
      { ok: false, error: "Invalid initData" },
      { status: 401 },
    );
  }

  const parsed = parseTelegramInitData(initData);

  return NextResponse.json({
    ok: true,
    user: parsed.user ?? null,
    startParam: parsed.start_param ?? null,
    chatType: parsed.chat_type ?? null,
  });
}
