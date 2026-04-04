export type PredictionDirection = "up" | "down";

export type PredictionMessageSource = "machine" | "legacy";

export type PredictionTransportMode = "treasury_comment" | "contract_v1";

export type PredictionBetTransferInput = {
  marketId: string;
  roundId?: string;
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
  roundId: string;
};

export type PredictionCloseRoundInput = {
  roundId: string;
};

export type PredictionSettleRoundInput = {
  roundId: string;
  result: PredictionDirection;
};

export type ParsedPredictionContractPayload =
  | {
      type: "place_bet";
      roundId: string;
      marketId: string;
      label: string;
      tokenAddress: string;
      timeframeId: string;
      timeframeCode: number;
      roundDurationSeconds: number;
      roundStartTimestamp: number;
      direction: PredictionDirection;
    }
  | {
      type: "close_round";
      roundId: string;
    }
  | {
      type: "settle_round";
      roundId: string;
      result: PredictionDirection;
    }
  | {
      type: "claim";
      roundId: string;
    };
