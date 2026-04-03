export type ActivityTrack = "liquidity" | "farming" | "staking";
export type PredictionDirection = "up" | "down";
export type CommentReactionEmoji = "🔥" | "👍" | "🚀" | "💎";

export type PredictionBet = {
  id: string;
  walletAddress: string;
  author: string;
  amount: number;
  direction: PredictionDirection;
  createdAt: string;
  txHash?: string;
  chainTxHash?: string;
  sourceKind?: "offchain" | "wallet_signed" | "pending" | "onchain_sync";
};

export type PredictionRoundStatus = "open" | "closed" | "settled";

export type PredictionRound = {
  id: string;
  status: PredictionRoundStatus;
  openedAt: string;
  closesAt: string;
  resolvedAt?: string;
  durationMinutes: number;
  settlementDirection?: PredictionDirection;
};

export type PredictionPayoutPreview = {
  walletAddress: string;
  author: string;
  totalStake: number;
  estimatedPayout: number;
};

export type PredictionSettlement = {
  roundId: string;
  pairId: string;
  pairLabel: string;
  settlementDirection: PredictionDirection;
  settledAt: string;
  totalPool: number;
  payouts: PredictionPayoutPreview[];
};

export type NotificationPreferences = {
  dailyCheckInReminders: boolean;
  watchlistAlerts: boolean;
  predictionSettlements: boolean;
  telegramBotMessages: boolean;
};

export type UserProfile = {
  walletAddress: string;
  displayName: string;
  bio: string;
  joinedAt: string;
  totalPoints: number;
  streak: number;
  lastCheckInDate?: string;
  checkInDates: string[];
  activities: Partial<Record<ActivityTrack, string>>;
  commentsCount: number;
  predictionsCount: number;
  notificationPreferences: NotificationPreferences;
  watchedPools: Array<{ poolId: string; poolLabel: string; createdAt: string }>;
};

export type PoolComment = {
  id: string;
  walletAddress: string;
  author: string;
  text: string;
  createdAt: string;
  reactions: Partial<Record<CommentReactionEmoji, string[]>>;
};

export type PairPrediction = {
  label: string;
  up: string[];
  down: string[];
  bets: PredictionBet[];
  round: PredictionRound | null;
  payoutPreviews: PredictionPayoutPreview[];
};

export type ActivityItem = {
  id: string;
  type:
    | "profile_created"
    | "daily_check_in"
    | "comment_added"
    | "reaction_added"
    | "prediction_added"
    | "prediction_round_closed"
    | "prediction_settled"
    | "track_started"
    | "watchlist_added";
  walletAddress: string;
  author: string;
  createdAt: string;
  title: string;
  detail: string;
};

export type CommunityStore = {
  profiles: Record<string, UserProfile>;
  comments: Record<string, PoolComment[]>;
  predictions: Record<string, PairPrediction>;
  settlements: PredictionSettlement[];
  activity: ActivityItem[];
};

export type Achievement = {
  id: string;
  category: "onchain" | "consistency" | "social" | "market" | "seasonal";
  icon: string;
  label: string;
  description: string;
  progress: number;
  target: number;
  suffix: string;
  milestone: string;
  level: number;
  unlocked: boolean;
  highlight?: string;
  startedAt?: string | undefined;
};

export type LeaderboardEntry = {
  walletAddress: string;
  displayName: string;
  totalPoints: number;
  streak: number;
  commentsCount: number;
  predictionsCount: number;
  achievementScore: number;
  userLevel: UserLevel;
};

export type UserLevel = {
  id:
    | "novice"
    | "explorer"
    | "strategist"
    | "operator"
    | "professional"
    | "legend";
  label: string;
  shortLabel: string;
  accentClassName: string;
  minScore: number;
};

export const DAILY_CHECK_IN_POINTS = 10;
export const COMMENT_POINTS = 7;
export const PREDICTION_POINTS = 5;
export const TRACK_POINTS = 20;
export const COMMENT_REACTION_EMOJIS: CommentReactionEmoji[] = [
  "🔥",
  "👍",
  "🚀",
  "💎",
];

export const defaultCommunityStore: CommunityStore = {
  profiles: {},
  comments: {},
  predictions: {},
  settlements: [],
  activity: [],
};

export function defaultNotificationPreferences(): NotificationPreferences {
  return {
    dailyCheckInReminders: true,
    watchlistAlerts: true,
    predictionSettlements: true,
    telegramBotMessages: true,
  };
}

