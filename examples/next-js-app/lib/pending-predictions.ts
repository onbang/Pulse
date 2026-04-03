"use client";

import type { PredictionDirection } from "@/lib/community";

const STORAGE_KEY = "ston-pulse-pending-predictions";

export type PendingPredictionBet = {
  messageHash: string;
  walletAddress: string;
  pairId: string;
  label: string;
  direction: PredictionDirection;
  amount: number;
  createdAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAllPendingPredictionBets() {
  if (!canUseStorage()) {
    return [] as PendingPredictionBet[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as PendingPredictionBet[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllPendingPredictionBets(items: PendingPredictionBet[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function readPendingPredictionBets(walletAddress?: string | null) {
  const items = readAllPendingPredictionBets();

  if (!walletAddress) {
    return items;
  }

  return items.filter((item) => item.walletAddress === walletAddress);
}

export function upsertPendingPredictionBet(item: PendingPredictionBet) {
  const current = readAllPendingPredictionBets().filter(
    (entry) => entry.messageHash !== item.messageHash,
  );

  current.unshift(item);
  writeAllPendingPredictionBets(current.slice(0, 30));
}

export function removePendingPredictionBet(messageHash: string) {
  const current = readAllPendingPredictionBets().filter(
    (entry) => entry.messageHash !== messageHash,
  );
  writeAllPendingPredictionBets(current);
}
