# @ston-pulse/prediction-market-contract

Build-oriented workspace package for the `TonForecastMarket` smart contract.
This package is responsible for:

- compiling the Tact contract through Blueprint,
- exposing generated TypeScript wrappers for the app and backend,
- keeping the onchain contract workflow separate from the UI package.

Current package scope:

1. `pnpm --filter @ston-pulse/prediction-market-contract build`
2. import `@ston-pulse/prediction-market-contract/ton-forecast-market`
3. use the generated wrapper from the app or backend forecast flow
