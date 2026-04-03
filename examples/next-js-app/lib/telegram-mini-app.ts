import { createHmac } from "node:crypto";

export type TelegramMiniAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  allows_write_to_pm?: boolean;
};

export type TelegramMiniAppInitData = {
  auth_date?: string;
  chat_instance?: string;
  chat_type?: string;
  hash?: string;
  query_id?: string;
  start_param?: string;
  user?: TelegramMiniAppUser;
};

export function parseTelegramInitData(
  initData: string,
): TelegramMiniAppInitData {
  const params = new URLSearchParams(initData);
  const userRaw = params.get("user");

  return {
    auth_date: params.get("auth_date") ?? undefined,
    chat_instance: params.get("chat_instance") ?? undefined,
    chat_type: params.get("chat_type") ?? undefined,
    hash: params.get("hash") ?? undefined,
    query_id: params.get("query_id") ?? undefined,
    start_param: params.get("start_param") ?? undefined,
    user: userRaw ? (JSON.parse(userRaw) as TelegramMiniAppUser) : undefined,
  };
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    return false;
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const signature = createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return signature === hash;
}
