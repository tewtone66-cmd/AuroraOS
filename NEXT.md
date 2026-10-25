# NEXT (بعد از v3.0.11 Android/data)
روی گوشی تست نشده. اگه بیلد یا اجرا خطا داد، متن خطا رو بفرست.

## v3.0.11 چی اضافه شد
- فایل‌منیجر: Quick access جدید «Android data»، «Android obb»، «App data».
- Android 10 و پایین‌تر: Android/data مستقیم باز میشه. Android 11 و 12: یه بار «Grant access» (انتخاب پوشه و Use this folder). Android 13+: توی بیشتر گوشی‌ها SAF بسته‌ست؛ فقط root (یا بعدا Shizuku).
- با root: Android/data، obb و /data/data (پوشه‌ی برنامه‌ها) باز میشه، خوندن/نوشتن/کپی/حذف.

## کارهای مونده
- Shizuku (برای Android 13+ بدون root): نیاز به اضافه کردن کتابخونه‌ی Shizuku به gradle و provider توی Manifest از طریق scripts/patch-android.py.
- جستجو (search) و zip داخل Android/data و /data پشتیبانی نمیشه.
- کپی به/از این پوشه‌ها نوار پیشرفت نداره.
- با root، فایل‌های جدید داخل Android/data مالک پوشه‌ی والد میشن (chown)، ولی SELinux label دستی درست نمیشه.
- «Open with VS Code» از فایل‌منیجر هنوز وصل نیست (openApp('vscode',{path}) آماده‌ست).
- محدودیت‌های قبلی: VS Code بدون Extensions/Git/Debug؛ حذف توی VS Code دائمیه.

## بعد از v3.1.8
آیکن لانچر و اسپلش اندروید از assets/nexos-*.svg ساخته میشه (نیاز به بیلد کامل APK). appId همون com.auroraos.desktop موند تا آپدیت روی نصب قبلی انجام بشه.

## بعد از v3.2.0
روی گوشی تست نشده: درگ با لمس و ماوس مجازی، شورتکات، سطل. نشانگر resize فقط روی دسته‌های گوشه/راست/پایین پنجره هست (لبه‌ی چپ/بالا ندارن).

## بعد از v3.2.1
روی گوشی تست نشده: دسته‌های (handle) انتخاب مثل اندروید نداریم؛ فقط کشیدن بعد از نگه‌داشتن. محتوای مرورگر (WebView بومی) انتخاب خودش رو دارد.

## بعد از v3.2.2
فقط روی گوشی قابل تست: ظاهر Auto و حالت پنجره‌ای؛ اگه حالت پنجره‌ای هنوز بد بود PAGE_K یا آستانه ۰.۸۵ در cssWidth تنظیم شود. زوم ۱۰٪ یعنی عرض layout ≈ ۱۰۰۰۰px (سقف Chromium).

## بعد از v3.2.3
کاشی Network فعلاً فقط تنظیمات رو باز میکنه (صفحه‌ی Battery در بخش C میاد). روشنایی و صدا در فلای‌اوت نیست چون وب‌ویو کنترل سیستم نداره.

## بعد از v3.2.4
سلامت واقعی (درصد فرسودگی) از اندروید در دسترس برنامه‌ها نیست؛ فقط وضعیت Good/Overheated و ظرفیت تخمینی. برای نسخه‌ی بعدی ورژن را از یک ثابت مرکزی بخوانیم (الان چند جا دستی عوض میشه).

## بعد از v3.2.5
آیکن لانچر فقط بعد از build جدید APK دیده میشه. قفل شبیه‌ساز واقعی نیست. OOBE برای کاربران فعلی هم یک بار نشون داده میشه (Skip دارد).

## بعد از v3.2.6
Claude Code واقعی داخل شبیه‌ساز اجرا نمیشه (برنامه‌ی واقعی Node/ویندوز لازم داره): از Termux (pkg install nodejs; npm i -g @anthropic-ai/claude-code) استفاده شود. اگر خطای شبکه ادامه داشت، متن داخل پرانتز خطا را بفرست.

## Done in 3.2.7
- Exe: virtual mouse reaches Wine, Fill/Keep aspect, rAF rect sync. Only phone-testable. Not done: moving Wine into the main Activity (high risk), clipping the exe window behind other Aurora windows (currently it is hidden completely when another window is on top), cursor shapes other than the arrow inside Wine.

## Done in 3.2.8
- Winlator calls verified against source, real Fill/Keep toggle, Wine cursor shapes. Phone test pending. Still open: partial clip behind other windows, Wine inside the main Activity.

## Done in 3.2.9
- Clip behind windows (setting), cursor signature log. Phone test pending. Next: map cursor crcs from aurora-cursors.txt to NexOS shapes.

