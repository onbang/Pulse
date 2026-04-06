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

export type BetYes = {
    $$type: 'BetYes';
    stakeAmount: bigint;
}

export function storeBetYes(src: BetYes) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1413896497, 32);
        b_0.storeCoins(src.stakeAmount);
    };
}

export function loadBetYes(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1413896497) { throw Error('Invalid prefix'); }
    const _stakeAmount = sc_0.loadCoins();
    return { $$type: 'BetYes' as const, stakeAmount: _stakeAmount };
}

export function loadTupleBetYes(source: TupleReader) {
    const _stakeAmount = source.readBigNumber();
    return { $$type: 'BetYes' as const, stakeAmount: _stakeAmount };
}

export function loadGetterTupleBetYes(source: TupleReader) {
    const _stakeAmount = source.readBigNumber();
    return { $$type: 'BetYes' as const, stakeAmount: _stakeAmount };
}

export function storeTupleBetYes(source: BetYes) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.stakeAmount);
    return builder.build();
}

export function dictValueParserBetYes(): DictionaryValue<BetYes> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBetYes(src)).endCell());
        },
        parse: (src) => {
            return loadBetYes(src.loadRef().beginParse());
        }
    }
}

export type BetNo = {
    $$type: 'BetNo';
    stakeAmount: bigint;
}

export function storeBetNo(src: BetNo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1413893681, 32);
        b_0.storeCoins(src.stakeAmount);
    };
}

export function loadBetNo(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1413893681) { throw Error('Invalid prefix'); }
    const _stakeAmount = sc_0.loadCoins();
    return { $$type: 'BetNo' as const, stakeAmount: _stakeAmount };
}

export function loadTupleBetNo(source: TupleReader) {
    const _stakeAmount = source.readBigNumber();
    return { $$type: 'BetNo' as const, stakeAmount: _stakeAmount };
}

export function loadGetterTupleBetNo(source: TupleReader) {
    const _stakeAmount = source.readBigNumber();
    return { $$type: 'BetNo' as const, stakeAmount: _stakeAmount };
}

export function storeTupleBetNo(source: BetNo) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.stakeAmount);
    return builder.build();
}

export function dictValueParserBetNo(): DictionaryValue<BetNo> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBetNo(src)).endCell());
        },
        parse: (src) => {
            return loadBetNo(src.loadRef().beginParse());
        }
    }
}

export type LockMarket = {
    $$type: 'LockMarket';
}

export function storeLockMarket(src: LockMarket) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1413893169, 32);
    };
}

export function loadLockMarket(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1413893169) { throw Error('Invalid prefix'); }
    return { $$type: 'LockMarket' as const };
}

export function loadTupleLockMarket(source: TupleReader) {
    return { $$type: 'LockMarket' as const };
}

export function loadGetterTupleLockMarket(source: TupleReader) {
    return { $$type: 'LockMarket' as const };
}

export function storeTupleLockMarket(source: LockMarket) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserLockMarket(): DictionaryValue<LockMarket> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeLockMarket(src)).endCell());
        },
        parse: (src) => {
            return loadLockMarket(src.loadRef().beginParse());
        }
    }
}

export type ResolveMarket = {
    $$type: 'ResolveMarket';
    finalPriceE9: bigint;
    resolvedAt: bigint;
}

export function storeResolveMarket(src: ResolveMarket) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1413894705, 32);
        b_0.storeUint(src.finalPriceE9, 64);
        b_0.storeUint(src.resolvedAt, 32);
    };
}

export function loadResolveMarket(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1413894705) { throw Error('Invalid prefix'); }
    const _finalPriceE9 = sc_0.loadUintBig(64);
    const _resolvedAt = sc_0.loadUintBig(32);
    return { $$type: 'ResolveMarket' as const, finalPriceE9: _finalPriceE9, resolvedAt: _resolvedAt };
}

export function loadTupleResolveMarket(source: TupleReader) {
    const _finalPriceE9 = source.readBigNumber();
    const _resolvedAt = source.readBigNumber();
    return { $$type: 'ResolveMarket' as const, finalPriceE9: _finalPriceE9, resolvedAt: _resolvedAt };
}

export function loadGetterTupleResolveMarket(source: TupleReader) {
    const _finalPriceE9 = source.readBigNumber();
    const _resolvedAt = source.readBigNumber();
    return { $$type: 'ResolveMarket' as const, finalPriceE9: _finalPriceE9, resolvedAt: _resolvedAt };
}

export function storeTupleResolveMarket(source: ResolveMarket) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.finalPriceE9);
    builder.writeNumber(source.resolvedAt);
    return builder.build();
}

