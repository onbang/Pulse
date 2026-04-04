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
  const result = await ui.choose(
    "Settlement result",
    ["up", "down"] as const,
    (value) => (value === "up" ? "Up" : "Down"),
  );

  const contract = provider.open(
    PulsePredictionMarket.fromAddress(contractAddress),
  );

  ui.setActionPrompt(`Settling round ${roundId} as ${result}...`);
  await contract.send(
    provider.sender(),
    { value: toNano("0.03") },
    {
      $$type: "SettleRound",
      roundId,
      token: round.token,
      timeframeCode: round.timeframeCode,
      roundStartTimestamp: round.roundStartTimestamp,
      result: result === "up" ? 1n : 0n,
    },
  );
  ui.clearActionPrompt();

  ui.write(`SettleRound sent for ${roundId} with result ${result}.`);
}
