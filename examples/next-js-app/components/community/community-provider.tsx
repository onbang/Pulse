"use client";

import { Address } from "@ton/core";
import { useTonAddress } from "@tonconnect/ui-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  type CheckInEvent,
  type LeaderboardEntry,
  type NotificationPreferences,
  type PairPrediction,
  type PredictionSettlement,
  type PoolComment,
  type PredictionBet,
  type PredictionDirection,
  type RewardLedgerEntry,
  type UserProfile,
  buildAchievements,
  defaultCommunityStore,
} from "@/lib/community";
import { fetchInternalApi } from "@/lib/vercel-internal-fetch";
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
  checkInEvents: CheckInEvent[];
  rewardLedger: RewardLedgerEntry[];
  settledPredictions: PredictionSettlement[];
  userBets: Array<PredictionBet & { pairId: string; pairLabel: string }>;
  updateProfile: (input: { displayName: string; bio: string }) => Promise<void>;
  updateNotificationPreferences: (
    input: Partial<NotificationPreferences>,
  ) => Promise<void>;
  checkIn: (input: { txHash: string }) => Promise<{
    ok: boolean;
    points: number;
    syncStatus: "pending" | "confirmed" | "failed";
  }>;
  syncCheckInTransaction: (input: { txHash: string }) => Promise<{
    ok: boolean;
    syncStatus: "pending" | "confirmed" | "missing";
  }>;
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
  }) => Promise<{
    ok: boolean;
    syncStatus: "pending" | "confirmed" | "failed";
  }>;
  syncPredictionTransaction: (input: { txHash: string }) => Promise<{
    ok: boolean;
    syncStatus: "pending" | "confirmed" | "missing";
  }>;
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
  const response = await fetchInternalApi(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }

  return (await response.json()) as T;
}

export { COMMENT_REACTION_EMOJIS } from "@/lib/community";

function normalizeTonAddress(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    return Address.parse(value).toString();
  } catch {
    return value;
  }
}

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
  const latestRequestRef = useRef(0);

  const applyPayload = (
    payload: CommunityStatePayload,
    requestedWalletAddress = walletAddress,
  ) => {
    const normalizedWalletAddress = normalizeTonAddress(requestedWalletAddress);
    const resolvedProfile =
      payload.profile ??
      (requestedWalletAddress
        ? (payload.store.profiles[requestedWalletAddress] ??
          (normalizedWalletAddress
            ? (payload.store.profiles[normalizedWalletAddress] ?? null)
            : null))
        : null);

    setStore(payload.store);
    setProfile(resolvedProfile);
    setAchievements(payload.achievements);
    setLeaderboard(payload.leaderboard);
    setRecentActivity(payload.recentActivity);
    setSettledPredictions(payload.settlements ?? []);
  };

  const refresh = async () => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setIsSyncing(true);

    try {
      const url = walletAddress
        ? `/api/community/state?wallet=${encodeURIComponent(walletAddress)}`
        : "/api/community/state";
      const response = await fetchInternalApi(url, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Failed to load community state");
      }

      if (latestRequestRef.current !== requestId) {
        return;
      }

      applyPayload(
        (await response.json()) as CommunityStatePayload,
        walletAddress,
      );
    } finally {
      if (latestRequestRef.current === requestId) {
        setIsSyncing(false);
        setIsLoaded(true);
      }
    }
  };

  useEffect(() => {
    void refresh();
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      setProfile(null);
      return;
    }

    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    void postJson<CommunityStatePayload>("/api/community/profile", {
      walletAddress,
      displayName: "",
      bio: "",
      telegramDisplayName: createTelegramDisplayName(telegramUser),
    }).then((payload) => {
      if (latestRequestRef.current !== requestId) {
        return;
      }

      applyPayload(payload, walletAddress);
      setIsLoaded(true);
    });
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

  const checkIn: CommunityContextValue["checkIn"] = async ({ txHash }) => {
    if (!walletAddress) {
      return { ok: false, points: 0, syncStatus: "failed" };
    }

    setIsSyncing(true);

    try {
      const payload = await postJson<{
        result: {
          ok: boolean;
          points: number;
          syncStatus: "pending" | "confirmed" | "failed";
        };
        state: CommunityStatePayload;
      }>("/api/community/check-in", { walletAddress, txHash });

      applyPayload(payload.state);
      return payload.result;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncCheckInTransaction: CommunityContextValue["syncCheckInTransaction"] =
    async ({ txHash }) => {
      if (!walletAddress) {
        return { ok: false, syncStatus: "missing" };
      }

      setIsSyncing(true);

      try {
        const response = await fetchInternalApi("/api/community/check-in", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            txHash,
          }),
          cache: "no-store",
        });

        if (!response.ok) {
          return { ok: false, syncStatus: "missing" };
        }

        const payload = (await response.json()) as {
          result: boolean;
          syncStatus: "pending" | "confirmed" | "missing";
          state: CommunityStatePayload;
        };

        applyPayload(payload.state);
        return {
          ok: payload.result,
          syncStatus: payload.syncStatus,
        };
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
      return { ok: false, syncStatus: "failed" };
    }

    setIsSyncing(true);

    try {
      const payload = await postJson<{
        result: boolean;
        syncStatus?: "pending" | "confirmed";
        state: CommunityStatePayload;
      }>("/api/community/predictions", {
        walletAddress,
        ...input,
      });

      applyPayload(payload.state);
      return {
        ok: payload.result,
        syncStatus: payload.syncStatus ?? "confirmed",
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const syncPredictionTransaction: CommunityContextValue["syncPredictionTransaction"] =
    async ({ txHash }) => {
      if (!walletAddress) {
        return { ok: false, syncStatus: "missing" };
      }

      setIsSyncing(true);

      try {
        const response = await fetchInternalApi("/api/community/predictions", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            txHash,
          }),
          cache: "no-store",
        });

        if (!response.ok) {
          return { ok: false, syncStatus: "missing" };
        }

        const payload = (await response.json()) as {
          result: boolean;
          syncStatus: "pending" | "confirmed" | "missing";
          state: CommunityStatePayload;
        };

        applyPayload(payload.state);
        return {
          ok: payload.result,
          syncStatus: payload.syncStatus,
        };
      } finally {
        setIsSyncing(false);
      }
    };

  const optimisticRecordPrediction: CommunityContextValue["optimisticRecordPrediction"] =
    () => {};

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
        const response = await fetchInternalApi("/api/community/predictions", {
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
    ? store.predictionHistory
        .filter((bet) => bet.walletAddress === walletAddress)
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
        checkInEvents: store.checkInEvents,
        rewardLedger: store.rewardLedger,
        settledPredictions,
        userBets,
        updateProfile,
        updateNotificationPreferences,
        checkIn,
        syncCheckInTransaction,
        addComment,
        getComments,
        toggleCommentReaction,
        submitPrediction,
        syncPredictionTransaction,
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

export function useCommunityProfile() {
  const context = useContext(CommunityContext);

  if (!context) {
    throw new Error(
      "useCommunityProfile must be used within CommunityProvider",
    );
  }

  return context;
}