export function dictValueParserResolveMarket(): DictionaryValue<ResolveMarket> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeResolveMarket(src)).endCell());
        },
        parse: (src) => {
            return loadResolveMarket(src.loadRef().beginParse());
        }
    }
}

export type ClaimReward = {
    $$type: 'ClaimReward';
}

export function storeClaimReward(src: ClaimReward) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1413890865, 32);
    };
}

export function loadClaimReward(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1413890865) { throw Error('Invalid prefix'); }
    return { $$type: 'ClaimReward' as const };
}

export function loadTupleClaimReward(source: TupleReader) {
    return { $$type: 'ClaimReward' as const };
}

export function loadGetterTupleClaimReward(source: TupleReader) {
    return { $$type: 'ClaimReward' as const };
}

export function storeTupleClaimReward(source: ClaimReward) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserClaimReward(): DictionaryValue<ClaimReward> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeClaimReward(src)).endCell());
        },
        parse: (src) => {
            return loadClaimReward(src.loadRef().beginParse());
        }
    }
}

export type ClaimRewardFor = {
    $$type: 'ClaimRewardFor';
    wallet: Address;
}

export function storeClaimRewardFor(src: ClaimRewardFor) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1413891633, 32);
        b_0.storeAddress(src.wallet);
    };
}

export function loadClaimRewardFor(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1413891633) { throw Error('Invalid prefix'); }
    const _wallet = sc_0.loadAddress();
    return { $$type: 'ClaimRewardFor' as const, wallet: _wallet };
}

export function loadTupleClaimRewardFor(source: TupleReader) {
    const _wallet = source.readAddress();
    return { $$type: 'ClaimRewardFor' as const, wallet: _wallet };
}

export function loadGetterTupleClaimRewardFor(source: TupleReader) {
    const _wallet = source.readAddress();
    return { $$type: 'ClaimRewardFor' as const, wallet: _wallet };
}

export function storeTupleClaimRewardFor(source: ClaimRewardFor) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.wallet);
    return builder.build();
}

export function dictValueParserClaimRewardFor(): DictionaryValue<ClaimRewardFor> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeClaimRewardFor(src)).endCell());
        },
        parse: (src) => {
            return loadClaimRewardFor(src.loadRef().beginParse());
        }
    }
}

export type Position = {
    $$type: 'Position';
    yesStake: bigint;
    noStake: bigint;
    claimed: boolean;
}

export function storePosition(src: Position) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.yesStake);
        b_0.storeCoins(src.noStake);
        b_0.storeBit(src.claimed);
    };
}

export function loadPosition(slice: Slice) {
    const sc_0 = slice;
    const _yesStake = sc_0.loadCoins();
    const _noStake = sc_0.loadCoins();
    const _claimed = sc_0.loadBit();
    return { $$type: 'Position' as const, yesStake: _yesStake, noStake: _noStake, claimed: _claimed };
}

export function loadTuplePosition(source: TupleReader) {
    const _yesStake = source.readBigNumber();
    const _noStake = source.readBigNumber();
    const _claimed = source.readBoolean();
    return { $$type: 'Position' as const, yesStake: _yesStake, noStake: _noStake, claimed: _claimed };
}

export function loadGetterTuplePosition(source: TupleReader) {
    const _yesStake = source.readBigNumber();
    const _noStake = source.readBigNumber();
    const _claimed = source.readBoolean();
    return { $$type: 'Position' as const, yesStake: _yesStake, noStake: _noStake, claimed: _claimed };
}

export function storeTuplePosition(source: Position) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.yesStake);
    builder.writeNumber(source.noStake);
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
}

