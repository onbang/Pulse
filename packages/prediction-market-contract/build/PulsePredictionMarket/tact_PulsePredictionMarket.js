"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PulsePredictionMarket =
  exports.PulsePredictionMarket_getterMapping =
  exports.PulsePredictionMarket_errors_backward =
  exports.PulsePredictionMarket_errors =
    void 0;
exports.storeDataSize = storeDataSize;
exports.loadDataSize = loadDataSize;
exports.loadTupleDataSize = loadTupleDataSize;
exports.loadGetterTupleDataSize = loadGetterTupleDataSize;
exports.storeTupleDataSize = storeTupleDataSize;
exports.dictValueParserDataSize = dictValueParserDataSize;
exports.storeSignedBundle = storeSignedBundle;
exports.loadSignedBundle = loadSignedBundle;
exports.loadTupleSignedBundle = loadTupleSignedBundle;
exports.loadGetterTupleSignedBundle = loadGetterTupleSignedBundle;
exports.storeTupleSignedBundle = storeTupleSignedBundle;
exports.dictValueParserSignedBundle = dictValueParserSignedBundle;
exports.storeStateInit = storeStateInit;
exports.loadStateInit = loadStateInit;
exports.loadTupleStateInit = loadTupleStateInit;
exports.loadGetterTupleStateInit = loadGetterTupleStateInit;
exports.storeTupleStateInit = storeTupleStateInit;
exports.dictValueParserStateInit = dictValueParserStateInit;
exports.storeContext = storeContext;
exports.loadContext = loadContext;
exports.loadTupleContext = loadTupleContext;
exports.loadGetterTupleContext = loadGetterTupleContext;
exports.storeTupleContext = storeTupleContext;
exports.dictValueParserContext = dictValueParserContext;
exports.storeSendParameters = storeSendParameters;
exports.loadSendParameters = loadSendParameters;
exports.loadTupleSendParameters = loadTupleSendParameters;
exports.loadGetterTupleSendParameters = loadGetterTupleSendParameters;
exports.storeTupleSendParameters = storeTupleSendParameters;
exports.dictValueParserSendParameters = dictValueParserSendParameters;
exports.storeMessageParameters = storeMessageParameters;
exports.loadMessageParameters = loadMessageParameters;
exports.loadTupleMessageParameters = loadTupleMessageParameters;
exports.loadGetterTupleMessageParameters = loadGetterTupleMessageParameters;
exports.storeTupleMessageParameters = storeTupleMessageParameters;
exports.dictValueParserMessageParameters = dictValueParserMessageParameters;
exports.storeDeployParameters = storeDeployParameters;
exports.loadDeployParameters = loadDeployParameters;
exports.loadTupleDeployParameters = loadTupleDeployParameters;
exports.loadGetterTupleDeployParameters = loadGetterTupleDeployParameters;
exports.storeTupleDeployParameters = storeTupleDeployParameters;
exports.dictValueParserDeployParameters = dictValueParserDeployParameters;
exports.storeStdAddress = storeStdAddress;
exports.loadStdAddress = loadStdAddress;
exports.loadTupleStdAddress = loadTupleStdAddress;
exports.loadGetterTupleStdAddress = loadGetterTupleStdAddress;
exports.storeTupleStdAddress = storeTupleStdAddress;
exports.dictValueParserStdAddress = dictValueParserStdAddress;
exports.storeVarAddress = storeVarAddress;
exports.loadVarAddress = loadVarAddress;
exports.loadTupleVarAddress = loadTupleVarAddress;
exports.loadGetterTupleVarAddress = loadGetterTupleVarAddress;
exports.storeTupleVarAddress = storeTupleVarAddress;
exports.dictValueParserVarAddress = dictValueParserVarAddress;
exports.storeBasechainAddress = storeBasechainAddress;
exports.loadBasechainAddress = loadBasechainAddress;
exports.loadTupleBasechainAddress = loadTupleBasechainAddress;
exports.loadGetterTupleBasechainAddress = loadGetterTupleBasechainAddress;
exports.storeTupleBasechainAddress = storeTupleBasechainAddress;
exports.dictValueParserBasechainAddress = dictValueParserBasechainAddress;
exports.storePlaceBet = storePlaceBet;
exports.loadPlaceBet = loadPlaceBet;
exports.loadTuplePlaceBet = loadTuplePlaceBet;
exports.loadGetterTuplePlaceBet = loadGetterTuplePlaceBet;
exports.storeTuplePlaceBet = storeTuplePlaceBet;
exports.dictValueParserPlaceBet = dictValueParserPlaceBet;
exports.storeCloseRound = storeCloseRound;
exports.loadCloseRound = loadCloseRound;
exports.loadTupleCloseRound = loadTupleCloseRound;
exports.loadGetterTupleCloseRound = loadGetterTupleCloseRound;
exports.storeTupleCloseRound = storeTupleCloseRound;
exports.dictValueParserCloseRound = dictValueParserCloseRound;
exports.storeSettleRound = storeSettleRound;
exports.loadSettleRound = loadSettleRound;
exports.loadTupleSettleRound = loadTupleSettleRound;
exports.loadGetterTupleSettleRound = loadGetterTupleSettleRound;
exports.storeTupleSettleRound = storeTupleSettleRound;
exports.dictValueParserSettleRound = dictValueParserSettleRound;
exports.storeClaim = storeClaim;
exports.loadClaim = loadClaim;
exports.loadTupleClaim = loadTupleClaim;
exports.loadGetterTupleClaim = loadGetterTupleClaim;
exports.storeTupleClaim = storeTupleClaim;
exports.dictValueParserClaim = dictValueParserClaim;
exports.storeRound = storeRound;
exports.loadRound = loadRound;
exports.loadTupleRound = loadTupleRound;
exports.loadGetterTupleRound = loadGetterTupleRound;
exports.storeTupleRound = storeTupleRound;
exports.dictValueParserRound = dictValueParserRound;
exports.storePosition = storePosition;
exports.loadPosition = loadPosition;
exports.loadTuplePosition = loadTuplePosition;
exports.loadGetterTuplePosition = loadGetterTuplePosition;
exports.storeTuplePosition = storeTuplePosition;
exports.dictValueParserPosition = dictValueParserPosition;
exports.storePulsePredictionMarket$Data = storePulsePredictionMarket$Data;
exports.loadPulsePredictionMarket$Data = loadPulsePredictionMarket$Data;
exports.loadTuplePulsePredictionMarket$Data =
  loadTuplePulsePredictionMarket$Data;
exports.loadGetterTuplePulsePredictionMarket$Data =
  loadGetterTuplePulsePredictionMarket$Data;
exports.storeTuplePulsePredictionMarket$Data =
  storeTuplePulsePredictionMarket$Data;
exports.dictValueParserPulsePredictionMarket$Data =
  dictValueParserPulsePredictionMarket$Data;
