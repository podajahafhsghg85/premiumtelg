const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;

// CHANNELS format:
// Name=-1001234567890,Another Channel=-1009876543210
const CHANNELS = parseChannels(process.env.CHANNELS || "");

function parseChannels(value) {
  return value.split(",").map(x => x.trim()).filter(Boolean).map(item => {
    const i = item.lastIndexOf("=");
    if (i <= 0) throw new Error("Invalid CHANNELS format: " + item);
    return { name: item.slice(0, i).trim(), id: item.slice(i + 1).trim() };
  });
}

if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN.");
  process.exit(1);
}
if (!CHANNELS.length) {
  console.error("Missing CHANNELS. Example: فروش=-1001234567890,پشتیبانی=-1009876543210");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const sessions = new Map();

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function premiumize(input) {
  const re = /\[(\d{5,25})\]/g;
  let out = "", last = 0, match;
  while ((match = re.exec(input)) !== null) {
    out += escapeHtml(input.slice(last, match.index));
    out += `<tg-emoji emoji-id="${match[1]}">🙂</tg-emoji>`;
    last = match.index + match[0].length;
  }
  return out + escapeHtml(input.slice(last));
}

function channelKeyboard() {
  return Markup.inlineKeyboard(
    CHANNELS.map((c, i) => [Markup.button.callback(`📢 ${c.name}`, `channel:${i}`)])
  );
}

bot.start(async ctx => {
  await ctx.reply(
    "🤖 آماده‌ام!\n\nبرای ارسال پست روی «📤 ارسال پست» بزن.",
    Markup.keyboard([["📤 ارسال پست"]]).resize()
  );
});

bot.hears("📤 ارسال پست", async ctx => {
  sessions.set(ctx.from.id, { step: "channel" });
  await ctx.reply("📢 پست رو در کدوم کانال می‌خوای ارسال کنم؟", channelKeyboard());
});

bot.action(/^channel:(\d+)$/, async ctx => {
  const index = Number(ctx.match[1]);
  const channel = CHANNELS[index];
  if (!channel) return ctx.answerCbQuery("کانال پیدا نشد.");

  sessions.set(ctx.from.id, { step: "text", channelIndex: index });
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `✅ کانال انتخاب شد: ${channel.name}\n\n✍️ حالا متن پست رو بفرست.\n\nمثال:\n🔥 فروش ویژه\nکانفیگ پرسرعت [5764775314521593432]`
  );
});

bot.on("text", async ctx => {
  const userId = ctx.from.id;
  const session = sessions.get(userId);
  if (!session || session.step !== "text") return;

  const channel = CHANNELS[session.channelIndex];
  sessions.delete(userId);

  try {
    const html = premiumize(ctx.message.text);
    await ctx.telegram.sendMessage(channel.id, html, {
      parse_mode: "HTML",
      disable_web_page_preview: false
    });

    await ctx.reply(`✅ پست با موفقیت در «${channel.name}» ارسال شد.`);
  } catch (err) {
    console.error(err);
    await ctx.reply(
      `❌ ارسال به «${channel.name}» انجام نشد.\n\n` +
      `مطمئن شو ربات در کانال ادمین است و اجازه ارسال پیام دارد و CHANNELS درست تنظیم شده است.`
    );
  }
});

bot.catch(err => console.error("Bot error:", err));

bot.launch().then(() => console.log("Multi-channel bot started."));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
