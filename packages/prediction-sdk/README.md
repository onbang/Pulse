# @ston-pulse/prediction-sdk

Shared prediction market helpers for STON Pulse.

What is in the package:

- TON message builders for prediction bets
- contract-mode opcode payload builders for the active forecast flow
- A stable machine-readable comment format for bet reconciliation

Current status:

- The app can already use this package to produce consistent onchain bet payloads
- The app can switch between treasury compatibility mode and contract mode
- The active onchain market contract is `TonForecastMarket`
