import { beginCell, Cell, loadMessage, storeMessage } from "@ton/core";

export function getMessageHashFromSignedBoc(boc?: string) {
  if (!boc) {
    return null;
  }

  try {
    const rootCell = Cell.fromBase64(boc);
    const message = loadMessage(rootCell.beginParse());
    return beginCell().store(storeMessage(message)).endCell().hash().toString("hex");
  } catch {
    return null;
  }
}
