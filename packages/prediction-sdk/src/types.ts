export type PredictionDirection = "up" | "down";
export type TonForecastDirection = "yes" | "no";
export type TonForecastMarketStatus =
  | "pending"
  | "open"
  | "locked"
  | "resolved_yes"
  | "resolved_no"
  | "resolved_draw";

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
  tokenAddress: string;
  timeframeCode: number;
  roundStartTimestamp: number;
};

export type PredictionCloseRoundInput = {
  roundId: string;
  tokenAddress: string;
  timeframeCode: number;
  roundStartTimestamp: number;
};

export type PredictionSettleRoundInput = {
  roundId: string;
  tokenAddress: string;
  timeframeCode: number;
  roundStartTimestamp: number;
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
      tokenAddress: string;
      timeframeCode: number;
      roundStartTimestamp: number;
    }
  | {
      type: "settle_round";
      roundId: string;
      tokenAddress: string;
      timeframeCode: number;
      roundStartTimestamp: number;
      result: PredictionDirection;
    }
  | {
      type: "claim";
      roundId: string;
      tokenAddress: string;
      timeframeCode: number;
      roundStartTimestamp: number;
    };

export type ParsedTonForecastContractPayload =
  | {
      type: "bet_yes";
    }
  | {
      type: "bet_no";
    }
  | {
      type: "lock_market";
    }
  | {
      type: "resolve_market";
      finalPriceE9: number;
      resolvedAt: number;
    }
  | {
      type: "claim_reward";
    }
  | {
      type: "claim_reward_for";
      walletAddress: string;
    };
