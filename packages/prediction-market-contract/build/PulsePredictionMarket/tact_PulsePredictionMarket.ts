import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type PlaceBet = {
    $$type: 'PlaceBet';
    marketId: string;
    marketLabel: string;
    direction: bigint;
}

export function storePlaceBet(src: PlaceBet) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1347764785, 32);
        b_0.storeStringRefTail(src.marketId);
        b_0.storeStringRefTail(src.marketLabel);
        b_0.storeUint(src.direction, 8);
    };
}

export function loadPlaceBet(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1347764785) { throw Error('Invalid prefix'); }
    const _marketId = sc_0.loadStringRefTail();
    const _marketLabel = sc_0.loadStringRefTail();
    const _direction = sc_0.loadUintBig(8);
    return { $$type: 'PlaceBet' as const, marketId: _marketId, marketLabel: _marketLabel, direction: _direction };
}

export function loadTuplePlaceBet(source: TupleReader) {
    const _marketId = source.readString();
    const _marketLabel = source.readString();
    const _direction = source.readBigNumber();
    return { $$type: 'PlaceBet' as const, marketId: _marketId, marketLabel: _marketLabel, direction: _direction };
}

export function loadGetterTuplePlaceBet(source: TupleReader) {
    const _marketId = source.readString();
    const _marketLabel = source.readString();
    const _direction = source.readBigNumber();
    return { $$type: 'PlaceBet' as const, marketId: _marketId, marketLabel: _marketLabel, direction: _direction };
}

export function storeTuplePlaceBet(source: PlaceBet) {
    const builder = new TupleBuilder();
    builder.writeString(source.marketId);
    builder.writeString(source.marketLabel);
    builder.writeNumber(source.direction);
    return builder.build();
}

export function dictValueParserPlaceBet(): DictionaryValue<PlaceBet> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePlaceBet(src)).endCell());
        },
        parse: (src) => {
            return loadPlaceBet(src.loadRef().beginParse());
        }
    }
}

export type CloseRound = {
    $$type: 'CloseRound';
    marketId: string;
}

export function storeCloseRound(src: CloseRound) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1347765041, 32);
        b_0.storeStringRefTail(src.marketId);
    };
}

export function loadCloseRound(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1347765041) { throw Error('Invalid prefix'); }
    const _marketId = sc_0.loadStringRefTail();
    return { $$type: 'CloseRound' as const, marketId: _marketId };
}

export function loadTupleCloseRound(source: TupleReader) {
    const _marketId = source.readString();
    return { $$type: 'CloseRound' as const, marketId: _marketId };
}

export function loadGetterTupleCloseRound(source: TupleReader) {
    const _marketId = source.readString();
    return { $$type: 'CloseRound' as const, marketId: _marketId };
}

export function storeTupleCloseRound(source: CloseRound) {
    const builder = new TupleBuilder();
    builder.writeString(source.marketId);
    return builder.build();
}

export function dictValueParserCloseRound(): DictionaryValue<CloseRound> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCloseRound(src)).endCell());
        },
        parse: (src) => {
            return loadCloseRound(src.loadRef().beginParse());
        }
    }
}

export type SettleRound = {
    $$type: 'SettleRound';
    marketId: string;
    result: bigint;
}

export function storeSettleRound(src: SettleRound) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1347769137, 32);
        b_0.storeStringRefTail(src.marketId);
        b_0.storeUint(src.result, 8);
    };
}

export function loadSettleRound(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1347769137) { throw Error('Invalid prefix'); }
    const _marketId = sc_0.loadStringRefTail();
    const _result = sc_0.loadUintBig(8);
    return { $$type: 'SettleRound' as const, marketId: _marketId, result: _result };
}

export function loadTupleSettleRound(source: TupleReader) {
    const _marketId = source.readString();
    const _result = source.readBigNumber();
    return { $$type: 'SettleRound' as const, marketId: _marketId, result: _result };
}

export function loadGetterTupleSettleRound(source: TupleReader) {
    const _marketId = source.readString();
    const _result = source.readBigNumber();
    return { $$type: 'SettleRound' as const, marketId: _marketId, result: _result };
}

export function storeTupleSettleRound(source: SettleRound) {
    const builder = new TupleBuilder();
    builder.writeString(source.marketId);
    builder.writeNumber(source.result);
    return builder.build();
}

