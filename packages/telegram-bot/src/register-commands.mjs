const token = process.env.TELEGRAM_BOT_TOKEN;
const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL;

if (!token) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN");
}

if (!miniAppUrl) {
  throw new Error("Missing TELEGRAM_MINI_APP_URL");
}

const apiBase = `https://api.telegram.org/bot${token}`;

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

await call("setMyCommands", {
  commands: [
    { command: "start", description: "Launch STON Pulse Mini App" },
    { command: "app", description: "Open the Mini App button again" },
    { command: "swap", description: "Open swap and predictions" },
    { command: "profile", description: "Open your profile dashboard" },
    { command: "leaderboard", description: "Open season leaderboard" },
    { command: "checkin", description: "Open daily check-in" },
    { command: "community", description: "Open community feed" },
    { command: "help", description: "Show help" },
  ],
});

await call("setChatMenuButton", {
  menu_button: {
    type: "web_app",
    text: "Open STON Pulse",
    web_app: {
      url: miniAppUrl,
    },
  },
});

console.log("Telegram commands and menu button registered");
