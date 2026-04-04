export type ActivityTrack = "liquidity" | "farming" | "staking";
export type PredictionDirection = "up" | "down";
export type CommentReactionEmoji = "🔥" | "👍" | "🚀" | "💎";
export type CheckInEventStatus = "pending" | "confirmed";
export type RewardLedgerReason =
  | "daily_check_in"
  | "streak_bonus"
  | "prediction"
  | "comment"
  | "watchlist"
  | "system";

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
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInDate?: string;
  checkInDates: string[];
  activities: Partial<Record<ActivityTrack, string>>;
  commentsCount: number;
  predictionsCount: number;
  swapCount: number;
  liquidityActionsCount: number;
  notificationPreferences: NotificationPreferences;
  watchedPools: Array<{ poolId: string; poolLabel: string; createdAt: string }>;
};

export type CheckInEvent = {
  id: string;
  walletAddress: string;
  dateKey: string;
  amountTon: number;
  sourceMessageHash?: string;
  chainTxHash?: string;
  createdAt: string;
  confirmedAt?: string;
  pointsAwarded: number;
  streakAfterCheckIn: number;
  status: CheckInEventStatus;
};

export type RewardLedgerEntry = {
  id: string;
  walletAddress: string;
  reason: RewardLedgerReason;
  label: string;
  points: number;
  relatedEventId?: string;
  createdAt: string;
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
  checkInEvents: CheckInEvent[];
  rewardLedger: RewardLedgerEntry[];
};

export type Achievement = {
  id: string;
  category: "wallet" | "check-in" | "trading" | "liquidity" | "community";
  icon: string;
  label: string;
  description: string;
  progress: number;
  target: number;
  suffix: string;
  milestone: string;
  level: number;
  tier: "locked" | "bronze" | "silver" | "gold" | "legendary";
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
    | "explorer"
    | "regular"
    | "signal-maker"
    | "streak-master"
    | "pulse-legend";
  label: string;
  shortLabel: string;
  accentClassName: string;
  minScore: number;
};

export const DAILY_CHECK_IN_POINTS = 10;
export const CHECK_IN_STREAK_BONUSES = [
  { minStreak: 30, points: 20 },
  { minStreak: 14, points: 10 },
  { minStreak: 7, points: 5 },
  { minStreak: 3, points: 2 },
] as const;
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
  checkInEvents: [],
  rewardLedger: [],
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
    id: "explorer",
    label: "Explorer",
    shortLabel: "EX",
    accentClassName: "border-sky-200 bg-sky-100 text-sky-700",
    minScore: 0,
  },
  {
    id: "regular",
    label: "Regular",
    shortLabel: "RG",
    accentClassName: "border-cyan-200 bg-cyan-100 text-cyan-700",
    minScore: 80,
  },
  {
    id: "signal-maker",
    label: "Signal Maker",
    shortLabel: "SG",
    accentClassName: "border-violet-200 bg-violet-100 text-violet-700",
    minScore: 220,
  },
  {
    id: "streak-master",
    label: "Streak Master",
    shortLabel: "SM",
    accentClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
    minScore: 420,
  },
  {
    id: "pulse-legend",
    label: "Pulse Legend",
    shortLabel: "PL",
    accentClassName: "border-amber-200 bg-amber-100 text-amber-700",
    minScore: 760,
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
    longestStreak: 0,
    totalCheckIns: 0,
    checkInDates: [],
    activities: {},
    commentsCount: 0,
    predictionsCount: 0,
    swapCount: 0,
    liquidityActionsCount: 0,
    notificationPreferences: defaultNotificationPreferences(),
    watchedPools: [],
  };
}

export function getCheckInBonusPoints(streak: number) {
  for (const bonus of CHECK_IN_STREAK_BONUSES) {
    if (streak >= bonus.minStreak) {
      return bonus.points;
    }
  }

  return 0;
}

export function getCheckInRewardPoints(streak: number) {
  return DAILY_CHECK_IN_POINTS + getCheckInBonusPoints(streak);
}

function diffInDays(startedAt: string) {
  const now = new Date().getTime();
  const started = new Date(startedAt).getTime();
  const diff = Math.floor((now - started) / (1000 * 60 * 60 * 24));

  return Math.max(diff + 1, 1);
}

function getAchievementTier(level: number): Achievement["tier"] {
  if (level >= 4) {
    return "legendary";
  }

  if (level === 3) {
    return "gold";
  }

  if (level === 2) {
    return "silver";
  }

  if (level === 1) {
    return "bronze";
  }

  return "locked";
}