const core_1 = require("@ton/core");
function storeDataSize(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeInt(src.cells, 257);
    b_0.storeInt(src.bits, 257);
    b_0.storeInt(src.refs, 257);
  };
}
function loadDataSize(slice) {
  const sc_0 = slice;
  const _cells = sc_0.loadIntBig(257);
  const _bits = sc_0.loadIntBig(257);
  const _refs = sc_0.loadIntBig(257);
  return { $$type: "DataSize", cells: _cells, bits: _bits, refs: _refs };
}
function loadTupleDataSize(source) {
  const _cells = source.readBigNumber();
  const _bits = source.readBigNumber();
  const _refs = source.readBigNumber();
  return { $$type: "DataSize", cells: _cells, bits: _bits, refs: _refs };
}
function loadGetterTupleDataSize(source) {
  const _cells = source.readBigNumber();
  const _bits = source.readBigNumber();
  const _refs = source.readBigNumber();
  return { $$type: "DataSize", cells: _cells, bits: _bits, refs: _refs };
}
function storeTupleDataSize(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeNumber(source.cells);
  builder.writeNumber(source.bits);
  builder.writeNumber(source.refs);
  return builder.build();
}
function dictValueParserDataSize() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeDataSize(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadDataSize(src.loadRef().beginParse());
    },
  };
}
function storeSignedBundle(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeBuffer(src.signature);
    b_0.storeBuilder(src.signedData.asBuilder());
  };
}
function loadSignedBundle(slice) {
  const sc_0 = slice;
  const _signature = sc_0.loadBuffer(64);
  const _signedData = sc_0;
  return {
    $$type: "SignedBundle",
    signature: _signature,
    signedData: _signedData,
  };
}
function loadTupleSignedBundle(source) {
  const _signature = source.readBuffer();
  const _signedData = source.readCell().asSlice();
  return {
    $$type: "SignedBundle",
    signature: _signature,
    signedData: _signedData,
  };
}
function loadGetterTupleSignedBundle(source) {
  const _signature = source.readBuffer();
  const _signedData = source.readCell().asSlice();
  return {
    $$type: "SignedBundle",
    signature: _signature,
    signedData: _signedData,
  };
}
function storeTupleSignedBundle(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeBuffer(source.signature);
  builder.writeSlice(source.signedData.asCell());
  return builder.build();
}
function dictValueParserSignedBundle() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeSignedBundle(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadSignedBundle(src.loadRef().beginParse());
    },
  };
}
function storeStateInit(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeRef(src.code);
    b_0.storeRef(src.data);
  };
}
function loadStateInit(slice) {
  const sc_0 = slice;
  const _code = sc_0.loadRef();
  const _data = sc_0.loadRef();
  return { $$type: "StateInit", code: _code, data: _data };
}
function loadTupleStateInit(source) {
  const _code = source.readCell();
  const _data = source.readCell();
  return { $$type: "StateInit", code: _code, data: _data };
}
function loadGetterTupleStateInit(source) {
  const _code = source.readCell();
  const _data = source.readCell();
  return { $$type: "StateInit", code: _code, data: _data };
}
function storeTupleStateInit(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeCell(source.code);
  builder.writeCell(source.data);
  return builder.build();
}
function dictValueParserStateInit() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeStateInit(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadStateInit(src.loadRef().beginParse());
    },
  };
}
function storeContext(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeBit(src.bounceable);
    b_0.storeAddress(src.sender);
    b_0.storeInt(src.value, 257);
    b_0.storeRef(src.raw.asCell());
  };
}
function loadContext(slice) {
  const sc_0 = slice;
  const _bounceable = sc_0.loadBit();
  const _sender = sc_0.loadAddress();
  const _value = sc_0.loadIntBig(257);
  const _raw = sc_0.loadRef().asSlice();
  return {
    $$type: "Context",
    bounceable: _bounceable,
    sender: _sender,
    value: _value,
    raw: _raw,
  };
}
function loadTupleContext(source) {
  const _bounceable = source.readBoolean();
  const _sender = source.readAddress();
  const _value = source.readBigNumber();
  const _raw = source.readCell().asSlice();
  return {
    $$type: "Context",
    bounceable: _bounceable,
    sender: _sender,
    value: _value,
    raw: _raw,
  };
}
function loadGetterTupleContext(source) {
  const _bounceable = source.readBoolean();
  const _sender = source.readAddress();
  const _value = source.readBigNumber();
  const _raw = source.readCell().asSlice();
  return {
    $$type: "Context",
    bounceable: _bounceable,
    sender: _sender,
    value: _value,
    raw: _raw,
  };
}
function storeTupleContext(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeBoolean(source.bounceable);
  builder.writeAddress(source.sender);
  builder.writeNumber(source.value);
  builder.writeSlice(source.raw.asCell());
  return builder.build();
}
function dictValueParserContext() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeContext(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadContext(src.loadRef().beginParse());
    },
  };
}
function storeSendParameters(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeInt(src.mode, 257);
    if (src.body !== null && src.body !== undefined) {
      b_0.storeBit(true).storeRef(src.body);
    } else {
      b_0.storeBit(false);
    }
    if (src.code !== null && src.code !== undefined) {
      b_0.storeBit(true).storeRef(src.code);
    } else {
      b_0.storeBit(false);
    }
    if (src.data !== null && src.data !== undefined) {
      b_0.storeBit(true).storeRef(src.data);
    } else {
      b_0.storeBit(false);
    }
    b_0.storeInt(src.value, 257);
    b_0.storeAddress(src.to);
    b_0.storeBit(src.bounce);
  };
}
function loadSendParameters(slice) {
  const sc_0 = slice;
  const _mode = sc_0.loadIntBig(257);
  const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
  const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
  const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
  const _value = sc_0.loadIntBig(257);
  const _to = sc_0.loadAddress();
  const _bounce = sc_0.loadBit();
  return {
    $$type: "SendParameters",
    mode: _mode,
    body: _body,
    code: _code,
    data: _data,
    value: _value,
    to: _to,
    bounce: _bounce,
  };
}
function loadTupleSendParameters(source) {
  const _mode = source.readBigNumber();
  const _body = source.readCellOpt();
  const _code = source.readCellOpt();
  const _data = source.readCellOpt();
  const _value = source.readBigNumber();
  const _to = source.readAddress();
  const _bounce = source.readBoolean();
  return {
    $$type: "SendParameters",
    mode: _mode,
    body: _body,
    code: _code,
    data: _data,
    value: _value,
    to: _to,
    bounce: _bounce,
  };
}
function loadGetterTupleSendParameters(source) {
  const _mode = source.readBigNumber();
  const _body = source.readCellOpt();
  const _code = source.readCellOpt();
  const _data = source.readCellOpt();
  const _value = source.readBigNumber();
  const _to = source.readAddress();
  const _bounce = source.readBoolean();
  return {
    $$type: "SendParameters",
    mode: _mode,
    body: _body,
    code: _code,
    data: _data,
    value: _value,
    to: _to,
    bounce: _bounce,
  };
}
function storeTupleSendParameters(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeNumber(source.mode);
  builder.writeCell(source.body);
  builder.writeCell(source.code);
  builder.writeCell(source.data);
  builder.writeNumber(source.value);
  builder.writeAddress(source.to);
  builder.writeBoolean(source.bounce);
  return builder.build();
}
function dictValueParserSendParameters() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeSendParameters(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadSendParameters(src.loadRef().beginParse());
    },
  };
}
function storeMessageParameters(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeInt(src.mode, 257);
    if (src.body !== null && src.body !== undefined) {
      b_0.storeBit(true).storeRef(src.body);
    } else {
      b_0.storeBit(false);
    }
    b_0.storeInt(src.value, 257);
    b_0.storeAddress(src.to);
    b_0.storeBit(src.bounce);
  };
}
function loadMessageParameters(slice) {
  const sc_0 = slice;
  const _mode = sc_0.loadIntBig(257);
  const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
  const _value = sc_0.loadIntBig(257);
  const _to = sc_0.loadAddress();
  const _bounce = sc_0.loadBit();
  return {
    $$type: "MessageParameters",
    mode: _mode,
    body: _body,
    value: _value,
    to: _to,
    bounce: _bounce,
  };
}
function loadTupleMessageParameters(source) {
  const _mode = source.readBigNumber();
  const _body = source.readCellOpt();
  const _value = source.readBigNumber();
  const _to = source.readAddress();
  const _bounce = source.readBoolean();
  return {
    $$type: "MessageParameters",
    mode: _mode,
    body: _body,
    value: _value,
    to: _to,
    bounce: _bounce,
  };
}
function loadGetterTupleMessageParameters(source) {
  const _mode = source.readBigNumber();
  const _body = source.readCellOpt();
  const _value = source.readBigNumber();
  const _to = source.readAddress();
  const _bounce = source.readBoolean();
  return {
    $$type: "MessageParameters",
    mode: _mode,
    body: _body,
    value: _value,
    to: _to,
    bounce: _bounce,
  };
}
function storeTupleMessageParameters(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeNumber(source.mode);
  builder.writeCell(source.body);
  builder.writeNumber(source.value);
  builder.writeAddress(source.to);
  builder.writeBoolean(source.bounce);
  return builder.build();
}
function dictValueParserMessageParameters() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeMessageParameters(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadMessageParameters(src.loadRef().beginParse());
    },
  };
}
function storeDeployParameters(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeInt(src.mode, 257);
    if (src.body !== null && src.body !== undefined) {
      b_0.storeBit(true).storeRef(src.body);
    } else {
      b_0.storeBit(false);
    }
    b_0.storeInt(src.value, 257);
    b_0.storeBit(src.bounce);
    b_0.store(storeStateInit(src.init));
  };
}
function loadDeployParameters(slice) {
  const sc_0 = slice;
  const _mode = sc_0.loadIntBig(257);
  const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
  const _value = sc_0.loadIntBig(257);
  const _bounce = sc_0.loadBit();
  const _init = loadStateInit(sc_0);
  return {
    $$type: "DeployParameters",
    mode: _mode,
    body: _body,
    value: _value,
    bounce: _bounce,
    init: _init,
  };
}
function loadTupleDeployParameters(source) {
  const _mode = source.readBigNumber();
  const _body = source.readCellOpt();
  const _value = source.readBigNumber();
  const _bounce = source.readBoolean();
  const _init = loadTupleStateInit(source);
  return {
    $$type: "DeployParameters",
    mode: _mode,
    body: _body,
    value: _value,
    bounce: _bounce,
    init: _init,
  };
}
function loadGetterTupleDeployParameters(source) {
  const _mode = source.readBigNumber();
  const _body = source.readCellOpt();
  const _value = source.readBigNumber();
  const _bounce = source.readBoolean();
  const _init = loadGetterTupleStateInit(source);
  return {
    $$type: "DeployParameters",
    mode: _mode,
    body: _body,
    value: _value,
    bounce: _bounce,
    init: _init,
  };
}
function storeTupleDeployParameters(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeNumber(source.mode);
  builder.writeCell(source.body);
  builder.writeNumber(source.value);
  builder.writeBoolean(source.bounce);
  builder.writeTuple(storeTupleStateInit(source.init));
  return builder.build();
}
function dictValueParserDeployParameters() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeDeployParameters(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadDeployParameters(src.loadRef().beginParse());
    },
  };
}
function storeStdAddress(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeInt(src.workchain, 8);
    b_0.storeUint(src.address, 256);
  };
}
function loadStdAddress(slice) {
  const sc_0 = slice;
  const _workchain = sc_0.loadIntBig(8);
  const _address = sc_0.loadUintBig(256);
  return { $$type: "StdAddress", workchain: _workchain, address: _address };
}
function loadTupleStdAddress(source) {
  const _workchain = source.readBigNumber();
  const _address = source.readBigNumber();
  return { $$type: "StdAddress", workchain: _workchain, address: _address };
}
function loadGetterTupleStdAddress(source) {
  const _workchain = source.readBigNumber();
  const _address = source.readBigNumber();
  return { $$type: "StdAddress", workchain: _workchain, address: _address };
}
function storeTupleStdAddress(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeNumber(source.workchain);
  builder.writeNumber(source.address);
  return builder.build();
}
function dictValueParserStdAddress() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeStdAddress(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadStdAddress(src.loadRef().beginParse());
    },
  };
}
function storeVarAddress(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeInt(src.workchain, 32);
    b_0.storeRef(src.address.asCell());
  };
}
function loadVarAddress(slice) {
  const sc_0 = slice;
  const _workchain = sc_0.loadIntBig(32);
  const _address = sc_0.loadRef().asSlice();
  return { $$type: "VarAddress", workchain: _workchain, address: _address };
}
function loadTupleVarAddress(source) {
  const _workchain = source.readBigNumber();
  const _address = source.readCell().asSlice();
  return { $$type: "VarAddress", workchain: _workchain, address: _address };
}
function loadGetterTupleVarAddress(source) {
  const _workchain = source.readBigNumber();
  const _address = source.readCell().asSlice();
  return { $$type: "VarAddress", workchain: _workchain, address: _address };
}
function storeTupleVarAddress(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeNumber(source.workchain);
  builder.writeSlice(source.address.asCell());
  return builder.build();
}
function dictValueParserVarAddress() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeVarAddress(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadVarAddress(src.loadRef().beginParse());
    },
  };
}
function storeBasechainAddress(src) {
  return (builder) => {
    const b_0 = builder;
    if (src.hash !== null && src.hash !== undefined) {
      b_0.storeBit(true).storeInt(src.hash, 257);
    } else {
      b_0.storeBit(false);
    }
  };
}
function loadBasechainAddress(slice) {
  const sc_0 = slice;
  const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
  return { $$type: "BasechainAddress", hash: _hash };
}
function loadTupleBasechainAddress(source) {
  const _hash = source.readBigNumberOpt();
  return { $$type: "BasechainAddress", hash: _hash };
}
function loadGetterTupleBasechainAddress(source) {
  const _hash = source.readBigNumberOpt();
  return { $$type: "BasechainAddress", hash: _hash };
}
function storeTupleBasechainAddress(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeNumber(source.hash);
  return builder.build();
}
function dictValueParserBasechainAddress() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeBasechainAddress(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadBasechainAddress(src.loadRef().beginParse());
    },
  };
}
function storePlaceBet(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeUint(1347764785, 32);
    b_0.storeStringRefTail(src.roundId);
    b_0.storeStringRefTail(src.marketId);
    const b_1 = new core_1.Builder();
    b_1.storeStringRefTail(src.marketLabel);
    b_1.storeAddress(src.token);
    b_1.storeStringRefTail(src.timeframeId);
    b_1.storeUint(src.timeframeCode, 8);
    b_1.storeUint(src.roundDurationSeconds, 32);
    b_1.storeUint(src.roundStartTimestamp, 32);
    b_1.storeUint(src.direction, 8);
    b_0.storeRef(b_1.endCell());
  };
}
function loadPlaceBet(slice) {
  const sc_0 = slice;
  if (sc_0.loadUint(32) !== 1347764785) {
    throw Error("Invalid prefix");
  }
  const _roundId = sc_0.loadStringRefTail();
  const _marketId = sc_0.loadStringRefTail();
  const sc_1 = sc_0.loadRef().beginParse();
  const _marketLabel = sc_1.loadStringRefTail();
  const _token = sc_1.loadAddress();
  const _timeframeId = sc_1.loadStringRefTail();
  const _timeframeCode = sc_1.loadUintBig(8);
  const _roundDurationSeconds = sc_1.loadUintBig(32);
  const _roundStartTimestamp = sc_1.loadUintBig(32);
  const _direction = sc_1.loadUintBig(8);
  return {
    $$type: "PlaceBet",
    roundId: _roundId,
    marketId: _marketId,
    marketLabel: _marketLabel,
    token: _token,
    timeframeId: _timeframeId,
    timeframeCode: _timeframeCode,
    roundDurationSeconds: _roundDurationSeconds,
    roundStartTimestamp: _roundStartTimestamp,
    direction: _direction,
  };
}
function loadTuplePlaceBet(source) {
  const _roundId = source.readString();
  const _marketId = source.readString();
  const _marketLabel = source.readString();
  const _token = source.readAddress();
  const _timeframeId = source.readString();
  const _timeframeCode = source.readBigNumber();
  const _roundDurationSeconds = source.readBigNumber();
  const _roundStartTimestamp = source.readBigNumber();
  const _direction = source.readBigNumber();
  return {
    $$type: "PlaceBet",
    roundId: _roundId,
    marketId: _marketId,
    marketLabel: _marketLabel,
    token: _token,
    timeframeId: _timeframeId,
    timeframeCode: _timeframeCode,
    roundDurationSeconds: _roundDurationSeconds,
    roundStartTimestamp: _roundStartTimestamp,
    direction: _direction,
  };
}
function loadGetterTuplePlaceBet(source) {
  const _roundId = source.readString();
  const _marketId = source.readString();
  const _marketLabel = source.readString();
  const _token = source.readAddress();
  const _timeframeId = source.readString();
  const _timeframeCode = source.readBigNumber();
  const _roundDurationSeconds = source.readBigNumber();
  const _roundStartTimestamp = source.readBigNumber();
  const _direction = source.readBigNumber();
  return {
    $$type: "PlaceBet",
    roundId: _roundId,
    marketId: _marketId,
    marketLabel: _marketLabel,
    token: _token,
    timeframeId: _timeframeId,
    timeframeCode: _timeframeCode,
    roundDurationSeconds: _roundDurationSeconds,
    roundStartTimestamp: _roundStartTimestamp,
    direction: _direction,
  };
}
function storeTuplePlaceBet(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeString(source.roundId);
  builder.writeString(source.marketId);
  builder.writeString(source.marketLabel);
  builder.writeAddress(source.token);
  builder.writeString(source.timeframeId);
  builder.writeNumber(source.timeframeCode);
  builder.writeNumber(source.roundDurationSeconds);
  builder.writeNumber(source.roundStartTimestamp);
  builder.writeNumber(source.direction);
  return builder.build();
}
function dictValueParserPlaceBet() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storePlaceBet(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadPlaceBet(src.loadRef().beginParse());
    },
  };
}
function storeCloseRound(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeUint(1347765041, 32);
    b_0.storeStringRefTail(src.roundId);
    b_0.storeAddress(src.token);
    b_0.storeUint(src.timeframeCode, 8);
    b_0.storeUint(src.roundStartTimestamp, 32);
  };
}
function loadCloseRound(slice) {
  const sc_0 = slice;
  if (sc_0.loadUint(32) !== 1347765041) {
    throw Error("Invalid prefix");
  }
  const _roundId = sc_0.loadStringRefTail();
  const _token = sc_0.loadAddress();
  const _timeframeCode = sc_0.loadUintBig(8);
  const _roundStartTimestamp = sc_0.loadUintBig(32);
  return {
    $$type: "CloseRound",
    roundId: _roundId,
    token: _token,
    timeframeCode: _timeframeCode,
    roundStartTimestamp: _roundStartTimestamp,
  };
}
function loadTupleCloseRound(source) {
  const _roundId = source.readString();
  const _token = source.readAddress();
  const _timeframeCode = source.readBigNumber();
  const _roundStartTimestamp = source.readBigNumber();
  return {
    $$type: "CloseRound",
    roundId: _roundId,
    token: _token,
    timeframeCode: _timeframeCode,
    roundStartTimestamp: _roundStartTimestamp,
  };
}
function loadGetterTupleCloseRound(source) {
  const _roundId = source.readString();
  const _token = source.readAddress();
  const _timeframeCode = source.readBigNumber();
  const _roundStartTimestamp = source.readBigNumber();
  return {
    $$type: "CloseRound",
    roundId: _roundId,
    token: _token,
    timeframeCode: _timeframeCode,
    roundStartTimestamp: _roundStartTimestamp,
  };
}
function storeTupleCloseRound(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeString(source.roundId);
  builder.writeAddress(source.token);
  builder.writeNumber(source.timeframeCode);
  builder.writeNumber(source.roundStartTimestamp);
  return builder.build();
}
function dictValueParserCloseRound() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeCloseRound(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadCloseRound(src.loadRef().beginParse());
    },
  };
}
function storeSettleRound(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeUint(1347769137, 32);
    b_0.storeStringRefTail(src.roundId);
    b_0.storeAddress(src.token);
    b_0.storeUint(src.timeframeCode, 8);
    b_0.storeUint(src.roundStartTimestamp, 32);
    b_0.storeUint(src.result, 8);
  };
}
function loadSettleRound(slice) {
  const sc_0 = slice;
  if (sc_0.loadUint(32) !== 1347769137) {
    throw Error("Invalid prefix");
  }
  const _roundId = sc_0.loadStringRefTail();
  const _token = sc_0.loadAddress();
  const _timeframeCode = sc_0.loadUintBig(8);
  const _roundStartTimestamp = sc_0.loadUintBig(32);
  const _result = sc_0.loadUintBig(8);
  return {
    $$type: "SettleRound",
    roundId: _roundId,
    token: _token,
    timeframeCode: _timeframeCode,
    roundStartTimestamp: _roundStartTimestamp,
    result: _result,
  };
}
function loadTupleSettleRound(source) {
  const _roundId = source.readString();
  const _token = source.readAddress();
  const _timeframeCode = source.readBigNumber();
  const _roundStartTimestamp = source.readBigNumber();
  const _result = source.readBigNumber();
  return {
    $$type: "SettleRound",
    roundId: _roundId,
    token: _token,
    timeframeCode: _timeframeCode,
    roundStartTimestamp: _roundStartTimestamp,
    result: _result,
  };
}
function loadGetterTupleSettleRound(source) {
  const _roundId = source.readString();
  const _token = source.readAddress();
  const _timeframeCode = source.readBigNumber();
  const _roundStartTimestamp = source.readBigNumber();
  const _result = source.readBigNumber();
  return {
    $$type: "SettleRound",
    roundId: _roundId,
    token: _token,
    timeframeCode: _timeframeCode,
    roundStartTimestamp: _roundStartTimestamp,
    result: _result,
  };
}
function storeTupleSettleRound(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeString(source.roundId);
  builder.writeAddress(source.token);
  builder.writeNumber(source.timeframeCode);
  builder.writeNumber(source.roundStartTimestamp);
  builder.writeNumber(source.result);
  return builder.build();
}
function dictValueParserSettleRound() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeSettleRound(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadSettleRound(src.loadRef().beginParse());
    },
  };
}
function storeClaim(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeUint(1347768369, 32);
    b_0.storeStringRefTail(src.roundId);
    b_0.storeAddress(src.token);
    b_0.storeUint(src.timeframeCode, 8);
    b_0.storeUint(src.roundStartTimestamp, 32);
  };
}
function loadClaim(slice) {
  const sc_0 = slice;
  if (sc_0.loadUint(32) !== 1347768369) {
    throw Error("Invalid prefix");
  }
  const _roundId = sc_0.loadStringRefTail();
  const _token = sc_0.loadAddress();
  const _timeframeCode = sc_0.loadUintBig(8);
  const _roundStartTimestamp = sc_0.loadUintBig(32);
  return {
    $$type: "Claim",
    roundId: _roundId,
    token: _token,
    timeframeCode: _timeframeCode,
    roundStartTimestamp: _roundStartTimestamp,
  };
}
function loadTupleClaim(source) {
  const _roundId = source.readString();
  const _token = source.readAddress();
  const _timeframeCode = source.readBigNumber();
  const _roundStartTimestamp = source.readBigNumber();
  return {
    $$type: "Claim",
    roundId: _roundId,
    token: _token,
    timeframeCode: _timeframeCode,
    roundStartTimestamp: _roundStartTimestamp,
  };
}
function loadGetterTupleClaim(source) {
  const _roundId = source.readString();
  const _token = source.readAddress();
  const _timeframeCode = source.readBigNumber();
  const _roundStartTimestamp = source.readBigNumber();
  return {
    $$type: "Claim",
    roundId: _roundId,
    token: _token,
    timeframeCode: _timeframeCode,
    roundStartTimestamp: _roundStartTimestamp,
  };
}
function storeTupleClaim(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeString(source.roundId);
  builder.writeAddress(source.token);
  builder.writeNumber(source.timeframeCode);
  builder.writeNumber(source.roundStartTimestamp);
  return builder.build();
}
function dictValueParserClaim() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeClaim(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadClaim(src.loadRef().beginParse());
    },
  };
}
function storeRound(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeStringRefTail(src.roundId);
    b_0.storeStringRefTail(src.marketId);
    const b_1 = new core_1.Builder();
    b_1.storeStringRefTail(src.marketLabel);
    b_1.storeAddress(src.token);
    b_1.storeStringRefTail(src.timeframeId);
    b_1.storeUint(src.timeframeCode, 8);
    b_1.storeUint(src.roundDurationSeconds, 32);
    b_1.storeUint(src.status, 8);
    b_1.storeUint(src.openedAt, 32);
    b_1.storeUint(src.closesAt, 32);
    b_1.storeUint(src.settledAt, 32);
    b_1.storeCoins(src.totalUp);
    b_1.storeCoins(src.totalDown);
    b_1.storeUint(src.result, 8);
    b_0.storeRef(b_1.endCell());
  };
}
function loadRound(slice) {
  const sc_0 = slice;
  const _roundId = sc_0.loadStringRefTail();
  const _marketId = sc_0.loadStringRefTail();
  const sc_1 = sc_0.loadRef().beginParse();
  const _marketLabel = sc_1.loadStringRefTail();
  const _token = sc_1.loadAddress();
  const _timeframeId = sc_1.loadStringRefTail();
  const _timeframeCode = sc_1.loadUintBig(8);
  const _roundDurationSeconds = sc_1.loadUintBig(32);
  const _status = sc_1.loadUintBig(8);
  const _openedAt = sc_1.loadUintBig(32);
  const _closesAt = sc_1.loadUintBig(32);
  const _settledAt = sc_1.loadUintBig(32);
  const _totalUp = sc_1.loadCoins();
  const _totalDown = sc_1.loadCoins();
  const _result = sc_1.loadUintBig(8);
  return {
    $$type: "Round",
    roundId: _roundId,
    marketId: _marketId,
    marketLabel: _marketLabel,
    token: _token,
    timeframeId: _timeframeId,
    timeframeCode: _timeframeCode,
    roundDurationSeconds: _roundDurationSeconds,
    status: _status,
    openedAt: _openedAt,
    closesAt: _closesAt,
    settledAt: _settledAt,
    totalUp: _totalUp,
    totalDown: _totalDown,
    result: _result,
  };
}
function loadTupleRound(source) {
  const _roundId = source.readString();
  const _marketId = source.readString();
  const _marketLabel = source.readString();
  const _token = source.readAddress();
  const _timeframeId = source.readString();
  const _timeframeCode = source.readBigNumber();
  const _roundDurationSeconds = source.readBigNumber();
  const _status = source.readBigNumber();
  const _openedAt = source.readBigNumber();
  const _closesAt = source.readBigNumber();
  const _settledAt = source.readBigNumber();
  const _totalUp = source.readBigNumber();
  const _totalDown = source.readBigNumber();
  const _result = source.readBigNumber();
  return {
    $$type: "Round",
    roundId: _roundId,
    marketId: _marketId,
    marketLabel: _marketLabel,
    token: _token,
    timeframeId: _timeframeId,
    timeframeCode: _timeframeCode,
    roundDurationSeconds: _roundDurationSeconds,
    status: _status,
    openedAt: _openedAt,
    closesAt: _closesAt,
    settledAt: _settledAt,
    totalUp: _totalUp,
    totalDown: _totalDown,
    result: _result,
  };
}
function loadGetterTupleRound(source) {
  const _roundId = source.readString();
  const _marketId = source.readString();
  const _marketLabel = source.readString();
  const _token = source.readAddress();
  const _timeframeId = source.readString();
  const _timeframeCode = source.readBigNumber();
  const _roundDurationSeconds = source.readBigNumber();
  const _status = source.readBigNumber();
  const _openedAt = source.readBigNumber();
  const _closesAt = source.readBigNumber();
  const _settledAt = source.readBigNumber();
  const _totalUp = source.readBigNumber();
  const _totalDown = source.readBigNumber();
  const _result = source.readBigNumber();
  return {
    $$type: "Round",
    roundId: _roundId,
    marketId: _marketId,
    marketLabel: _marketLabel,
    token: _token,
    timeframeId: _timeframeId,
    timeframeCode: _timeframeCode,
    roundDurationSeconds: _roundDurationSeconds,
    status: _status,
    openedAt: _openedAt,
    closesAt: _closesAt,
    settledAt: _settledAt,
    totalUp: _totalUp,
    totalDown: _totalDown,
    result: _result,
  };
}
function storeTupleRound(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeString(source.roundId);
  builder.writeString(source.marketId);
  builder.writeString(source.marketLabel);
  builder.writeAddress(source.token);
  builder.writeString(source.timeframeId);
  builder.writeNumber(source.timeframeCode);
  builder.writeNumber(source.roundDurationSeconds);
  builder.writeNumber(source.status);
  builder.writeNumber(source.openedAt);
  builder.writeNumber(source.closesAt);
  builder.writeNumber(source.settledAt);
  builder.writeNumber(source.totalUp);
  builder.writeNumber(source.totalDown);
  builder.writeNumber(source.result);
  return builder.build();
}
function dictValueParserRound() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storeRound(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadRound(src.loadRef().beginParse());
    },
  };
}
function storePosition(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeCoins(src.upStake);
    b_0.storeCoins(src.downStake);
    b_0.storeBit(src.claimed);
  };
}
function loadPosition(slice) {
  const sc_0 = slice;
  const _upStake = sc_0.loadCoins();
  const _downStake = sc_0.loadCoins();
  const _claimed = sc_0.loadBit();
  return {
    $$type: "Position",
    upStake: _upStake,
    downStake: _downStake,
    claimed: _claimed,
  };
}
function loadTuplePosition(source) {
  const _upStake = source.readBigNumber();
  const _downStake = source.readBigNumber();
  const _claimed = source.readBoolean();
  return {
    $$type: "Position",
    upStake: _upStake,
    downStake: _downStake,
    claimed: _claimed,
  };
}
function loadGetterTuplePosition(source) {
  const _upStake = source.readBigNumber();
  const _downStake = source.readBigNumber();
  const _claimed = source.readBoolean();
  return {
    $$type: "Position",
    upStake: _upStake,
    downStake: _downStake,
    claimed: _claimed,
  };
}
function storeTuplePosition(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeNumber(source.upStake);
  builder.writeNumber(source.downStake);
  builder.writeBoolean(source.claimed);
  return builder.build();
}
function dictValueParserPosition() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)().store(storePosition(src)).endCell(),
      );
    },
    parse: (src) => {
      return loadPosition(src.loadRef().beginParse());
    },
  };
}
function storePulsePredictionMarket$Data(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeAddress(src.admin);
    b_0.storeUint(src.protocolFeeBps, 16);
    b_0.storeInt(src.deploymentNonce, 257);
    b_0.storeDict(
      src.rounds,
      core_1.Dictionary.Keys.BigUint(256),
      dictValueParserRound(),
    );
    b_0.storeDict(
      src.positions,
      core_1.Dictionary.Keys.BigUint(256),
      dictValueParserPosition(),
    );
  };
}
function loadPulsePredictionMarket$Data(slice) {
  const sc_0 = slice;
  const _admin = sc_0.loadAddress();
  const _protocolFeeBps = sc_0.loadUintBig(16);
  const _deploymentNonce = sc_0.loadIntBig(257);
  const _rounds = core_1.Dictionary.load(
    core_1.Dictionary.Keys.BigUint(256),
    dictValueParserRound(),
    sc_0,
  );
  const _positions = core_1.Dictionary.load(
    core_1.Dictionary.Keys.BigUint(256),
    dictValueParserPosition(),
    sc_0,
  );
  return {
    $$type: "PulsePredictionMarket$Data",
    admin: _admin,
    protocolFeeBps: _protocolFeeBps,
    deploymentNonce: _deploymentNonce,
    rounds: _rounds,
    positions: _positions,
  };
}
function loadTuplePulsePredictionMarket$Data(source) {
  const _admin = source.readAddress();
  const _protocolFeeBps = source.readBigNumber();
  const _deploymentNonce = source.readBigNumber();
  const _rounds = core_1.Dictionary.loadDirect(
    core_1.Dictionary.Keys.BigUint(256),
    dictValueParserRound(),
    source.readCellOpt(),
  );
  const _positions = core_1.Dictionary.loadDirect(
    core_1.Dictionary.Keys.BigUint(256),
    dictValueParserPosition(),
    source.readCellOpt(),
  );
  return {
    $$type: "PulsePredictionMarket$Data",
    admin: _admin,
    protocolFeeBps: _protocolFeeBps,
    deploymentNonce: _deploymentNonce,
    rounds: _rounds,
    positions: _positions,
  };
}
function loadGetterTuplePulsePredictionMarket$Data(source) {
  const _admin = source.readAddress();
  const _protocolFeeBps = source.readBigNumber();
  const _deploymentNonce = source.readBigNumber();
  const _rounds = core_1.Dictionary.loadDirect(
    core_1.Dictionary.Keys.BigUint(256),
    dictValueParserRound(),
    source.readCellOpt(),
  );
  const _positions = core_1.Dictionary.loadDirect(
    core_1.Dictionary.Keys.BigUint(256),
    dictValueParserPosition(),
    source.readCellOpt(),
  );
  return {
    $$type: "PulsePredictionMarket$Data",
    admin: _admin,
    protocolFeeBps: _protocolFeeBps,
    deploymentNonce: _deploymentNonce,
    rounds: _rounds,
    positions: _positions,
  };
}
function storeTuplePulsePredictionMarket$Data(source) {
  const builder = new core_1.TupleBuilder();
  builder.writeAddress(source.admin);
  builder.writeNumber(source.protocolFeeBps);
  builder.writeNumber(source.deploymentNonce);
  builder.writeCell(
    source.rounds.size > 0
      ? (0, core_1.beginCell)()
          .storeDictDirect(
            source.rounds,
            core_1.Dictionary.Keys.BigUint(256),
            dictValueParserRound(),
          )
          .endCell()
      : null,
  );
  builder.writeCell(
    source.positions.size > 0
      ? (0, core_1.beginCell)()
          .storeDictDirect(
            source.positions,
            core_1.Dictionary.Keys.BigUint(256),
            dictValueParserPosition(),
          )
          .endCell()
      : null,
  );
  return builder.build();
}
function dictValueParserPulsePredictionMarket$Data() {
  return {
    serialize: (src, builder) => {
      builder.storeRef(
        (0, core_1.beginCell)()
          .store(storePulsePredictionMarket$Data(src))
          .endCell(),
      );
    },
    parse: (src) => {
      return loadPulsePredictionMarket$Data(src.loadRef().beginParse());
    },
  };
}
function initPulsePredictionMarket_init_args(src) {
  return (builder) => {
    const b_0 = builder;
    b_0.storeAddress(src.admin);
    b_0.storeInt(src.protocolFeeBps, 257);
    b_0.storeInt(src.deploymentNonce, 257);
  };
}
async function PulsePredictionMarket_init(
  admin,
  protocolFeeBps,
  deploymentNonce,
) {
  const __code = core_1.Cell.fromHex(
    "b5ee9c7241021a01000822000114ff00208e8130e1f2c80b0104f001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e11fa40d30f810101d700f404f40455406c158e13fa40810101d700810101d700552003d1586d6de206925f06e004d70d1ff2e08221821050554231bae30221821050554331bae30221821050555331bae30201821050555031ba020c0e1204fe31d401d001d401d001d430d0d401d001fa40d401d001d307d31fd31fd30730f8235323a0104d103c4bef54775cdb3cf842161514433054797edb3c817f76f8416f24135f03c200f2f4817f1c2fc200f2f455318200a04b5436985612db3c17f2f48200c3eb56115610bef2f48200d76811115612bb01111101f2f42f8307271415030602f68b2354d8523001f90101f901ba9c32c0019481012cba923070e2e08b331354d8523001f90101f901ba9c32c00294810384ba923070e2e08b231488523001f90101f901ba9c32c00394810e10ba923070e2e08b234488523001f90101f901ba9c32c00494813840ba923070e2e08b2314481301f90101f901bae30204050018c0059582015180ba923070e200045b7002fc59f40f6fa192306ddf206e92306d8e87d0db3c6c1e6f0ee2206e8e263070547000106f722f07106f2e516e516e06051117051024561604561a04011119016f0e070995102f3a3b30e281751428206ef2d0806f2e10cd5f0d500a01f90101f901ba19f2f48200d92727206ef2d0806f2e109d5f0d500601f90101f901ba15160703fcf2f48157fa26206ef2d0806f2e108d5f0d5004ba13f2f4815ae525206ef2d0806f2e10ad5f0d5005c70514f2f481326124206ef2d0806f2e105d5f0d5009ba18f2f4815f6223206ef2d0806f2e104d5f0d500bba1af2f4813ca022206ef2d0806f2e106d5f0dc000f2f401206ef2d0806f2e5611c001e30f56128307561708090a0012f8416f24135f0313a00014f8416f24135f0312a05801fe59f40f6fa192306ddf206e92306d9dd0fa00fa00d20055206c136f03e2206e943070207097206ef2d0806f23e21114c00199f8416f24135f0312a099f8416f24135f03a001e28307111412c855205afa0258fa02ca00c9031113030211120201111601206e953059f45b30944133f417e210bc10ab109a10891078106710560b0184104510344130011113010f83071111c855d0db3cc910364470206e953059f45b30944133f417e25502c87f01ca0055405045ce12cb0f810101cf00f400f400c9ed541104fe31d401d001fa40d307d31f30f84210575e71db3c547678db3c2283072259f40f6fa192306ddf206e92306d8e87d0db3c6c1e6f0ee282008b4b216eb3f2f48113cc21206ef2d0806f2e5f0d500901f90101f901ba18f2f4815ae527206ef2d0806f2e10ad5f0d5009c70518f2f48157fa26206ef2d0806f2e108d5f0d5009ba0f14160d01fe18f2f48200cc8425206ef2d0806f2e105d5f0d5009ba18f2f4817e8124206ef2d0806f2e106d5f0dc000f2f403206ef2d0806f2e3610bc10ac109c108c107c106c105c71050443138307502ec855d0db3cc910374150206e953059f45b30944133f417e25502c87f01ca0055405045ce12cb0f810101cf00f400f400c9ed541104fc31d401d001fa40d307d31fd30730f84210581047103649a0db3c547658db3c2283072259f40f6fa192306ddf206e92306d8e87d0db3c6c1e6f0ee282008b4b216eb3f2f48113cc21206ef2d0806f2e5f0d500b01f90101f901ba1af2f4815ae529206ef2d0806f2e10ad5f0d5009c70518f2f48157fa28206ef2d0806f2e0f14161000148200b9b55116c705f2f401f6108d5f0d5007ba16f2f48200cc8427206ef2d0806f2e105d5f0d5009ba18f2f48200e94726206ef2d0806f2e106d5f0dc001f2f405206ef2d0806f2e30323472f823158307111413c855d0db3cc910364740206e953059f45b30944133f417e25003c87f01ca0055405045ce12cb0f810101cf00f400f400c9ed5411005e0dc8ce1ecd0bc8ce1bcdc80ac8ce1acd18ce06c8ce16cd14cb0712cb1fcb07cb1fcb1fcb1f58fa025003fa02cb07cd010ee3025f06f2c0821304f2d401d001fa40d307d31f3010465e70547678db3cf842161514433054789adb3c830754431859f40f6fa192306ddf206e92306d8e87d0db3c6c1e6f0ee282008b4b216eb3f2f48113cc21206ef2d0806f2e5f0d500901f90101f901ba18f2f4815ae527206ef2d0806f2e10ad5f0d5009c70518f2f48157fa26141516170018c85003cf16cb07cb1fc9f900001ec85004cf1658cf16cb07cb1fc9f9000058d401d001d401d001d401d0d401d001fa40d401d001d307d31fd307d31fd31fd31ffa00fa00d3073010ce10cd01fe206ef2d0806f2e108d5f0d5009ba18f2f48200cc8425206ef2d0806f2e105d5f0d5009ba18f2f48200f17e24206ef2d0806f2e106d5f0dc002f2f42483072459f40f6fa192306ddf206e92306d9dd0fa00fa00d20055206c136f03e2814dbc216eb3f2f48200b24221206ef2d0806f236c21b3f2f424206ef2d0806f2e6cd11801fec0019920206ef2d0806f235b9a20206ef2d0806f233031e28200b2cf21c200f2f425206ef2d0806f2e102d5f0d26206ef2d0806f2e1d5f0da026206ef2d0806f2e6cd1c0019c06206ef2d0806f2e102d5f0d9b06206ef2d0806f2e1d5f0de28200f62a21c200f2f406a85005a9045301a8812710a904a104206ef2d0806f231900f8307f0283075023c855205afa0258fa02ca00c910364140206e953059f45b30944133f417e2f8425003726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb004433c87f01ca0055405045ce12cb0f810101cf00f400f400c9ed540ec42cc8",
  );
  const builder = (0, core_1.beginCell)();
  builder.storeUint(0, 1);
  initPulsePredictionMarket_init_args({
    $$type: "PulsePredictionMarket_init_args",
    admin,
    protocolFeeBps,
    deploymentNonce,
  })(builder);
  const __data = builder.endCell();
  return { code: __code, data: __data };
}
exports.PulsePredictionMarket_errors = {
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
  43: {
    message:
      "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree",
  },
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
  5068: { message: "round_id_mismatch" },
  12897: { message: "round_mismatch" },
  15520: { message: "round_closed" },
  19900: { message: "position_not_found" },
  22522: { message: "timeframe_code_mismatch" },
  23269: { message: "token_mismatch" },
  24418: { message: "round_duration_mismatch" },
  29972: { message: "market_mismatch" },
  32385: { message: "round_not_open" },
  32540: { message: "round_start_required" },
  32630: { message: "stake_required" },
  35659: { message: "round_not_found" },
  41035: { message: "invalid_timeframe" },
  45634: { message: "already_claimed" },
  45775: { message: "no_winning_position" },
  47541: { message: "admin_only" },
  50155: { message: "round_not_started" },
  52356: { message: "round_start_mismatch" },
  55144: { message: "round_expired" },
  55591: { message: "timeframe_mismatch" },
  59719: { message: "round_not_closed" },
  61822: { message: "round_not_settled" },
  63018: { message: "invalid_winner_pool" },
};
exports.PulsePredictionMarket_errors_backward = {
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
  round_id_mismatch: 5068,
  round_mismatch: 12897,
  round_closed: 15520,
  position_not_found: 19900,
  timeframe_code_mismatch: 22522,
  token_mismatch: 23269,
  round_duration_mismatch: 24418,
  market_mismatch: 29972,
  round_not_open: 32385,
  round_start_required: 32540,
  stake_required: 32630,
  round_not_found: 35659,
  invalid_timeframe: 41035,
  already_claimed: 45634,
  no_winning_position: 45775,
  admin_only: 47541,
  round_not_started: 50155,
  round_start_mismatch: 52356,
  round_expired: 55144,
  timeframe_mismatch: 55591,
  round_not_closed: 59719,
  round_not_settled: 61822,
  invalid_winner_pool: 63018,
};
const PulsePredictionMarket_types = [
  {
    name: "DataSize",
    header: null,
    fields: [
      {
        name: "cells",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      {
        name: "bits",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      {
        name: "refs",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
    ],
  },
  {
    name: "SignedBundle",
    header: null,
    fields: [
      {
        name: "signature",
        type: {
          kind: "simple",
          type: "fixed-bytes",
          optional: false,
          format: 64,
        },
      },
      {
        name: "signedData",
        type: {
          kind: "simple",
          type: "slice",
          optional: false,
          format: "remainder",
        },
      },
    ],
  },
  {
    name: "StateInit",
    header: null,
    fields: [
      { name: "code", type: { kind: "simple", type: "cell", optional: false } },
      { name: "data", type: { kind: "simple", type: "cell", optional: false } },
    ],
  },
  {
    name: "Context",
    header: null,
    fields: [
      {
        name: "bounceable",
        type: { kind: "simple", type: "bool", optional: false },
      },
      {
        name: "sender",
        type: { kind: "simple", type: "address", optional: false },
      },
      {
        name: "value",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      { name: "raw", type: { kind: "simple", type: "slice", optional: false } },
    ],
  },
  {
    name: "SendParameters",
    header: null,
    fields: [
      {
        name: "mode",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      { name: "body", type: { kind: "simple", type: "cell", optional: true } },
      { name: "code", type: { kind: "simple", type: "cell", optional: true } },
      { name: "data", type: { kind: "simple", type: "cell", optional: true } },
      {
        name: "value",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      {
        name: "to",
        type: { kind: "simple", type: "address", optional: false },
      },
      {
        name: "bounce",
        type: { kind: "simple", type: "bool", optional: false },
      },
    ],
  },
  {
    name: "MessageParameters",
    header: null,
    fields: [
      {
        name: "mode",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      { name: "body", type: { kind: "simple", type: "cell", optional: true } },
      {
        name: "value",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      {
        name: "to",
        type: { kind: "simple", type: "address", optional: false },
      },
      {
        name: "bounce",
        type: { kind: "simple", type: "bool", optional: false },
      },
    ],
  },
  {
    name: "DeployParameters",
    header: null,
    fields: [
      {
        name: "mode",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      { name: "body", type: { kind: "simple", type: "cell", optional: true } },
      {
        name: "value",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      {
        name: "bounce",
        type: { kind: "simple", type: "bool", optional: false },
      },
      {
        name: "init",
        type: { kind: "simple", type: "StateInit", optional: false },
      },
    ],
  },
  {
    name: "StdAddress",
    header: null,
    fields: [
      {
        name: "workchain",
        type: { kind: "simple", type: "int", optional: false, format: 8 },
      },
      {
        name: "address",
        type: { kind: "simple", type: "uint", optional: false, format: 256 },
      },
    ],
  },
  {
    name: "VarAddress",
    header: null,
    fields: [
      {
        name: "workchain",
        type: { kind: "simple", type: "int", optional: false, format: 32 },
      },
      {
        name: "address",
        type: { kind: "simple", type: "slice", optional: false },
      },
    ],
  },
  {
    name: "BasechainAddress",
    header: null,
    fields: [
      {
        name: "hash",
        type: { kind: "simple", type: "int", optional: true, format: 257 },
      },
    ],
  },
  {
    name: "PlaceBet",
    header: 1347764785,
    fields: [
      {
        name: "roundId",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "marketId",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "marketLabel",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "token",
        type: { kind: "simple", type: "address", optional: false },
      },
      {
        name: "timeframeId",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "timeframeCode",
        type: { kind: "simple", type: "uint", optional: false, format: 8 },
      },
      {
        name: "roundDurationSeconds",
        type: { kind: "simple", type: "uint", optional: false, format: 32 },
      },
      {
        name: "roundStartTimestamp",
        type: { kind: "simple", type: "uint", optional: false, format: 32 },
      },
      {
        name: "direction",
        type: { kind: "simple", type: "uint", optional: false, format: 8 },
      },
    ],
  },
  {
    name: "CloseRound",
    header: 1347765041,
    fields: [
      {
        name: "roundId",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "token",
        type: { kind: "simple", type: "address", optional: false },
      },
      {
        name: "timeframeCode",
        type: { kind: "simple", type: "uint", optional: false, format: 8 },
      },
      {
        name: "roundStartTimestamp",
        type: { kind: "simple", type: "uint", optional: false, format: 32 },
      },
    ],
  },
  {
    name: "SettleRound",
    header: 1347769137,
    fields: [
      {
        name: "roundId",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "token",
        type: { kind: "simple", type: "address", optional: false },
      },
      {
        name: "timeframeCode",
        type: { kind: "simple", type: "uint", optional: false, format: 8 },
      },
      {
        name: "roundStartTimestamp",
        type: { kind: "simple", type: "uint", optional: false, format: 32 },
      },
      {
        name: "result",
        type: { kind: "simple", type: "uint", optional: false, format: 8 },
      },
    ],
  },
  {
    name: "Claim",
    header: 1347768369,
    fields: [
      {
        name: "roundId",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "token",
        type: { kind: "simple", type: "address", optional: false },
      },
      {
        name: "timeframeCode",
        type: { kind: "simple", type: "uint", optional: false, format: 8 },
      },
      {
        name: "roundStartTimestamp",
        type: { kind: "simple", type: "uint", optional: false, format: 32 },
      },
    ],
  },
  {
    name: "Round",
    header: null,
    fields: [
      {
        name: "roundId",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "marketId",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "marketLabel",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "token",
        type: { kind: "simple", type: "address", optional: false },
      },
      {
        name: "timeframeId",
        type: { kind: "simple", type: "string", optional: false },
      },
      {
        name: "timeframeCode",
        type: { kind: "simple", type: "uint", optional: false, format: 8 },
      },
      {
        name: "roundDurationSeconds",
        type: { kind: "simple", type: "uint", optional: false, format: 32 },
      },
      {
        name: "status",
        type: { kind: "simple", type: "uint", optional: false, format: 8 },
      },
      {
        name: "openedAt",
        type: { kind: "simple", type: "uint", optional: false, format: 32 },
      },
      {
        name: "closesAt",
        type: { kind: "simple", type: "uint", optional: false, format: 32 },
      },
      {
        name: "settledAt",
        type: { kind: "simple", type: "uint", optional: false, format: 32 },
      },
      {
        name: "totalUp",
        type: {
          kind: "simple",
          type: "uint",
          optional: false,
          format: "coins",
        },
      },
      {
        name: "totalDown",
        type: {
          kind: "simple",
          type: "uint",
          optional: false,
          format: "coins",
        },
      },
      {
        name: "result",
        type: { kind: "simple", type: "uint", optional: false, format: 8 },
      },
    ],
  },
  {
    name: "Position",
    header: null,
    fields: [
      {
        name: "upStake",
        type: {
          kind: "simple",
          type: "uint",
          optional: false,
          format: "coins",
        },
      },
      {
        name: "downStake",
        type: {
          kind: "simple",
          type: "uint",
          optional: false,
          format: "coins",
        },
      },
      {
        name: "claimed",
        type: { kind: "simple", type: "bool", optional: false },
      },
    ],
  },
  {
    name: "PulsePredictionMarket$Data",
    header: null,
    fields: [
      {
        name: "admin",
        type: { kind: "simple", type: "address", optional: false },
      },
      {
        name: "protocolFeeBps",
        type: { kind: "simple", type: "uint", optional: false, format: 16 },
      },
      {
        name: "deploymentNonce",
        type: { kind: "simple", type: "int", optional: false, format: 257 },
      },
      {
        name: "rounds",
        type: {
          kind: "dict",
          key: "uint",
          keyFormat: 256,
          value: "Round",
          valueFormat: "ref",
        },
      },
      {
        name: "positions",
        type: {
          kind: "dict",
          key: "uint",
          keyFormat: 256,
          value: "Position",
          valueFormat: "ref",
        },
      },
    ],
  },
];
const PulsePredictionMarket_opcodes = {
  PlaceBet: 1347764785,
  CloseRound: 1347765041,
  SettleRound: 1347769137,
  Claim: 1347768369,
};
const PulsePredictionMarket_getters = [];
exports.PulsePredictionMarket_getterMapping = {};
const PulsePredictionMarket_receivers = [
  { receiver: "internal", message: { kind: "typed", type: "PlaceBet" } },
  { receiver: "internal", message: { kind: "typed", type: "CloseRound" } },
  { receiver: "internal", message: { kind: "typed", type: "SettleRound" } },
  { receiver: "internal", message: { kind: "typed", type: "Claim" } },
];
class PulsePredictionMarket {
  static storageReserve = 0n;
  static errors = exports.PulsePredictionMarket_errors_backward;
  static opcodes = PulsePredictionMarket_opcodes;
  static async init(admin, protocolFeeBps, deploymentNonce) {
    return await PulsePredictionMarket_init(
      admin,
      protocolFeeBps,
      deploymentNonce,
    );
  }
  static async fromInit(admin, protocolFeeBps, deploymentNonce) {
    const __gen_init = await PulsePredictionMarket_init(
      admin,
      protocolFeeBps,
      deploymentNonce,
    );
    const address = (0, core_1.contractAddress)(0, __gen_init);
    return new PulsePredictionMarket(address, __gen_init);
  }
  static fromAddress(address) {
    return new PulsePredictionMarket(address);
  }
  address;
  init;
  abi = {
    types: PulsePredictionMarket_types,
    getters: PulsePredictionMarket_getters,
    receivers: PulsePredictionMarket_receivers,
    errors: exports.PulsePredictionMarket_errors,
  };
  constructor(address, init) {
    this.address = address;
    this.init = init;
  }
  async send(provider, via, args, message) {
    let body = null;
    if (
      message &&
      typeof message === "object" &&
      !(message instanceof core_1.Slice) &&
      message.$$type === "PlaceBet"
    ) {
      body = (0, core_1.beginCell)().store(storePlaceBet(message)).endCell();
    }
    if (
      message &&
      typeof message === "object" &&
      !(message instanceof core_1.Slice) &&
      message.$$type === "CloseRound"
    ) {
      body = (0, core_1.beginCell)().store(storeCloseRound(message)).endCell();
    }
    if (
      message &&
      typeof message === "object" &&
      !(message instanceof core_1.Slice) &&
      message.$$type === "SettleRound"
    ) {
      body = (0, core_1.beginCell)().store(storeSettleRound(message)).endCell();
    }
    if (
      message &&
      typeof message === "object" &&
      !(message instanceof core_1.Slice) &&
      message.$$type === "Claim"
    ) {
      body = (0, core_1.beginCell)().store(storeClaim(message)).endCell();
    }
    if (body === null) {
      throw new Error("Invalid message type");
    }
    await provider.internal(via, { ...args, body: body });
  }
}
exports.PulsePredictionMarket = PulsePredictionMarket;
