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

## Environment

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
- `TELEGRAM_BOT_TOKEN`
- `STON_PULSE_DB_FILE`

## Deployment notes

- Default TON Connect manifest is now served from `/api/tonconnect-manifest`
- The app uses SQLite storage through `node:sqlite`
- In local development the default storage path is `.data/community.sqlite`
- In serverless runtimes like Vercel the default storage path falls back to `/tmp/ston-pulse/community.sqlite` to avoid read-only filesystem errors
- For durable production persistence, provide a custom `STON_PULSE_DB_FILE` backed by writable storage instead of relying on ephemeral `/tmp`
- `GET /api/health` can be used as a lightweight health endpoint