function buildMetricAchievement(input: {
  id: string;
  category: Achievement["category"];
  icon: string;
  label: string;
  description: string;
  progress: number;
  tiers: number[];
  suffix: string;
  lockedMilestone: string;
  highlight: {
    unlocked: string;
    locked: string;
  };
}) {
  const [bronze = 0, silver = 0, gold = 0, legendary] = input.tiers;
  const level =
    input.progress >= (legendary ?? gold)
      ? legendary
        ? 4
        : 3
      : input.progress >= gold
        ? 3
        : input.progress >= silver
          ? 2
          : input.progress >= bronze
            ? 1
            : 0;
  const target =
    level >= 4 && legendary
      ? legendary
      : level === 3
        ? gold
        : level === 2
          ? gold
          : level === 1
            ? silver
            : bronze;
  const milestone =
    level >= 4 && legendary
      ? `Legend ${legendary}${input.suffix}`
      : level === 3
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
    progress: input.progress,
    target,
    suffix: input.suffix,
    milestone,
    level,
    tier: getAchievementTier(level),
    unlocked: input.progress >= bronze,
    highlight:
      input.progress >= bronze
        ? input.highlight.unlocked
        : input.highlight.locked,
  } satisfies Achievement;
}

export function buildAchievements(
  profile: UserProfile | null,
  store: CommunityStore,
): Achievement[] {
  if (!profile) {
    return [
      buildMetricAchievement({
        id: "first-connect",
        category: "wallet",
        icon: "🔌",
        label: "Wallet Native",
        description: "Подключи TON-кошелек и активируй onchain-профиль.",
        progress: 0,
        tiers: [1, 1, 1, 1],
        suffix: "",
        lockedMilestone: "Подключи кошелек",
        highlight: {
          unlocked: "",
          locked: "Кошелек еще не подключен.",
        },
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
  const checkInEvents = store.checkInEvents.filter(
    (event) =>
      event.walletAddress === profile.walletAddress &&
      event.status === "confirmed",
  );
  const rewardEntries = store.rewardLedger.filter(
    (entry) => entry.walletAddress === profile.walletAddress,
  );
  const featureUsageCount = [
    profile.totalCheckIns > 0,
    profile.predictionsCount > 0,
    profile.commentsCount > 0,
    profile.watchedPools.length > 0,
    profile.liquidityActionsCount > 0 || Boolean(profile.activities.liquidity),
    profile.swapCount > 0,
  ].filter(Boolean).length;
  const leaderboard = buildBaseLeaderboard(store);
  const position =
    leaderboard.findIndex(
      (entry) => entry.walletAddress === profile.walletAddress,
    ) + 1;
  const topTenProgress = position > 0 && position <= 10 ? 10 - position + 1 : 0;

  return [
    buildMetricAchievement({
      id: "wallet-native",
      category: "wallet",
      icon: "🔐",
      label: "Wallet Native",
      description: "Профиль живет вместе с кошельком и onchain-активностью.",
      progress: 1,
      tiers: [1, 1, 1, 1],
      suffix: "",
      lockedMilestone: "Подключи кошелек",
      highlight: {
        unlocked: "Кошелек подключен и профиль активен.",
        locked: "Подключи кошелек, чтобы открыть профиль.",
      },
    }),
    buildMetricAchievement({
      id: "first-check-in",
      category: "check-in",
      icon: "✅",
      label: "First Check-in",
      description: "Подтверди первый ежедневный check-in onchain.",
      progress: profile.totalCheckIns,
      tiers: [1, 7, 30, 100],
      suffix: "",
      lockedMilestone: "Сделай первый check-in",
      highlight: {
        unlocked: `${profile.totalCheckIns} подтвержденных check-in уже в истории.`,
        locked: "Пока ни одного подтвержденного check-in.",
      },
    }),
    buildMetricAchievement({
      id: "streak-runner",
      category: "check-in",
      icon: "🔥",
      label: "Streak Runner",
      description: "Собирай серию check-in без пропусков.",
      progress: profile.longestStreak,
      tiers: [3, 7, 30, 60],
      suffix: "d",
      lockedMilestone: "Серия 3 дня",
      highlight: {
        unlocked: `Лучшая серия: ${profile.longestStreak} дней.`,
        locked: "Собери непрерывную серию check-in.",
      },
    }),
    buildMetricAchievement({
      id: "points-engine",
      category: "check-in",
      icon: "⚡",
      label: "Points Engine",
      description: "Наращивай points и поднимай уровень профиля.",
      progress: profile.totalPoints,
      tiers: [50, 150, 400, 800],
      suffix: "",
      lockedMilestone: "50 points",
      highlight: {
        unlocked: `Всего накоплено ${profile.totalPoints} points.`,
        locked: "Points начнут расти после первого onchain check-in.",
      },
    }),
    buildMetricAchievement({
      id: "signal-hunter",
      category: "trading",
      icon: "📈",
      label: "Signal Hunter",
      description: "Участвуй в прогнозах и собирай рыночную историю.",
      progress: profile.predictionsCount,
      tiers: [1, 5, 15, 40],
      suffix: "",
      lockedMilestone: "Сделай 1 прогноз",
      highlight: {
        unlocked: `${profile.predictionsCount} прогнозов уже зафиксировано.`,
        locked: "Начни с первого прогноза по токену.",
      },
    }),
    buildMetricAchievement({
      id: "whale-conviction",
      category: "trading",
      icon: "🐋",
      label: "High Conviction",
      description: "Сделай заметную ставку и зафиксируй уверенность onchain.",
      progress: biggestBet,
      tiers: [1, 5, 20, 50],
      suffix: " TON",
      lockedMilestone: "Ставка 1 TON",
      highlight: {
        unlocked: `Крупнейшая ставка: ${biggestBet.toFixed(2)} TON.`,
        locked: "Пока нет крупной ставки для этого бейджа.",
      },
    }),
    buildMetricAchievement({
      id: "pool-scout",
      category: "liquidity",
      icon: "🌊",
      label: "Pool Explorer",
      description: "Собери собственный shortlist пулов для наблюдения.",
      progress: profile.watchedPools.length,
      tiers: [1, 3, 8, 16],
      suffix: "",
      lockedMilestone: "Добавь 1 пул",
      highlight: {
        unlocked: `В watchlist уже ${profile.watchedPools.length} пулов.`,
        locked: "Сохрани первый пул в watchlist.",
      },
    }),
    buildMetricAchievement({
      id: "liquidity-native",
      category: "liquidity",
      icon: "💧",
      label: "Liquidity Native",
      description: "Используй liquidity flow и onchain LP-действия.",
      progress:
        profile.liquidityActionsCount > 0 || profile.activities.liquidity
          ? 1
          : 0,
      tiers: [1, 3, 10, 25],
      suffix: "",
      lockedMilestone: "Первое LP-действие",
      highlight: {
        unlocked: "Liquidity flow уже был использован.",
        locked: "Бейдж откроется после первого действия с ликвидностью.",
      },
    }),
    buildMetricAchievement({
      id: "community-voice",
      category: "community",
      icon: "💬",
      label: "Community Voice",
      description: "Комментируй, реагируй и формируй social layer.",
      progress: profile.commentsCount + receivedReactions,
      tiers: [1, 5, 20, 50],
      suffix: "",
      lockedMilestone: "Первый комментарий",
      highlight: {
        unlocked: `${profile.commentsCount} комментариев и ${receivedReactions} реакций в сумме.`,
        locked: "Напиши первый комментарий к пулу.",
      },
    }),
    buildMetricAchievement({
      id: "community-regular",
      category: "community",
      icon: "🛰️",
      label: "Community Regular",
      description:
        "Используй больше одной функции и стань постоянным участником.",
      progress: featureUsageCount,
      tiers: [2, 4, 6, 6],
      suffix: "",
      lockedMilestone: "2 feature used",
      highlight: {
        unlocked: `Задействовано ${featureUsageCount} продуктовых сценариев.`,
        locked: "Попробуй несколько разделов продукта.",
      },
    }),
    buildMetricAchievement({
      id: "early-pulse-user",
      category: "wallet",
      icon: "🌟",
      label: "Early Pulse User",
      description: "Ранний участник, который пришел в Pulse на старте.",
      progress:
        new Date(profile.joinedAt).getTime() <
        new Date("2026-06-01T00:00:00.000Z").getTime()
          ? 1
          : 0,
      tiers: [1, 1, 1, 1],
      suffix: "",
      lockedMilestone: "Early adopter",
      highlight: {
        unlocked: "Профиль создан в ранней фазе продукта.",
        locked: "Этот бейдж выдается ранним участникам.",
      },
    }),
    buildMetricAchievement({
      id: "pulse-legend",
      category: "community",
      icon: "🏆",
      label: "Pulse Legend",
      description:
        "Поднимись в топ таблицы и удерживайся среди заметных участников.",
      progress: topTenProgress,
      tiers: [1, 5, 10, 10],
      suffix: "",
      lockedMilestone: "Попади в Top 10",
      highlight: {
        unlocked: `Текущая позиция в leaderboard: #${position}.`,
        locked: "Подними points и streak, чтобы попасть в top 10.",
      },
    }),
    buildMetricAchievement({
      id: "reward-trail",
      category: "check-in",
      icon: "🎁",
      label: "Reward Trail",
      description: "Собери длинную историю начислений и onchain check-in.",
      progress: rewardEntries.length + checkInEvents.length,
      tiers: [3, 10, 30, 60],
      suffix: "",
      lockedMilestone: "3 rewards",
      highlight: {
        unlocked: `В ledger уже ${rewardEntries.length} записей о наградах.`,
        locked: "Первые награды появятся после check-in.",
      },
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
      achievement.category === "wallet"
        ? 120
        : achievement.category === "check-in"
          ? 110
          : achievement.category === "trading"
            ? 95
            : achievement.category === "community"
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
        userLevel: getUserLevel(profile.totalPoints),
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
  const normalizedWalletAddress = walletAddress
    ? (() => {
        try {
          return Address.parse(walletAddress).toString();
        } catch {
          return walletAddress;
        }
      })()
    : null;
  const profile = walletAddress
    ? (store.profiles[walletAddress] ??
      (normalizedWalletAddress
        ? (store.profiles[normalizedWalletAddress] ?? null)
        : null))
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
import { Address } from "@ton/core";
