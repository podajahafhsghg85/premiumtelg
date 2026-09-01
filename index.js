const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("Missing BOT_TOKEN or CHANNEL_ID environment variables.");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const waitingForPost = new Set();

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/*
  Converts:
    سلام [5764775314521593432]
  into Telegram HTML:
    سلام <tg-emoji emoji-id="5764775314521593432">🙂</tg-emoji>

  The fallback character is only used as the visible fallback by Telegram.
  The actual custom emoji is selected by emoji-id.
*/
function premiumize(input) {
  const re = /\[(\d{5,25})\]/g;
  let out = "";
  let last = 0;
  let match;

  while ((match = re.exec(input)) !== null) {
    out += escapeHtml(input.slice(last, match.index));
    out += `<tg-emoji emoji-id="${match[1]}">🙂</tg-emoji>`;
    last = match.index + match[0].length;
  }

  out += escapeHtml(input.slice(last));
  return out;
}

bot.start(async (ctx) => {
  await ctx.reply(
    "🤖 ربات آماده است.\n\nاز دکمه «📤 ارسال پست» استفاده کن و متن را بفرست.\n\nنمونه:\nسلام [5764775314521593432]",
    Markup.keyboard([["📤 ارسال پست"]]).resize()
  );
});

bot.hears("📤 ارسال پست", async (ctx) => {
  waitingForPost.add(ctx.from.id);
  await ctx.reply(
    "✍️ متن پست را بفرست.\n\nبرای ایموجی پریمیوم، ID را داخل براکت بگذار:\n[5764775314521593432]"
  );
});

bot.on("text", async (ctx) => {
  if (!waitingForPost.has(ctx.from.id)) return;

  waitingForPost.delete(ctx.from.id);

  const input = ctx.message.text;
  const html = premiumize(input);

  try {
    await ctx.telegram.sendMessage(CHANNEL_ID, html, {
      parse_mode: "HTML",
      disable_web_page_preview: false
    });

    await ctx.reply("✅ پست با موفقیت به کانال ارسال شد.");
  } catch (err) {
    console.error("Telegram sendMessage error:", err);
    await ctx.reply(
      "❌ ارسال نشد.\n\nموارد زیر را چک کن:\n" +
      "1) ربات داخل کانال ادمین باشد.\n" +
      "2) ربات اجازه ارسال پیام داشته باشد.\n" +
      "3) CHANNEL_ID درست باشد.\n" +
      "4) فرمت ID ایموجی مثل [1234567890123456789] باشد."
    );
  }
});

bot.catch((err) => console.error("Bot error:", err));

bot.launch().then(() => console.log("Bot started successfully."));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