export function storeMarketState(src: MarketState) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.resolver);
        b_0.storeAddress(src.treasury);
        const b_1 = new Builder();
        b_1.storeAddress(src.token);
        b_1.storeUint(src.timeframeSeconds, 32);
        b_1.storeUint(src.thresholdBps, 16);
        b_1.storeUint(src.referencePriceE9, 64);
        b_1.storeUint(src.protocolFeeBps, 16);
        b_1.storeUint(src.createdAt, 32);
        b_1.storeUint(src.closeTime, 32);
        b_1.storeUint(src.status, 8);
        b_1.storeUint(src.resolvedAt, 32);
        b_1.storeUint(src.finalPriceE9, 64);
        b_1.storeCoins(src.totalYes);
        b_1.storeCoins(src.totalNo);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadMarketState(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _resolver = sc_0.loadAddress();
    const _treasury = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _token = sc_1.loadAddress();
    const _timeframeSeconds = sc_1.loadUintBig(32);
    const _thresholdBps = sc_1.loadUintBig(16);
    const _referencePriceE9 = sc_1.loadUintBig(64);
    const _protocolFeeBps = sc_1.loadUintBig(16);
    const _createdAt = sc_1.loadUintBig(32);
    const _closeTime = sc_1.loadUintBig(32);
    const _status = sc_1.loadUintBig(8);
    const _resolvedAt = sc_1.loadUintBig(32);
    const _finalPriceE9 = sc_1.loadUintBig(64);
    const _totalYes = sc_1.loadCoins();
    const _totalNo = sc_1.loadCoins();
    return { $$type: 'MarketState' as const, owner: _owner, resolver: _resolver, treasury: _treasury, token: _token, timeframeSeconds: _timeframeSeconds, thresholdBps: _thresholdBps, referencePriceE9: _referencePriceE9, protocolFeeBps: _protocolFeeBps, createdAt: _createdAt, closeTime: _closeTime, status: _status, resolvedAt: _resolvedAt, finalPriceE9: _finalPriceE9, totalYes: _totalYes, totalNo: _totalNo };
}

export function loadTupleMarketState(source: TupleReader) {
    const _owner = source.readAddress();
    const _resolver = source.readAddress();
    const _treasury = source.readAddress();
    const _token = source.readAddress();
    const _timeframeSeconds = source.readBigNumber();
    const _thresholdBps = source.readBigNumber();
    const _referencePriceE9 = source.readBigNumber();
    const _protocolFeeBps = source.readBigNumber();
    const _createdAt = source.readBigNumber();
    const _closeTime = source.readBigNumber();
    const _status = source.readBigNumber();
    const _resolvedAt = source.readBigNumber();
    const _finalPriceE9 = source.readBigNumber();
    const _totalYes = source.readBigNumber();
    const _totalNo = source.readBigNumber();
    return { $$type: 'MarketState' as const, owner: _owner, resolver: _resolver, treasury: _treasury, token: _token, timeframeSeconds: _timeframeSeconds, thresholdBps: _thresholdBps, referencePriceE9: _referencePriceE9, protocolFeeBps: _protocolFeeBps, createdAt: _createdAt, closeTime: _closeTime, status: _status, resolvedAt: _resolvedAt, finalPriceE9: _finalPriceE9, totalYes: _totalYes, totalNo: _totalNo };
}

export function loadGetterTupleMarketState(source: TupleReader) {
    const _owner = source.readAddress();
    const _resolver = source.readAddress();
    const _treasury = source.readAddress();
    const _token = source.readAddress();
    const _timeframeSeconds = source.readBigNumber();
    const _thresholdBps = source.readBigNumber();
    const _referencePriceE9 = source.readBigNumber();
    const _protocolFeeBps = source.readBigNumber();
    const _createdAt = source.readBigNumber();
    const _closeTime = source.readBigNumber();
    const _status = source.readBigNumber();
    const _resolvedAt = source.readBigNumber();
    const _finalPriceE9 = source.readBigNumber();
    const _totalYes = source.readBigNumber();
    const _totalNo = source.readBigNumber();
    return { $$type: 'MarketState' as const, owner: _owner, resolver: _resolver, treasury: _treasury, token: _token, timeframeSeconds: _timeframeSeconds, thresholdBps: _thresholdBps, referencePriceE9: _referencePriceE9, protocolFeeBps: _protocolFeeBps, createdAt: _createdAt, closeTime: _closeTime, status: _status, resolvedAt: _resolvedAt, finalPriceE9: _finalPriceE9, totalYes: _totalYes, totalNo: _totalNo };
}

export function storeTupleMarketState(source: MarketState) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.resolver);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.token);
    builder.writeNumber(source.timeframeSeconds);
    builder.writeNumber(source.thresholdBps);
    builder.writeNumber(source.referencePriceE9);
    builder.writeNumber(source.protocolFeeBps);
    builder.writeNumber(source.createdAt);
    builder.writeNumber(source.closeTime);
    builder.writeNumber(source.status);
    builder.writeNumber(source.resolvedAt);
    builder.writeNumber(source.finalPriceE9);
    builder.writeNumber(source.totalYes);
    builder.writeNumber(source.totalNo);
    return builder.build();
}

export function dictValueParserMarketState(): DictionaryValue<MarketState> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMarketState(src)).endCell());
        },
        parse: (src) => {
            return loadMarketState(src.loadRef().beginParse());
        }
    }
}

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
}