export function normalizeNotificationPreferences(
  value?: Partial<NotificationPreferences> | null,
): NotificationPreferences {
  return {
    ...defaultNotificationPreferences(),
    ...(value ?? {}),
  };
}

const USER_LEVELS: UserLevel[] = [
  {
    id: "novice",
    label: "Novice",
    shortLabel: "NV",
    accentClassName: "border-slate-200 bg-slate-100 text-slate-700",
    minScore: 0,
  },
  {
    id: "explorer",
    label: "Explorer",
    shortLabel: "EX",
    accentClassName: "border-sky-200 bg-sky-100 text-sky-700",
    minScore: 150,
  },
  {
    id: "strategist",
    label: "Strategist",
    shortLabel: "ST",
    accentClassName: "border-cyan-200 bg-cyan-100 text-cyan-700",
    minScore: 320,
  },
  {
    id: "operator",
    label: "Operator",
    shortLabel: "OP",
    accentClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
    minScore: 520,
  },
  {
    id: "professional",
    label: "Professional",
    shortLabel: "PRO",
    accentClassName: "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700",
    minScore: 760,
  },
  {
    id: "legend",
    label: "Legend",
    shortLabel: "LGD",
    accentClassName: "border-amber-200 bg-amber-100 text-amber-700",
    minScore: 1020,
  },
];

export function getAllUserLevels() {
  return USER_LEVELS;
}

export function createDefaultProfile(
  walletAddress: string,
  displayName?: string,
): UserProfile {
  const compact = walletAddress.slice(0, 4);

  return {
    walletAddress,
    displayName: displayName || `STON ${compact}`,
    bio: "Liquidity explorer on TON.",
    joinedAt: new Date().toISOString(),
    totalPoints: 0,
    streak: 0,
    checkInDates: [],
    activities: {},
    commentsCount: 0,
    predictionsCount: 0,
    notificationPreferences: defaultNotificationPreferences(),
    watchedPools: [],
  };
}

function getTrackAchievementMeta(track: ActivityTrack) {
  if (track === "liquidity") {
    return {
      id: "liquidity-keeper",
      category: "onchain" as const,
      icon: "🌊",
      label: "Liquidity keeper",
      description: "Hold a liquidity position and build consistency.",
    };
  }

  if (track === "farming") {
    return {
      id: "yield-farmer",
      category: "onchain" as const,
      icon: "🌾",
      label: "Yield farmer",
      description: "Stay active in vault and farming strategies.",
    };
  }

  return {
    id: "stake-guardian",
    category: "onchain" as const,
    icon: "🛡️",
    label: "Stake guardian",
    description: "Keep your staking position alive over time.",
  };
}

function diffInDays(startedAt: string) {
  const now = new Date().getTime();
  const started = new Date(startedAt).getTime();
  const diff = Math.floor((now - started) / (1000 * 60 * 60 * 24));

  return Math.max(diff + 1, 1);
}

function buildHoldAchievement(
  profile: UserProfile | null,
  track: ActivityTrack,
): Achievement {
  const startedAt = profile?.activities[track];
  const progress = startedAt ? diffInDays(startedAt) : 0;
  const level = progress >= 90 ? 3 : progress >= 30 ? 2 : progress >= 7 ? 1 : 0;
  const milestone =
    level === 3
      ? "Diamond 90d"
      : level === 2
        ? "Gold 30d"
        : level === 1
          ? "Silver 7d"
          : "Start tracking";
  const meta = getTrackAchievementMeta(track);

  return {
    id: meta.id,
    category: meta.category,
    icon: meta.icon,
    label: meta.label,
    description: meta.description,
    progress,
    target: 90,
    suffix: "days",
    milestone,
    level,
    unlocked: progress > 0,
    highlight: startedAt
      ? `Tracked since ${new Date(startedAt).toLocaleDateString()}.`
      : "No active position tracked yet.",
    startedAt,
  };
}

