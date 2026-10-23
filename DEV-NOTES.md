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
