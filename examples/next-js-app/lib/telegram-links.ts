import { ROUTES } from "@/constants";

export const TELEGRAM_START_PARAMS = {
  home: "ston-pulse",
  swap: "swap",
  profile: "profile",
  community: "community",
  leaderboard: "leaderboard",
  checkIn: "check-in",
} as const;

export function createTelegramMiniAppLink(
  botUsername: string,
  startParam: string = TELEGRAM_START_PARAMS.home,
) {
  return `https://t.me/${botUsername}?startapp=${encodeURIComponent(startParam)}`;
}

export function resolveTelegramStartParamRoute(startParam?: string) {
  switch (startParam) {
    case TELEGRAM_START_PARAMS.swap:
      return ROUTES.swap;
    case TELEGRAM_START_PARAMS.profile:
      return ROUTES.profile;
    case TELEGRAM_START_PARAMS.community:
      return ROUTES.community;
    case TELEGRAM_START_PARAMS.leaderboard:
      return ROUTES.leaderboard;
    case TELEGRAM_START_PARAMS.checkIn:
      return ROUTES.checkIn;
    case TELEGRAM_START_PARAMS.home:
    default:
      return "/";
  }
}
