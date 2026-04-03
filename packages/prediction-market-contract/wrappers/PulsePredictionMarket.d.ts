import type { Address, Cell, Contract, ContractProvider, Sender } from "@ton/core";

export type PlaceBet = {
  $$type: "PlaceBet";
  marketId: string;
  marketLabel: string;
  direction: bigint;
};

export type CloseRound = {
  $$type: "CloseRound";
  marketId: string;
};

export type SettleRound = {
  $$type: "SettleRound";
  marketId: string;
  result: bigint;
};

export type Claim = {
  $$type: "Claim";
  marketId: string;
};

export declare class PulsePredictionMarket implements Contract {
  static fromInit(
    admin: Address,
    roundDurationSeconds: bigint,
    protocolFeeBps: bigint,
  ): Promise<PulsePredictionMarket>;
  static fromAddress(address: Address): PulsePredictionMarket;

  readonly address: Address;
  readonly init?: { code: Cell; data: Cell };

  constructor(address: Address, init?: { code: Cell; data: Cell });

  send(
    provider: ContractProvider,
    via: Sender,
    args: { value: bigint; bounce?: boolean | null | undefined },
    message: PlaceBet | CloseRound | SettleRound | Claim,
  ): Promise<void>;
}
