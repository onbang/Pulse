export const SUPPORTED_LANGUAGES = ["en", "ru"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export const LANGUAGE_STORAGE_KEY = "ston-pulse-language";

export const messages = {
  en: {
    "language.en": "EN",
    "language.ru": "RU",
    "header.communityLayer": "Community Layer",
    "header.language": "Language",
    "header.productHint": "Swap, pools, streaks, and community signal in one app.",
    "nav.overview": "Overview",
    "nav.swap": "Swap",
    "nav.pools": "Pools",
    "nav.liquidityProvide": "Liquidity provide",
    "nav.liquidityRefund": "Liquidity refund",
    "nav.vault": "Vault",
    "nav.stake": "Stake",
    "nav.profile": "Profile",
    "nav.checkIn": "Check-in",
    "nav.leaderboard": "Leaderboard",
    "nav.community": "Community",
    "swap.hero.eyebrow": "Live Trade Studio",
    "swap.hero.title": "Swap",
    "swap.hero.subtitle":
      "Execute swaps, read live routing context, and layer community conviction on top of every token pair.",
    "swap.hero.execution": "Execution",
    "swap.hero.executionTitle": "STON route intelligence",
    "swap.hero.executionBody":
      "Simulation and market context flow into every trade.",
    "swap.hero.community": "Community",
    "swap.hero.communityTitle": "Prediction layer",
    "swap.hero.communityBody":
      "Read conviction, place bets, and compare momentum live.",
    "swap.hero.precision": "Precision",
    "swap.hero.precisionTitle": "Ready to quote",
    "swap.hero.precisionLoading": "Refreshing route",
    "swap.hero.precisionBody":
      "Fine-tune slippage, routing, and timing before execution.",
    "swap.ticket.eyebrow": "Trade ticket",
    "swap.ticket.title": "Execute with confidence",
    "swap.ticket.mode": "Mode",
    "swap.ticket.modeValue": "Wallet-grade flow",
    "assetSelect.placeholder": "Select asset...",
    "assetSelect.search": "Search asset...",
    "assetSelect.empty": "No asset found.",
    "swap.form.offer": "You offer",
    "swap.form.ask": "You ask",
    "swap.button.connect": "Connect wallet to swap",
    "swap.button.selectAsset": "Select both assets",
    "swap.button.enterAmount": "Enter an amount",
    "swap.button.loading": "Calculating route...",
    "swap.button.invalid": "Invalid swap",
    "swap.button.submit": "Swap",
    "swap.button.sent": "Transaction sent to the network",
    "swap.referral.address": "Referral address:",
    "swap.referral.percent": "Referral percentage:",
    "swap.chart.previewTitle": "Pulse market",
    "swap.chart.previewDescription":
      "Choose any token to switch this preview into a token-specific live market chart.",
    "swap.chart.selectTokenTitle": "Choose a token first",
    "swap.chart.selectTokenDescription":
      "Pick a token to unlock the chart and activate interval controls.",
    "swap.chart.selectTokenEyebrow": "Token required",
    "swap.chart.selectTokenPrompt": "Select the token you want to track",
    "swap.chart.selectTokenBody":
      "Once you choose a token, the chart, price pulse, and timeframes will switch on for that asset.",
    "swap.chart.liveDescription":
      "Real-time styled market chart for the token you selected.",
    "swap.chart.liveValue": "Live {value}",
    "swap.chart.live": "Live",
    "swap.chart.preview": "Preview",
    "swap.chart.waiting": "Waiting for token selection",
    "swap.chart.forecastPulse": "Forecast pulse",
    "swap.chart.liveMode": "Live mode",
    "swap.chart.previewMode": "Preview mode",
    "swap.chart.candles": "Candles",
    "swap.chart.timeframe.1M": "Scalp mode",
    "swap.chart.timeframe.5M": "Live session",
    "swap.chart.timeframe.15M": "Momentum",
    "swap.chart.timeframe.1H": "Structure",
    "swap.chart.timeframe.4H": "Trend",
    "swap.chart.timeframe.1D": "Swing",
    "swap.chart.structureHigh": "Structure high",
    "swap.chart.structureLow": "Structure low",
    "swap.chart.routeImpact": "Route impact",
    "swap.chart.tradeLens": "Trade lens",
    "swap.chart.tradeLensTitle":
      "Read momentum before you place the next prediction",
    "swap.chart.tradeLensBodyLive":
      "Candles, live token price pulse, and community bias now sit in one market panel.",
    "swap.chart.tradeLensBodyPreview":
      "The market panel is always visible now, and it upgrades into a live token chart as soon as you choose one.",
    "swap.chart.upperBand": "Upper intraday band",
    "swap.chart.lowerBand": "Lower support zone",
    "swap.chart.impactLive": "Friction in the current quote path",
    "swap.chart.impactPreview": "Indicative impact until the token is selected",
    "swap.prediction.selectorEyebrow": "Prediction token",
    "swap.prediction.selectorTitle": "Choose a token for the forecast round",
    "swap.prediction.selectorBody":
      "If you have not selected a swap pair yet, you can still open a prediction round by choosing a token directly here.",
    "prediction.title": "Community price outlook",
    "prediction.subtitle":
      "Vote where the market moves next for {label}.",
    "prediction.roundStatus": "Round status",
    "prediction.timeLeft": "Time left",
    "prediction.winner": "Winner",
    "prediction.closed": "Closed",
    "prediction.pending": "Pending",
    "prediction.totalPool": "Total pool",
    "prediction.upOdds": "Up odds",
    "prediction.downOdds": "Down odds",
    "prediction.yourSide": "Your active side",
    "prediction.noPosition": "No position yet",
    "prediction.potentialPayout": "Potential payout",
    "prediction.potentialPreview":
      "Live preview based on the current pool split and your existing exposure.",
    "prediction.stakeAmount": "Stake amount",
    "prediction.stakePlaceholder": "Enter stake in points",
    "prediction.payoutHint":
      "Payout coefficient is calculated from the current stake pool on each side.",
    "prediction.bullish": "Bullish",
    "prediction.bearish": "Bearish",
    "prediction.settleTitle": "Settle closed round",
    "prediction.settleBody":
      "Lock in the winning side to publish payout previews.",
    "prediction.settleUp": "Settle Up",
    "prediction.settleDown": "Settle Down",
    "prediction.history": "Highest stakes history",
    "prediction.betsCount": "{count} bets",
    "prediction.noBets": "No bets yet for this pair.",
    "prediction.settled": "Settled",
    "prediction.awaitingSettlement": "Awaiting settlement",
    "prediction.up": "Up",
    "prediction.down": "Down",
    "prediction.pointsCommitted": "{amount} pts committed in this round.",
    "prediction.reputationHint":
      "Join the round to start earning prediction reputation.",
    "prediction.roundStatusOpen": "open",
    "prediction.roundStatusClosed": "closed",
    "prediction.roundStatusSettled": "settled",
    "prediction.openRoundEnded":
      "This round is no longer accepting new bets.",
    "prediction.connectToVote":
      "Connect your wallet to vote with your profile.",
    "prediction.validStakeHint":
      "Enter a valid stake amount above 0 to place a bet.",
    "prediction.latestSettlement": "Latest settlement snapshot",
    "prediction.lastResolvedView": "Last resolved view for {label}.",
    "prediction.upWon": "Up won",
    "prediction.downWon": "Down won",
    "prediction.settledAt": "Settled at",
    "prediction.totalRoundPool": "Total round pool",
    "prediction.winnersPreview": "Winners payout preview",
    "prediction.winnersCount": "{count} winners",
    "prediction.noWinningBets": "No winning bets in this round.",
    "prediction.stakeLine": "Stake {amount} pts",
    "prediction.disclaimer":
      "This is a sentiment widget, not financial advice. Open rounds accept bets, closed rounds await settlement, and settled rounds show payout previews.",
    "pools.hero.eyebrow": "Liquidity terminal",
    "pools.hero.title": "Discover the pools that matter right now.",
    "pools.hero.subtitle":
      "Scan the deepest routes, compare pair pricing, and save standout pools to your watchlist in a cleaner, readable discovery flow.",
    "pools.hero.coverage": "Coverage",
    "pools.hero.signal": "Signal",
    "pools.hero.goal": "Goal",
    "pools.hero.coverageValue": "Live",
    "pools.hero.signalValue": "Social",
    "pools.hero.goalValue": "Actionable",
    "pools.hero.coverageBody":
      "Built from current STON asset and pair data.",
    "pools.hero.signalBody":
      "Watchlist-ready with community-driven pool context.",
    "pools.hero.goalBody":
      "Move from discovery to providing liquidity in one flow.",
    "comments.title": "Pool comments",
    "comments.subtitle":
      "Leave a short note for liquidity providers. Max 200 characters.",
    "comments.placeholder":
      "Share context about spread, volatility, rewards, or strategy.",
    "comments.post": "Post comment",
    "comments.empty": "No comments yet for this pool.",
    "comments.connectHint":
      "Connect your wallet to post through your profile.",
    "comments.commentFor": "Comment for {label}",
    "comments.selectPoolFirst": "Select a pool first to unlock comments",
    "landing.hero.eyebrow": "Guided entry",
    "landing.hero.title": "Start with a clear path, not a wall of DeFi tools.",
    "landing.hero.subtitle":
      "STON Pulse helps you swap tokens, discover live pools, follow your streak, and use community signal without getting lost on the first screen.",
    "landing.hero.primaryCta": "Start with Swap",
    "landing.hero.secondaryCta": "Explore pools first",
    "landing.hero.card1.eyebrow": "What it is",
    "landing.hero.card1.title": "A cleaner entry into STON activity",
    "landing.hero.card1.body":
      "Use one interface for swaps, pool discovery, streak progress, and community-driven market context.",
    "landing.hero.card2.eyebrow": "How to begin",
    "landing.hero.card2.title": "Pick one simple path first",
    "landing.hero.card2.body":
      "Most users should start with Swap or Pools, then unlock profile, check-ins, and predictions after the wallet is connected.",
    "landing.path.eyebrow": "Main path",
    "landing.path.swap.title": "Swap with live quote context",
    "landing.path.swap.body":
      "Choose tokens, see the live quote, track the token chart, and swap with more confidence.",
    "landing.path.swap.cta": "Open Swap",
    "landing.path.pools.title": "Browse the pools that matter now",
    "landing.path.pools.body":
      "Scan live pools, compare liquidity depth, and move into LP actions once a pair looks interesting.",
    "landing.path.pools.cta": "Open Pools",
    "landing.path.profile.title": "Track your points and streak",
    "landing.path.profile.body":
      "Keep your daily momentum alive, collect achievements, and see how your profile grows over time.",
    "landing.path.profile.cta": "Open Profile",
    "landing.how.eyebrow": "How it works",
    "landing.how.title": "Use Pulse in three simple steps",
    "landing.how.step1.title": "Connect your wallet",
    "landing.how.step1.body":
      "Unlock profile actions, daily check-ins, social features, and live swap execution.",
    "landing.how.step2.title": "Choose one clear goal",
    "landing.how.step2.body":
      "Either swap a token, inspect pools, or build your streak. You do not need every screen at once.",
    "landing.how.step3.title": "Go deeper only when ready",
    "landing.how.step3.body":
      "Predictions, community comments, leaderboard, farming, and staking stay available as second-step tools.",
    "landing.explore.eyebrow": "More inside",
    "landing.explore.title": "Other sections you can open after the basics",
    "misc.neutralFlow": "Neutral flow",
  },
  ru: {
    "language.en": "EN",
    "language.ru": "RU",
    "header.communityLayer": "Комьюнити слой",
    "header.language": "Язык",
    "header.productHint": "Обмен, пулы, серия чек-инов и сигнал комьюнити в одном приложении.",
    "nav.overview": "Обзор",
    "nav.swap": "Обмен",
    "nav.pools": "Пулы",
    "nav.liquidityProvide": "Добавить ликвидность",
    "nav.liquidityRefund": "Вывод ликвидности",
    "nav.vault": "Фарминг",
    "nav.stake": "Стейкинг",
    "nav.profile": "Профиль",
    "nav.checkIn": "Чек-ин",
    "nav.leaderboard": "Рейтинг",
    "nav.community": "Комьюнити",
    "swap.hero.eyebrow": "Торговая студия",
    "swap.hero.title": "Обмен",
    "swap.hero.subtitle":
      "Совершай обмены, смотри рыночный контекст и оценивай настроение комьюнити по каждому токену.",
    "swap.hero.execution": "Исполнение",
    "swap.hero.executionTitle": "Маршруты STON",
    "swap.hero.executionBody":
      "Симуляция и рыночный контекст подставляются в каждую сделку.",
    "swap.hero.community": "Комьюнити",
    "swap.hero.communityTitle": "Слой прогнозов",
    "swap.hero.communityBody":
      "Смотри настроение рынка, делай ставки и сравнивай импульс.",
    "swap.hero.precision": "Точность",
    "swap.hero.precisionTitle": "Готово к расчету",
    "swap.hero.precisionLoading": "Обновляем маршрут",
    "swap.hero.precisionBody":
      "Настрой slippage, маршрут и тайминг до исполнения.",
    "swap.ticket.eyebrow": "Торговый тикет",
    "swap.ticket.title": "Обменивай уверенно",
    "swap.ticket.mode": "Режим",
    "swap.ticket.modeValue": "Режим кошелька",
    "assetSelect.placeholder": "Выбери токен...",
    "assetSelect.search": "Поиск токена...",
    "assetSelect.empty": "Токен не найден.",
    "swap.form.offer": "Ты отдаешь",
    "swap.form.ask": "Ты получаешь",
    "swap.button.connect": "Подключи кошелек для обмена",
    "swap.button.selectAsset": "Выбери оба токена",
    "swap.button.enterAmount": "Введи сумму",
    "swap.button.loading": "Считаем маршрут...",
    "swap.button.invalid": "Некорректный обмен",
    "swap.button.submit": "Обменять",
    "swap.button.sent": "Транзакция отправлена в сеть",
    "swap.referral.address": "Реферальный адрес:",
    "swap.referral.percent": "Реферальный процент:",
    "swap.chart.previewTitle": "Рынок Pulse",
    "swap.chart.previewDescription":
      "Выбери любой токен, чтобы превратить превью в живой график именно этого токена.",
    "swap.chart.selectTokenTitle": "Сначала выбери токен",
    "swap.chart.selectTokenDescription":
      "Выбери токен, чтобы открыть график и активировать интервалы.",
    "swap.chart.selectTokenEyebrow": "Нужен токен",
    "swap.chart.selectTokenPrompt": "Сначала выбери токен, который хочешь отслеживать",
    "swap.chart.selectTokenBody":
      "После выбора токена включатся график, ценовой импульс и интервалы именно для этого актива.",
    "swap.chart.liveDescription":
      "Живой график выбранного тобой токена.",
    "swap.chart.liveValue": "Live {value}",
    "swap.chart.live": "Live",
    "swap.chart.preview": "Превью",
    "swap.chart.waiting": "Ожидается выбор токена",
    "swap.chart.forecastPulse": "Импульс прогноза",
    "swap.chart.liveMode": "Живой режим",
    "swap.chart.previewMode": "Режим превью",
    "swap.chart.candles": "Свечи",
    "swap.chart.timeframe.1M": "Скальп",
    "swap.chart.timeframe.5M": "Живая сессия",
    "swap.chart.timeframe.15M": "Импульс",
    "swap.chart.timeframe.1H": "Структура",
    "swap.chart.timeframe.4H": "Тренд",
    "swap.chart.timeframe.1D": "Свинг",
    "swap.chart.structureHigh": "Верхняя зона",
    "swap.chart.structureLow": "Нижняя зона",
    "swap.chart.routeImpact": "Влияние маршрута",
    "swap.chart.tradeLens": "Рыночный фокус",
    "swap.chart.tradeLensTitle":
      "Смотри импульс перед тем, как делать следующий прогноз",
    "swap.chart.tradeLensBodyLive":
      "Свечи, живой ценовой импульс и настроение комьюнити теперь собраны в одной панели.",
    "swap.chart.tradeLensBodyPreview":
      "Панель рынка видна всегда и превращается в живой график сразу после выбора токена.",
    "swap.chart.upperBand": "Верхний внутридневной диапазон",
    "swap.chart.lowerBand": "Нижняя зона поддержки",
    "swap.chart.impactLive": "Текущее влияние по выбранному сценарию",
    "swap.chart.impactPreview": "Предварительное влияние до выбора токена",
    "swap.prediction.selectorEyebrow": "Токен прогноза",
    "swap.prediction.selectorTitle": "Выбери токен для раунда прогноза",
    "swap.prediction.selectorBody":
      "Если ты еще не выбрал пару в swap-форме, можно открыть раунд прогноза прямо отсюда, выбрав токен.",
    "prediction.title": "Прогноз движения цены",
    "prediction.subtitle":
      "Голосуй, куда двинется рынок для {label}.",
    "prediction.roundStatus": "Статус раунда",
    "prediction.timeLeft": "Осталось времени",
    "prediction.winner": "Победитель",
    "prediction.closed": "Закрыт",
    "prediction.pending": "Ожидается",
    "prediction.totalPool": "Общий пул",
    "prediction.upOdds": "Коэф. вверх",
    "prediction.downOdds": "Коэф. вниз",
    "prediction.yourSide": "Твоя активная сторона",
    "prediction.noPosition": "Позиции пока нет",
    "prediction.potentialPayout": "Потенциальная выплата",
    "prediction.potentialPreview":
      "Живой предпросмотр на основе текущего распределения пула и твоей позиции.",
    "prediction.stakeAmount": "Размер ставки",
    "prediction.stakePlaceholder": "Введи ставку в points",
    "prediction.payoutHint":
      "Коэффициент выплаты считается от текущего пула ставок по каждой стороне.",
    "prediction.bullish": "Вверх",
    "prediction.bearish": "Вниз",
    "prediction.settleTitle": "Завершить закрытый раунд",
    "prediction.settleBody":
      "Зафиксируй победившую сторону, чтобы показать выплаты.",
    "prediction.settleUp": "Зафиксировать вверх",
    "prediction.settleDown": "Зафиксировать вниз",
    "prediction.history": "История крупнейших ставок",
    "prediction.betsCount": "{count} ставок",
    "prediction.noBets": "Для этого сценария пока нет ставок.",
    "prediction.settled": "Завершен",
    "prediction.awaitingSettlement": "Ждет завершения",
    "prediction.up": "Вверх",
    "prediction.down": "Вниз",
    "prediction.pointsCommitted": "{amount} pts в этом раунде.",
    "prediction.reputationHint":
      "Войди в раунд, чтобы начать накапливать prediction reputation.",
    "prediction.roundStatusOpen": "открыт",
    "prediction.roundStatusClosed": "закрыт",
    "prediction.roundStatusSettled": "завершен",
    "prediction.openRoundEnded":
      "Этот раунд больше не принимает новые ставки.",
    "prediction.connectToVote":
      "Подключи кошелек, чтобы голосовать от своего профиля.",
    "prediction.validStakeHint":
      "Введи корректную ставку больше 0, чтобы сделать прогноз.",
    "prediction.latestSettlement": "Последний снимок завершения",
    "prediction.lastResolvedView": "Последний завершенный раунд для {label}.",
    "prediction.upWon": "Победило вверх",
    "prediction.downWon": "Победило вниз",
    "prediction.settledAt": "Завершено в",
    "prediction.totalRoundPool": "Общий пул раунда",
    "prediction.winnersPreview": "Предпросмотр выплат победителям",
    "prediction.winnersCount": "{count} победителей",
    "prediction.noWinningBets": "В этом раунде нет выигравших ставок.",
    "prediction.stakeLine": "Ставка {amount} pts",
    "prediction.disclaimer":
      "Это виджет рыночного настроения, а не финансовый совет. Открытые раунды принимают ставки, закрытые ждут завершения, а завершенные показывают выплаты.",
    "pools.hero.eyebrow": "Терминал ликвидности",
    "pools.hero.title": "Открой важные пулы прямо сейчас.",
    "pools.hero.subtitle":
      "Смотри глубину, сравнивай пары и сохраняй сильные пулы в watchlist в более понятном режиме исследования.",
    "pools.hero.coverage": "Покрытие",
    "pools.hero.signal": "Сигнал",
    "pools.hero.goal": "Цель",
    "pools.hero.coverageValue": "Live",
    "pools.hero.signalValue": "Социальный",
    "pools.hero.goalValue": "Практичный",
    "pools.hero.coverageBody":
      "Построено на актуальных STON asset и pair данных.",
    "pools.hero.signalBody":
      "Готово для watchlist и community-driven анализа.",
    "pools.hero.goalBody":
      "Переходи от discovery к добавлению ликвидности в один поток.",
    "comments.title": "Комментарии к пулу",
    "comments.subtitle":
      "Оставь короткую заметку для поставщиков ликвидности. До 200 символов.",
    "comments.placeholder":
      "Поделись контекстом по спреду, волатильности, наградам или стратегии.",
    "comments.post": "Опубликовать",
    "comments.empty": "Для этого пула пока нет комментариев.",
    "comments.connectHint":
      "Подключи кошелек, чтобы публиковать комментарии от своего профиля.",
    "comments.commentFor": "Комментарий для {label}",
    "comments.selectPoolFirst": "Сначала выбери пул, чтобы открыть комментарии",
    "landing.hero.eyebrow": "Понятный старт",
    "landing.hero.title": "Начни с понятного сценария, а не с перегруженного DeFi-экрана.",
    "landing.hero.subtitle":
      "STON Pulse помогает обменивать токены, изучать пулы, держать серию чек-инов и использовать сигнал комьюнити без ощущения, что тебя сразу бросили в сложный интерфейс.",
    "landing.hero.primaryCta": "Начать с обмена",
    "landing.hero.secondaryCta": "Сначала посмотреть пулы",
    "landing.hero.card1.eyebrow": "Что это",
    "landing.hero.card1.title": "Более понятный вход в экосистему STON",
    "landing.hero.card1.body":
      "Одно приложение для обмена, поиска пулов, прогресса профиля и рыночного контекста от комьюнити.",
    "landing.hero.card2.eyebrow": "С чего начать",
    "landing.hero.card2.title": "Сначала выбери один простой путь",
    "landing.hero.card2.body":
      "Большинству пользователей лучше начать с Обмена или Пулов, а уже потом подключать профиль, чек-ины и прогнозы.",
    "landing.path.eyebrow": "Основной сценарий",
    "landing.path.swap.title": "Обменивай с живой котировкой и контекстом",
    "landing.path.swap.body":
      "Выбери токены, посмотри live quote, оцени график токена и соверши обмен спокойнее и понятнее.",
    "landing.path.swap.cta": "Открыть обмен",
    "landing.path.pools.title": "Смотри пулы, которые важны прямо сейчас",
    "landing.path.pools.body":
      "Проверяй актуальные пулы, глубину ликвидности и переходи к LP-действиям только когда пара действительно интересна.",
    "landing.path.pools.cta": "Открыть пулы",
    "landing.path.profile.title": "Следи за points и своей серией",
    "landing.path.profile.body":
      "Сохраняй ежедневный ритм, открывай достижения и смотри, как растет твой профиль.",
    "landing.path.profile.cta": "Открыть профиль",
    "landing.how.eyebrow": "Как пользоваться",
    "landing.how.title": "Используй Pulse в три простых шага",
    "landing.how.step1.title": "Подключи кошелек",
    "landing.how.step1.body":
      "После этого откроются действия профиля, ежедневный чек-ин, социальные функции и живой обмен.",
    "landing.how.step2.title": "Выбери одну цель",
    "landing.how.step2.body":
      "Либо обменять токен, либо посмотреть пулы, либо прокачать серию. Не нужно осваивать все экраны сразу.",
    "landing.how.step3.title": "Углубляйся потом",
    "landing.how.step3.body":
      "Прогнозы, комментарии, рейтинг, фарминг и стейкинг остаются вторым уровнем, когда базовый путь уже понятен.",
    "landing.explore.eyebrow": "Еще внутри",
    "landing.explore.title": "Другие разделы, которые можно открыть после базы",
    "misc.neutralFlow": "Нейтральный импульс",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

export function translate(
  language: AppLanguage,
  key: string,
  variables?: Record<string, string | number>,
) {
  const localeMessages = messages[language] as Record<string, string>;
  const fallbackMessages = messages[DEFAULT_LANGUAGE] as Record<string, string>;
  const template =
    localeMessages[key] ?? fallbackMessages[key] ?? key;

  if (!variables) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = variables[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}
