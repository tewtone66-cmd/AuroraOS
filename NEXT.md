# NEXT (بعد از v3-p08)
انجام‌شده در p08: (1-بخشی) حرکت/تغییر اندازه‌ی پنجره‌ی exe بدون لگ (یک آپدیت در هر فریم)، (3) killStaleWine قبل از هر اجرا.
copyAppLogs از قبل در AuroraWinePlugin بود (لاگ‌ها → Download/aurora-app-logs).
انجام‌نشده (نیاز به خواندن بخش exe/wine در src/index.html ~522-616 و XServerDisplayActivity):
- 1: چسبیدن کامل پنجره (جدا از تسک/ریسنت: excludeFromRecents در منیفست، مخفی‌شدن با رفتن Aurora به پس‌زمینه)
- 2: صفحه‌ی نصب با نوار سبز + پنجره‌ی اطلاعات + آیکن هوم با لودینگ ماوس + حذف اپ «Windows PC»
- 4: اجرا در پس‌زمینه + صفحه‌ی آبی + خاموشی خودکار
- 5: نسخه 3.0.0 آلفا + بهینه‌سازی
- 6: پنهان‌کردن ماوس Wine و رسم ماوس Aurora داخل XServerDisplayActivity
