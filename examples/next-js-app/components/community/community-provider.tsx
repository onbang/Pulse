"use client";

import { Address } from "@ton/core";
import { useTonAddress } from "@tonconnect/ui-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useTelegramMiniApp } from "@/components/telegram/telegram-mini-app-provider";
import { useDevPreviewWallet } from "@/hooks/use-dev-preview-wallet";
import {
  DEFAULT_PROFILE_BIO,
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
  getDefaultProfileDisplayName,
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

type StoredPublicProfile = {
  displayName: string;
  bio: string;
  updatedAt: string;
};

type CommunityContextValue = {
  isLoaded: boolean;
  isSyncing: boolean;
  isPreviewMode: boolean;
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
const LOCAL_PROFILE_STORAGE_PREFIX = "ston-pulse:public-profile:";

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

function resolvePayloadProfile(
  payload: CommunityStatePayload,
  requestedWalletAddress?: string | null,
) {
  const normalizedWalletAddress = normalizeTonAddress(requestedWalletAddress);

  return (
    payload.profile ??
    (requestedWalletAddress
      ? (payload.store.profiles[requestedWalletAddress] ??
        (normalizedWalletAddress
          ? (payload.store.profiles[normalizedWalletAddress] ?? null)
          : null))
      : null)
  );
}

function getStoredPublicProfileKey(walletAddress: string) {
  return `${LOCAL_PROFILE_STORAGE_PREFIX}${normalizeTonAddress(walletAddress) || walletAddress}`;
}

function readStoredPublicProfile(
  walletAddress?: string | null,
): StoredPublicProfile | null {
  if (typeof window === "undefined" || !walletAddress) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(
      getStoredPublicProfileKey(walletAddress),
    );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredPublicProfile>;

    if (
      typeof parsed.displayName !== "string" ||
      typeof parsed.bio !== "string"
    ) {
      return null;
    }

    return {
      displayName: parsed.displayName,
      bio: parsed.bio,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function writeStoredPublicProfile(
  walletAddress: string,
  input: { displayName: string; bio: string },
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getStoredPublicProfileKey(walletAddress),
      JSON.stringify({
        displayName: input.displayName,
        bio: input.bio,
        updatedAt: new Date().toISOString(),
      } satisfies StoredPublicProfile),
    );
  } catch {
    // Ignore client storage failures and continue with server state.
  }
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const connectedWalletAddress = useTonAddress();
  const { isPreviewMode: hasPreviewWallet, previewWalletAddress } =
    useDevPreviewWallet();
  const isPreviewMode = !connectedWalletAddress && hasPreviewWallet;
  const walletAddress =
    connectedWalletAddress || (isPreviewMode ? previewWalletAddress : "");
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
  const normalizedConnectedWallet = normalizeTonAddress(walletAddress);
  const resolvedWalletAddress =
    profile?.walletAddress || normalizedConnectedWallet || walletAddress;

  const resetTransientState = useCallback(() => {
    setStore(defaultCommunityStore);
    setProfile(null);
    setAchievements([]);
    setLeaderboard([]);
    setRecentActivity([]);
    setSettledPredictions([]);
  }, []);

  const applyPayload = useCallback(
    (
      payload: CommunityStatePayload,
      requestedWalletAddress = walletAddress,
    ) => {
      const resolvedProfile = resolvePayloadProfile(
        payload,
        requestedWalletAddress,
      );

      setStore(payload.store);
      setProfile(resolvedProfile);
      setAchievements(payload.achievements);
      setLeaderboard(payload.leaderboard);
      setRecentActivity(payload.recentActivity);
      setSettledPredictions(payload.settlements ?? []);
    },
    [walletAddress],
  );

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
    } catch (error) {
      console.error("Failed to refresh community state", error);

      if (latestRequestRef.current === requestId && !walletAddress) {
        resetTransientState();
      }
    } finally {
      if (latestRequestRef.current === requestId) {
        setIsSyncing(false);
        setIsLoaded(true);
      }
    }
  };

  useEffect(() => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setIsSyncing(true);

    const bootstrap = async () => {
      try {
        if (!walletAddress) {
          const response = await fetchInternalApi("/api/community/state", {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("Failed to load anonymous community state");
          }

          if (latestRequestRef.current !== requestId) {
            return;
          }

          applyPayload(
            (await response.json()) as CommunityStatePayload,
            walletAddress,
          );
          return;
        }

        if (isPreviewMode) {
          const response = await fetchInternalApi(
            `/api/community/state?wallet=${encodeURIComponent(walletAddress)}`,
            {
              cache: "no-store",
            },
          );

          if (!response.ok) {
            throw new Error("Failed to load preview community state");
          }

          if (latestRequestRef.current !== requestId) {
            return;
          }

          applyPayload(
            (await response.json()) as CommunityStatePayload,
            walletAddress,
          );
          return;
        }

        const telegramDisplayName = createTelegramDisplayName(telegramUser);
        const payload = await postJson<CommunityStatePayload>(
          "/api/community/profile",
          {
            walletAddress,
            telegramDisplayName,
          },
        );

        let nextPayload = payload;
        const storedPublicProfile = readStoredPublicProfile(walletAddress);
        const currentProfile = resolvePayloadProfile(payload, walletAddress);
        const defaultDisplayName = currentProfile
          ? getDefaultProfileDisplayName(currentProfile.walletAddress)
          : getDefaultProfileDisplayName(
              normalizeTonAddress(walletAddress) || walletAddress,
            );
        const displayNameLooksDefault = Boolean(
          currentProfile &&
            (currentProfile.displayName === defaultDisplayName ||
              (telegramDisplayName &&
                currentProfile.displayName === telegramDisplayName) ||
              !currentProfile.displayName.trim()),
        );
        const bioLooksDefault = Boolean(
          currentProfile &&
            (currentProfile.bio === DEFAULT_PROFILE_BIO ||
              !currentProfile.bio.trim()),
        );
        const shouldRestoreStoredProfile = Boolean(
          currentProfile &&
            storedPublicProfile &&
            ((displayNameLooksDefault &&
              storedPublicProfile.displayName !== currentProfile.displayName) ||
              (bioLooksDefault &&
                storedPublicProfile.bio !== currentProfile.bio)),
        );

        if (shouldRestoreStoredProfile && storedPublicProfile) {
          nextPayload = await postJson<CommunityStatePayload>(
            "/api/community/profile",
            {
              walletAddress,
              displayName: storedPublicProfile.displayName,
              bio: storedPublicProfile.bio,
              telegramDisplayName,
            },
          );
        }

        if (latestRequestRef.current !== requestId) {
          return;
        }

        applyPayload(nextPayload, walletAddress);
      } catch (error) {
        console.error("Failed to bootstrap community provider", error);

        if (latestRequestRef.current !== requestId) {
          return;
        }

        if (!walletAddress) {
          resetTransientState();
          return;
        }

        try {
          const response = await fetchInternalApi(
            `/api/community/state?wallet=${encodeURIComponent(walletAddress)}`,
            { cache: "no-store" },
          );

          if (!response.ok) {
            throw new Error("Fallback community state request failed");
          }

          if (latestRequestRef.current !== requestId) {
            return;
          }

          applyPayload(
            (await response.json()) as CommunityStatePayload,
            walletAddress,
          );
        } catch (fallbackError) {
          console.error(
            "Failed to recover community provider after bootstrap error",
            fallbackError,
          );
        }
      } finally {
        if (latestRequestRef.current === requestId) {
          setIsSyncing(false);
          setIsLoaded(true);
        }
      }
    };

    void bootstrap();
  }, [
    applyPayload,
    isPreviewMode,
    resetTransientState,
    telegramUser,
    walletAddress,
  ]);

  const updateProfile: CommunityContextValue["updateProfile"] = async (
    input,
  ) => {
    if (!walletAddress || isPreviewMode) {
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

      const resolvedProfile = resolvePayloadProfile(payload, walletAddress);
      writeStoredPublicProfile(walletAddress, {
        displayName: resolvedProfile?.displayName ?? input.displayName,
        bio: resolvedProfile?.bio ?? input.bio,
      });
      applyPayload(payload);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateNotificationPreferences: CommunityContextValue["updateNotificationPreferences"] =
    async (input) => {
      if (!walletAddress || isPreviewMode) {
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
    if (!walletAddress || isPreviewMode) {
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
      if (!walletAddress || isPreviewMode) {
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
    if (!walletAddress || isPreviewMode) {
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
      if (!walletAddress || isPreviewMode) {
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
    if (!walletAddress || isPreviewMode) {
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
      if (!walletAddress || isPreviewMode) {
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
    if (!walletAddress || isPreviewMode) {
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
      if (!walletAddress || isPreviewMode) {
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
    if (!walletAddress || isPreviewMode) {
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
  const userBets = resolvedWalletAddress
    ? store.predictionHistory
        .filter(
          (bet) =>
            normalizeTonAddress(bet.walletAddress) === resolvedWalletAddress,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  return (
    <CommunityContext.Provider
      value={{
        isLoaded,
        isSyncing,
        isPreviewMode,
        walletAddress: resolvedWalletAddress,
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
