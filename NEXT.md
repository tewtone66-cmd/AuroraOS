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
