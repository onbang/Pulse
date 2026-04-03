export type PredictionDirection = "up" | "down";

export type PredictionMessageSource = "machine" | "legacy";

export type PredictionTransportMode = "treasury_comment" | "contract_v1";

export type PredictionBetTransferInput = {
  marketId: string;
  label: string;
  direction: PredictionDirection;
  amount: number;
};

export type ParsedPredictionBetTransfer = {
  marketId: string | null;
  label: string;
  direction: PredictionDirection;
  amount: number;
  source: PredictionMessageSource;
};

export type PredictionClaimInput = {
  marketId: string;
};

export type PredictionCloseRoundInput = {
  marketId: string;
};

export type PredictionSettleRoundInput = {
  marketId: string;
  result: PredictionDirection;
};
