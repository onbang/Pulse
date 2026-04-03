# @ston-pulse/prediction-sdk

Shared prediction market helpers for STON Pulse.

What is in the package:

- TON message builders for prediction bets
- contract-mode opcode payload builders for `PlaceBet`, `CloseRound`, `SettleRound`, and `Claim`
- A contract wrapper for the market treasury/contract address
- A stable machine-readable comment format for bet reconciliation
- A contract specification draft in `contracts/`

Current status:

- The app can already use this package to produce consistent onchain bet payloads
- The app can switch between treasury compatibility mode and contract mode
- The actual prediction market smart contract still needs deployment before contract mode can go live
