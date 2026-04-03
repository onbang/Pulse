# @ston-pulse/prediction-sdk

Shared prediction market helpers for STON Pulse.

What is in the package:

- TON message builders for prediction bets
- A contract wrapper for the market treasury/contract address
- A stable machine-readable comment format for bet reconciliation
- A contract specification draft in `contracts/`

Current status:

- The app can already use this package to produce consistent onchain bet payloads
- The actual prediction market smart contract still needs deployment and settlement logic
- Until deployment, the transfer message targets the configured treasury address
