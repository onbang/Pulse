const DEFAULT_FORECAST_TREASURY_ADDRESS =
  "UQCgKml7bxoGETrbA7dHKzttwluVTM4OT_K3WG-el_epHllC";

const DEFAULT_FORECAST_DEPLOY_RESERVE_TON = "0.05";
const DEFAULT_FORECAST_CLAIM_TRIGGER_TON = "0.02";
const DEFAULT_FORECAST_PROTOCOL_FEE_BPS = 300;
const DEFAULT_FORECAST_THRESHOLD_PRESETS_BPS = [50, 100, 200];
const DEFAULT_FORECAST_AUTO_CYCLE_ENABLED = true;

function parseThresholdPresets(value?: string | null) {
  if (!value?.trim()) {
    return DEFAULT_FORECAST_THRESHOLD_PRESETS_BPS;
  }

  const parsed = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

  return parsed.length > 0 ? parsed : DEFAULT_FORECAST_THRESHOLD_PRESETS_BPS;
}

export function getForecastTreasuryAddress() {
  return (
    process.env.NEXT_PUBLIC_FORECAST_TREASURY_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_PREDICTION_TREASURY_ADDRESS?.trim() ||
    DEFAULT_FORECAST_TREASURY_ADDRESS
  );
}

export function getForecastResolverAddress(ownerAddress?: string | null) {
  return (
    process.env.NEXT_PUBLIC_FORECAST_RESOLVER_ADDRESS?.trim() ||
    process.env.FORECAST_RESOLVER_ADDRESS?.trim() ||
    ownerAddress?.trim() ||
    getForecastTreasuryAddress()
  );
}

export function getForecastProtocolFeeBps() {
  const parsed = Number(
    process.env.NEXT_PUBLIC_FORECAST_PROTOCOL_FEE_BPS ??
      process.env.FORECAST_PROTOCOL_FEE_BPS,
  );

  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_FORECAST_PROTOCOL_FEE_BPS;
  }

  return parsed;
}

export function getForecastDeployReserveTon() {
  return (
    process.env.NEXT_PUBLIC_FORECAST_DEPLOY_RESERVE_TON?.trim() ||
    process.env.FORECAST_DEPLOY_RESERVE_TON?.trim() ||
    DEFAULT_FORECAST_DEPLOY_RESERVE_TON
  );
}

export function getForecastClaimTriggerTon() {
  return (
    process.env.NEXT_PUBLIC_FORECAST_CLAIM_TRIGGER_TON?.trim() ||
    process.env.FORECAST_CLAIM_TRIGGER_TON?.trim() ||
    DEFAULT_FORECAST_CLAIM_TRIGGER_TON
  );
}

export function getForecastThresholdPresetsBps() {
  return parseThresholdPresets(
    process.env.NEXT_PUBLIC_FORECAST_THRESHOLD_PRESETS_BPS ??
      process.env.FORECAST_THRESHOLD_PRESETS_BPS,
  );
}

export function getForecastResolverMnemonic() {
  return (
    process.env.FORECAST_RESOLVER_MNEMONIC?.trim() ||
    process.env.FORECAST_AUTOMATION_MNEMONIC?.trim() ||
    process.env.TON_WALLET_MNEMONIC?.trim() ||
    ""
  );
}

export function getForecastAutoCycleEnabled() {
  const raw =
    process.env.FORECAST_AUTO_CYCLE_ENABLED ??
    process.env.NEXT_PUBLIC_FORECAST_AUTO_CYCLE_ENABLED;

  if (!raw?.trim()) {
    return DEFAULT_FORECAST_AUTO_CYCLE_ENABLED;
  }

  return raw === "1" || raw.toLowerCase() === "true";
}

export function getForecastCronSecret() {
  return (
    process.env.FORECAST_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}
