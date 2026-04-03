# STON Pulse

STON Pulse is a productized STON.fi-based social trading app built on top of the public SDK workspace. It combines swap execution, liquidity workflows, Telegram Mini App entrypoints, community predictions, profiles, gamification, and social interaction in one monorepo.

## What is inside

- `examples/next-js-app`: the main STON Pulse web app and Telegram Mini App frontend
- `packages/telegram-bot`: Telegram bot that launches and deep-links into the Mini App
- `packages/sdk`: STON.fi SDK workspace package
- `packages/stake-sdk`: STON.fi stake SDK workspace package

## Product features

- TON Connect profile with points, streaks, levels, and achievements
- Daily check-ins and community progression
- Swap prediction rounds with stakes, odds, settlement flow, and payout previews
- Pool comments with emoji reactions
- Watchlist, leaderboard, and live activity feed
- Telegram Mini App routing and bot launch flows
- TonAPI-powered wallet profile insights

## Local development

1. Install dependencies:

```sh
pnpm install
```

2. Copy env templates:

```sh
cp examples/next-js-app/.env.example examples/next-js-app/.env.local
cp packages/telegram-bot/.env.example packages/telegram-bot/.env.local
```

3. Run the app:

```sh
pnpm dev
```

## Verification

```sh
pnpm ci
```

This runs:

- monorepo lint
- Next.js typecheck
- Next.js production build with webpack
- Telegram bot build

## Deployment checklist

- Set `NEXT_PUBLIC_APP_URL`
- Set `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
- Set `TELEGRAM_BOT_TOKEN`
- Set `TELEGRAM_MINI_APP_URL`
- Set `STON_PULSE_DB_FILE` for persistent SQLite storage
- Register Telegram bot commands with `pnpm --filter @ston-pulse/telegram-bot register`
- Point TON Connect manifest to `/api/tonconnect-manifest` or your own production manifest URL
- Use `GET /api/health` as a simple platform health probe
- Follow the full release flow in `docs/release-checklist.md`

## GitHub and CI

The repo includes a GitHub Actions workflow at `.github/workflows/ci.yml` that validates the web app and Telegram bot on every push and pull request.

## Notes

- The current persistence layer uses SQLite through `node:sqlite`
- Node 22 is required
- During production builds, Node may print an experimental warning for `node:sqlite`; this is expected with the current runtime