export function dictValueParserSettleRound(): DictionaryValue<SettleRound> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSettleRound(src)).endCell());
        },
        parse: (src) => {
            return loadSettleRound(src.loadRef().beginParse());
        }
    }
}

export type Claim = {
    $$type: 'Claim';
    marketId: string;
}

export function storeClaim(src: Claim) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1347768369, 32);
        b_0.storeStringRefTail(src.marketId);
    };
}

export function loadClaim(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1347768369) { throw Error('Invalid prefix'); }
    const _marketId = sc_0.loadStringRefTail();
    return { $$type: 'Claim' as const, marketId: _marketId };
}

export function loadTupleClaim(source: TupleReader) {
    const _marketId = source.readString();
    return { $$type: 'Claim' as const, marketId: _marketId };
}

export function loadGetterTupleClaim(source: TupleReader) {
    const _marketId = source.readString();
    return { $$type: 'Claim' as const, marketId: _marketId };
}

export function storeTupleClaim(source: Claim) {
    const builder = new TupleBuilder();
    builder.writeString(source.marketId);
    return builder.build();
}

export function dictValueParserClaim(): DictionaryValue<Claim> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeClaim(src)).endCell());
        },
        parse: (src) => {
            return loadClaim(src.loadRef().beginParse());
        }
    }
}

export type Position = {
    $$type: 'Position';
    upStake: bigint;
    downStake: bigint;
    claimed: boolean;
}

export function storePosition(src: Position) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.upStake);
        b_0.storeCoins(src.downStake);
        b_0.storeBit(src.claimed);
    };
}

export function loadPosition(slice: Slice) {
    const sc_0 = slice;
    const _upStake = sc_0.loadCoins();
    const _downStake = sc_0.loadCoins();
    const _claimed = sc_0.loadBit();
    return { $$type: 'Position' as const, upStake: _upStake, downStake: _downStake, claimed: _claimed };
}

export function loadTuplePosition(source: TupleReader) {
    const _upStake = source.readBigNumber();
    const _downStake = source.readBigNumber();
    const _claimed = source.readBoolean();
    return { $$type: 'Position' as const, upStake: _upStake, downStake: _downStake, claimed: _claimed };
}

export function loadGetterTuplePosition(source: TupleReader) {
    const _upStake = source.readBigNumber();
    const _downStake = source.readBigNumber();
    const _claimed = source.readBoolean();
    return { $$type: 'Position' as const, upStake: _upStake, downStake: _downStake, claimed: _claimed };
}

export function storeTuplePosition(source: Position) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.upStake);
    builder.writeNumber(source.downStake);
    builder.writeBoolean(source.claimed);
    return builder.build();
}

export function dictValueParserPosition(): DictionaryValue<Position> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePosition(src)).endCell());
        },
        parse: (src) => {
            return loadPosition(src.loadRef().beginParse());
        }
    }
}

export type PulsePredictionMarket$Data = {
    $$type: 'PulsePredictionMarket$Data';
    admin: Address;
    roundDurationSeconds: bigint;
    protocolFeeBps: bigint;
    marketId: string;
    marketLabel: string;
    status: bigint;
    openedAt: bigint;
    closesAt: bigint;
    settledAt: bigint;
    totalUp: bigint;
    totalDown: bigint;
    result: bigint;
    positions: Dictionary<Address, Position>;
}

