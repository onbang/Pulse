# STON Pulse app

STON Pulse is the main user-facing app in this workspace. It is both a standalone web app and the frontend for the Telegram Mini App flow.

## Core experience

- TON Connect wallet onboarding
- Personal profile with levels, points, streaks, and achievements
- Daily check-ins and gamified progression
- Swap intelligence and community prediction rounds
- Pool comments with emoji reactions
- Watchlist, leaderboard, and community activity feed
- Telegram Mini App deep links and bot-ready launch paths
- TonAPI-powered wallet profile context

## Local run

1. Install dependencies:

```sh
pnpm install
```

2. Copy env file:

```sh
cp .env.example .env.local
```

3. Start the app:

```sh
pnpm --filter @ston-fi/sdk-example-next-js-app dev
```

## Verification

```sh
pnpm --filter @ston-fi/sdk-example-next-js-app lint:tsc
pnpm --filter @ston-fi/sdk-example-next-js-app exec next build --webpack
```

## API surface

- `GET /api/health`
- `POST /api/community/profile`
- `GET /api/community/state`
- `POST /api/community/check-in`
- `POST /api/community/comments`
- `POST /api/community/comments/reaction`
- `POST /api/community/predictions`
- `PATCH /api/community/predictions`
- `POST /api/community/watchlist`
- `POST /api/community/track-activity`
- `POST /api/telegram/auth`
- `GET /api/ton/profile/[wallet]`
- `GET /tonconnect-manifest.json`
- `GET /api/tonconnect-manifest`
- `GET /api/debug/runtime-logs`
- `POST /api/debug/runtime-logs`
- `GET /api/forecast-markets/context`
- `GET /api/forecast-markets/ops`
- `POST /api/forecast-markets/create-intent`
- `POST /api/forecast-markets/bet-intent`
- `POST /api/forecast-markets/claim-intent`
- `POST /api/forecast-markets/lock-intent`
- `POST /api/forecast-markets/resolve-intent`
- `PUT /api/forecast-markets/sync`
- `POST /api/forecast-markets/auto-cycle`

## Environment

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`
- `NEXT_PUBLIC_CHECKIN_TREASURY_ADDRESS`
- `NEXT_PUBLIC_PREDICTION_TREASURY_ADDRESS`
- `NEXT_PUBLIC_FORECAST_TREASURY_ADDRESS`
- `NEXT_PUBLIC_FORECAST_RESOLVER_ADDRESS`
- `NEXT_PUBLIC_FORECAST_AUTO_CYCLE_ENABLED`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
- `TELEGRAM_BOT_TOKEN`
- `FORECAST_RESOLVER_ADDRESS`
- `FORECAST_RESOLVER_MNEMONIC`
- `FORECAST_CRON_SECRET`
- `STON_PULSE_DATABASE_URL`
- `STON_PULSE_DATABASE_NAMESPACE`
- `STON_PULSE_DATA_DIR`
- `STON_PULSE_REQUIRE_DURABLE_STORAGE`
- `STON_PULSE_DB_FILE`
- `STON_PULSE_LOG_FILE`
- `STON_PULSE_DEBUG_LOG_SECRET`

## Runtime logs

- Server route failures are now written to a runtime log file
- Client-side crashes and unhandled promise rejections are also reported automatically
- The same structured entries are mirrored to stdout/stderr, so they also show up in Vercel Runtime Logs
- Local default log path: `.data/runtime-errors.log`
- Serverless default log path: `/tmp/ston-pulse/runtime-errors.log`
- To override the file location, set `STON_PULSE_LOG_FILE`
- To protect log reads in production, set `STON_PULSE_DEBUG_LOG_SECRET`

Read the latest entries from the app:

```sh
curl -s "http://localhost:3000/api/debug/runtime-logs?limit=100&secret=your-secret"
```

or on production:

```sh
curl -s "https://your-domain.example/api/debug/runtime-logs?limit=100&secret=your-secret"
```

The response includes:

- `file`: the active runtime log file path
- `count`: how many entries were returned
- `entries`: recent log events in JSON form

Each entry includes timestamp, scope, message, stack trace, route path, and extra metadata when available.

Operational snapshot for resolver wallet and auto-cycle:

```sh
curl -s "http://localhost:3000/api/forecast-markets/ops?secret=your-secret"
```

## Deployment notes

- Default TON Connect manifest is now served from `/tonconnect-manifest.json`
- `/api/tonconnect-manifest` remains available as a compatible alias with the same JSON payload
- The app still uses SQLite through `node:sqlite`, but it can now mirror the shared runtime state into external Postgres
- Set `STON_PULSE_DATABASE_URL` to a Postgres or Neon connection string to enable durable external persistence
- If you already use Vercel Postgres or Neon env injection, `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL`, and `DATABASE_URL` are also recognized automatically
- `STON_PULSE_DATABASE_NAMESPACE` can be set to keep preview and production state separated when they share the same Postgres database
- In local development without external Postgres, the default storage path is `.data/community.sqlite`
- In serverless runtimes like Vercel without external Postgres, the default storage path falls back to `/tmp/ston-pulse/community.sqlite` to avoid read-only filesystem errors
- Runtime logs follow the same writable storage rule and default to `.data/runtime-errors.log` locally or `/tmp/ston-pulse/runtime-errors.log` on serverless
- With `STON_PULSE_DATABASE_URL` enabled, each request hydrates a scratch SQLite file from Postgres, runs the existing business logic, and writes the updated snapshot back before finishing
- `STON_PULSE_DB_FILE` and `STON_PULSE_DATA_DIR` are now for local development or self-hosted persistent volumes only
- On Vercel Functions, `STON_PULSE_DB_FILE` and `STON_PULSE_DATA_DIR` still only change the local scratch path and do not make SQLite durable across deploys, cold starts, or new instances
- Set `STON_PULSE_REQUIRE_DURABLE_STORAGE=true` in production if you want the app to fail fast whenever the database still resolves to an ephemeral path
- `GET /api/health` now reports `external-postgres` when durable Postgres snapshot persistence is active, plus the latest forecast auto-cycle summary
- Token forecasts use one `TonForecastMarket` contract per `token + timeframe + roundStart`
- `POST /api/forecast-markets/auto-cycle` is scheduled via Vercel Cron every minute to lock closed rounds, resolve winners, and trigger automatic winner payouts
- Automatic resolution and payouts require a funded resolver wallet via `FORECAST_RESOLVER_MNEMONIC` or `FORECAST_RESOLVER_ADDRESS`
- The forecast card now exposes manual fallback controls for `lock`, `resolve`, and `claim` when the connected wallet is allowed to perform them
- `FORECAST_CRON_SECRET` can be set to protect the auto-cycle route with a bearer token

## Hobby scheduler

- Vercel Hobby does not support minute-level Cron for this workflow
- The repository includes `.github/workflows/forecast-auto-cycle.yml` as the external scheduler fallback
- It triggers `https://pulse-next-js-app.vercel.app/api/forecast-markets/auto-cycle` every 5 minutes
- To enable it, add the same `CRON_SECRET` value as a GitHub Actions secret named `CRON_SECRET`
- Optional: add a repository variable `FORECAST_AUTO_CYCLE_URL` if the production domain changes
