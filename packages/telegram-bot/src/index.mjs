const token = process.env.TELEGRAM_BOT_TOKEN;
const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL;
const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "your_bot";

if (!token) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN");
}

if (!miniAppUrl) {
  throw new Error("Missing TELEGRAM_MINI_APP_URL");
}

const apiBase = `https://api.telegram.org/bot${token}`;
const startParams = {
  home: "ston-pulse",
  swap: "swap",
  profile: "profile",
  community: "community",
  leaderboard: "leaderboard",
  checkIn: "check-in",
};

async function call(method, body) {
  const response = await fetch(`${apiBase}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`${method} failed: ${JSON.stringify(data)}`);
  }

  return data.result;
}

function buildMiniAppUrl(startParam = startParams.home) {
  return `https://t.me/${botUsername}?startapp=${encodeURIComponent(startParam)}`;
}

function buildLaunchKeyboard(_startParam = startParams.home) {
  return {
    inline_keyboard: [
      [
        {
          text: "Open STON Pulse Mini App",
          web_app: { url: miniAppUrl },
        },
      ],
      [
        { text: "Swap", url: buildMiniAppUrl(startParams.swap) },
        { text: "Profile", url: buildMiniAppUrl(startParams.profile) },
      ],
      [
        { text: "Leaderboard", url: buildMiniAppUrl(startParams.leaderboard) },
        { text: "Check-in", url: buildMiniAppUrl(startParams.checkIn) },
      ],
    ],
  };
}

async function sendLaunchMessage(chatId, title, startParam = startParams.home) {
  await call("sendMessage", {
    chat_id: chatId,
    text: title,
    reply_markup: buildLaunchKeyboard(startParam),
  });
}

async function handleUpdate(update) {
  const message = update.message;
  const text = message?.text?.trim();

  if (!message?.chat?.id || !text) {
    return;
  }

  if (text === "/start" || text === "/app") {
    await sendLaunchMessage(
      message.chat.id,
      "Open STON Pulse inside Telegram to access swaps, profile, check-ins, liquidity comments, and community prediction bets.",
      startParams.home,
    );
    return;
  }

  if (text === "/swap") {
    await sendLaunchMessage(
      message.chat.id,
      "Jump straight into the Swap desk and community prediction flow.",
      startParams.swap,
    );
    return;
  }

  if (text === "/profile") {
    await sendLaunchMessage(
      message.chat.id,
      "Open your profile hub with achievements, level progress, and notification center.",
      startParams.profile,
    );
    return;
  }

  if (text === "/leaderboard") {
    await sendLaunchMessage(
      message.chat.id,
      "Open the season leaderboard and see who leads STON Pulse right now.",
      startParams.leaderboard,
    );
    return;
  }

  if (text === "/checkin") {
    await sendLaunchMessage(
      message.chat.id,
      "Claim daily momentum and keep your streak alive inside the Mini App.",
      startParams.checkIn,
    );
    return;
  }

  if (text === "/community") {
    await sendLaunchMessage(
      message.chat.id,
      "Drop into the live community feed, reactions, and watched pool activity.",
      startParams.community,
    );
    return;
  }

  if (text === "/help") {
    await call("sendMessage", {
      chat_id: message.chat.id,
      text: [
        "Commands:",
        "/start - launch the Mini App",
        "/app - open the Mini App button again",
        "/swap - open swap and predictions",
        "/profile - open your profile dashboard",
        "/leaderboard - open leaderboard",
        "/checkin - open daily check-in",
        "/community - open community feed",
        "/help - show this help",
        "",
        `Main link: ${buildMiniAppUrl(startParams.home)}`,
        `Profile link: ${buildMiniAppUrl(startParams.profile)}`,
      ].join("\n"),
    });
  }
}

async function main() {
  let offset = 0;

  await call("setMyDescription", {
    description:
      "STON Pulse Mini App: swaps, profile, check-ins, liquidity comments, and community prediction bets.",
  });

  console.log("Telegram bot polling started");

  while (true) {
    try {
      const updates = await call("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message"],
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (error) {
      console.error("Polling error", error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

main();
