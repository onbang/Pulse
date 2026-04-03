# @ston-pulse/prediction-market-contract

Deployment-oriented workspace package for the `PulsePredictionMarket` smart
contract. This package is responsible for:

- compiling the Tact contract through Blueprint,
- preparing deployment and admin scripts,
- keeping the onchain contract workflow separate from the app UI package.

## Planned workflow

1. `pnpm --filter @ston-pulse/prediction-market-contract build`
2. `pnpm --filter @ston-pulse/prediction-market-contract deploy`
3. Set `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS` in the app environment.
4. Use admin scripts to close and settle rounds, and wallet-side `claim`.
