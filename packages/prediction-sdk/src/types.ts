export type PredictionDirection = "up" | "down";

export type PredictionMessageSource = "machine" | "legacy";

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