function buildMetricAchievement(input: {
  id: string;
  category: Achievement["category"];
  icon: string;
  label: string;
  description: string;
  progress: number;
  bronze: number;
  silver: number;
  gold: number;
  suffix: string;
  lockedMilestone: string;
}) {
  const { progress, bronze, silver, gold } = input;
  const level =
    progress >= gold ? 3 : progress >= silver ? 2 : progress >= bronze ? 1 : 0;
  const target =
    level === 3 ? gold : level === 2 ? gold : level === 1 ? silver : bronze;
  const milestone =
    level === 3
      ? `Gold ${gold}${input.suffix}`
      : level === 2
        ? `Silver ${silver}${input.suffix}`
        : level === 1
          ? `Bronze ${bronze}${input.suffix}`
          : input.lockedMilestone;

  return {
    id: input.id,
    category: input.category,
    icon: input.icon,
    label: input.label,
    description: input.description,
    progress,
    target,
    suffix: input.suffix,
    milestone,
    level,
    unlocked: progress >= bronze,
    highlight:
      level > 0
        ? `${progress}${input.suffix} reached. Keep pushing for the next tier.`
        : `Need ${bronze}${input.suffix} to unlock the first tier.`,
  } satisfies Achievement;
}

export function buildAchievements(
  profile: UserProfile | null,
  store: CommunityStore,
): Achievement[] {
  if (!profile) {
    return [
      buildHoldAchievement(null, "liquidity"),
      buildHoldAchievement(null, "farming"),
      buildHoldAchievement(null, "staking"),
      buildMetricAchievement({
        id: "daily-ritual",
        category: "consistency",
        icon: "📅",
        label: "Daily ritual",
        description: "Check in regularly and build your points streak.",
        progress: 0,
        bronze: 3,
        silver: 7,
        gold: 30,
        suffix: "d",
        lockedMilestone: "3d streak",
      }),
    ];
  }

  const allComments = Object.values(store.comments).flat();
  const userComments = allComments.filter(
    (comment) => comment.walletAddress === profile.walletAddress,
  );
  const receivedReactions = userComments.reduce((sum, comment) => {
    return (
      sum +
      Object.values(comment.reactions).reduce(
        (commentSum, addresses) => commentSum + (addresses?.length ?? 0),
        0,
      )
    );
  }, 0);
  const biggestBet = Object.values(store.predictions)
    .flatMap((prediction) => prediction.bets)
    .filter((bet) => bet.walletAddress === profile.walletAddress)
    .reduce((max, bet) => Math.max(max, bet.amount), 0);
  const leaderboard = buildBaseLeaderboard(store);
  const position =
    leaderboard.findIndex(
      (entry) => entry.walletAddress === profile.walletAddress,
    ) + 1;
  const topTenProgress = position > 0 && position <= 10 ? 10 - position + 1 : 0;

  return [
    buildHoldAchievement(profile, "liquidity"),
    buildHoldAchievement(profile, "farming"),
    buildHoldAchievement(profile, "staking"),
    buildMetricAchievement({
      id: "daily-ritual",
      category: "consistency",
      icon: "📅",
      label: "Daily ritual",
      description: "Check in regularly and build your points streak.",
      progress: profile.streak,
      bronze: 3,
      silver: 7,
      gold: 30,
      suffix: "d",
      lockedMilestone: "3d streak",
    }),
    buildMetricAchievement({
      id: "commentator",
      category: "social",
      icon: "💬",
      label: "Commentator",
      description:
        "Join the pool conversation and become a recognizable voice.",
      progress: profile.commentsCount,
      bronze: 1,
      silver: 5,
      gold: 20,
      suffix: "",
      lockedMilestone: "Post 1 comment",
    }),
    buildMetricAchievement({
      id: "community-voice",
      category: "social",
      icon: "🔥",
      label: "Community voice",
      description: "Earn reactions on your comments from other users.",
      progress: receivedReactions,
      bronze: 3,
      silver: 10,
      gold: 25,
      suffix: "",
      lockedMilestone: "Get 3 reactions",
    }),
    buildMetricAchievement({
      id: "signal-hunter",
      category: "market",
      icon: "📈",
      label: "Signal hunter",
      description:
        "Stay active in prediction markets and build your read of sentiment.",
      progress: profile.predictionsCount,
      bronze: 1,
      silver: 5,
      gold: 15,
      suffix: "",
      lockedMilestone: "Place 1 forecast",
    }),
    buildMetricAchievement({
      id: "whale-conviction",
      category: "market",
      icon: "🐋",
      label: "Whale conviction",
      description:
        "Place a standout prediction stake and show your confidence.",
      progress: biggestBet,
      bronze: 25,
      silver: 100,
      gold: 250,
      suffix: " pts",
      lockedMilestone: "Bet 25 pts",
    }),
    buildMetricAchievement({
      id: "pool-scout",
      category: "social",
      icon: "🛰️",
      label: "Pool scout",
      description: "Curate your own shortlist of pools worth watching.",
      progress: profile.watchedPools.length,
      bronze: 1,
      silver: 3,
      gold: 8,
      suffix: "",
      lockedMilestone: "Watch 1 pool",
    }),
    buildMetricAchievement({
      id: "pulse-legend",
      category: "seasonal",
      icon: "🏆",
      label: "Pulse legend",
      description:
        "Climb into the seasonal top 10 and stay visible on the board.",
      progress: topTenProgress,
      bronze: 1,
      silver: 5,
      gold: 10,
      suffix: "",
      lockedMilestone: "Reach Top 10",
    }),
  ];
}

