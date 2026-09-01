# Telegram Premium Emoji Post Bot

این ربات بدون نیاز به اکانت Premium یا «توکن پریمیوم» کار می‌کند. تبدیل `[emoji_id]` به custom emoji با Bot API انجام می‌شود.

## متغیرهای Railway

- `BOT_TOKEN` = توکن ربات از BotFather
- `CHANNEL_ID` = آیدی کانال، ترجیحاً مثل `-1001234567890`

## راه‌اندازی

1. این پروژه را در GitHub قرار بده.
2. در Railway یک Project بساز و Deploy from GitHub Repo را انتخاب کن.
3. Variables بالا را اضافه کن.
4. Start Command:
   `npm start`
5. ربات را در کانال Admin کن و اجازه Post Messages بده.
6. ربات را در Private Chat باز کن و `/start` بزن.

## فرمت پست

مثلاً:

فروش ویژه 🔥
سرور پرسرعت [5764775314521593432]

هر `[عدد]` که ID یک custom emoji معتبر تلگرام باشد، به custom emoji تبدیل می‌شود.

نکته: اگر ID نامعتبر باشد یا ایموجی برای Telegram قابل استفاده نباشد، خود Telegram ممکن است آن را نمایش ندهد؛ ربات نمی‌تواند یک ID نامعتبر را معتبر کند.
