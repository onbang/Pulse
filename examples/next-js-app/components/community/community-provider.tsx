"use client";

import { useTonAddress } from "@tonconnect/ui-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useTelegramMiniApp } from "@/components/telegram/telegram-mini-app-provider";
import {
  COMMENT_REACTION_EMOJIS,
  type Achievement,
  type ActivityItem,
  type ActivityTrack,
  type CommentReactionEmoji,
  type CommunityStore,
  type LeaderboardEntry,
  type NotificationPreferences,
  type PairPrediction,
  type PredictionSettlement,
  type PoolComment,
  type PredictionBet,
  type PredictionDirection,
  type UserProfile,
  buildAchievements,
  defaultCommunityStore,
} from "@/lib/community";
import {
  readPendingPredictionBets,
  removePendingPredictionBet,
} from "@/lib/pending-predictions";
import type { TelegramMiniAppUser } from "@/lib/telegram-mini-app";

type CommunityStatePayload = {
  store: CommunityStore;
  profile: UserProfile | null;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  recentActivity: ActivityItem[];
  settlements: PredictionSettlement[];
};

type CommunityContextValue = {
  isLoaded: boolean;
  isSyncing: boolean;
  walletAddress: string;
  profile: UserProfile | null;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  recentActivity: ActivityItem[];
  settledPredictions: PredictionSettlement[];
  userBets: Array<PredictionBet & { pairId: string; pairLabel: string }>;
  updateProfile: (input: { displayName: string; bio: string }) => Promise<void>;
  updateNotificationPreferences: (
    input: Partial<NotificationPreferences>,
  ) => Promise<void>;
  checkIn: () => Promise<{ ok: boolean; points: number }>;
  addComment: (input: { poolId: string; text: string }) => Promise<boolean>;
  getComments: (poolId: string) => PoolComment[];
  toggleCommentReaction: (input: {
    poolId: string;
    commentId: string;
    emoji: CommentReactionEmoji;
  }) => Promise<void>;
  submitPrediction: (input: {
    pairId: string;
    label: string;
    direction: PredictionDirection;
    amount: number;
    txHash?: string;
  }) => Promise<boolean>;
  optimisticRecordPrediction: (input: {
    pairId: string;
    label: string;
    direction: PredictionDirection;
    amount: number;
  }) => void;
  settlePredictionRound: (input: {
    pairId: string;
    direction: PredictionDirection;
  }) => Promise<boolean>;
  getPrediction: (pairId: string) => PairPrediction | null;
  trackActivity: (track: ActivityTrack) => Promise<void>;
  toggleWatchlist: (input: {
    poolId: string;
    poolLabel: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
};

const CommunityContext = createContext<CommunityContextValue | null>(null);

function createTelegramDisplayName(user?: TelegramMiniAppUser | null) {
  if (!user) {
    return null;
  }

  if (user.username) {
    return `@${user.username}`;
  }

  return [user.first_name, user.last_name].filter(Boolean).join(" ") || null;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }

  return (await response.json()) as T;
}

export { COMMENT_REACTION_EMOJIS } from "@/lib/community";

export function CommunityProvider({ children }: { children: ReactNode }) {
  const walletAddress = useTonAddress();
  const { user: telegramUser } = useTelegramMiniApp();
  const [store, setStore] = useState<CommunityStore>(defaultCommunityStore);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [settledPredictions, setSettledPredictions] = useState<
    PredictionSettlement[]
  >([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const applyPayload = (payload: CommunityStatePayload) => {
    const nextStore =
      walletAddress && typeof window !== "undefined"
        ? mergePendingPredictions(payload.store, walletAddress, profile?.displayName)
        : payload.store;

    setStore(nextStore);
    setProfile(payload.profile);
    setAchievements(payload.achievements);
    setLeaderboard(payload.leaderboard);
    setRecentActivity(payload.recentActivity);
    setSettledPredictions(payload.settlements ?? []);
  };

  const refresh = async () => {
    setIsSyncing(true);

    try {
      const url = walletAddress
        ? `/api/community/state?wallet=${encodeURIComponent(walletAddress)}`
        : "/api/community/state";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to load community state");
      }

      applyPayload((await response.json()) as CommunityStatePayload);
    } finally {
      setIsSyncing(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    void refresh();
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    void postJson<CommunityStatePayload>("/api/community/profile", {
      walletAddress,
      displayName: "",
      bio: "",
      telegramDisplayName: createTelegramDisplayName(telegramUser),
    }).then(applyPayload);
  }, [telegramUser, walletAddress]);

  const updateProfile: CommunityContextValue["updateProfile"] = async (
    input,
  ) => {
    if (!walletAddress) {
      return;
    }

    setIsSyncing(true);

    try {
      const payload = await postJson<CommunityStatePayload>(
        "/api/community/profile",
        {
          walletAddress,
          displayName: input.displayName,
          bio: input.bio,
          telegramDisplayName: createTelegramDisplayName(telegramUser),
        },
      );

      applyPayload(payload);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateNotificationPreferences: CommunityContextValue["updateNotificationPreferences"] =
    async (input) => {
      if (!walletAddress) {
        return;
      }

      setIsSyncing(true);

      try {
        const payload = await postJson<CommunityStatePayload>(
          "/api/community/profile",
          {
            walletAddress,
            displayName: profile?.displayName ?? "",
            bio: profile?.bio ?? "",
            telegramDisplayName: createTelegramDisplayName(telegramUser),
            notificationPreferences: input,
          },
        );

        applyPayload(payload);
      } finally {
        setIsSyncing(false);
      }
    };

  const checkIn: CommunityContextValue["checkIn"] = async () => {
    if (!walletAddress) {
      return { ok: false, points: 0 };
    }

    setIsSyncing(true);

    try {
      const payload = await postJson<{
        result: { ok: boolean; points: number };
        state: CommunityStatePayload;
      }>("/api/community/check-in", { walletAddress });

      applyPayload(payload.state);
      return payload.result;
    } finally {
      setIsSyncing(false);
    }
  };

  const addComment: CommunityContextValue["addComment"] = async ({
    poolId,
    text,
  }) => {
    if (!walletAddress) {
      return false;
    }

    setIsSyncing(true);

    try {
      const payload = await postJson<{
        result: boolean;
        state: CommunityStatePayload;
      }>("/api/community/comments", {
        walletAddress,
        poolId,
        text,
      });

      applyPayload(payload.state);
      return payload.result;
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleCommentReaction: CommunityContextValue["toggleCommentReaction"] =
    async ({ poolId, commentId, emoji }) => {
      if (!walletAddress) {
        return;
      }

      setIsSyncing(true);

      try {
        const payload = await postJson<CommunityStatePayload>(
          "/api/community/comments/reaction",
          {
            walletAddress,
            poolId,
            commentId,
            emoji,
          },
        );

        applyPayload(payload);
      } finally {
        setIsSyncing(false);
      }
    };

  const submitPrediction: CommunityContextValue["submitPrediction"] = async (
    input,
  ) => {
    if (!walletAddress) {
      return false;
    }

    setIsSyncing(true);

    try {
      const payload = await postJson<{
        result: boolean;
        state: CommunityStatePayload;
      }>("/api/community/predictions", {
        walletAddress,
        ...input,
      });

      applyPayload(payload.state);
      return payload.result;
    } finally {
      setIsSyncing(false);
    }
  };

  const optimisticRecordPrediction: CommunityContextValue["optimisticRecordPrediction"] =
    ({ pairId, label, direction, amount }) => {
      if (!walletAddress) {
        return;
      }

      const createdAt = new Date().toISOString();
      const optimisticBet: PredictionBet = {
        id: `optimistic-${walletAddress}-${Date.now()}`,
        walletAddress,
        author: profile?.displayName || `STON ${walletAddress.slice(0, 4)}`,
        amount: Math.round(amount * 100) / 100,
        direction,
        createdAt,
      };

      setStore((currentStore) => {
        const existingPrediction = currentStore.predictions[pairId] ?? {
          label,
          up: [],
          down: [],
          bets: [],
          round: {
            id: `optimistic-round-${pairId}`,
            status: "open" as const,
            openedAt: createdAt,
            closesAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            durationMinutes: 60,
          },
          payoutPreviews: [],
        };

        const nextPrediction: PairPrediction = {
          ...existingPrediction,
          label,
          up:
            direction === "up"
              ? Array.from(new Set([...existingPrediction.up, walletAddress]))
              : existingPrediction.up.filter((item) => item !== walletAddress),
          down:
            direction === "down"
              ? Array.from(new Set([...existingPrediction.down, walletAddress]))
              : existingPrediction.down.filter((item) => item !== walletAddress),
          bets: [optimisticBet, ...existingPrediction.bets],
          round:
            existingPrediction.round ?? {
              id: `optimistic-round-${pairId}`,
              status: "open",
              openedAt: createdAt,
              closesAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              durationMinutes: 60,
            },
        };

        return {
          ...currentStore,
          predictions: {
            ...currentStore.predictions,
            [pairId]: nextPrediction,
          },
        };
      });
    };

  const trackActivity: CommunityContextValue["trackActivity"] = async (
    track,
  ) => {
    if (!walletAddress) {
      return;
    }

    setIsSyncing(true);

    try {
      const payload = await postJson<CommunityStatePayload>(
        "/api/community/track-activity",
        {
          walletAddress,
          track,
        },
      );

      applyPayload(payload);
    } finally {
      setIsSyncing(false);
    }
  };

  const settlePredictionRound: CommunityContextValue["settlePredictionRound"] =
    async (input) => {
      if (!walletAddress) {
        return false;
      }

      setIsSyncing(true);

      try {
        const response = await fetch("/api/community/predictions", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            ...input,
          }),
        });

        if (!response.ok) {
          return false;
        }

        const payload = (await response.json()) as {
          result: boolean;
          state: CommunityStatePayload;
        };

        applyPayload(payload.state);
        return payload.result;
      } finally {
        setIsSyncing(false);
      }
    };

  const toggleWatchlist: CommunityContextValue["toggleWatchlist"] = async (
    input,
  ) => {
    if (!walletAddress) {
      return;
    }

    setIsSyncing(true);

    try {
      const payload = await postJson<CommunityStatePayload>(
        "/api/community/watchlist",
        {
          walletAddress,
          ...input,
        },
      );

      applyPayload(payload);
    } finally {
      setIsSyncing(false);
    }
  };

  const getComments = (poolId: string) => store.comments[poolId] ?? [];
  const getPrediction = (pairId: string) => store.predictions[pairId] ?? null;
  const userBets = walletAddress
    ? Object.entries(store.predictions)
        .flatMap(([pairId, prediction]) =>
          prediction.bets
            .filter((bet) => bet.walletAddress === walletAddress)
            .map((bet) => ({
              ...bet,
              pairId,
              pairLabel: prediction.label,
            })),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  return (
    <CommunityContext.Provider
      value={{
        isLoaded,
        isSyncing,
        walletAddress,
        profile,
        achievements:
          profile && achievements.length === 0
            ? buildAchievements(profile, store)
            : achievements,
        leaderboard,
        recentActivity,
        settledPredictions,
        userBets,
        updateProfile,
        updateNotificationPreferences,
        checkIn,
        addComment,
        getComments,
        toggleCommentReaction,
        submitPrediction,
        optimisticRecordPrediction,
        settlePredictionRound,
        getPrediction,
        trackActivity,
        toggleWatchlist,
        refresh,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

function mergePendingPredictions(
  store: CommunityStore,
  walletAddress: string,
  displayName?: string,
) {
  const pendingBets = readPendingPredictionBets(walletAddress);

  if (pendingBets.length === 0) {
    return store;
  }

  const nextStore: CommunityStore = {
    ...store,
    predictions: { ...store.predictions },
  };

  for (const pending of pendingBets) {
    const existingPrediction = nextStore.predictions[pending.pairId] ?? {
      label: pending.label,
      up: [],
      down: [],
      bets: [],
      round: {
        id: `pending-round-${pending.pairId}`,
        status: "open" as const,
        openedAt: pending.createdAt,
        closesAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        durationMinutes: 60,
      },
      payoutPreviews: [],
    };

    const alreadySynced = existingPrediction.bets.some((bet) => {
      const createdGap = Math.abs(
        new Date(bet.createdAt).getTime() - new Date(pending.createdAt).getTime(),
      );

      return (
        bet.walletAddress === pending.walletAddress &&
        bet.direction === pending.direction &&
        Math.abs(bet.amount - pending.amount) < 0.0001 &&
        createdGap < 15 * 60 * 1000
      );
    });

    if (alreadySynced) {
      removePendingPredictionBet(pending.messageHash);
      continue;
    }

    nextStore.predictions[pending.pairId] = {
      ...existingPrediction,
      label: pending.label,
      up:
        pending.direction === "up"
          ? Array.from(new Set([...existingPrediction.up, pending.walletAddress]))
          : existingPrediction.up,
      down:
        pending.direction === "down"
          ? Array.from(new Set([...existingPrediction.down, pending.walletAddress]))
          : existingPrediction.down,
      bets: [
        {
          id: `pending-${pending.messageHash}`,
          walletAddress: pending.walletAddress,
          author: displayName || `STON ${pending.walletAddress.slice(0, 4)}`,
          amount: pending.amount,
          direction: pending.direction,
          createdAt: pending.createdAt,
          txHash: pending.messageHash,
          sourceKind: "pending",
        },
        ...existingPrediction.bets,
      ],
    };
  }

  return nextStore;
}

export function useCommunityProfile() {
  const context = useContext(CommunityContext);

  if (!context) {
    throw new Error(
      "useCommunityProfile must be used within CommunityProvider",
    );
  }

  return context;
}
