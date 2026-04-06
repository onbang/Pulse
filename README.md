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
pnpm run verify
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
- Set `STON_PULSE_DATABASE_URL` to a Postgres or Neon connection string if you want durable persistence on Vercel
- Optional: set `STON_PULSE_DATABASE_NAMESPACE` to isolate preview and production state inside the same Postgres database
- `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL`, and `DATABASE_URL` are also recognized automatically for the external Postgres mode
- Set `STON_PULSE_DB_FILE` or `STON_PULSE_DATA_DIR` only when you control a genuinely persistent writable volume
- Do not rely on `STON_PULSE_DB_FILE` / `STON_PULSE_DATA_DIR` for SQLite durability on Vercel Functions because local filesystem storage there is temporary without external Postgres mirroring
- Set `STON_PULSE_REQUIRE_DURABLE_STORAGE=true` in production if you want deploys to fail fast on ephemeral `/tmp` storage
- Register Telegram bot commands with `pnpm --filter @ston-pulse/telegram-bot register`
- Point TON Connect manifest to `/api/tonconnect-manifest` or your own production manifest URL
- Use `GET /api/health` for storage/auto-cycle health and `GET /api/forecast-markets/ops` for protected resolver diagnostics
- Follow the full release flow in `docs/release-checklist.md`

## GitHub and CI

The repo includes a GitHub Actions workflow at `.github/workflows/ci.yml` that validates the web app and Telegram bot on every push and pull request.

## Notes

- The current persistence layer uses SQLite through `node:sqlite`
- Node 22 is required
- During production builds, Node may print an experimental warning for `node:sqlite`; this is expected with the current runtime
- Contract structure, prediction-market flow, and remaining delivery gaps are documented in `docs/contracts-overview.md`