export function storePulsePredictionMarket$Data(src: PulsePredictionMarket$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.admin);
        b_0.storeInt(src.roundDurationSeconds, 257);
        b_0.storeInt(src.protocolFeeBps, 257);
        b_0.storeStringRefTail(src.marketId);
        b_0.storeStringRefTail(src.marketLabel);
        const b_1 = new Builder();
        b_1.storeInt(src.status, 257);
        b_1.storeInt(src.openedAt, 257);
        b_1.storeInt(src.closesAt, 257);
        const b_2 = new Builder();
        b_2.storeInt(src.settledAt, 257);
        b_2.storeCoins(src.totalUp);
        b_2.storeCoins(src.totalDown);
        b_2.storeInt(src.result, 257);
        b_2.storeDict(src.positions, Dictionary.Keys.Address(), dictValueParserPosition());
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadPulsePredictionMarket$Data(slice: Slice) {
    const sc_0 = slice;
    const _admin = sc_0.loadAddress();
    const _roundDurationSeconds = sc_0.loadIntBig(257);
    const _protocolFeeBps = sc_0.loadIntBig(257);
    const _marketId = sc_0.loadStringRefTail();
    const _marketLabel = sc_0.loadStringRefTail();
    const sc_1 = sc_0.loadRef().beginParse();
    const _status = sc_1.loadIntBig(257);
    const _openedAt = sc_1.loadIntBig(257);
    const _closesAt = sc_1.loadIntBig(257);
    const sc_2 = sc_1.loadRef().beginParse();
    const _settledAt = sc_2.loadIntBig(257);
    const _totalUp = sc_2.loadCoins();
    const _totalDown = sc_2.loadCoins();
    const _result = sc_2.loadIntBig(257);
    const _positions = Dictionary.load(Dictionary.Keys.Address(), dictValueParserPosition(), sc_2);
    return { $$type: 'PulsePredictionMarket$Data' as const, admin: _admin, roundDurationSeconds: _roundDurationSeconds, protocolFeeBps: _protocolFeeBps, marketId: _marketId, marketLabel: _marketLabel, status: _status, openedAt: _openedAt, closesAt: _closesAt, settledAt: _settledAt, totalUp: _totalUp, totalDown: _totalDown, result: _result, positions: _positions };
}

export function loadTuplePulsePredictionMarket$Data(source: TupleReader) {
    const _admin = source.readAddress();
    const _roundDurationSeconds = source.readBigNumber();
    const _protocolFeeBps = source.readBigNumber();
    const _marketId = source.readString();
    const _marketLabel = source.readString();
    const _status = source.readBigNumber();
    const _openedAt = source.readBigNumber();
    const _closesAt = source.readBigNumber();
    const _settledAt = source.readBigNumber();
    const _totalUp = source.readBigNumber();
    const _totalDown = source.readBigNumber();
    const _result = source.readBigNumber();
    const _positions = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserPosition(), source.readCellOpt());
    return { $$type: 'PulsePredictionMarket$Data' as const, admin: _admin, roundDurationSeconds: _roundDurationSeconds, protocolFeeBps: _protocolFeeBps, marketId: _marketId, marketLabel: _marketLabel, status: _status, openedAt: _openedAt, closesAt: _closesAt, settledAt: _settledAt, totalUp: _totalUp, totalDown: _totalDown, result: _result, positions: _positions };
}

export function loadGetterTuplePulsePredictionMarket$Data(source: TupleReader) {
    const _admin = source.readAddress();
    const _roundDurationSeconds = source.readBigNumber();
    const _protocolFeeBps = source.readBigNumber();
    const _marketId = source.readString();
    const _marketLabel = source.readString();
    const _status = source.readBigNumber();
    const _openedAt = source.readBigNumber();
    const _closesAt = source.readBigNumber();
    const _settledAt = source.readBigNumber();
    const _totalUp = source.readBigNumber();
    const _totalDown = source.readBigNumber();
    const _result = source.readBigNumber();
    const _positions = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserPosition(), source.readCellOpt());
    return { $$type: 'PulsePredictionMarket$Data' as const, admin: _admin, roundDurationSeconds: _roundDurationSeconds, protocolFeeBps: _protocolFeeBps, marketId: _marketId, marketLabel: _marketLabel, status: _status, openedAt: _openedAt, closesAt: _closesAt, settledAt: _settledAt, totalUp: _totalUp, totalDown: _totalDown, result: _result, positions: _positions };
}

export function storeTuplePulsePredictionMarket$Data(source: PulsePredictionMarket$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.admin);
    builder.writeNumber(source.roundDurationSeconds);
    builder.writeNumber(source.protocolFeeBps);
    builder.writeString(source.marketId);
    builder.writeString(source.marketLabel);
    builder.writeNumber(source.status);
    builder.writeNumber(source.openedAt);
    builder.writeNumber(source.closesAt);
    builder.writeNumber(source.settledAt);
    builder.writeNumber(source.totalUp);
    builder.writeNumber(source.totalDown);
    builder.writeNumber(source.result);
    builder.writeCell(source.positions.size > 0 ? beginCell().storeDictDirect(source.positions, Dictionary.Keys.Address(), dictValueParserPosition()).endCell() : null);
    return builder.build();
}

