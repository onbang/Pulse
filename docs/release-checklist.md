# STON Pulse Release Checklist

## GitHub

- Create a new GitHub repository for STON Pulse
- Update `origin` away from `ston-fi/sdk`
- Push the current branch and enable GitHub Actions

## Web app environment

- Set `NEXT_PUBLIC_APP_URL`
- Set `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`
- Set `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
- Set `TELEGRAM_BOT_TOKEN`
- Set `STON_PULSE_DB_FILE`

## Telegram bot environment

- Set `TELEGRAM_BOT_TOKEN`
- Set `TELEGRAM_MINI_APP_URL`
- Set `TELEGRAM_BOT_USERNAME`

## Telegram rollout

- Create the bot in BotFather
- Register commands with `pnpm --filter @ston-pulse/telegram-bot register`
- Configure the Mini App URL
- Verify deep links for:
  - `/start`
  - `/swap`
  - `/profile`
  - `/leaderboard`
  - `/checkin`
  - `/community`

## Web deployment verification

- Check `GET /api/health`
- Check `GET /api/tonconnect-manifest`
- Verify TON Connect flow on production domain
- Verify Telegram Mini App init data validation
- Verify SQLite persistence path or mount

## Product smoke test

- Connect wallet
- Update profile
- Claim daily check-in
- Add liquidity comment and reaction
- Place prediction bet
- Settle a prediction round
- Verify leaderboard and profile history