export function storeTonForecastMarket$Data(src: TonForecastMarket$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.resolver);
        b_0.storeAddress(src.treasury);
        const b_1 = new Builder();
        b_1.storeAddress(src.token);
        b_1.storeUint(src.timeframeSeconds, 32);
        b_1.storeUint(src.thresholdBps, 16);
        b_1.storeUint(src.referencePriceE9, 64);
        b_1.storeUint(src.protocolFeeBps, 16);
        b_1.storeUint(src.createdAt, 32);
        b_1.storeUint(src.closeTime, 32);
        b_1.storeUint(src.status, 8);
        b_1.storeUint(src.resolvedAt, 32);
        b_1.storeUint(src.finalPriceE9, 64);
        b_1.storeCoins(src.totalYes);
        b_1.storeCoins(src.totalNo);
        b_1.storeDict(src.positions, Dictionary.Keys.BigUint(256), dictValueParserPosition());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadTonForecastMarket$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _resolver = sc_0.loadAddress();
    const _treasury = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _token = sc_1.loadAddress();
    const _timeframeSeconds = sc_1.loadUintBig(32);
    const _thresholdBps = sc_1.loadUintBig(16);
    const _referencePriceE9 = sc_1.loadUintBig(64);
    const _protocolFeeBps = sc_1.loadUintBig(16);
    const _createdAt = sc_1.loadUintBig(32);
    const _closeTime = sc_1.loadUintBig(32);
    const _status = sc_1.loadUintBig(8);
    const _resolvedAt = sc_1.loadUintBig(32);
    const _finalPriceE9 = sc_1.loadUintBig(64);
    const _totalYes = sc_1.loadCoins();
    const _totalNo = sc_1.loadCoins();
    const _positions = Dictionary.load(Dictionary.Keys.BigUint(256), dictValueParserPosition(), sc_1);
    return { $$type: 'TonForecastMarket$Data' as const, owner: _owner, resolver: _resolver, treasury: _treasury, token: _token, timeframeSeconds: _timeframeSeconds, thresholdBps: _thresholdBps, referencePriceE9: _referencePriceE9, protocolFeeBps: _protocolFeeBps, createdAt: _createdAt, closeTime: _closeTime, status: _status, resolvedAt: _resolvedAt, finalPriceE9: _finalPriceE9, totalYes: _totalYes, totalNo: _totalNo, positions: _positions };
}

export function loadTupleTonForecastMarket$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _resolver = source.readAddress();
    const _treasury = source.readAddress();
    const _token = source.readAddress();
    const _timeframeSeconds = source.readBigNumber();
    const _thresholdBps = source.readBigNumber();
    const _referencePriceE9 = source.readBigNumber();
    const _protocolFeeBps = source.readBigNumber();
    const _createdAt = source.readBigNumber();
    const _closeTime = source.readBigNumber();
    const _status = source.readBigNumber();
    const _resolvedAt = source.readBigNumber();
    const _finalPriceE9 = source.readBigNumber();
    const _totalYes = source.readBigNumber();
    source = source.readTuple();
    const _totalNo = source.readBigNumber();
    const _positions = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), dictValueParserPosition(), source.readCellOpt());
    return { $$type: 'TonForecastMarket$Data' as const, owner: _owner, resolver: _resolver, treasury: _treasury, token: _token, timeframeSeconds: _timeframeSeconds, thresholdBps: _thresholdBps, referencePriceE9: _referencePriceE9, protocolFeeBps: _protocolFeeBps, createdAt: _createdAt, closeTime: _closeTime, status: _status, resolvedAt: _resolvedAt, finalPriceE9: _finalPriceE9, totalYes: _totalYes, totalNo: _totalNo, positions: _positions };
}

export function loadGetterTupleTonForecastMarket$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _resolver = source.readAddress();
    const _treasury = source.readAddress();
    const _token = source.readAddress();
    const _timeframeSeconds = source.readBigNumber();
    const _thresholdBps = source.readBigNumber();
    const _referencePriceE9 = source.readBigNumber();
    const _protocolFeeBps = source.readBigNumber();
    const _createdAt = source.readBigNumber();
    const _closeTime = source.readBigNumber();
    const _status = source.readBigNumber();
    const _resolvedAt = source.readBigNumber();
    const _finalPriceE9 = source.readBigNumber();
    const _totalYes = source.readBigNumber();
    const _totalNo = source.readBigNumber();
    const _positions = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), dictValueParserPosition(), source.readCellOpt());
    return { $$type: 'TonForecastMarket$Data' as const, owner: _owner, resolver: _resolver, treasury: _treasury, token: _token, timeframeSeconds: _timeframeSeconds, thresholdBps: _thresholdBps, referencePriceE9: _referencePriceE9, protocolFeeBps: _protocolFeeBps, createdAt: _createdAt, closeTime: _closeTime, status: _status, resolvedAt: _resolvedAt, finalPriceE9: _finalPriceE9, totalYes: _totalYes, totalNo: _totalNo, positions: _positions };
}

