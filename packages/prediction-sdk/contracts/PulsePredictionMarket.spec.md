# PulsePredictionMarket Contract Spec

This package now targets a concrete onchain message model for prediction betting.

## Goals

- Accept `up` / `down` bets onchain
- Track one active round per `marketId`
- Keep side pools and user positions onchain
- Allow admin close/settle and user claim
- Preserve a stable fallback format for treasury-mode reconciliation until deployment

## Storage

- `admin: Address`
- `current_rounds: map<string, Round>`
- `positions: map<string, map<Address, Position>>`
- `protocol_fee_bps: uint16`

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

- `wallet: Address`
- `up_stake: coins`
- `down_stake: coins`
- `claimed: bool`

## External Messages

### PlaceBet

- `op: 0x50554231`
- `market_id: string`
- `market_label: string` in a ref cell
- `direction: uint8`
- `value: coins` from the incoming transfer

If no open round exists for the market, the contract opens one automatically.

### CloseRound

- `op: 0x50554331`
- `market_id: string`

Admin only. Stops new bets for that market.

### SettleRound

- `op: 0x50555331`
- `market_id: string`
- `result: uint8`

Admin/oracle only. Writes final result and unlocks claims.

### Claim

- `op: 0x50555031`
- `market_id: string`

Transfers the winning payout back to the bettor.

## Compatibility Layer

Until the contract is deployed, the app can still use treasury-mode comments:

`PULSE_PREDICTION_BET_V1|marketId|label|direction|amount`

This is why the SDK exposes both:

- treasury compatibility builders
- contract opcode builders
