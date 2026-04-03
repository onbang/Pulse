# Prediction Market Deployment Workflow

This repository is now ready for a deployed `PulsePredictionMarket` contract workflow.

## 1. Install contract tooling

Recommended stack:

- `tact`
- TON wallet / deploy key
- testnet or mainnet RPC / explorer access

## 2. Compile the contract

Contract source:

- [PulsePredictionMarket.tact](/Users/sergey/Documents/Playground/Project/packages/prediction-sdk/contracts/PulsePredictionMarket.tact)

Compile it with your preferred Tact pipeline and keep the resulting contract address.

## 3. Configure the app

Set these env vars:

- `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=<deployed contract address>`
- `NEXT_PUBLIC_PREDICTION_TREASURY_ADDRESS=<optional legacy fallback>`

Once `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS` is present, the app switches to contract-mode payloads automatically.

## 4. Fund and verify

- fund the contract with enough TON to handle payouts / gas
- verify that `PlaceBet` messages arrive
- verify that `CloseRound`, `SettleRound`, and `Claim` can be executed by admin / users

## 5. Enable settlement ops

Settlement can be handled by:

- a small admin dashboard
- a backend signer / cron
- a dedicated oracle flow

The SDK already exposes the payload builders needed for these messages.
