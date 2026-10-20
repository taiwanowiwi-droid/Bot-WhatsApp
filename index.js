const express = require("express");
const path = require("path");
const qrcode = require("qrcode-terminal");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let botStatus = "Belum terhubung";
let latestQR = false;
let sock;

const menu = {
  AI: [".AI", ".Gemini", ".GPT", ".DeepSeek", ".ResetAI"],
  ANIMANGA: [".Anime", ".Manga", ".MyAnimeList", ".JadwalAnime"],
  BOT: [".BotInfo", ".BotSettings", ".AutoRead", ".SetBotName", ".Stats"],
  DOWNLOADER: [".TikTok", ".Instagram", ".Facebook", ".PinterestDownloader", ".MediaFire"],
  FUN: [".Meme", ".Fact", ".Dadu", ".Ship", ".Roast"],
  GAME: [".TebakKata", ".TebakGambar", ".Math", ".TicTacToe", ".Leaderboard"],
  GENERAL: [".About", ".Help", ".Menu", ".Ping", ".Owner"],
  GROUP: [".Welcome", ".AntiLink", ".TagAll", ".GroupInfo", ".Promote", ".Demote"],
  TOOLS: [".Calculator", ".QR", ".Translate", ".Sticker", ".ShortURL"],
  YOUTUBE: [".YtSearch", ".YtMp3", ".YtMp4", ".YtMusic"]
};

function menuText() {
  let out = "╭─〔 SHIROINE BOT 〕\n│ Status: " + botStatus + "\n│ Prefix: .\n╰──────────\n";
  for (const [category, commands] of Object.entries(menu)) {
    out += `\n╭─〔 ${category} 〕\n`;
    out += commands.map(command => `│ ${command}`).join("\n");
    out += "\n╰──────────\n";
  }
  out += "\nCatatan: daftar menu adalah kerangka awal; setiap perintah perlu dibuat dan diuji sebelum berfungsi.";
  return out;
}

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Web Bot WhatsApp", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      latestQR = qr;
      botStatus = "Menunggu scan QR";
      console.log("\nScan QR ini dengan WhatsApp > Perangkat tertaut:\n");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      botStatus = "Terhubung";
      latestQR = false;
      console.log("WhatsApp bot terhubung.");
    }
    if (connection === "close") {
      botStatus = "Terputus";
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        setTimeout(() => startWhatsApp().catch(console.error), 3000);
      } else {
        console.log("Sesi keluar. Hapus folder auth_info lalu jalankan ulang untuk menautkan ulang.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe || msg.key.remoteJid === "status@broadcast") continue;
      const jid = msg.key.remoteJid;
      const body = getMessageText(msg.message).trim();
      if (!body.startsWith(".")) continue;

      const command = body.split(/\s+/)[0].toLowerCase();
      if (command === ".menu" || command === ".help") {
        await sock.sendMessage(jid, { text: menuText() }, { quoted: msg });
      } else if (command === ".ping") {
        await sock.sendMessage(jid, { text: "Pong! Bot aktif." }, { quoted: msg });
      } else if (command === ".botinfo") {
        await sock.sendMessage(jid, { text: "Web Bot WhatsApp v4.3.0\nStatus: " + botStatus }, { quoted: msg });
      }
    }
  });
}

function getMessageText(message) {
  const m = message.conversation
    || message.extendedTextMessage?.text
    || message.imageMessage?.caption
    || message.videoMessage?.caption;
  return typeof m === "string" ? m : "";
}

app.get("/api/status", (_req, res) => {
  res.json({ status: botStatus, qrAvailable: Boolean(latestQR) });
});
app.get("/api/menu", (_req, res) => res.json(menu));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => {
  console.log(`Dashboard berjalan di http://localhost:${PORT}`);
  startWhatsApp().catch(err => {
    botStatus = "Gagal mulai";
    console.error("Gagal menjalankan koneksi WhatsApp:", err);
  });
});
