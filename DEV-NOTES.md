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
