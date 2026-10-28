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

- v3.2.0 (DND-3.2.0، بخش A1): چیدمان آزاد آیکن‌های دسکتاپ (grid ۸۶×۹۴، موقعیت‌ها در aur.dpos، آیکن‌های حذف‌شده در aur.dhide، شورتکات‌ها در aur.lnks با نوع 'lnk' در DESK). buildIcons بازنویسی/wrap شد (آیکن‌های lnk جدا ساخته میشن). درگ قدیمی ستونی خاموش شد (return اول IIFE) و درگ جدید با ghost + سلول هدف + سطل ساخته شد. درگ ردیف‌های فایل‌منیجر از طریق DNDX.hit به دسکتاپ (شورتکات)، آیکن سطل و پنجره‌ی سطل می‌رسه. ترتیب آیکن‌های پین‌شده‌ی تسک‌بار با درگ عوض میشه (PIN). کرسرهای جدید: ew/ns/nwse/nesw/move/grab/grabbing/no داخل #cur (با curState جدید). peek تمام‌صفحه ۵ ثانیه و با هر تعامل تمدید میشه (peekKeep).

- v3.2.1 (SEL-3.2.1، بخش A2): انتخاب متن آبی (::selection) داخل .body/.tmo/.cro، موتور انتخاب سفارشی برای لمس (نگه‌داشتن ۴۵۰ms = کلمه، ادامه با کشیدن) و ماوس مجازی (pointerId 99: کلیک دوم=کلمه، سوم=پاراگراف، درگ=بازه)، نوار شناور #selbar (Copy/Cut/Paste/Select all) و منوی راست‌کلیک برای متن و input ها. کلیپبورد: navigator.clipboard با fallback به execCommand و حافظه داخلی. فایل‌منیجر: fragment، content-visibility روی ردیف‌ها، تامبنیل زیر ۲.۵MB، debounce جستجو.

- v3.2.2 (ZOOM-3.2.2، بخش G): زوم مرورگر ۱۰..۲۵۰٪، پیش‌فرض DZ=50، مقدار 0 = «Auto/Fit» (دکمه‌ی Auto)، فلگ zx (انتخاب صریح کاربر/سایت ذخیره‌شده). Java: cssWidth در حالت پنجره‌ای (<۸۵٪ عرض صفحه) و zoom پیش‌فرض یا Auto، عرض layout = w/PAGE_K (شبیه موبایل) و سقف عرض ۱۰۰۰۰. نیاز به build جدید APK.

- v3.2.3 (TBX-3.2.3، بخش B): حالت tb-full با grid بازچینی شد (استارت+برنامه‌ها وسط یا چپ، tray و ساعت راست؛ جداکننده‌ها مخفی). taskFit: اگه dock سرریز کنه gap و سایز آیکن کم میشه (کلاس fit و --tbg/--tbk). will-change فقط هنگام hover. فلای‌اوت tray کامل بازنویسی شد (کاشی‌های Network/Performance/Dark/VM، کارت باتری با انیمیشن شارژ، دکمه All settings). fly/flyPos/handler داخل IIFE تعویض متنی شدن.

