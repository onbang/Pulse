# STON Pulse Telegram Bot

This bot launches the STON Pulse Telegram Mini App and exposes deep links into the main product sections.

## Environment

Create environment variables:

```sh
export TELEGRAM_BOT_TOKEN=...
export TELEGRAM_MINI_APP_URL=https://your-domain.example
export TELEGRAM_BOT_USERNAME=your_bot_username
```

## Run

```sh
pnpm --filter @ston-pulse/telegram-bot start
```

## Register commands

```sh
pnpm --filter @ston-pulse/telegram-bot register
```

## Supported commands

- `/start`
- `/app`
- `/swap`
- `/profile`
- `/leaderboard`
- `/checkin`
- `/community`
- `/help`