export function storeTupleTonForecastMarket$Data(source: TonForecastMarket$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.resolver);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.token);
    builder.writeNumber(source.timeframeSeconds);
    builder.writeNumber(source.thresholdBps);
    builder.writeNumber(source.referencePriceE9);
    builder.writeNumber(source.protocolFeeBps);
    builder.writeNumber(source.createdAt);
    builder.writeNumber(source.closeTime);
    builder.writeNumber(source.status);
    builder.writeNumber(source.resolvedAt);
    builder.writeNumber(source.finalPriceE9);
    builder.writeNumber(source.totalYes);
    builder.writeNumber(source.totalNo);
    builder.writeCell(source.positions.size > 0 ? beginCell().storeDictDirect(source.positions, Dictionary.Keys.BigUint(256), dictValueParserPosition()).endCell() : null);
    return builder.build();
}

export function dictValueParserTonForecastMarket$Data(): DictionaryValue<TonForecastMarket$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTonForecastMarket$Data(src)).endCell());
        },
        parse: (src) => {
            return loadTonForecastMarket$Data(src.loadRef().beginParse());
        }
    }
}

 type TonForecastMarket_init_args = {
    $$type: 'TonForecastMarket_init_args';
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
}

function initTonForecastMarket_init_args(src: TonForecastMarket_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.resolver);
        b_0.storeAddress(src.treasury);
        const b_1 = new Builder();
        b_1.storeAddress(src.token);
        b_1.storeInt(src.timeframeSeconds, 257);
        b_1.storeInt(src.thresholdBps, 257);
        const b_2 = new Builder();
        b_2.storeInt(src.referencePriceE9, 257);
        b_2.storeInt(src.protocolFeeBps, 257);
        b_2.storeInt(src.createdAt, 257);
        const b_3 = new Builder();
        b_3.storeInt(src.closeTime, 257);
        b_2.storeRef(b_3.endCell());
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

