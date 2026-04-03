import type { NetworkProvider } from "@ton/blueprint";
import { toNano } from "@ton/core";

import { PulsePredictionMarket } from "../wrappers/PulsePredictionMarket.js";
import { resolveBigIntInput } from "./_helpers";

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();
  const sender = provider.sender();
  const senderAddress = sender.address;

  if (!senderAddress) {
    throw new Error("Deploy sender address is required.");
  }

  const roundDurationSeconds = await resolveBigIntInput(
    ui,
    "Round duration in seconds",
    process.env.PREDICTION_ROUND_DURATION_SECONDS,
    3600n,
  );

  const protocolFeeBps = await resolveBigIntInput(
    ui,
    "Protocol fee in basis points",
    process.env.PREDICTION_PROTOCOL_FEE_BPS,
    300n,
  );

  const contract = provider.open(
    await PulsePredictionMarket.fromInit(
      senderAddress,
      roundDurationSeconds,
      protocolFeeBps,
    ),
  );

  ui.write(`Prediction market address: ${contract.address.toString()}`);

  if (await provider.isContractDeployed(contract.address)) {
    ui.write("Contract is already deployed at this address.");
    ui.write(
      `Set NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=${contract.address.toString()}`,
    );
    return;
  }

  ui.setActionPrompt("Sending deploy transaction...");
  await provider.deploy(contract, toNano("0.08"));
  await provider.waitForDeploy(contract.address);
  ui.clearActionPrompt();

  ui.write("Prediction market contract deployed successfully.");
  ui.write(
    `Set NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=${contract.address.toString()}`,
  );
}
