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
- `GET /api/tonconnect-manifest`
- `GET /api/forecast-markets/context`
- `POST /api/forecast-markets/create-intent`
- `POST /api/forecast-markets/bet-intent`
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
- `STON_PULSE_DB_FILE`

## Deployment notes

- Default TON Connect manifest is now served from `/api/tonconnect-manifest`
- The app uses SQLite storage through `node:sqlite`
- In local development the default storage path is `.data/community.sqlite`
- In serverless runtimes like Vercel the default storage path falls back to `/tmp/ston-pulse/community.sqlite` to avoid read-only filesystem errors
- For durable production persistence, provide a custom `STON_PULSE_DB_FILE` backed by writable storage instead of relying on ephemeral `/tmp`
- `GET /api/health` can be used as a lightweight health endpoint
- Token forecasts use one `TonForecastMarket` contract per `token + timeframe + roundStart`
- `GET /api/forecast-markets/auto-cycle` is scheduled via Vercel Cron every minute to lock closed rounds, resolve winners, and trigger automatic winner payouts
- Automatic resolution and payouts require a funded resolver wallet via `FORECAST_RESOLVER_MNEMONIC` or `FORECAST_RESOLVER_ADDRESS`
- `FORECAST_CRON_SECRET` can be set to protect the auto-cycle route with a bearer token

## Hobby scheduler

- Vercel Hobby does not support minute-level Cron for this workflow
- The repository includes `.github/workflows/forecast-auto-cycle.yml` as the external scheduler fallback
- It triggers `https://pulse-next-js-app.vercel.app/api/forecast-markets/auto-cycle` every 5 minutes
- To enable it, add the same `CRON_SECRET` value as a GitHub Actions secret named `CRON_SECRET`
- Optional: add a repository variable `FORECAST_AUTO_CYCLE_URL` if the production domain changes
