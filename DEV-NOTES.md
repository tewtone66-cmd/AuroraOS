# DEV-NOTES (src/index.html، شماره‌ی خط‌ها تقریبی)

- ~4-146 CSS (۹۷ motion، ۵۲ browser، ۶۵ explorer، ۸۵ photos/notepad)
- ~156 setViewport + AuroraBusy (v3-p01) | ~163 A (لیست اپ‌ها) | ~172 PIN | ~183 S (تنظیمات: ui مقیاس، sp سرعت موس)
- مدیر پنجره: W(189)، openApp(205)، drag(204)، updateFs(220)، fitWins(221)، minW(222)، showW(223)، focusW(224)، closeW(225)
- تسک‌بار/داک: dockUpdate(227)، dockFx(272)، buildIcons(233)، clock(282)
- منو: closeMenus(202)، ctx(203)، buildUI(263)
- ماوس مجازی: VM(285)، vmSet(294)، ev(296)، vclick(307)، pDown/pMove/pUp(317-322)
- مرورگر ~345-394 | فایل‌ها ~395-463 | Notepad ~464 | Photos ~484 | Media ~497 | Calc ~504
- تنظیمات: appSet(514) (کلیک دکمه‌ها خط ~516-518؛ مقیاس data-ui) | About(520) | exe/wine ~522-616
- بومی: android-src/*.java (AuroraBrowserPlugin، AuroraWinePlugin، AuroraFilesPlugin...)

- v3-p02: لوگو/آیکن‌ها در assets/*.svg (+ scripts/make-icons.mjs)؛ آیکن اپ‌ها: IC/A.g؛ بکگراندها: WALL (SVG data-URI)؛ لودینگ: #boot (ابتدای body)؛ خاموشی: #shut + دکمه‌ی #off

- v3-p05: بازنویسی مدیا و فایل‌منیجر؛ Photos/Media: CSS `.stage img/video` با object-fit:contain (نسبت ۹:۱۶ و ...)
  appCode (ادیتور کد + hl/hlx هایلایت)، appZip (آرشیو)، appMusic + MU (پلیر جدا) + #np/#npc (نشانگر کنار داک)
  فایل‌منیجر: E.sr (نتایج سرچ سراسری، NF.search)، پیشرفت کپی/انتقال (.fpg، رویداد fprog)، نمای d/l/i
  بومی: AuroraFilesPlugin → search، zipList/zipExtract/zipCreate، cancel، درایوهای مجازی D/E (AuroraOS/D و /E)

- v3-p06: مرورگر: مقیاس صفحه دیگه با setInitialScale نیست؛ جاوا (AuroraBrowserPlugin: cssWidth/vpScript/applyZoom) عرض viewport رو = عرض پنجره / (PAGE_K × زوم) اجبار می‌کنه (PAGE_K=1.4 ثابت کلاس جاوا). زوم: اسلایدر `.bz` + چیپ `.bzc` کنار آدرس + Ctrl +/-/0 (ZL پله‌ها)
  فول‌اسکرین: آیکن‌های SVG نوار عنوان (WI)، دکمه‌ی `.fsd` برای نمایش موقت داک (fsPeek، کلاس body.peek، ۴.۵ثانیه)

- v3-p07: ماشین‌حساب از نو (appCalc: تاریخچه، ripple، کیبورد، CSS `.cc*`)؛ ترمینال appTerm (دستورات روی NF، مسیر C:\ = ریشه‌ی NF.roots()[0])؛ تسک‌منیجر appTask (`taskmgr`، Ctrl+Shift+Esc، گراف CPU/RAM)؛ بومی: AuroraFilesPlugin.sysInfo (رم سیستم، PSS، زمان CPU پروسه)

- v3.0.1 (perf): drag()/dockFx با rAF (یک حرکت در هر فریم)؛ کلاس body.pdrag هنگام درگ سایه/بلور رو خاموش می‌کنه؛ حالت کارایی: S.perf، setPerf()، کلاس body.perf، کلید aur.perf، تنظیمات ← تسک‌بار؛ CSS با کامنت PERF-3.0.1 ته استایل

- v3.0.2 (drag): درگ آیکن‌های دسکتاپ از نو (IIFE با کامنت DND-3.0.2: آستانه ۵px، ghost با rAF، هایلایت مقصد .dt، رها کردن سایت روی Recycle Bin = حذف، Esc = لغو)؛ hold-to-drag: S.hd از [100,300,500,700,1000] با پیش‌فرض 300 و کلید aur.hd3؛ سرعت ماوس مجازی هنگام درگ دیگه 1x نیست (pMove)؛ درگ فایل‌منیجر (خط ~738) دست نخورده

- v3.0.3 (mouse/typing): علت باگ تایپ: رویدادهای ماوسِ خودکارِ لمس روی #pad فوکوس input رو می‌پروندن (فقط با نگه‌داشتن تایپ می‌شد)؛ حالا pad روی pointerdown/mousedown/touchstart preventDefault می‌کنه. kbShow() + focusin سراسری کیبورد رو نشون میده و فوکوس رو بعد ۶۰ و ۲۰۰ms برمی‌گردونه؛ تایپ وقتی استارت بازه به #sq میره. شکل جدید فلش و دست داخل #cur (پیش‌نمایش ستینگ از همونا کلون میشه). گزینه‌های جدید: S.rp (ripple کلیک)، S.kb (کیبورد خودکار)

- v3.0.4 (browser size): علت سایز غلط: عرض صفحه = عرض پنجره / (1.4 × زوم) ثابت بود، پس صفحه‌ها خیلی بزرگ و موبایلی می‌شدن. حالا AuroraBrowserPlugin.cssWidth = عرض پنجره × refW / (innerWidth × زوم): پنجره‌ی تمام‌عرض مثل مانیتور refW پیکسلی (پیش‌فرض 1280) چیده میشه. refW از S.pw (ستینگ ← Browser ← Page size، کلید aur.pw) میاد و با NB.show/create (پارامتر ref) به جاوا میره؛ کلید کش sync شامل S.pw شد. PAGE_K فقط fallback قدیمیه

- v3.0.5 (desktop): علت باگ انتخاب بکگراند (اگه هنوز بود): استایل ریبرند `.wall,#desk{background-image:var(--nx-wall)!important}` همیشه یه عکس رو اجبار می‌کرد و حلقه‌ی fix همه‌ی WALLهای عکسی رو با همون یه عکس عوض می‌کرد؛ هر دو حذف شد. ۸ بکگراند جدید (SVG سبک بدون blur) توی بلوک اسکریپت NEXOS با کامنت DESK-3.0.5 با WALL.splice جایگزین WALL شدن. آیکن Browser به DESK اضافه شد. سطل: دکمه‌ی Select all، Ctrl+A/Delete/Enter، و بج شمارنده روی آیکن دسکتاپ (trBadge که buildIcons رو wrap می‌کنه)

- v3.0.6 (taskbar): اسکریپت جدا با کامنت TB-3.0.6 قبل از NEXOS-END: سینی سیستم #tray (آیکن شبکه با navigator.connection، باتری با getBattery) + فلای‌اوت #trf (باتری، شبکه، حالت کارایی، تم)؛ پیش‌نمایش پنجره‌ها #tbpv (cloneNode پنجره با scale، هر ۱.۵ثانیه رفرش، با ۳۸۰ms مکث روی آیکن)؛ applyTb و closeMenus wrap شدن؛ تنظیمات: S.tbr شکل (pill/round/square)، S.tbw چیدمان (float/full)، S.tba تراز، S.tbt سینی، S.tbv پیش‌نمایش. کلاس‌های بدنه: tb-round tb-square tb-full tb-left no-tray

- v3.0.7 (music): اسکریپت جدا با کامنت MUSIC-3.0.7 قبل از NEXOS-END توابع appMusic/npInit/muUI/npPlace رو override می‌کنه (A.music.f الان arrow به appMusic هست تا override دیده بشه). ویجت #mnp داخل #dock (قبل از #tray) و کارت #mnpc بالای دَک؛ کلاس ریشه‌ی پلیر `.mz` (نه `.mp` که مال Photos هست)؛ کلاس‌های `.sl i` و `.a/.b/.t0/.t1/.meq i` عمدا حفظ شدن چون listenerهای timeupdate/muBars قدیمی بهشون وابسته‌ان. باگ‌های رفع‌شده: آیکن‌های shuffle/repeat به خاطر CSS پر می‌شدن؛ بستن پنجره موزیک رو متوقف می‌کرد (حالا ادامه میده، توقف با دکمه‌ی Stop)؛ ویجت fixed بود و روی دَک می‌افتاد. جدید: تب Queue/Library با اسکن /Music و /Download، میانبرهای کیبورد (Space، فلش‌ها، N/P)، آیکن و گرادیان جدید

- v3.0.8 (start/search/power): اسکریپت جدا با کامنت START-3.0.8 قبل از NEXOS-END. استارت: عرض 560، Pinned + Recent (کلید aur.recent، openApp wrap شده)، فوتر با دکمه‌ی پاور #pwb و منوی #pwm (Lock/Sleep/Restart/Shut down)؛ #rst و #off قدیمی مخفی موندن چون startInit بهشون bind کرده. سرچ: q.oninput/onkeydown دوباره ست شدن (startSearch قدیمی دیگه استفاده نمیشه)، بخش‌های Best match/Apps/Settings/Actions/Files/Web، چیپ‌های فیلتر .sflt، فایل‌ها با NF.search(path:'') و debounce، ناوبری با فلش و Enter و Esc. #lck قفل‌صفحه و #slp خواب (با لمس/کلید بیدار میشن). دکمه‌ی سرچ #srchBtn کنار استارت، راست‌کلیک/نگه‌داشتن روی استارت = منوی power-user. توابع جهانی: doLock، doSleep، openSearch

- v3.0.9 part 1 (exe launch): کامنت EXE-3.0.9 (CSS ته استایل + داخل appExe). پنجره‌ی exe یه کارت پیشرفت ۴ مرحله‌ای داره (`w.exeStep(i,text,frac)`: 0 Download runtime، 1 Install، 2 Setup، 3/4 Open window؛ `w.exeSub(text)`). مراحل از رویدادهای واقعی جاوا میان: progress{rootfs|container}، exeState{preparing|launching|running|error}، و بعد از resolve شدن runExe. علت «چسبیدن/جا موندن پنجره‌ی برنامه»: setExeRect جاوا وقتی هنوز Activity ساخته نشده بی‌صدا رد می‌شد ولی کش `last` توی appExe فکر می‌کرد ارسال شده؛ حالا `w.forcePush()` بعد از exeStarted/launching/running (۰، ۴۰۰، ۱۲۰۰ms با `exePushSoon`)، بعد از نمایش دوباره‌ی پنجره و بعد از appResumed کش رو پاک می‌کنه و rect رو دوباره می‌فرسته. تاخیر sched از 60 به 16ms.

- v3.0.9 part 2 (bat + code run): ترمینال appTerm(w,arg): `arg.bat` = مسیر فایل .bat که خودکار اجرا میشه (File Explorer، سرچ و Downloads روی .bat/.cmd میرن به `openApp('term',{bat:path})`). مفسر batch با کامنت BAT-3.0.9 قبل از `const HELP`: mkFr/expand (%VAR% %1 %* %~dp0 %CD% %DATE% %RANDOM% %ERRORLEVEL%)، batLine/execBat (صف `fr.inj` برای بلاک‌های ( ) و FOR)، doIf (== equ neq lss leq gtr geq exist defined errorlevel not /i)، doFor (FOR و FOR /L؛ /F /D /R نه)، set /a با پارسر عددی (بدون eval)، set /p، pause، timeout، goto/call :label/exit /b، title، ENV مشترک بین دستورها. Ctrl+C = توقف (`stopBat`)، سقف ۵۰۰۰۰ قدم. اسم فایل .bat/.cmd بدون پسوند هم توی ترمینال اجرا میشه (default سوییچ run). ادیتور کد: دکمه‌ی Run و F5/Ctrl+Enter (runIt): .html پیش‌نمایش iframe سندباکس، .js توی Web Worker با console.log و دکمه‌ی Stop، .json اعتبارسنجی، .bat/.cmd توی ترمینال؛ بقیه‌ی زبان‌ها پیام «پشتیبانی نمیشه». CSS با کامنت CODE-3.0.9.

## 3.0.10a - PowerShell terminal (PS-3.0.10a)
- appTerm (src/index.html): block `/* PS-3.0.10a ... */` sits between the BAT interpreter and `const HELP`.
- State `PSM` (declared next to `prompt`): on / nested / vars / funcs. `run()` calls `psRun` when PSM.on, else `psCmdMode` (powershell/pwsh + ping/ipconfig/nslookup/curl/whoami/hostname/systeminfo).
- Engine: psParts/psSplit (statements) -> psStmt (if/foreach/for/while/do/try/function/assign) -> psPipe/psStage/psCmd -> PSCMD[cmdlet]. Expressions: psExpr (psOr..psPrimary). Output: psFmtOut (table/list/dir listing).
- Cmdlets live in `const PSCMD`; aliases in `PSALIAS`; app names for Start-Process in `PSAPPS`.
- Network: android-src/AuroraNetPlugin.java (http, ping[TCP probe], tcp, dns, netinfo) registered in MainActivity; JS `psNetCall`.
- Terminal opens as PowerShell; `cmd` switches to Command Prompt, `powershell` goes back. Batch launches stay in cmd.

## 3.0.10b - Visual Studio Code app (VSC-3.0.10b)
- App id `vscode` (A.vscode, name "Visual Studio Code"): opens https://vscode.dev in a native WebView (id `vsc`) filling the window body. No address bar/tabs; DOM splash `.vsl` while loading, error panel `.vse` + "Try again" (30 s timeout, offline, or Android error page title).
- Code block `/* VSC-3.0.10b */` just before the Task Manager section: appVsc, A.vscode, IC.vscode. CSS block `/* VSC-3.0.10b */` at the end of the style tag.
- Hidden from desktop and Start pins/Recent: flag `A.vscode.hid=1` (checked in the #pins builder and recent()). Found only by search: search match also uses `A[id].kw` (keywords: vscode vs code ide editor).
- Native surface is now shared: `natCands()` lists visible native views (browser tab or `vsc`), `sync()` shows the one on the top-most window, `natSnap/natUnsnap` keep snapshots, `bpos()` (virtual mouse) follows `shownTab`. Browser `popup`/`tabtouch` handlers ignore events while `shownTab==='vsc'`. VS Code popups (e.g. GitHub sign-in) open in the Browser app.
- Java: AuroraBrowserPlugin.create sets a dark WebView background for id `vsc` (no white flash).
- Limit: Android WebView has no File System Access API, so "Open Folder" on device storage does not work; use GitHub repos, virtual files and uploads.

- v3.0.11 Android/data: جاوا `android-src/AuroraRestricted.java` (جدید، بدون وابستگی به Capacitor) + پچ روی AuroraFilesPlugin (هوک `rh(path)` اول list/info/mkdir/rename/remove/readText/writeText/open/paste؛ متدهای جدید rList/rInfo/... و `restrictedStatus`، `restrictedGrant`). مسیرهای /storage/emulated/0/Android/data|obb (فقط SDK>=30، به‌جز پوشه‌ی خود برنامه) از SAF (گرانت درخت primary:Android/data|obb توی SharedPreferences `aurora_restricted`) یا root (`su -c`) میرن؛ مسیرهای /data/* فقط root (پوشه‌ی خود برنامه مستقیم). خطای دسترسی کد NEEDS_GRANT_DATA / NEEDS_GRANT_OBB / NEEDS_ROOT داره. توی index.html: بلاک `/* ACCESS-3.0.11 */` داخل appFiles (تابع showAcc قبل از load: کارت «Grant access / Use root») + Quick access: Android data، Android obb، App data. paste بین حافظه‌ی معمولی و این پوشه‌ها استریمی کپی میکنه (بدون نوار پیشرفت). VS Code و بقیه هم از همین NF.readText/writeText استفاده میکنن.

- v3.1.8 (ظاهر نهایی، FINAL-3.1.8): لوگوی N (path ثابت M168 368V144l176 224V144 با گرادیان #nxg که در یک svg صفرایز بعد از <body> تعریف شده) جایگزین ستاره‌ی قدیمی شد (const STAR، دکمه‌ی استارت، About، صفحه‌ی خاموشی). بوت جدید: halo + کشیده‌شدن N + ظاهر شدن حرف‌به‌حرف NexOS + نوار پیشرفت و خروج با زوم. روشن‌کردن از صفحه‌ی خاموشی قبل از reload انیمیشن wake دارد. body.intro (۴.۲ ثانیه) آیکن‌های دسکتاپ و داک را با تأخیر پله‌ای وارد می‌کند. انیمیشن نرم: متغیرهای --ease/--spring، انتقال دکمه/آیکن/ورودی، محتوای پنجره fade می‌شود؛ body.perf همه را خاموش می‌کند. ورژن 3.1.8 همه‌جا (HTML، package.json). فایل‌های build (workflow، make-icons، README) NexOS شدند؛ نام‌های داخلی Aurora* در جاوا/پلاگین/appId عمدا دست نخورد چون تغییرشان باعث خراب شدن پلاگین‌ها و داده‌ی کاربر میشه.

- v3.1.8b (WN-3.1.8b / PERF2-3.1.8b): پنجره‌ی What's New (#wn) یک بار برای هر ورژن بعد از بوت باز میشه (کلید aur.wn؛ دستی: showWhatsNew() در کنسول). لیست ITEMS داخل اسکریپت. بهینه‌سازی بدون حذف انیمیشن: لایه‌ی جدا برای #desk و #dock، سایه‌ی سبک‌تر پنجره، content-visibility برای ردیف‌های فایل‌منیجر، contain برای ترمینال، touch-action manipulation، توقف انیمیشن‌ها وقتی برنامه در پس‌زمینه است (body.hid)، و حالت خودکار body.lite: اگر موقع لمس بیشتر از ۳۵٪ فریم‌ها از ۳۴ms بیشتر شد فقط blur و سایه خاموش میشه (انیمیشن‌ها می‌مونن؛ فقط در همین نشست، ذخیره نمیشه).