async function TonForecastMarket_init(owner: Address, resolver: Address, treasury: Address, token: Address, timeframeSeconds: bigint, thresholdBps: bigint, referencePriceE9: bigint, protocolFeeBps: bigint, createdAt: bigint, closeTime: bigint) {
    const __code = Cell.fromHex('b5ee9c7241023a01000f1400025aff008e88f4a413f4bcf2c80bed53208e983001d072d721d200d200fa4021103450666f04f86102f862e1ed43d901070205946ac0020402f3a023b51343480006398be903e903e903500743e9020404075c020404075c0350c3420404075c020404075c020404075c0350c3420404075c00c041e841e441e02b4554220802812c9b0803cbd205f680970bffcbd2058588930803cbd208025e494c4af3cbd1c151c00081b78c343c44403d543b6cf1b30db10e08030166db3c8307220259f40f6fa192306ddf206e92306d9dd0fa00fa00d20055206c136f03e2206e943070207097206ef2d0806f23e22c03f9a3a7b51343480006398be903e903e903500743e9020404075c020404075c0350c3420404075c020404075c020404075c0350c3420404075c00c041e841e441e02b4554220802812c9b0803cbd205f680970bffcbd2058588930803cbd208025e494c4af3cbd1c151c00081b78c376cf0fcfcfcfcfcfcfcfcfcfcfcfcfe080506001e547fed547fed547fed547fed547fed000a3f57106c1e03fced44d0d200018e62fa40fa40fa40d401d0fa40810101d700810101d700d430d0810101d700810101d700810101d700d430d0810101d70030107a107910780ad155088200a04b26c200f2f4817da025c2fff2f481616224c200f2f4820097925312bcf2f470547000206de30d1111935f0f5be0705610d74920c21fe3002108090a0060fa40fa40fa40d401d0fa40d31fd30fd33fd30fd31fd31fd307d31fd33ffa00fa00f404300d11100d10df10de5710550e000e311110d31f111103f4821054465931ba8ee55b0ffa0030f8420f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035102443007f01db3cc87f01ca00111055e011101fce1dce1bce09c8ce18cb1f16cb0f14cb3f12cb0fcb1fcb1fcb07cb1f12cb3f58fa0258fa0212f400cdc9ed54e021821054464e31bae302210c0b1201ca5b0ffa0030f8420f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035102443007001db3cc87f01ca00111055e011101fce1dce1bce09c8ce18cb1f16cb0f14cb3f12cb0fcb1fcb1fcb07cb1f12cb3f58fa0258fa0212f400cdc9ed540c04f40f11120f0e11110e0d11100d0c11120c0b11110b0a11100a0911120908111108071110070611120605111105041110040311120302111102011110011112db3c5612db3c5611db3c111397045614a01114a09c035614a0111413a003111302e21110111311100f11120f0e11110e0d11100d10cf10be10ad109c0d0e0f11013655e08200bd3e1110db3c01111101f2f4811ce5f82327b9f2f4550e17002e817f7621c200f2f48200ba05f8416f24135f0358bef2f402f4210f11110f5e3d0c11100c0b11110b0a11100a091111090811100807111107061110060511110504111004031111030211100201111101111083071112db3c021111020111120159f40f6fa192306ddf206e92306d9dd0fa00fa00d20055206c136f03e2206e943070207097206ef2d0806f23e21110111211102c1000400f11110f0e11100e10df10ce10bd10ac109b108a1079106810571046103510340122108b107a1069105810471046404513db3c2b04cc821054464c31ba8ec05b3f10df551cdb3cc87f01ca00111055e011101fce1dce1bce09c8ce18cb1f16cb0f14cb3f12cb0fcb1fcb1fcb07cb1f12cb3f58fa0258fa0212f400cdc9ed54e021821054465231bae30221821054464331bae30221821054464631ba13141f20023e820093d1f82328bef2f455e08200bd3e1110db3c01111101f2f4550edb3c36171a01c65b0fd33fd31f300f11110f0e11100e10df10ce10bd10ac109b108a1079106810571046103510241023db3cc87f01ca00111055e011101fce1dce1bce09c8ce18cb1f16cb0f14cb3f12cb0fcb1fcb1fcb07cb1f12cb3f58fa0258fa0212f400cdc9ed541504bc0f11110f5e3d0c11100c0b11110b0a11100a0911110908111008071111070611100605111105041110040311110302111002011111011110db3c820093d1f82328bef2f455e0815f151110db3c917f8e82db3ce201111101f2f4550e56111617191b00188200a3def8425610c705f2f40192250f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c01111101ba0f11100f10ef10de10cd10bc10ab109a1089107810671056104510344130180002700192250f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c01111101ba0f11100f10ef10de10cd10bc10ab109a10891078106710561045103441301a000271024edb3cdb3c3434342ec200943ef8230edf10df10ce10bd10ac109b108a10791068105710465052131c1d03568127102ca052b0a8812710a9048127102da152c0a8812710a9045222be8e835bdb3ce0bb8e82db3ce0db3c35242f048c0f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c561101ba9322c0009170e28e865710550edb3ce0db3c561101ba9321c0009170e2352f241e011e8e865710550edb3ce00f11100f550e2f01b65b3ff8420e11100e10df10ce10bd10ac109b108a10791068105710461035443012db3cc87f01ca00111055e011101fce1dce1bce09c8ce18cb1f16cb0f14cb3f12cb0fcb1fcb1fcb07cb1f12cb3f58fa0258fa0212f400cdc9ed542102e88edc5b0ffa40300e11100e10df10ce10bd10ac109b108a10791068105710461035443012db3cc87f01ca00111055e011101fce1dce1bce09c8ce18cb1f16cb0f14cb3f12cb0fcb1fcb1fcb07cb1f12cb3f58fa0258fa0212f400cdc9ed54e05711c0001110c12101111001b0e3025f0f30f2c082213904f40f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c5610db3c5472101112111511121111111411111110111311100f11150f0e11140e0d11130d0c11150c0b11140b0a11130a09111509081114080711130706111506051114050411130403111503db3c8160fe21c2002225272a012455e082009fd91110db3c01111101f2f4550e2303ce250f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c01111101ba917f8e8a241110db3c01111101bae2917f8e8a241110db3c01111101bae20f11100f10ef10de10cd10bc10ab109a108910781067105610451034413035242f00027302f6210f11110f5e3d0c11100c0b11110b0a11100a091111090811100807111107061110060511110504111004031111030211100201111101111083071112db3c021111020111120159f40f6fa192306ddf206e92306d9dd0fa00fa00d20055206c136f03e2814dbc216eb3f2f48200b24221206ef2d0806f236c21b32c26005ef2f4206ef2d0806f231110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035103402ec280f11130f0e11120e0d11110d0c11100c0b11130b0a11120a0911110908111008071113070611120605111105041110040311130302111202011111011110db3c01111101ba8e215710011111011110a00c11100c10bf10ae109d108c107b106a1059104810374650e05612561256121111111211112f2803fe1110111111100f11100f10ef10de10cd10bc10ab109a108910781067105610451034db3c8200b2cf21c200f2f40f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c8200f62a01c200f2f4021113020111120111110f11120f0e11110e0d11100d10cf10be10ad109c108b107a106932332902c210581047103605111305103403111303db3c0f11100f0e11100e0d11100d0c11100c0b11100b0a11100a09111009111008070655405610db3c011112011111a0011110a10e11100e10df10ce10bd10ac109b108a10791068105710461035443012313602f8f2f4561256121111111211111110111211100f11120f0e11120e0d11120d0c11120c0b11120b0a11120a09111209081112080711120706111206051112050411120403111203021112025616597fdb3c0f11140f0e11130e0d11120d0c11110c0b11100b10af109e108d107c106b105a10491038471550644330db3c2b2e02f6240f11140f0e11130e0d11120d0c11110c0b11100b0a11140a091113090811120807111107061110060511140504111304031112030211110201111001111483071114db3c3102111202011111011110c855205afa0258fa02ca00c903111203021111021e206e953059f45b30944133f417e210af109e108d107c2c2d000ec801cf16c9f9000018106b105a104910384760433003f42a0f11150f0e11140e0d11130d0c11120c0b11110b0a11100a0911150908111408071113070611120605111105041110040311150302111402011113011112db3c01111301ba8e9a5712571257120b11110b0a11100a109f108e107d106c5555db3ce002111402011113010e11120d11110d0c11100c10bf10ae2f38300002740470109d108c107b106a10591048103706111406051113050411140403111303db3cdb3c20c2008e8452e0db3c9130e20f11110f0e11100e551d3136383703e6db3c0f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c0f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c01111201a8011110a9040e11100e10df10ce10bd10ac109b108a1079106810571046103544301232333401ae30270f11120f0e11110e0d11100d0c11120c0b11110b0a11100a0911120908111108071110070611120605111105041110040311120302111102011110011112db3c01111301ba913f94571010efe20d11100d10cf552b35019c250f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c01111101ba91219120e20f11100f10ef10de10cd10bc10ab109a108910781067105610451034413035019c250f11100f0e11100e0d11100d0c11100c0b11100b0a11100a0911100911100807065540db3c01111101ba91209121e20f11100f10ef10de10cd10bc10ab109a108910781067105610451034413035000272000e29a8812710a9040104db3c380070726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00007810df551cc87f01ca00111055e011101fce1dce1bce09c8ce18cb1f16cb0f14cb3f12cb0fcb1fcb1fcb07cb1f12cb3f58fa0258fa0212f400cdc9ed54eab7103e');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initTonForecastMarket_init_args({ $$type: 'TonForecastMarket_init_args', owner, resolver, treasury, token, timeframeSeconds, thresholdBps, referencePriceE9, protocolFeeBps, createdAt, closeTime })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const TonForecastMarket_errors = {
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
    7397: { message: "market_locked" },
    19900: { message: "position_not_found" },
    24341: { message: "market_not_resolvable" },
    24830: { message: "nothing_to_claim" },
    24930: { message: "invalid_reference_price" },
    32160: { message: "invalid_threshold" },
    32630: { message: "stake_required" },
    37841: { message: "market_still_open" },
    38802: { message: "invalid_close_time" },
    40921: { message: "market_not_resolved" },
    41035: { message: "invalid_timeframe" },
    41950: { message: "resolver_only" },
    45634: { message: "already_claimed" },
    45775: { message: "no_winning_position" },
    47621: { message: "insufficient_message_value" },
    48446: { message: "market_not_open" },
    63018: { message: "invalid_winner_pool" },
} as const

export const TonForecastMarket_errors_backward = {
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
    "market_locked": 7397,
    "position_not_found": 19900,
    "market_not_resolvable": 24341,
    "nothing_to_claim": 24830,
    "invalid_reference_price": 24930,
    "invalid_threshold": 32160,
    "stake_required": 32630,
    "market_still_open": 37841,
    "invalid_close_time": 38802,
    "market_not_resolved": 40921,
    "invalid_timeframe": 41035,
    "resolver_only": 41950,
    "already_claimed": 45634,
    "no_winning_position": 45775,
    "insufficient_message_value": 47621,
    "market_not_open": 48446,
    "invalid_winner_pool": 63018,
} as const

const TonForecastMarket_types: ABIType[] = [
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
    {"name":"BetYes","header":1413896497,"fields":[{"name":"stakeAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"BetNo","header":1413893681,"fields":[{"name":"stakeAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"LockMarket","header":1413893169,"fields":[]},
    {"name":"ResolveMarket","header":1413894705,"fields":[{"name":"finalPriceE9","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"resolvedAt","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
    {"name":"ClaimReward","header":1413890865,"fields":[]},
    {"name":"ClaimRewardFor","header":1413891633,"fields":[{"name":"wallet","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Position","header":null,"fields":[{"name":"yesStake","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"noStake","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"claimed","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MarketState","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"resolver","type":{"kind":"simple","type":"address","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"token","type":{"kind":"simple","type":"address","optional":false}},{"name":"timeframeSeconds","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"thresholdBps","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"referencePriceE9","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"protocolFeeBps","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"createdAt","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"closeTime","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"status","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"resolvedAt","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"finalPriceE9","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"totalYes","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalNo","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"TonForecastMarket$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"resolver","type":{"kind":"simple","type":"address","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"token","type":{"kind":"simple","type":"address","optional":false}},{"name":"timeframeSeconds","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"thresholdBps","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"referencePriceE9","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"protocolFeeBps","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"createdAt","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"closeTime","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"status","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"resolvedAt","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"finalPriceE9","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"totalYes","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalNo","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"positions","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"Position","valueFormat":"ref"}}]},
]

const TonForecastMarket_opcodes = {
    "BetYes": 1413896497,
    "BetNo": 1413893681,
    "LockMarket": 1413893169,
    "ResolveMarket": 1413894705,
    "ClaimReward": 1413890865,
    "ClaimRewardFor": 1413891633,
}

const TonForecastMarket_getters: ABIGetter[] = [
    {"name":"getMarketState","methodId":109545,"arguments":[],"returnType":{"kind":"simple","type":"MarketState","optional":false}},
    {"name":"getPosition","methodId":109064,"arguments":[{"name":"wallet","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"Position","optional":false}},
]

export const TonForecastMarket_getterMapping: { [key: string]: string } = {
    'getMarketState': 'getGetMarketState',
    'getPosition': 'getGetPosition',
}

const TonForecastMarket_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"empty"}},
    {"receiver":"internal","message":{"kind":"typed","type":"BetYes"}},
    {"receiver":"internal","message":{"kind":"typed","type":"BetNo"}},
    {"receiver":"internal","message":{"kind":"typed","type":"LockMarket"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ResolveMarket"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ClaimReward"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ClaimRewardFor"}},
]


export class TonForecastMarket implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = TonForecastMarket_errors_backward;
    public static readonly opcodes = TonForecastMarket_opcodes;
    
    static async init(owner: Address, resolver: Address, treasury: Address, token: Address, timeframeSeconds: bigint, thresholdBps: bigint, referencePriceE9: bigint, protocolFeeBps: bigint, createdAt: bigint, closeTime: bigint) {
        return await TonForecastMarket_init(owner, resolver, treasury, token, timeframeSeconds, thresholdBps, referencePriceE9, protocolFeeBps, createdAt, closeTime);
    }
    
    static async fromInit(owner: Address, resolver: Address, treasury: Address, token: Address, timeframeSeconds: bigint, thresholdBps: bigint, referencePriceE9: bigint, protocolFeeBps: bigint, createdAt: bigint, closeTime: bigint) {
        const __gen_init = await TonForecastMarket_init(owner, resolver, treasury, token, timeframeSeconds, thresholdBps, referencePriceE9, protocolFeeBps, createdAt, closeTime);
        const address = contractAddress(0, __gen_init);
        return new TonForecastMarket(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new TonForecastMarket(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  TonForecastMarket_types,
        getters: TonForecastMarket_getters,
        receivers: TonForecastMarket_receivers,
        errors: TonForecastMarket_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: null | BetYes | BetNo | LockMarket | ResolveMarket | ClaimReward | ClaimRewardFor) {
        
        let body: Cell | null = null;
        if (message === null) {
            body = new Cell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'BetYes') {
            body = beginCell().store(storeBetYes(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'BetNo') {
            body = beginCell().store(storeBetNo(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'LockMarket') {
            body = beginCell().store(storeLockMarket(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ResolveMarket') {
            body = beginCell().store(storeResolveMarket(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ClaimReward') {
            body = beginCell().store(storeClaimReward(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ClaimRewardFor') {
            body = beginCell().store(storeClaimRewardFor(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetMarketState(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('getMarketState', builder.build())).stack;
        const result = loadGetterTupleMarketState(source);
        return result;
    }
    
    async getGetPosition(provider: ContractProvider, wallet: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(wallet);
        const source = (await provider.get('getPosition', builder.build())).stack;
        const result = loadGetterTuplePosition(source);
        return result;
    }
    
}