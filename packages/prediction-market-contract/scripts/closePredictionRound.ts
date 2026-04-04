import type { NetworkProvider } from "@ton/blueprint";
import { toNano } from "@ton/core";

import { PulsePredictionMarket } from "../build/PulsePredictionMarket/tact_PulsePredictionMarket.js";
import {
  parsePredictionRoundId,
  resolveContractAddress,
  resolveRoundId,
} from "./_helpers.js";

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();
  const contractAddress = await resolveContractAddress(
    ui,
    process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS,
  );
  const roundId = await resolveRoundId(ui, process.env.PREDICTION_ROUND_ID);
  const round = parsePredictionRoundId(roundId);

  const contract = provider.open(
    PulsePredictionMarket.fromAddress(contractAddress),
  );

  ui.setActionPrompt(`Closing round ${roundId}...`);
  await contract.send(
    provider.sender(),
    { value: toNano("0.03") },
    {
      $$type: "CloseRound",
      roundId,
      token: round.token,
      timeframeCode: round.timeframeCode,
      roundStartTimestamp: round.roundStartTimestamp,
    },
  );
  ui.clearActionPrompt();

  ui.write(`CloseRound sent for ${roundId}.`);
}
