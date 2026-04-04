import {
  Cell,
  Slice,
  Address,
  Builder,
  TupleItem,
  TupleReader,
  Dictionary,
  ContractProvider,
  Sender,
  Contract,
  ContractABI,
  DictionaryValue,
} from "@ton/core";
export type DataSize = {
  $$type: "DataSize";
  cells: bigint;
  bits: bigint;
  refs: bigint;
};
export declare function storeDataSize(
  src: DataSize,
): (builder: Builder) => void;
export declare function loadDataSize(slice: Slice): {
  $$type: "DataSize";
  cells: bigint;
  bits: bigint;
  refs: bigint;
};
export declare function loadTupleDataSize(source: TupleReader): {
  $$type: "DataSize";
  cells: bigint;
  bits: bigint;
  refs: bigint;
};
export declare function loadGetterTupleDataSize(source: TupleReader): {
  $$type: "DataSize";
  cells: bigint;
  bits: bigint;
  refs: bigint;
};
export declare function storeTupleDataSize(source: DataSize): TupleItem[];
export declare function dictValueParserDataSize(): DictionaryValue<DataSize>;
export type SignedBundle = {
  $$type: "SignedBundle";
  signature: Buffer;
  signedData: Slice;
};
export declare function storeSignedBundle(
  src: SignedBundle,
): (builder: Builder) => void;
export declare function loadSignedBundle(slice: Slice): {
  $$type: "SignedBundle";
  signature: Buffer<ArrayBufferLike>;
  signedData: Slice;
};
export declare function loadTupleSignedBundle(source: TupleReader): {
  $$type: "SignedBundle";
  signature: Buffer<ArrayBufferLike>;
  signedData: Slice;
};
export declare function loadGetterTupleSignedBundle(source: TupleReader): {
  $$type: "SignedBundle";
  signature: Buffer<ArrayBufferLike>;
  signedData: Slice;
};
export declare function storeTupleSignedBundle(
  source: SignedBundle,
): TupleItem[];
export declare function dictValueParserSignedBundle(): DictionaryValue<SignedBundle>;
export type StateInit = {
  $$type: "StateInit";
  code: Cell;
  data: Cell;
};
export declare function storeStateInit(
  src: StateInit,
): (builder: Builder) => void;
export declare function loadStateInit(slice: Slice): {
  $$type: "StateInit";
  code: Cell;
  data: Cell;
};
export declare function loadTupleStateInit(source: TupleReader): {
  $$type: "StateInit";
  code: Cell;
  data: Cell;
};
export declare function loadGetterTupleStateInit(source: TupleReader): {
  $$type: "StateInit";
  code: Cell;
  data: Cell;
};
export declare function storeTupleStateInit(source: StateInit): TupleItem[];
export declare function dictValueParserStateInit(): DictionaryValue<StateInit>;
export type Context = {
  $$type: "Context";
  bounceable: boolean;
  sender: Address;
  value: bigint;
  raw: Slice;
};
export declare function storeContext(src: Context): (builder: Builder) => void;
export declare function loadContext(slice: Slice): {
  $$type: "Context";
  bounceable: boolean;
  sender: Address;
  value: bigint;
  raw: Slice;
};
export declare function loadTupleContext(source: TupleReader): {
  $$type: "Context";
  bounceable: boolean;
  sender: Address;
  value: bigint;
  raw: Slice;
};
export declare function loadGetterTupleContext(source: TupleReader): {
  $$type: "Context";
  bounceable: boolean;
  sender: Address;
  value: bigint;
  raw: Slice;
};
export declare function storeTupleContext(source: Context): TupleItem[];
export declare function dictValueParserContext(): DictionaryValue<Context>;
export type SendParameters = {
  $$type: "SendParameters";
  mode: bigint;
  body: Cell | null;
  code: Cell | null;
  data: Cell | null;
  value: bigint;
  to: Address;
  bounce: boolean;
};
export declare function storeSendParameters(
  src: SendParameters,
): (builder: Builder) => void;
export declare function loadSendParameters(slice: Slice): {
  $$type: "SendParameters";
  mode: bigint;
  body: Cell;
  code: Cell;
  data: Cell;
  value: bigint;
  to: Address;
  bounce: boolean;
};
export declare function loadTupleSendParameters(source: TupleReader): {
  $$type: "SendParameters";
  mode: bigint;
  body: Cell;
  code: Cell;
  data: Cell;
  value: bigint;
  to: Address;
  bounce: boolean;
};
export declare function loadGetterTupleSendParameters(source: TupleReader): {
  $$type: "SendParameters";
  mode: bigint;
  body: Cell;
  code: Cell;
  data: Cell;
  value: bigint;
  to: Address;
  bounce: boolean;
};
export declare function storeTupleSendParameters(
  source: SendParameters,
): TupleItem[];
export declare function dictValueParserSendParameters(): DictionaryValue<SendParameters>;
export type MessageParameters = {
  $$type: "MessageParameters";
  mode: bigint;
  body: Cell | null;
  value: bigint;
  to: Address;
  bounce: boolean;
};
export declare function storeMessageParameters(
  src: MessageParameters,
): (builder: Builder) => void;
export declare function loadMessageParameters(slice: Slice): {
  $$type: "MessageParameters";
  mode: bigint;
  body: Cell;
  value: bigint;
  to: Address;
  bounce: boolean;
};
export declare function loadTupleMessageParameters(source: TupleReader): {
  $$type: "MessageParameters";
  mode: bigint;
  body: Cell;
  value: bigint;
  to: Address;
  bounce: boolean;
};
export declare function loadGetterTupleMessageParameters(source: TupleReader): {
  $$type: "MessageParameters";
  mode: bigint;
  body: Cell;
  value: bigint;
  to: Address;
  bounce: boolean;
};
export declare function storeTupleMessageParameters(
  source: MessageParameters,
): TupleItem[];
export declare function dictValueParserMessageParameters(): DictionaryValue<MessageParameters>;
export type DeployParameters = {
  $$type: "DeployParameters";
  mode: bigint;
  body: Cell | null;
  value: bigint;
  bounce: boolean;
  init: StateInit;
};
export declare function storeDeployParameters(
  src: DeployParameters,
): (builder: Builder) => void;
export declare function loadDeployParameters(slice: Slice): {
  $$type: "DeployParameters";
  mode: bigint;
  body: Cell;
  value: bigint;
  bounce: boolean;
  init: {
    $$type: "StateInit";
    code: Cell;
    data: Cell;
  };
};
export declare function loadTupleDeployParameters(source: TupleReader): {
  $$type: "DeployParameters";
  mode: bigint;
  body: Cell;
  value: bigint;
  bounce: boolean;
  init: {
    $$type: "StateInit";
    code: Cell;
    data: Cell;
  };
};
export declare function loadGetterTupleDeployParameters(source: TupleReader): {
  $$type: "DeployParameters";
  mode: bigint;
  body: Cell;
  value: bigint;
  bounce: boolean;
  init: {
    $$type: "StateInit";
    code: Cell;
    data: Cell;
  };
};
export declare function storeTupleDeployParameters(
  source: DeployParameters,
): TupleItem[];
export declare function dictValueParserDeployParameters(): DictionaryValue<DeployParameters>;
export type StdAddress = {
  $$type: "StdAddress";
  workchain: bigint;
  address: bigint;
};
export declare function storeStdAddress(
  src: StdAddress,
): (builder: Builder) => void;
export declare function loadStdAddress(slice: Slice): {
  $$type: "StdAddress";
  workchain: bigint;
  address: bigint;
};
export declare function loadTupleStdAddress(source: TupleReader): {
  $$type: "StdAddress";
  workchain: bigint;
  address: bigint;
};
export declare function loadGetterTupleStdAddress(source: TupleReader): {
  $$type: "StdAddress";
  workchain: bigint;
  address: bigint;
};
export declare function storeTupleStdAddress(source: StdAddress): TupleItem[];
export declare function dictValueParserStdAddress(): DictionaryValue<StdAddress>;
export type VarAddress = {
  $$type: "VarAddress";
  workchain: bigint;
  address: Slice;
};
export declare function storeVarAddress(
  src: VarAddress,
): (builder: Builder) => void;
export declare function loadVarAddress(slice: Slice): {
  $$type: "VarAddress";
  workchain: bigint;
  address: Slice;
};
export declare function loadTupleVarAddress(source: TupleReader): {
  $$type: "VarAddress";
  workchain: bigint;
  address: Slice;
};
export declare function loadGetterTupleVarAddress(source: TupleReader): {
  $$type: "VarAddress";
  workchain: bigint;
  address: Slice;
};
export declare function storeTupleVarAddress(source: VarAddress): TupleItem[];
export declare function dictValueParserVarAddress(): DictionaryValue<VarAddress>;
export type BasechainAddress = {
  $$type: "BasechainAddress";
  hash: bigint | null;
};
export declare function storeBasechainAddress(
  src: BasechainAddress,
): (builder: Builder) => void;
export declare function loadBasechainAddress(slice: Slice): {
  $$type: "BasechainAddress";
  hash: bigint;
};
export declare function loadTupleBasechainAddress(source: TupleReader): {
  $$type: "BasechainAddress";
  hash: bigint;
};
export declare function loadGetterTupleBasechainAddress(source: TupleReader): {
  $$type: "BasechainAddress";
  hash: bigint;
};
export declare function storeTupleBasechainAddress(
  source: BasechainAddress,
): TupleItem[];
export declare function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress>;
export type PlaceBet = {
  $$type: "PlaceBet";
  roundId: string;
  marketId: string;
  marketLabel: string;
  token: Address;
  timeframeId: string;
  timeframeCode: bigint;
  roundDurationSeconds: bigint;
  roundStartTimestamp: bigint;
  direction: bigint;
};
export declare function storePlaceBet(
  src: PlaceBet,
): (builder: Builder) => void;
export declare function loadPlaceBet(slice: Slice): {
  $$type: "PlaceBet";
  roundId: string;
  marketId: string;
  marketLabel: string;
  token: Address;
  timeframeId: string;
  timeframeCode: bigint;
  roundDurationSeconds: bigint;
  roundStartTimestamp: bigint;
  direction: bigint;
};
export declare function loadTuplePlaceBet(source: TupleReader): {
  $$type: "PlaceBet";
  roundId: string;
  marketId: string;
  marketLabel: string;
  token: Address;
  timeframeId: string;
  timeframeCode: bigint;
  roundDurationSeconds: bigint;
  roundStartTimestamp: bigint;
  direction: bigint;
};
export declare function loadGetterTuplePlaceBet(source: TupleReader): {
  $$type: "PlaceBet";
  roundId: string;
  marketId: string;
  marketLabel: string;
  token: Address;
  timeframeId: string;
  timeframeCode: bigint;
  roundDurationSeconds: bigint;
  roundStartTimestamp: bigint;
  direction: bigint;
};
export declare function storeTuplePlaceBet(source: PlaceBet): TupleItem[];
export declare function dictValueParserPlaceBet(): DictionaryValue<PlaceBet>;
export type CloseRound = {
  $$type: "CloseRound";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
};
export declare function storeCloseRound(
  src: CloseRound,
): (builder: Builder) => void;
export declare function loadCloseRound(slice: Slice): {
  $$type: "CloseRound";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
};
export declare function loadTupleCloseRound(source: TupleReader): {
  $$type: "CloseRound";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
};
export declare function loadGetterTupleCloseRound(source: TupleReader): {
  $$type: "CloseRound";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
};
export declare function storeTupleCloseRound(source: CloseRound): TupleItem[];
export declare function dictValueParserCloseRound(): DictionaryValue<CloseRound>;
export type SettleRound = {
  $$type: "SettleRound";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
  result: bigint;
};
export declare function storeSettleRound(
  src: SettleRound,
): (builder: Builder) => void;
export declare function loadSettleRound(slice: Slice): {
  $$type: "SettleRound";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
  result: bigint;
};
export declare function loadTupleSettleRound(source: TupleReader): {
  $$type: "SettleRound";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
  result: bigint;
};
export declare function loadGetterTupleSettleRound(source: TupleReader): {
  $$type: "SettleRound";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
  result: bigint;
};
export declare function storeTupleSettleRound(source: SettleRound): TupleItem[];
export declare function dictValueParserSettleRound(): DictionaryValue<SettleRound>;
export type Claim = {
  $$type: "Claim";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
};
export declare function storeClaim(src: Claim): (builder: Builder) => void;
export declare function loadClaim(slice: Slice): {
  $$type: "Claim";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
};
export declare function loadTupleClaim(source: TupleReader): {
  $$type: "Claim";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
};
export declare function loadGetterTupleClaim(source: TupleReader): {
  $$type: "Claim";
  roundId: string;
  token: Address;
  timeframeCode: bigint;
  roundStartTimestamp: bigint;
};
export declare function storeTupleClaim(source: Claim): TupleItem[];
export declare function dictValueParserClaim(): DictionaryValue<Claim>;
export type Round = {
  $$type: "Round";
  roundId: string;
  marketId: string;
  marketLabel: string;
  token: Address;
  timeframeId: string;
  timeframeCode: bigint;
  roundDurationSeconds: bigint;
  status: bigint;
  openedAt: bigint;
  closesAt: bigint;
  settledAt: bigint;
  totalUp: bigint;
  totalDown: bigint;
  result: bigint;
};
export declare function storeRound(src: Round): (builder: Builder) => void;
export declare function loadRound(slice: Slice): {
  $$type: "Round";
  roundId: string;
  marketId: string;
  marketLabel: string;
  token: Address;
  timeframeId: string;
  timeframeCode: bigint;
  roundDurationSeconds: bigint;
  status: bigint;
  openedAt: bigint;
  closesAt: bigint;
  settledAt: bigint;
  totalUp: bigint;
  totalDown: bigint;
  result: bigint;
};
export declare function loadTupleRound(source: TupleReader): {
  $$type: "Round";
  roundId: string;
  marketId: string;
  marketLabel: string;
  token: Address;
  timeframeId: string;
  timeframeCode: bigint;
  roundDurationSeconds: bigint;
  status: bigint;
  openedAt: bigint;
  closesAt: bigint;
  settledAt: bigint;
  totalUp: bigint;
  totalDown: bigint;
  result: bigint;
};
export declare function loadGetterTupleRound(source: TupleReader): {
  $$type: "Round";
  roundId: string;
  marketId: string;
  marketLabel: string;
  token: Address;
  timeframeId: string;
  timeframeCode: bigint;
  roundDurationSeconds: bigint;
  status: bigint;
  openedAt: bigint;
  closesAt: bigint;
  settledAt: bigint;
  totalUp: bigint;
  totalDown: bigint;
  result: bigint;
};
export declare function storeTupleRound(source: Round): TupleItem[];
export declare function dictValueParserRound(): DictionaryValue<Round>;
export type Position = {
  $$type: "Position";
  upStake: bigint;
  downStake: bigint;
  claimed: boolean;
};
export declare function storePosition(
  src: Position,
): (builder: Builder) => void;
export declare function loadPosition(slice: Slice): {
  $$type: "Position";
  upStake: bigint;
  downStake: bigint;
  claimed: boolean;
};
export declare function loadTuplePosition(source: TupleReader): {
  $$type: "Position";
  upStake: bigint;
  downStake: bigint;
  claimed: boolean;
};
export declare function loadGetterTuplePosition(source: TupleReader): {
  $$type: "Position";
  upStake: bigint;
  downStake: bigint;
  claimed: boolean;
};
export declare function storeTuplePosition(source: Position): TupleItem[];
export declare function dictValueParserPosition(): DictionaryValue<Position>;
export type PulsePredictionMarket$Data = {
  $$type: "PulsePredictionMarket$Data";
  admin: Address;
  protocolFeeBps: bigint;
  deploymentNonce: bigint;
  rounds: Dictionary<bigint, Round>;
  positions: Dictionary<bigint, Position>;
};
export declare function storePulsePredictionMarket$Data(
  src: PulsePredictionMarket$Data,
): (builder: Builder) => void;
export declare function loadPulsePredictionMarket$Data(slice: Slice): {
  $$type: "PulsePredictionMarket$Data";
  admin: Address;
  protocolFeeBps: bigint;
  deploymentNonce: bigint;
  rounds: Dictionary<bigint, Round>;
  positions: Dictionary<bigint, Position>;
};
export declare function loadTuplePulsePredictionMarket$Data(
  source: TupleReader,
): {
  $$type: "PulsePredictionMarket$Data";
  admin: Address;
  protocolFeeBps: bigint;
  deploymentNonce: bigint;
  rounds: Dictionary<bigint, Round>;
  positions: Dictionary<bigint, Position>;
};
export declare function loadGetterTuplePulsePredictionMarket$Data(
  source: TupleReader,
): {
  $$type: "PulsePredictionMarket$Data";
  admin: Address;
  protocolFeeBps: bigint;
  deploymentNonce: bigint;
  rounds: Dictionary<bigint, Round>;
  positions: Dictionary<bigint, Position>;
};
export declare function storeTuplePulsePredictionMarket$Data(
  source: PulsePredictionMarket$Data,
): TupleItem[];
export declare function dictValueParserPulsePredictionMarket$Data(): DictionaryValue<PulsePredictionMarket$Data>;
export declare const PulsePredictionMarket_errors: {
  readonly 2: {
    readonly message: "Stack underflow";
  };
  readonly 3: {
    readonly message: "Stack overflow";
  };
  readonly 4: {
    readonly message: "Integer overflow";
  };
  readonly 5: {
    readonly message: "Integer out of expected range";
  };
  readonly 6: {
    readonly message: "Invalid opcode";
  };
  readonly 7: {
    readonly message: "Type check error";
  };
  readonly 8: {
    readonly message: "Cell overflow";
  };
  readonly 9: {
    readonly message: "Cell underflow";
  };
  readonly 10: {
    readonly message: "Dictionary error";
  };
  readonly 11: {
    readonly message: "'Unknown' error";
  };
  readonly 12: {
    readonly message: "Fatal error";
  };
  readonly 13: {
    readonly message: "Out of gas error";
  };
  readonly 14: {
    readonly message: "Virtualization error";
  };
  readonly 32: {
    readonly message: "Action list is invalid";
  };
  readonly 33: {
    readonly message: "Action list is too long";
  };
  readonly 34: {
    readonly message: "Action is invalid or not supported";
  };
  readonly 35: {
    readonly message: "Invalid source address in outbound message";
  };
  readonly 36: {
    readonly message: "Invalid destination address in outbound message";
  };
  readonly 37: {
    readonly message: "Not enough Toncoin";
  };
  readonly 38: {
    readonly message: "Not enough extra currencies";
  };
  readonly 39: {
    readonly message: "Outbound message does not fit into a cell after rewriting";
  };
  readonly 40: {
    readonly message: "Cannot process a message";
  };
  readonly 41: {
    readonly message: "Library reference is null";
  };
  readonly 42: {
    readonly message: "Library change action error";
  };
  readonly 43: {
    readonly message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree";
  };
  readonly 50: {
    readonly message: "Account state size exceeded limits";
  };
  readonly 128: {
    readonly message: "Null reference exception";
  };
  readonly 129: {
    readonly message: "Invalid serialization prefix";
  };
  readonly 130: {
    readonly message: "Invalid incoming message";
  };
  readonly 131: {
    readonly message: "Constraints error";
  };
  readonly 132: {
    readonly message: "Access denied";
  };
  readonly 133: {
    readonly message: "Contract stopped";
  };
  readonly 134: {
    readonly message: "Invalid argument";
  };
  readonly 135: {
    readonly message: "Code of a contract was not found";
  };
  readonly 136: {
    readonly message: "Invalid standard address";
  };
  readonly 138: {
    readonly message: "Not a basechain address";
  };
  readonly 5068: {
    readonly message: "round_id_mismatch";
  };
  readonly 12897: {
    readonly message: "round_mismatch";
  };
  readonly 15520: {
    readonly message: "round_closed";
  };
  readonly 19900: {
    readonly message: "position_not_found";
  };
  readonly 22522: {
    readonly message: "timeframe_code_mismatch";
  };
  readonly 23269: {
    readonly message: "token_mismatch";
  };
  readonly 24418: {
    readonly message: "round_duration_mismatch";
  };
  readonly 29972: {
    readonly message: "market_mismatch";
  };
  readonly 32385: {
    readonly message: "round_not_open";
  };
  readonly 32540: {
    readonly message: "round_start_required";
  };
  readonly 32630: {
    readonly message: "stake_required";
  };
  readonly 35659: {
    readonly message: "round_not_found";
  };
  readonly 41035: {
    readonly message: "invalid_timeframe";
  };
  readonly 45634: {
    readonly message: "already_claimed";
  };
  readonly 45775: {
    readonly message: "no_winning_position";
  };
  readonly 47541: {
    readonly message: "admin_only";
  };
  readonly 50155: {
    readonly message: "round_not_started";
  };
  readonly 52356: {
    readonly message: "round_start_mismatch";
  };
  readonly 55144: {
    readonly message: "round_expired";
  };
  readonly 55591: {
    readonly message: "timeframe_mismatch";
  };
  readonly 59719: {
    readonly message: "round_not_closed";
  };
  readonly 61822: {
    readonly message: "round_not_settled";
  };
  readonly 63018: {
    readonly message: "invalid_winner_pool";
  };
};
export declare const PulsePredictionMarket_errors_backward: {
  readonly "Stack underflow": 2;
  readonly "Stack overflow": 3;
  readonly "Integer overflow": 4;
  readonly "Integer out of expected range": 5;
  readonly "Invalid opcode": 6;
  readonly "Type check error": 7;
  readonly "Cell overflow": 8;
  readonly "Cell underflow": 9;
  readonly "Dictionary error": 10;
  readonly "'Unknown' error": 11;
  readonly "Fatal error": 12;
  readonly "Out of gas error": 13;
  readonly "Virtualization error": 14;
  readonly "Action list is invalid": 32;
  readonly "Action list is too long": 33;
  readonly "Action is invalid or not supported": 34;
  readonly "Invalid source address in outbound message": 35;
  readonly "Invalid destination address in outbound message": 36;
  readonly "Not enough Toncoin": 37;
  readonly "Not enough extra currencies": 38;
  readonly "Outbound message does not fit into a cell after rewriting": 39;
  readonly "Cannot process a message": 40;
  readonly "Library reference is null": 41;
  readonly "Library change action error": 42;
  readonly "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43;
  readonly "Account state size exceeded limits": 50;
  readonly "Null reference exception": 128;
  readonly "Invalid serialization prefix": 129;
  readonly "Invalid incoming message": 130;
  readonly "Constraints error": 131;
  readonly "Access denied": 132;
  readonly "Contract stopped": 133;
  readonly "Invalid argument": 134;
  readonly "Code of a contract was not found": 135;
  readonly "Invalid standard address": 136;
  readonly "Not a basechain address": 138;
  readonly round_id_mismatch: 5068;
  readonly round_mismatch: 12897;
  readonly round_closed: 15520;
  readonly position_not_found: 19900;
  readonly timeframe_code_mismatch: 22522;
  readonly token_mismatch: 23269;
  readonly round_duration_mismatch: 24418;
  readonly market_mismatch: 29972;
  readonly round_not_open: 32385;
  readonly round_start_required: 32540;
  readonly stake_required: 32630;
  readonly round_not_found: 35659;
  readonly invalid_timeframe: 41035;
  readonly already_claimed: 45634;
  readonly no_winning_position: 45775;
  readonly admin_only: 47541;
  readonly round_not_started: 50155;
  readonly round_start_mismatch: 52356;
  readonly round_expired: 55144;
  readonly timeframe_mismatch: 55591;
  readonly round_not_closed: 59719;
  readonly round_not_settled: 61822;
  readonly invalid_winner_pool: 63018;
};
export declare const PulsePredictionMarket_getterMapping: {
  [key: string]: string;
};
export declare class PulsePredictionMarket implements Contract {
  static readonly storageReserve = 0n;
  static readonly errors: {
    readonly "Stack underflow": 2;
    readonly "Stack overflow": 3;
    readonly "Integer overflow": 4;
    readonly "Integer out of expected range": 5;
    readonly "Invalid opcode": 6;
    readonly "Type check error": 7;
    readonly "Cell overflow": 8;
    readonly "Cell underflow": 9;
    readonly "Dictionary error": 10;
    readonly "'Unknown' error": 11;
    readonly "Fatal error": 12;
    readonly "Out of gas error": 13;
    readonly "Virtualization error": 14;
    readonly "Action list is invalid": 32;
    readonly "Action list is too long": 33;
    readonly "Action is invalid or not supported": 34;
    readonly "Invalid source address in outbound message": 35;
    readonly "Invalid destination address in outbound message": 36;
    readonly "Not enough Toncoin": 37;
    readonly "Not enough extra currencies": 38;
    readonly "Outbound message does not fit into a cell after rewriting": 39;
    readonly "Cannot process a message": 40;
    readonly "Library reference is null": 41;
    readonly "Library change action error": 42;
    readonly "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43;
    readonly "Account state size exceeded limits": 50;
    readonly "Null reference exception": 128;
    readonly "Invalid serialization prefix": 129;
    readonly "Invalid incoming message": 130;
    readonly "Constraints error": 131;
    readonly "Access denied": 132;
    readonly "Contract stopped": 133;
    readonly "Invalid argument": 134;
    readonly "Code of a contract was not found": 135;
    readonly "Invalid standard address": 136;
    readonly "Not a basechain address": 138;
    readonly round_id_mismatch: 5068;
    readonly round_mismatch: 12897;
    readonly round_closed: 15520;
    readonly position_not_found: 19900;
    readonly timeframe_code_mismatch: 22522;
    readonly token_mismatch: 23269;
    readonly round_duration_mismatch: 24418;
    readonly market_mismatch: 29972;
    readonly round_not_open: 32385;
    readonly round_start_required: 32540;
    readonly stake_required: 32630;
    readonly round_not_found: 35659;
    readonly invalid_timeframe: 41035;
    readonly already_claimed: 45634;
    readonly no_winning_position: 45775;
    readonly admin_only: 47541;
    readonly round_not_started: 50155;
    readonly round_start_mismatch: 52356;
    readonly round_expired: 55144;
    readonly timeframe_mismatch: 55591;
    readonly round_not_closed: 59719;
    readonly round_not_settled: 61822;
    readonly invalid_winner_pool: 63018;
  };
  static readonly opcodes: {
    PlaceBet: number;
    CloseRound: number;
    SettleRound: number;
    Claim: number;
  };
  static init(
    admin: Address,
    protocolFeeBps: bigint,
    deploymentNonce: bigint,
  ): Promise<{
    code: Cell;
    data: Cell;
  }>;
  static fromInit(
    admin: Address,
    protocolFeeBps: bigint,
    deploymentNonce: bigint,
  ): Promise<PulsePredictionMarket>;
  static fromAddress(address: Address): PulsePredictionMarket;
  readonly address: Address;
  readonly init?: {
    code: Cell;
    data: Cell;
  };
  readonly abi: ContractABI;
  constructor(
    address: Address,
    init?: {
      code: Cell;
      data: Cell;
    },
  );
  send(
    provider: ContractProvider,
    via: Sender,
    args: {
      value: bigint;
      bounce?: boolean | null | undefined;
    },
    message: PlaceBet | CloseRound | SettleRound | Claim,
  ): Promise<void>;
}
