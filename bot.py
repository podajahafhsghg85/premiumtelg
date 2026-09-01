import os
import re
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, MessageEntity
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ConversationHandler

# ===== تنـظیمات =====
TOKEN = os.environ.get("BOT_TOKEN")
CHANNEL_ID = os.environ.get("CHANNEL_ID")
PORT = int(os.environ.get("PORT", 8443))
WEBHOOK_URL = os.environ.get("WEBHOOK_URL")

ASK_TEXT = 1
logging.basicConfig(level=logging.INFO)

# ===== تابع تبدیـل [id] به Entity =====
def build_entities(text):
    pattern = re.compile(r'\[(\d+)\]')
    entities = []
    clean_text = text
    offset_correction = 0
    for match in pattern.finditer(text):
        start = match.start() - offset_correction
        end = match.end() - offset_correction
        emoji_id = match.group(1)
        entities.append(
            MessageEntity(
                type=MessageEntity.CUSTOM_EMOJI,
                offset=start,
                length=0,
                custom_emoji_id=emoji_id
            )
        )
        offset_correction += len(match.group(0))
    clean_text = re.sub(r'\[\d+\]', '', text)
    return clean_text, entities

# ===== هندلرها =====
async def start(update: Update, context):
    keyboard = [
        [InlineKeyboardButton("📤 ارسال پسـت", callback_data="send_post")],
        [InlineKeyboardButton("➕ افزودن کانال", callback_data="add_channel")]
    ]
    await update.message.reply_text(
        "👋 به ربات پسـت‌رسان خوش اومدی!\n"
        "برای ارسال پسـت، دکمـه‌ی «ارسال پسـت» رو بزن و متن رو با [id] بفرسـت.\n"
        "مثال: سلام [5764775314521593432] به کانال خوش آمدید",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def button_handler(update: Update, context):
    query = update.callback_query
    await query.answer()
    if query.data == "send_post":
        await query.edit_message_text("✏️ متن پست رو ارسال کن (با [id]):")
        return ASK_TEXT
    elif query.data == "add_channel":
        await query.edit_message_text(
            "🔹 برای افزودن ربات به کانال:\n"
            "1. مدیریت کانال ← افزودن ادمیـن\n"
            "2. ربات رو انتـخاب کن\n"
            "3. دسترسـی ارسال پیام رو فعال کن\n"
            "4. آیدی عددی کانال رو در متـغیر CHANNEL_ID بذار",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 برگشـت", callback_data="back")]])
        )
        return ConversationHandler.END

async def back_handler(update: Update, context):
    query = update.callback_query
    await query.answer()
    keyboard = [
        [InlineKeyboardButton("📤 ارسال پسـت", callback_data="send_post")],
        [InlineKeyboardButton("➕ افزودن کانال", callback_data="add_channel")]
    ]
    await query.edit_message_text("منوی اصلـی:", reply_markup=InlineKeyboardMarkup(keyboard))
    return ConversationHandler.END

async def receive_text(update: Update, context):
    text = update.message.text
    clean_text, entities = build_entities(text)
    try:
        await context.bot.send_message(
            chat_id=CHANNEL_ID,
            text=clean_text,
            entities=entities
        )
        await update.message.reply_text("✅ پست با موفقـیت ارسال شد!")
    except Exception as e:
        await update.message.reply_text(f"❌ خطا: {e}\nبررسی کن ربات ادمیـن کاناله و CHANNEL_ID درستـه.")
    return ConversationHandler.END

async def cancel(update: Update, context):
    await update.message.reply_text("🚫 لغو شد.")
    return ConversationHandler.END

# ===== راه‌اندازی =====
def main():
    if not TOKEN or not CHANNEL_ID:
        raise ValueError("BOT_TOKEN و CHANNEL_ID باید در محـیط تنـظیم شوند.")
    
    app = Application.builder().token(TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[CallbackQueryHandler(button_handler, pattern="^send_post$")],
        states={ASK_TEXT: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_text
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(button_handler, pattern="^(send_post|add_channel)$"))
    app.add_handler(CallbackQueryHandler(back_handler, pattern="^back$"))
    app.add_handler(conv_handler)

    if WEBHOOK_URL:
        app.run_webhook(listen="0.0.0.0", port=PORT, url_path=TOKEN, webhook_url=f"{WEBHOOK_URL}/{TOKEN}")
    else:
        app.run_polling()

if name == "main":
    main()
