# PulsePredictionMarket Contract Spec

This document describes the target contract that the UI and SDK are being prepared for.

## Goals

- Accept onchain bets for `up` / `down`
- Separate rounds by market id and timeframe
- Keep total pool, side pool, and per-wallet stake onchain
- Support closing, settlement, and claims

## Storage

- `admin: Address`
- `treasury: Address`
- `round_seqno: uint64`
- `rounds: map<uint64, Round>`
- `wallet_positions: map<(uint64, Address), Position>`

## Round

- `market_id: string`
- `market_label: string`
- `status: open | closed | settled`
- `opened_at: uint32`
- `closes_at: uint32`
- `settled_at: uint32`
- `total_up: coins`
- `total_down: coins`
- `result: up | down | unset`

## Position

- `round_id: uint64`
- `wallet: Address`
- `up_stake: coins`
- `down_stake: coins`
- `claimed: bool`

## External Messages

### PlaceBet

- `op: uint32`
- `round_id: uint64`
- `direction: uint8`

The UI currently uses a transfer with a machine-readable comment:

`PULSE_PREDICTION_BET_V1|marketId|label|direction|amount`

This format is kept stable so treasury-mode and future contract-mode can be reconciled consistently.

### CloseRound

- Admin only
- Stops accepting new bets

### SettleRound

- Admin/oracle only
- Sets final direction

### Claim

- Wallet claims winnings after settlement

## UI Integration Direction

- `buildPredictionBetTransferMessage(...)` already generates a stable message
- once the contract is deployed, the SDK can switch from treasury comments to explicit contract opcodes
- the app should not need another UI rewrite when that happens
