import { Cell, Slice, Address, Builder, TupleItem, TupleReader, Dictionary, ContractProvider, Sender, Contract, ContractABI, DictionaryValue } from '@ton/core';
export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
};
export declare function storeDataSize(src: DataSize): (builder: Builder) => void;
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
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
};
export declare function storeSignedBundle(src: SignedBundle): (builder: Builder) => void;
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
export declare function storeTupleSignedBundle(source: SignedBundle): TupleItem[];
export declare function dictValueParserSignedBundle(): DictionaryValue<SignedBundle>;
export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
};
export declare function storeStateInit(src: StateInit): (builder: Builder) => void;
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
    $$type: 'Context';
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
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
};
export declare function storeSendParameters(src: SendParameters): (builder: Builder) => void;
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
export declare function storeTupleSendParameters(source: SendParameters): TupleItem[];
export declare function dictValueParserSendParameters(): DictionaryValue<SendParameters>;
export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
};
export declare function storeMessageParameters(src: MessageParameters): (builder: Builder) => void;
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
export declare function storeTupleMessageParameters(source: MessageParameters): TupleItem[];
export declare function dictValueParserMessageParameters(): DictionaryValue<MessageParameters>;
export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
};
export declare function storeDeployParameters(src: DeployParameters): (builder: Builder) => void;
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
export declare function storeTupleDeployParameters(source: DeployParameters): TupleItem[];
export declare function dictValueParserDeployParameters(): DictionaryValue<DeployParameters>;
export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
};
export declare function storeStdAddress(src: StdAddress): (builder: Builder) => void;
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
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
};
export declare function storeVarAddress(src: VarAddress): (builder: Builder) => void;
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
    $$type: 'BasechainAddress';
    hash: bigint | null;
};
export declare function storeBasechainAddress(src: BasechainAddress): (builder: Builder) => void;
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
export declare function storeTupleBasechainAddress(source: BasechainAddress): TupleItem[];
export declare function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress>;
export type BetYes = {
    $$type: 'BetYes';
    stakeAmount: bigint;
};
export declare function storeBetYes(src: BetYes): (builder: Builder) => void;
export declare function loadBetYes(slice: Slice): {
    $$type: "BetYes";
    stakeAmount: bigint;
};
export declare function loadTupleBetYes(source: TupleReader): {
    $$type: "BetYes";
    stakeAmount: bigint;
};
export declare function loadGetterTupleBetYes(source: TupleReader): {
    $$type: "BetYes";
    stakeAmount: bigint;
};
export declare function storeTupleBetYes(source: BetYes): TupleItem[];
export declare function dictValueParserBetYes(): DictionaryValue<BetYes>;
export type BetNo = {
    $$type: 'BetNo';
    stakeAmount: bigint;
};
export declare function storeBetNo(src: BetNo): (builder: Builder) => void;
export declare function loadBetNo(slice: Slice): {
    $$type: "BetNo";
    stakeAmount: bigint;
};
export declare function loadTupleBetNo(source: TupleReader): {
    $$type: "BetNo";
    stakeAmount: bigint;
};
export declare function loadGetterTupleBetNo(source: TupleReader): {
    $$type: "BetNo";
    stakeAmount: bigint;
};
export declare function storeTupleBetNo(source: BetNo): TupleItem[];
export declare function dictValueParserBetNo(): DictionaryValue<BetNo>;
export type LockMarket = {
    $$type: 'LockMarket';
};
export declare function storeLockMarket(src: LockMarket): (builder: Builder) => void;
export declare function loadLockMarket(slice: Slice): {
    $$type: "LockMarket";
};
export declare function loadTupleLockMarket(source: TupleReader): {
    $$type: "LockMarket";
};
export declare function loadGetterTupleLockMarket(source: TupleReader): {
    $$type: "LockMarket";
};
export declare function storeTupleLockMarket(source: LockMarket): TupleItem[];
export declare function dictValueParserLockMarket(): DictionaryValue<LockMarket>;
export type ResolveMarket = {
    $$type: 'ResolveMarket';
    finalPriceE9: bigint;
    resolvedAt: bigint;
};
export declare function storeResolveMarket(src: ResolveMarket): (builder: Builder) => void;
export declare function loadResolveMarket(slice: Slice): {
    $$type: "ResolveMarket";
    finalPriceE9: bigint;
    resolvedAt: bigint;
};
export declare function loadTupleResolveMarket(source: TupleReader): {
    $$type: "ResolveMarket";
    finalPriceE9: bigint;
    resolvedAt: bigint;
};
export declare function loadGetterTupleResolveMarket(source: TupleReader): {
    $$type: "ResolveMarket";
    finalPriceE9: bigint;
    resolvedAt: bigint;
};
export declare function storeTupleResolveMarket(source: ResolveMarket): TupleItem[];
export declare function dictValueParserResolveMarket(): DictionaryValue<ResolveMarket>;
export type ClaimReward = {
    $$type: 'ClaimReward';
};
export declare function storeClaimReward(src: ClaimReward): (builder: Builder) => void;
export declare function loadClaimReward(slice: Slice): {
    $$type: "ClaimReward";
};
export declare function loadTupleClaimReward(source: TupleReader): {
    $$type: "ClaimReward";
};
export declare function loadGetterTupleClaimReward(source: TupleReader): {
    $$type: "ClaimReward";
};
export declare function storeTupleClaimReward(source: ClaimReward): TupleItem[];
export declare function dictValueParserClaimReward(): DictionaryValue<ClaimReward>;
export type ClaimRewardFor = {
    $$type: 'ClaimRewardFor';
    wallet: Address;
};
export declare function storeClaimRewardFor(src: ClaimRewardFor): (builder: Builder) => void;
export declare function loadClaimRewardFor(slice: Slice): {
    $$type: "ClaimRewardFor";
    wallet: Address;
};
export declare function loadTupleClaimRewardFor(source: TupleReader): {
    $$type: "ClaimRewardFor";
    wallet: Address;
};
export declare function loadGetterTupleClaimRewardFor(source: TupleReader): {
    $$type: "ClaimRewardFor";
    wallet: Address;
};
export declare function storeTupleClaimRewardFor(source: ClaimRewardFor): TupleItem[];
export declare function dictValueParserClaimRewardFor(): DictionaryValue<ClaimRewardFor>;
export type Position = {
    $$type: 'Position';
    yesStake: bigint;
    noStake: bigint;
    claimed: boolean;
};
export declare function storePosition(src: Position): (builder: Builder) => void;
export declare function loadPosition(slice: Slice): {
    $$type: "Position";
    yesStake: bigint;
    noStake: bigint;
    claimed: boolean;
};
export declare function loadTuplePosition(source: TupleReader): {
    $$type: "Position";
    yesStake: bigint;
    noStake: bigint;
    claimed: boolean;
};
export declare function loadGetterTuplePosition(source: TupleReader): {
    $$type: "Position";
    yesStake: bigint;
    noStake: bigint;
    claimed: boolean;
};
export declare function storeTuplePosition(source: Position): TupleItem[];
export declare function dictValueParserPosition(): DictionaryValue<Position>;
export type MarketState = {
    $$type: 'MarketState';
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: bigint;
    thresholdBps: bigint;
    referencePriceE9: bigint;
    protocolFeeBps: bigint;
    createdAt: bigint;
    closeTime: bigint;
    status: bigint;
    resolvedAt: bigint;
    finalPriceE9: bigint;
    totalYes: bigint;
    totalNo: bigint;
};
export declare function storeMarketState(src: MarketState): (builder: Builder) => void;
export declare function loadMarketState(slice: Slice): {
    $$type: "MarketState";
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: bigint;
    thresholdBps: bigint;
    referencePriceE9: bigint;
    protocolFeeBps: bigint;
    createdAt: bigint;
    closeTime: bigint;
    status: bigint;
    resolvedAt: bigint;
    finalPriceE9: bigint;
    totalYes: bigint;
    totalNo: bigint;
};
export declare function loadTupleMarketState(source: TupleReader): {
    $$type: "MarketState";
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: bigint;
    thresholdBps: bigint;
    referencePriceE9: bigint;
    protocolFeeBps: bigint;
    createdAt: bigint;
    closeTime: bigint;
    status: bigint;
    resolvedAt: bigint;
    finalPriceE9: bigint;
    totalYes: bigint;
    totalNo: bigint;
};
export declare function loadGetterTupleMarketState(source: TupleReader): {
    $$type: "MarketState";
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: bigint;
    thresholdBps: bigint;
    referencePriceE9: bigint;
    protocolFeeBps: bigint;
    createdAt: bigint;
    closeTime: bigint;
    status: bigint;
    resolvedAt: bigint;
    finalPriceE9: bigint;
    totalYes: bigint;
    totalNo: bigint;
};
export declare function storeTupleMarketState(source: MarketState): TupleItem[];
export declare function dictValueParserMarketState(): DictionaryValue<MarketState>;
export type TonForecastMarket$Data = {
    $$type: 'TonForecastMarket$Data';
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: bigint;
    thresholdBps: bigint;
    referencePriceE9: bigint;
    protocolFeeBps: bigint;
    createdAt: bigint;
    closeTime: bigint;
    status: bigint;
    resolvedAt: bigint;
    finalPriceE9: bigint;
    totalYes: bigint;
    totalNo: bigint;
    positions: Dictionary<bigint, Position>;
};
export declare function storeTonForecastMarket$Data(src: TonForecastMarket$Data): (builder: Builder) => void;
export declare function loadTonForecastMarket$Data(slice: Slice): {
    $$type: "TonForecastMarket$Data";
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: bigint;
    thresholdBps: bigint;
    referencePriceE9: bigint;
    protocolFeeBps: bigint;
    createdAt: bigint;
    closeTime: bigint;
    status: bigint;
    resolvedAt: bigint;
    finalPriceE9: bigint;
    totalYes: bigint;
    totalNo: bigint;
    positions: Dictionary<bigint, Position>;
};
export declare function loadTupleTonForecastMarket$Data(source: TupleReader): {
    $$type: "TonForecastMarket$Data";
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: bigint;
    thresholdBps: bigint;
    referencePriceE9: bigint;
    protocolFeeBps: bigint;
    createdAt: bigint;
    closeTime: bigint;
    status: bigint;
    resolvedAt: bigint;
    finalPriceE9: bigint;
    totalYes: bigint;
    totalNo: bigint;
    positions: Dictionary<bigint, Position>;
};
export declare function loadGetterTupleTonForecastMarket$Data(source: TupleReader): {
    $$type: "TonForecastMarket$Data";
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: bigint;
    thresholdBps: bigint;
    referencePriceE9: bigint;
    protocolFeeBps: bigint;
    createdAt: bigint;
    closeTime: bigint;
    status: bigint;
    resolvedAt: bigint;
    finalPriceE9: bigint;
    totalYes: bigint;
    totalNo: bigint;
    positions: Dictionary<bigint, Position>;
};
export declare function storeTupleTonForecastMarket$Data(source: TonForecastMarket$Data): TupleItem[];
export declare function dictValueParserTonForecastMarket$Data(): DictionaryValue<TonForecastMarket$Data>;
export declare const TonForecastMarket_errors: {
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
    readonly 7397: {
        readonly message: "market_locked";
    };
    readonly 19900: {
        readonly message: "position_not_found";
    };
    readonly 24341: {
        readonly message: "market_not_resolvable";
    };
    readonly 24830: {
        readonly message: "nothing_to_claim";
    };
    readonly 24930: {
        readonly message: "invalid_reference_price";
    };
    readonly 32160: {
        readonly message: "invalid_threshold";
    };
    readonly 32630: {
        readonly message: "stake_required";
    };
    readonly 37841: {
        readonly message: "market_still_open";
    };
    readonly 38802: {
        readonly message: "invalid_close_time";
    };
    readonly 40921: {
        readonly message: "market_not_resolved";
    };
    readonly 41035: {
        readonly message: "invalid_timeframe";
    };
    readonly 41950: {
        readonly message: "resolver_only";
    };
    readonly 45634: {
        readonly message: "already_claimed";
    };
    readonly 45775: {
        readonly message: "no_winning_position";
    };
    readonly 47621: {
        readonly message: "insufficient_message_value";
    };
    readonly 48446: {
        readonly message: "market_not_open";
    };
    readonly 63018: {
        readonly message: "invalid_winner_pool";
    };
};
export declare const TonForecastMarket_errors_backward: {
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
    readonly market_locked: 7397;
    readonly position_not_found: 19900;
    readonly market_not_resolvable: 24341;
    readonly nothing_to_claim: 24830;
    readonly invalid_reference_price: 24930;
    readonly invalid_threshold: 32160;
    readonly stake_required: 32630;
    readonly market_still_open: 37841;
    readonly invalid_close_time: 38802;
    readonly market_not_resolved: 40921;
    readonly invalid_timeframe: 41035;
    readonly resolver_only: 41950;
    readonly already_claimed: 45634;
    readonly no_winning_position: 45775;
    readonly insufficient_message_value: 47621;
    readonly market_not_open: 48446;
    readonly invalid_winner_pool: 63018;
};
export declare const TonForecastMarket_getterMapping: {
    [key: string]: string;
};
export declare class TonForecastMarket implements Contract {
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
        readonly market_locked: 7397;
        readonly position_not_found: 19900;
        readonly market_not_resolvable: 24341;
        readonly nothing_to_claim: 24830;
        readonly invalid_reference_price: 24930;
        readonly invalid_threshold: 32160;
        readonly stake_required: 32630;
        readonly market_still_open: 37841;
        readonly invalid_close_time: 38802;
        readonly market_not_resolved: 40921;
        readonly invalid_timeframe: 41035;
        readonly resolver_only: 41950;
        readonly already_claimed: 45634;
        readonly no_winning_position: 45775;
        readonly insufficient_message_value: 47621;
        readonly market_not_open: 48446;
        readonly invalid_winner_pool: 63018;
    };
    static readonly opcodes: {
        BetYes: number;
        BetNo: number;
        LockMarket: number;
        ResolveMarket: number;
        ClaimReward: number;
        ClaimRewardFor: number;
    };
    static init(owner: Address, resolver: Address, treasury: Address, token: Address, timeframeSeconds: bigint, thresholdBps: bigint, referencePriceE9: bigint, protocolFeeBps: bigint, createdAt: bigint, closeTime: bigint): Promise<{
        code: Cell;
        data: Cell;
    }>;
    static fromInit(owner: Address, resolver: Address, treasury: Address, token: Address, timeframeSeconds: bigint, thresholdBps: bigint, referencePriceE9: bigint, protocolFeeBps: bigint, createdAt: bigint, closeTime: bigint): Promise<TonForecastMarket>;
    static fromAddress(address: Address): TonForecastMarket;
    readonly address: Address;
    readonly init?: {
        code: Cell;
        data: Cell;
    };
    readonly abi: ContractABI;
    constructor(address: Address, init?: {
        code: Cell;
        data: Cell;
    });
    send(provider: ContractProvider, via: Sender, args: {
        value: bigint;
        bounce?: boolean | null | undefined;
    }, message: null | BetYes | BetNo | LockMarket | ResolveMarket | ClaimReward | ClaimRewardFor): Promise<void>;
    getGetMarketState(provider: ContractProvider): Promise<{
        $$type: "MarketState";
        owner: Address;
        resolver: Address;
        treasury: Address;
        token: Address;
        timeframeSeconds: bigint;
        thresholdBps: bigint;
        referencePriceE9: bigint;
        protocolFeeBps: bigint;
        createdAt: bigint;
        closeTime: bigint;
        status: bigint;
        resolvedAt: bigint;
        finalPriceE9: bigint;
        totalYes: bigint;
        totalNo: bigint;
    }>;
    getGetPosition(provider: ContractProvider, wallet: Address): Promise<{
        $$type: "Position";
        yesStake: bigint;
        noStake: bigint;
        claimed: boolean;
    }>;
}
