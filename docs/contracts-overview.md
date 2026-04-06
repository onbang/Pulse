# Contracts Overview

This document maps the smart-contract surface used by STON Pulse, explains how the forecast market is structured end-to-end, and records the gaps that still matter for production readiness.

## 1. What contract packages exist in this repo

### Contracts we build and own

- `packages/prediction-market-contract/contracts/TonForecastMarket.tact`
  - Main onchain contract for token forecast rounds.
  - One deployed contract represents one market for `token + timeframe + roundStart`.
  - Generated wrappers live in `packages/prediction-market-contract/build/TonForecastMarket`.

### Contract helper package for that contract

- `packages/prediction-sdk`
  - Not a contract by itself.
  - Builds and parses TON payloads for `TonForecastMarket`.
  - Contains opcode and payload helpers for `bet`, `lock`, `resolve`, and `claim`.

### External STON.fi contract wrappers used by the app

- `packages/sdk`
  - DEX wrappers: routers, pools, LP accounts, and pTON contracts.
  - Farm wrappers: `FarmNftMinterV1/V2/V3` and `FarmNftItemV1/V2/V3`.
  - pTON wrappers: `PtonV1`, `PtonV2_1`.
  - These are SDK abstractions over external STON.fi contracts, not local onchain sources in this repo.

- `packages/stake-sdk`
  - Stake wrappers: `StakeNftMinter`, `StakeNftItem`.
  - Also SDK-level integration for external stake contracts.

## 2. TonForecastMarket structure

### Contract lifecycle

- `open`
  - Bets are accepted until `closeTime`.
- `locked`
  - Betting is closed, waiting for resolution.
- `resolved_yes`
  - Final price finished above the upper threshold.
- `resolved_no`
  - Final price finished below the lower threshold.
- `resolved_draw`
  - Final price finished inside the threshold band, or the winning side had no liquidity and the market falls back to refund mode.

### Core config stored onchain

- `owner`
  - Wallet that created the market.
- `resolver`
  - Wallet allowed to resolve the market.
- `treasury`
  - Fee receiver.
- `token`
  - Token address the forecast is based on.
- `timeframeSeconds`
  - Round duration.
- `thresholdBps`
  - Percent band used to separate `yes`, `no`, and `draw`.
- `referencePriceE9`
  - Price snapshot captured at market creation.
- `protocolFeeBps`
  - Fee charged from winners' profit.
- `createdAt`, `closeTime`
  - Round timing.

### Mutable state stored onchain

- `status`
  - Current lifecycle state.
- `resolvedAt`, `finalPriceE9`
  - Resolution outcome.
- `totalYes`, `totalNo`
  - Total liquidity on each side.
- `positions`
  - Per-wallet map with `yesStake`, `noStake`, `claimed`.

### Internal messages the contract accepts

- `BetYes`
- `BetNo`
- `LockMarket`
- `ResolveMarket`
- `ClaimReward`
- `ClaimRewardFor`

### Getters used by the app

- `getMarketState`
  - Reads the full market snapshot.
- `getPosition`
  - Reads one wallet position and claim flag.

## 3. How the forecast flow works end-to-end

### User flow

1. User connects a TON wallet in the Next.js app.
2. User picks a token and timeframe from the forecast UI.
3. If no active market exists, the app creates a new `TonForecastMarket` intent and the first bet becomes the bootstrap liquidity.
4. If an active market already exists, the app sends a `bet` intent directly to that market contract.
5. The app polls `/api/forecast-markets/sync` until the bet is confirmed onchain and mirrored into SQLite/community state.
6. After `closeTime`, the resolver flow locks and resolves the market.
7. Winning wallets are auto-claimed by the backend when automation is available.
8. If auto-claim has not landed yet, the user can now trigger a manual claim from the UI.

### Backend orchestration

- `examples/next-js-app/lib/server/forecast-market-store.ts`
  - Creates deterministic market addresses from `TonForecastMarket.fromInit(...)`.
  - Stores market rows and auto-claim state in SQLite.
  - Syncs chain activity from TonAPI.
  - Maintains community projections such as `prediction_rounds` and `prediction_settlements`.
  - Drives `lock`, `resolve`, and `claim` through resolver automation.

- `examples/next-js-app/app/api/forecast-markets/*`
  - Route handlers for `context`, `create-intent`, `bet-intent`, `claim-intent`, `lock-intent`, `resolve-intent`, `sync`, and `auto-cycle`.

### Frontend integration

- `examples/next-js-app/components/community/price-prediction-card.tsx`
  - Opens wallet transactions through TON Connect.
  - Tracks bet submission state.
  - Polls `sync` for onchain confirmation.
  - Now also shows wallet-specific settled-market state and exposes manual claim when a payout is claimable.

## 4. What was missing and what is now done

### Done now

- Manual claim was added to the forecast UI.
- Resolver/operator fallback controls were added to the forecast UI for manual `lock` and `resolve`.
- The server now returns wallet-specific forecast state (`hasPosition`, `claimable`, `claimed`, `winningSide`, resolver capabilities).
- `claim-intent` no longer blindly prepares a transaction when the wallet has no winning position or already claimed.
- `lock-intent` and `resolve-intent` now validate market state instead of returning generic success payloads.
- `resolve-intent` can now derive the final price snapshot on the backend, so the UI does not have to manually construct resolver payload data.
- Auto-cycle runs are now recorded in SQLite, exposed through health/ops endpoints, and mirrored into structured runtime logs.
- Storage diagnostics now surface whether the app is running on durable or ephemeral paths, and production can fail fast with `STON_PULSE_REQUIRE_DURABLE_STORAGE=true`.
- `lint:tsc` is green locally again alongside `next build --webpack`.
- Forecast API documentation was updated to list the full route surface.

## 5. What is still missing

- Managed durable backend storage
  - The app no longer silently relies on ephemeral `/tmp` when `STON_PULSE_REQUIRE_DURABLE_STORAGE=true`, but the persistence layer is still SQLite. A future step is migrating community/forecast state to a managed service if we want multi-instance writes instead of mounted-disk durability.

- Automated alert delivery
  - We now expose resolver balance, recent auto-cycle runs, stuck markets, and auto-claim errors via `/api/health` and `/api/forecast-markets/ops`, but alert routing itself (Slack/Telegram/PagerDuty) still needs to be wired separately if we want proactive notifications.

## 6. Recommended next steps

1. Add a small resolver-only control surface for manual `lock` and `resolve`.
2. Move SQLite storage to a durable production-backed location or service.
3. Add telemetry for auto-cycle failures, claim retries, and resolver balance.
4. Fix the `lint:tsc` workflow so typecheck becomes a reliable CI signal again.
