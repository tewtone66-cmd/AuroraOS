# NEXT (بعد از v3.0.9)
همه‌ی آیتم‌های چت ۹ نوشته شدند ولی روی گوشی تست نشده‌اند. اگه بیلد خطا داد، متن خطا رو بفرست.

## v3.0.9 چی اضافه شد
- پنجره‌ی exe: کارت پیشرفت ۴ مرحله‌ای (Download runtime ← Install ← Setup ← Open window) با رویدادهای واقعی جاوا. «Download runtime» در واقع باز کردن runtime از داخل APK هست و فقط بار اول طول می‌کشه.
- فیکس جا موندن پنجره‌ی برنامه: بعد از exeStarted/launching/running، بعد از نمایش دوباره و بعد از برگشت از بکگراند rect دوباره فرستاده میشه (علت: جاوا قبل از ساخته شدن Activity بی‌صدا رد می‌کرد).
- اجرای .bat/.cmd توی ترمینال (دوبار لمس توی فایل‌منیجر) و دکمه‌ی Run توی ادیتور کد (.html .js .json .bat).

## محدودیت‌ها / کارهای مونده
- ترمینال: FOR /F /D /R، `%VAR:a=b%`، `!var!` (delayed expansion)، `start`، `&`/`&&`/`|` و اجرای exe از ترمینال پشتیبانی نمیشه. `pause` با Enter ادامه میده. Ctrl+C فقط با کیبورد فیزیکی.
- Run: فقط html/js/json/bat. python/java/kotlin و ... اجرا نمیشن. اسکریپت js داخل Worker اجرا میشه، پس document/window نداره (برای اون html بنویس). html داخل iframe سندباکس هست؛ حلقه‌ی بی‌نهایت توی html کل UI رو قفل می‌کنه.
- اگه پنجره‌ی برنامه هنوز جا می‌مونه، ویدیو بگیر یا بگو دقیقا کی (شروع برنامه، درگ، مینیمایز، برگشت از بکگراند).
- از قبل: ماوس Aurora داخل exe با عکس لحظه‌ی شروع ساخته میشه؛ پنجره‌ی exe وقتی زیر پنجره‌ی دیگه‌ست مخفی میشه (نه اینکه واقعا بینشون قرار بگیره). لاگ Wine پر از خطای d3d هست (گرافیک)، ربطی به لانچ نداره.


## Done in 3.0.10a
- PowerShell terminal + AuroraNet plugin (see DEV-NOTES).

## Todo after 3.0.10a
- 3.0.10b: full VS Code app (preinstalled, only in taskbar search, not on desktop).
- PS: Copy-Item/Move-Item to a new file name (needs a copy API in AuroraFilesPlugin), tab completion, .ps1 run from Files/Code, switch statement, Get-PSDrive.
- Found, not touched: none yet.