export function dictValueParserPulsePredictionMarket$Data(): DictionaryValue<PulsePredictionMarket$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePulsePredictionMarket$Data(src)).endCell());
        },
        parse: (src) => {
            return loadPulsePredictionMarket$Data(src.loadRef().beginParse());
        }
    }
}

 type PulsePredictionMarket_init_args = {
    $$type: 'PulsePredictionMarket_init_args';
    admin: Address;
    roundDurationSeconds: bigint;
    protocolFeeBps: bigint;
}

function initPulsePredictionMarket_init_args(src: PulsePredictionMarket_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.admin);
        b_0.storeInt(src.roundDurationSeconds, 257);
        b_0.storeInt(src.protocolFeeBps, 257);
    };
}

async function PulsePredictionMarket_init(admin: Address, roundDurationSeconds: bigint, protocolFeeBps: bigint) {
    const __code = Cell.fromHex('b5ee9c7241020d01000463000142ff00208e983001d072d721d200d200fa4021103450666f04f86102f862e1f2c80b0101feed44d0d200018e44fa40810101d700810101d700d401d001d401d0d401d001810101d700810101d700810101d700d430d0810101d700fa00fa00810101d700f40430109d109c109b109a6c1d8e1dfa40810101d700810101d700552003d1588b088b08737054700020726de20e925f0ee00cd70d1ff2e082218210505542310204c2bae30221821050554331ba8f4b31d430d0f84210cd10bc10ab109a10891078106710561045103443e0db3c2982008b4b0f01f90101f901ba1ef2f4817e8107c00017f2f410ab109a10891078106771071056104510344130e021821050555331ba03080c0702fa31d401d001d401d001d30730f82329c003917f9329c002e28ebc10de10ce10be10ae109e108e107e106e105e104e103e102f0111100152e011105610db3c50ef10cd10bc10ab109a10891078106710561045103410239132e22a82008fe80401f90101f901ba13f2f4813ca028c000f2f48200d7685116bbf2f4817f76040500246c9333705335a0547111106710561045726d01f0f8416f24135f03c200f2f420c00199f8416f24135f0313a09af8416f24135f0312a058e281010bf8422f5959f40b6fa192306ddf206e92306d9dd0fa00fa00d20055206c136f03e2206e943070207097206ef2d0806f23e205c00199f8416f24135f0312a099f8416f24135f03a001e281010bf8425036c80600fc55205afa0258fa02ca00c9103f4140206e953059f45930944133f413e210ac109b108a107910681057104610354430c87f01ca0055c050cdce1a810101cf0018810101cf0006c8ce16cdc805c8ce15cd13810101cf00810101cf00810101cf0002c8810101cf005003fa025003fa0213810101cf0013f40012cdcdc9ed5403a08f3e31d401d001d30730f8424ef0db3c31332782008b4b0d01f90101f901ba1cf2f48200e94705c00115f2f472f82310ac109b108a1079106817104610354144e001821050555031bae3025f0ef2c082080c0900148200b9b5511ec705f2f401fed430d02882008b4b0201f90101f901baf2f48200f17e26c002f2f481010bf8422e5959f40b6fa192306ddf206e92306d9dd0fa00fa00d20055206c136f03e2814dbc216eb3f2f48200b24221206ef2d0806f236c21b3f2f42cc0019920206ef2d0806f235b9a20206ef2d0806f233031e28200b2cf21c200f2f45da02ec0010a02fe91249123e28200f62a21c200f2f459a801a904530aa8812710a904a101206ef2d0806f23307f81010bf8424434c855205afa0258fa02ca00c90311100312206e953059f45930944133f413e2f842500e726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf818ae2f400c901fb0010ac55190b0c001a58cf8680cf8480f400f400cf81009ec87f01ca0055c050cdce1a810101cf0018810101cf0006c8ce16cdc805c8ce15cd13810101cf00810101cf00810101cf0002c8810101cf005003fa025003fa0213810101cf0013f40012cdcdc9ed54504f8337');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initPulsePredictionMarket_init_args({ $$type: 'PulsePredictionMarket_init_args', admin, roundDurationSeconds, protocolFeeBps })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const PulsePredictionMarket_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    15520: { message: "round_closed" },
    19900: { message: "position_not_found" },
    32385: { message: "round_not_open" },
    32630: { message: "stake_required" },
    35659: { message: "round_not_found" },
    36840: { message: "another_round_active" },
    45634: { message: "already_claimed" },
    45775: { message: "no_winning_position" },
    47541: { message: "admin_only" },
    55144: { message: "round_expired" },
    59719: { message: "round_not_closed" },
    61822: { message: "round_not_settled" },
    63018: { message: "invalid_winner_pool" },
} as const

