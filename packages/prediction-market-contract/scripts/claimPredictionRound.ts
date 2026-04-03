import type { NetworkProvider } from "@ton/blueprint";
import { toNano } from "@ton/core";

import { PulsePredictionMarket } from "../build/PulsePredictionMarket/tact_PulsePredictionMarket.js";
import { resolveContractAddress, resolveMarketId } from "./_helpers.js";

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();
  const contractAddress = await resolveContractAddress(
    ui,
    process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS,
  );
  const marketId = await resolveMarketId(ui, process.env.PREDICTION_MARKET_ID);

  const contract = provider.open(
    PulsePredictionMarket.fromAddress(contractAddress),
  );

  ui.setActionPrompt(`Claiming payout for ${marketId}...`);
  await contract.send(
    provider.sender(),
    { value: toNano("0.02") },
    {
      $$type: "Claim",
      marketId,
    },
  );
  ui.clearActionPrompt();

  ui.write(`Claim sent for ${marketId}.`);
}