function buildBaseLeaderboard(store: CommunityStore) {
  return Object.values(store.profiles).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    if (b.streak !== a.streak) {
      return b.streak - a.streak;
    }

    return a.joinedAt.localeCompare(b.joinedAt);
  });
}

export function getAchievementScore(achievements: Achievement[]) {
  return achievements.reduce((sum, achievement) => {
    const milestoneWeight =
      achievement.category === "seasonal"
        ? 120
        : achievement.category === "onchain"
          ? 110
          : achievement.category === "market"
            ? 95
            : achievement.category === "social"
              ? 85
              : 80;
    const progressWeight = Math.min(
      achievement.progress / Math.max(achievement.target, 1),
      1,
    );

    return (
      sum +
      achievement.level * milestoneWeight +
      progressWeight * Math.round(milestoneWeight * 0.35)
    );
  }, 0);
}

export function getUserLevel(score: number): UserLevel {
  for (let index = USER_LEVELS.length - 1; index >= 0; index -= 1) {
    const level = USER_LEVELS[index];

    if (level && score >= level.minScore) {
      return level;
    }
  }

  return USER_LEVELS[0]!;
}

export function getNextUserLevel(score: number) {
  const current = getUserLevel(score);
  const currentIndex = USER_LEVELS.findIndex(
    (level) => level.id === current.id,
  );
  const next =
    currentIndex >= 0 ? (USER_LEVELS[currentIndex + 1] ?? null) : null;

  return next;
}

export function getUserLevelProgress(score: number) {
  const current = getUserLevel(score);
  const next = getNextUserLevel(score);

  if (!next) {
    return {
      current,
      next: null,
      progressPercent: 100,
      remainingScore: 0,
    };
  }

  const span = Math.max(next.minScore - current.minScore, 1);
  const progressPercent = Math.min(
    Math.max(((score - current.minScore) / span) * 100, 0),
    100,
  );

  return {
    current,
    next,
    progressPercent,
    remainingScore: Math.max(next.minScore - score, 0),
  };
}

export function buildLeaderboard(store: CommunityStore): LeaderboardEntry[] {
  return buildBaseLeaderboard(store)
    .map((profile) => {
      const achievements = buildAchievements(profile, store);
      const achievementScore = Math.round(getAchievementScore(achievements));

      return {
        walletAddress: profile.walletAddress,
        displayName: profile.displayName,
        totalPoints: profile.totalPoints,
        streak: profile.streak,
        commentsCount: profile.commentsCount,
        predictionsCount: profile.predictionsCount,
        achievementScore,
        userLevel: getUserLevel(achievementScore),
      };
    })
    .sort((a, b) => {
      if (b.userLevel.minScore !== a.userLevel.minScore) {
        return b.userLevel.minScore - a.userLevel.minScore;
      }

      if (b.achievementScore !== a.achievementScore) {
        return b.achievementScore - a.achievementScore;
      }

      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      if (b.streak !== a.streak) {
        return b.streak - a.streak;
      }

      return a.displayName.localeCompare(b.displayName);
    })
    .map((profile) => ({
      walletAddress: profile.walletAddress,
      displayName: profile.displayName,
      totalPoints: profile.totalPoints,
      streak: profile.streak,
      commentsCount: profile.commentsCount,
      predictionsCount: profile.predictionsCount,
      achievementScore: profile.achievementScore,
      userLevel: profile.userLevel,
    }));
}

export function buildCommunityState(
  store: CommunityStore,
  walletAddress: string | null,
) {
  const profile = walletAddress
    ? (store.profiles[walletAddress] ?? null)
    : null;

  return {
    store,
    profile,
    achievements: buildAchievements(profile, store),
    leaderboard: buildLeaderboard(store).slice(0, 20),
    recentActivity: store.activity
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20),
    settlements: store.settlements
      .slice()
      .sort((a, b) => b.settledAt.localeCompare(a.settledAt))
      .slice(0, 20),
  };
}