export const PulsePredictionMarket_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "round_closed": 15520,
    "position_not_found": 19900,
    "round_not_open": 32385,
    "stake_required": 32630,
    "round_not_found": 35659,
    "another_round_active": 36840,
    "already_claimed": 45634,
    "no_winning_position": 45775,
    "admin_only": 47541,
    "round_expired": 55144,
    "round_not_closed": 59719,
    "round_not_settled": 61822,
    "invalid_winner_pool": 63018,
} as const

const PulsePredictionMarket_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"PlaceBet","header":1347764785,"fields":[{"name":"marketId","type":{"kind":"simple","type":"string","optional":false}},{"name":"marketLabel","type":{"kind":"simple","type":"string","optional":false}},{"name":"direction","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"CloseRound","header":1347765041,"fields":[{"name":"marketId","type":{"kind":"simple","type":"string","optional":false}}]},
    {"name":"SettleRound","header":1347769137,"fields":[{"name":"marketId","type":{"kind":"simple","type":"string","optional":false}},{"name":"result","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"Claim","header":1347768369,"fields":[{"name":"marketId","type":{"kind":"simple","type":"string","optional":false}}]},
    {"name":"Position","header":null,"fields":[{"name":"upStake","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"downStake","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"claimed","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"PulsePredictionMarket$Data","header":null,"fields":[{"name":"admin","type":{"kind":"simple","type":"address","optional":false}},{"name":"roundDurationSeconds","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"protocolFeeBps","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"marketId","type":{"kind":"simple","type":"string","optional":false}},{"name":"marketLabel","type":{"kind":"simple","type":"string","optional":false}},{"name":"status","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"openedAt","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"closesAt","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"settledAt","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"totalUp","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalDown","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"result","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"positions","type":{"kind":"dict","key":"address","value":"Position","valueFormat":"ref"}}]},
]

const PulsePredictionMarket_opcodes = {
    "PlaceBet": 1347764785,
    "CloseRound": 1347765041,
    "SettleRound": 1347769137,
    "Claim": 1347768369,
}

const PulsePredictionMarket_getters: ABIGetter[] = [
]

export const PulsePredictionMarket_getterMapping: { [key: string]: string } = {
}

const PulsePredictionMarket_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"PlaceBet"}},
    {"receiver":"internal","message":{"kind":"typed","type":"CloseRound"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SettleRound"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Claim"}},
]


export class PulsePredictionMarket implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = PulsePredictionMarket_errors_backward;
    public static readonly opcodes = PulsePredictionMarket_opcodes;
    
    static async init(admin: Address, roundDurationSeconds: bigint, protocolFeeBps: bigint) {
        return await PulsePredictionMarket_init(admin, roundDurationSeconds, protocolFeeBps);
    }
    
    static async fromInit(admin: Address, roundDurationSeconds: bigint, protocolFeeBps: bigint) {
        const __gen_init = await PulsePredictionMarket_init(admin, roundDurationSeconds, protocolFeeBps);
        const address = contractAddress(0, __gen_init);
        return new PulsePredictionMarket(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new PulsePredictionMarket(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  PulsePredictionMarket_types,
        getters: PulsePredictionMarket_getters,
        receivers: PulsePredictionMarket_receivers,
        errors: PulsePredictionMarket_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: PlaceBet | CloseRound | SettleRound | Claim) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'PlaceBet') {
            body = beginCell().store(storePlaceBet(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CloseRound') {
            body = beginCell().store(storeCloseRound(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SettleRound') {
            body = beginCell().store(storeSettleRound(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Claim') {
            body = beginCell().store(storeClaim(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
}