- v3.2.4 (SET-3.2.4، بخش C): Settings: حالت موبایل (کلاس nar وقتی عرض<560: اول لیست، بعد صفحه با دکمه‌ی back، حالت sch برای جستجو)، صفحه‌ی Battery (NX3.bat با getBattery و NF.sysInfo؛ فیلدهای batLevel/batTemp/batVolt/batHealth/batPlug/batTech/batCounter/batCurrent در AuroraFilesPlugin.sysInfo)، صفحه‌ی Performance، Night light/Dim (#nlx/#dmx)، Reduce motion (body.rm)، Auto performance در ۱۵٪ (S.ap). رشته‌ی ورژن در About/Update درست شد. NX3 در window.

- v3.2.5 (NX-ICON-3.2.5، بخش D1): آیکن جدید: مونوگرام N + حلقه‌ی مداری روی پس‌زمینه‌ی شفق؛ فایل‌ها: assets/nexos-{bg,fg,icon,logo,splash}.svg. فورگراند داخل safe-zone ادپتیو (شعاع ۱۱۳ از ۱۳۲ در ۴۳۲px). نیاز به بیلد کامل APK.

- v3.2.5 (SYS-3.2.5، بخش D): آیکن/لوگو/اسپلش جدید (assets/*.svg؛ make-icons.mjs در CI رندر میکنه). doShut: پنجره‌ها shdn، حلقه‌ی پیشرفت دور لوگو. قفل: lck با بخش .lgn (آواتار، نام، نقطه‌های PIN، keypad)، swipe-up، کلاس pin، ۵ اشتباه=۳۰ ثانیه صبر. PIN هش SHA-256 (aur.pinh/aur.pinl)، نام aur.user، قفل موقع استارت aur.lockboot. OOBE (aur.oobe) ۶ مرحله. صفحه‌ی Account در Settings. NX4 در window. دقت: قفل فقط داخل NexOS هست و امنیت گوشی نیست.

- v3.2.6 (TERM-3.2.6، بخش E): ترمینال: splitChain/run/run1 برای && و || (هر دو حالت) و & (فقط CMD)، موفقیت با شمارنده‌ی ES (E) و PSV['?']. Tab completion (complete(): دستورها + مسیرها با rp/ls، چرخشی)، نوار .tmk (Tab، ↑↓، Ctrl+C، Copy، Paste، Clear)، paste چندخطی با submitLine، عنوان پنجره Command Prompt/Windows PowerShell، prompt اکو در PS با 'PS '. psNetMsg علت واقعی خطا را در پرانتز نشان می‌دهد. NOTHERE: برای claude/npm/node/git/... پیام Termux.

## 3.2.7 - Wine/EXE (EXE-3.2.7 in index.html, aurora-fill-3.2.7 in AuroraWinePlugin.java)
- Virtual mouse -> Wine: `xpos()` returns {id:'exe',x,y} when the VM is inside a visible, running exe window; `bpos()` returns it first, so the whole existing native pipeline (press/release/npt/scroll/rclick) reaches `nrw`, which sends id 'exe' to `exeNat` -> `NW.exePointer`. Java `exePointer` moves the X pointer and presses buttons through reflection on the XServer (injectPointerMove / injectPointerButtonPress / Release, Pointer$Button). Not compiled against Winlator here: if a name differs, `ok:false` -> one toast.
- Fill / Keep aspect: Settings > Mouse (bottom chips "Windows programs: screen", S.exf, ls aur.exf). Java `setExeFit` calls renderer.setFullscreen(bool) by reflection; `fitMap` maps pointer/cursor for both modes. If the switch is missing it stays on Fill.
- Window rect: JS `w.sched` uses requestAnimationFrame, `push` sends one setExeRect at a time (latest wins, serial); Java applies at once. Visibility check `w.chk` runs on pointerdown/class change + 250 ms safety timer (was 120 ms polling only).

## 3.2.8 - Wine/EXE follow-up (aurora-fill-3.2.8 in AuroraWinePlugin.java)
- Checked against Winlator pin 8077f374: XServer.injectPointerMove(int,int), injectPointerButtonPress/Release(Pointer.Button) exist; GLRenderer has NO setFullscreen(boolean), only toggleFullscreen()/isFullscreen(). Fill = renderer fullscreen (stretch), Keep = default letterbox. `applyFit` toggles only when the mode differs (guard 300 ms, up to 4 re-checks); `fitMap` follows the renderer's real mode (isFullscreen), so pointer/cursor mapping is always right.
- Cursor shapes: Wine cursor with hotspot (0,0) = arrow -> NexOS cursor overlay. Any other visible Wine cursor (hand, I-beam, resize ...) is drawn by Wine (renderer.setCursorVisible(true)) and the overlay is hidden. A cursor the program hides stays hidden.
- Not done on purpose: clipping the exe window behind other windows (window-resize + offset needs Winlator view/touch changes; setClipBounds leaves the window capturing touches).

## 3.2.9 - clip behind windows + cursor log (aurora-clip-3.2.9)
- JS exeClip(w): covering NexOS windows (above in z-order or the top window) -> largest free rectangle (min 96x64 CSS px, max 6 covers). Sent as rect.clip. Setting aur.exc (default on); "Hide fully" = old behaviour.
- Java applyRectClip: Wine window = visible rectangle (so the cut-off part does not catch touches); XServerView gets a fixed full size + translation (GL surface is not resized). vwOf/vhOf/xvTx/xvTy keep pointer + cursor mapping on the full view.
- Part of the exe outside the rectangle but not covered stays empty (largest rectangle only).
- Wine inside the main Activity: NOT done. XServerView is a GLSurfaceView: a SurfaceView is either under the WebView (hole) or over it, so NexOS windows could still not be drawn over a program; needs a TextureView renderer rewrite.
- Cursor shapes: Winlator keeps only bitmap + hotspot (no shape name). New cursors are written to Download/aurora-cursors.txt; map them by crc in the next update.

## 3.2.10 - NexOS cursor shapes for Wine (aurora-shapes-3.2.10)
- NexOS has 4 cursor shapes in #cur: arrow (.sa), hand (.sh), I-beam (.si), busy (.sb, static frame). pushShapes sends hand/ibeam/busy with their hotspot (fractions of the 26x28 box).
- Java shapeOf(cursor): hotspot (0,0) = arrow; else crc lookup in Download/aurora-cursor-map.txt ("crc=hand|ibeam|busy|arrow|wine"), else guessShape (hand + I-beam only, geometry, UNVERIFIED). null = Wine's own cursor. aurora-cursors.txt now shows guess= per cursor: compare with the real shape, then add exact crc lines / a built-in table.
- Setting aur.exs (default on); off = 3.2.9 behaviour.

## 3.2.11 - cursor-log diagnostics (aurora-diag-3.2.11)
- No aurora-cursors.txt appeared after 3.2.9/3.2.10 and every failure was silent. curNote() now writes "# ..." lines into the same file: overlay called/running, state under the pointer, cursors without image data.
- Reading the file: no "overlay: called" = cursorOverlay never ran; "called" without "running" = early return; "no window under pointer" / "window has no cursor set" = X never gives a cursor, so nothing to map; "visible hot=.." without a cursor entry = see "without image data".
- BUILTIN_MAP in AuroraWinePlugin.java is empty on purpose; fill it with verified "crc=shape" lines from aurora-cursors.txt (shapeOf checks Download/aurora-cursor-map.txt first, then BUILTIN_MAP).

## 3.2.13 - no black Wine screen (aurora-clear-3.2.13)
- Read from Winlator 8077f37: GLRenderer clears to alpha 0 and the EGL config has alpha, but the surface was opaque and the Wine desktop window (explorer.exe, black) was drawn. Build-time patch scripts/patch-exe-clear.py (called from patch-exe-window.py): GLRenderer.auroraClear skips desktop windows, XServerView surface TRANSLUCENT, AuroraExeWindow windowBackground transparent. AuroraWinePlugin turns the flag on in cursorOverlay and off when the program ends.
- Unverified on device. If the black stays: XServerDisplayActivity may set its own background (grep setBackground|FLXServerDisplay in com/winlator/XServerDisplayActivity.java).
- Side effect: Wine's own taskbar (also WM_CLASS explorer.exe) is not drawn either.

## 3.2.12 - Wine cursors drawn by NexOS (aurora-owncur-3.2.12)
- Phone test of 3.2.10: mouse vanished while dragging a window. Unknown Wine cursors (hotspot != 0, no NexOS shape) were left to Wine's renderer while the NexOS overlay hid itself. Now NexOS draws the cursor's own bitmap in the overlay (wineBmp/sizeCursor); the old renderer path remains only if the bitmap is unusable.
- Unverified on device: byte order (B,G,R,A assumed), size scale (cursorH/28 per bitmap pixel), hotspot position.

## 3.2.14 - cursor table from the real log + no hidden mouse (aurora-nohide-3.2.14)
- Real aurora-cursors.txt: deadd746 = hourglass 20x20 hot 10,10 (busy); 1d2d519e = arrow 20x20 hot 0,0; 2144df1c = 1x1 blank (Wine "hidden"). Table is in BUILTIN_MAP (AuroraWinePlugin.java). Hand and I-beam crc values are still unknown (no sample yet: hover a link and a text box in an EXE, then read the log again).
- Hidden Wine cursor (1x1) used to hide the NexOS mouse; the log showed visible/hidden flipping about once a second. Now the NexOS arrow stays. Side effect: programs that hide the cursor on purpose (games) show the arrow; make it a setting if that matters.

## 3.2.15 - Wine start timer (aurora-tick-3.2.15)
- "Starting Wine..." shows elapsed seconds (exeTick). Most of the delay is Wine/box64 boot, not NexOS code. Untested on phone.
- NOT done (no data): Wine black check, hand/I-beam crc, NexOS-window-over-Wine glitch.

## 3.4.0 - Themes, new logo, global text selection (THEME-3.4.0)
- Themes: Dark (default), Light, Liquid Glass. `S.theme` in `dark|light|glass` (key `aur.theme`; old `auto` -> dark). `applyTheme()` sets `<html data-skin>` (chosen theme) and `<html data-theme>` (colour scheme; glass = dark). A tiny head script sets both before first paint.
- All styling reads CSS tokens (`--surf --surf2 --txt --mut --line --pn --hov --dock-* --win-sh --pop-sh --sel-*`, glass: `--gl-blur --gl-fill --gl-rim --gl-edge`). CSS block `/* THEME-3.4.0 */` at the end of the last `<style>`. Glass rim = `::before` gradient mask; `body.perf/lite` make glass opaque (no blur).
- Settings > Themes (`PGS.theme`, `THEME_META`). Preview images: `assets/theme-previews/{dark,light,glass}.svg` are placeholders, copied to `www/theme-previews/` by `scripts/prepare-web.mjs`. Replace the files (or change `img` in `THEME_META`).
- Logo: new N mark (`assets/nexos-mark.svg`, icon/logo/fg/bg/splash SVGs, same path inline as `#nxg` gradient in boot, shutdown, start button, About, What's New, OOBE, favicon).
- Selection: `::selection` blue via `--sel-bg/--sel-fg` in every theme; selectable regions list `SELR` in the selection engine (now also What's New, setup, dialogs); controls stay non-selectable.
