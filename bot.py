async def back_handler(update: Update, context):
    query = update.callback_query
    await query.answer()
    keyboard = [
        [InlineKeyboardButton("📤 ارسال پست", callback_data="send_post")],
        [InlineKeyboardButton("➕ افزودن کانال", callback_data="add_channel")]
    ]
    await query.edit_message_text("منوی اصلی:", reply_markup=InlineKeyboardMarkup(keyboard))
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
        await update.message.reply_text("✅ پست با موفقیت به کانال ارسال شد!")
    except Exception as e:
        await update.message.reply_text(f"❌ خطا در ارسال: {e}\nمطمئن شو ربات ادمین کاناله و CHANNEL_ID درست تنظیم شده.")
    return ConversationHandler.END

async def cancel(update: Update, context):
    await update.message.reply_text("🚫 عملیات لغو شد.")
    return ConversationHandler.END

# ===== راه‌اندازی =====
def main():
    app = Application.builder().token(TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[CallbackQueryHandler(button_handler, pattern="^send_post$")],
        states={
            ASK_TEXT: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_text)]
        },
        fallbacks=[CommandHandler("cancel", cancel)]
    )
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(button_handler, pattern="^(send_post|add_channel)$"))
    app.add_handler(CallbackQueryHandler(back_handler, pattern="^back$"))
    app.add_handler(conv_handler)

    # ===== دیپلوی روی Railway =====
    if WEBHOOK_URL:
        app.run_webhook(
            listen="0.0.0.0",
            port=PORT,
            url_path=TOKEN,
            webhook_url=f"{WEBHOOK_URL}/{TOKEN}"
        )
    else:
        app.run_polling()

if __name__ == "__main__":
    main()
