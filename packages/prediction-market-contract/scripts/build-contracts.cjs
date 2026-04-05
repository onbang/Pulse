require("ts-node/register");

const { buildOne } = require("@ton/blueprint/dist/build.js");

const silentUi = {
  write(message) {
    if (message) {
      process.stdout.write(`${String(message)}\n`);
    }
  },
  prompt() {
    throw new Error(
      "Interactive prompt is not available during contract build",
    );
  },
  inputAddress() {
    throw new Error("Interactive input is not available during contract build");
  },
  input() {
    throw new Error("Interactive input is not available during contract build");
  },
  choose() {
    throw new Error(
      "Interactive choice is not available during contract build",
    );
  },
  setActionPrompt(message) {
    if (message) {
      process.stdout.write(`${String(message)}\n`);
    }
  },
  clearActionPrompt() {},
};

async function main() {
  for (const contract of ["PulsePredictionMarket", "TonForecastMarket"]) {
    await buildOne(contract, silentUi);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
