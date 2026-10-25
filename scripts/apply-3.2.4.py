#!/usr/bin/env python3
# NexOS 3.2.4 (part C) - Settings: new layout for phones, Battery page (real Android data), Performance page,
# night light / dim / reduce motion / auto performance, version strings fixed. Edits index.html and AuroraFilesPlugin.java.
import re, sys, pathlib
here = pathlib.Path(__file__).resolve().parent
root = here.parent
idx = root / 'src' / 'index.html'; jv = root / 'android-src' / 'AuroraFilesPlugin.java'
s = idx.read_text(encoding='utf-8'); j = jv.read_text(encoding='utf-8')
if 'SET-3.2.4' in s:
    print('already applied'); sys.exit(0)
assert 'TBX-3.2.3' in s, 'apply 3.2.3 first'
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, f'html: expected {count}, found {n}: {old[:90]}'
    s = s.replace(old, new)

# navigation + search index
rep("const NAV=[['System',[['about','About'],['display','Display & size'],['storage','Storage'],['update','Update']]]",
    "const NAV=[['System',[['about','About'],['display','Display & size'],['battery','Battery'],['perf','Performance'],['storage','Storage'],['update','Update']]]")
rep("const IDX=[['About this system, version, device','about'],",
    "const IDX=[['Battery, charge, health, temperature','battery'],['Battery saver, auto performance','perf'],['Performance mode, reduce motion','perf'],['Night light, warm colors','display'],['Dim screen, brightness','display'],['About this system, version, device','about'],")
# stale version strings
rep("['Version','3.0.0 (alpha)']", "['Version','3.2.4']")
rep("['Installed version','3.1.8']", "['Installed version','3.2.4']", 2)

# layout: phone mode + wrappers around PGS
rep("const pgEl=$('#spg',B);",
 """const pgEl=$('#spg',B),sxEl=$('.sx',B);/*SET-3.2.4*/
new ResizeObserver(()=>sxEl.classList.toggle('nar',sxEl.clientWidth<560)).observe(sxEl);sxEl.classList.toggle('nar',sxEl.clientWidth<560);if(arg)sxEl.classList.add('det');
const _pd=PGS.display;PGS.display=()=>_pd()+`<h4>Night light (warm screen color)</h4>${chips('nl',[0,10,18,28],S.nl,v=>v?({10:'Low',18:'Medium',28:'High'})[v]:'Off')}<h4>Dim screen (software brightness)</h4>${chips('dm',[0,10,20,30,45],S.dm,v=>v?v+'%':'Off')}<p class="bnote">Android does not let apps change the real screen brightness, so this darkens the picture on top.</p>`;
PGS.battery=()=>`<h3>Battery</h3><div id="batx"><div class="bnote">Reading battery…</div></div><h4>Battery saving</h4><h4 style="margin-top:6px">Performance mode</h4>${onoff('perf',S.perf)}<h4>Turn on Performance mode automatically at 15%</h4>${onoff('ap',S.ap)}`;
PGS.perf=()=>`<h3>Performance</h3><h4>Performance mode (no blur, shadows or heavy animations)</h4>${onoff('perf',S.perf)}<h4>Reduce motion (almost no animations)</h4>${onoff('rm',S.rm)}<h4>Turn on Performance mode automatically at 15% battery</h4>${onoff('ap',S.ap)}<h4>Check what is using memory</h4><button class="pgb" data-k="app" data-v="taskmgr">Open Task Manager</button>`;""")
rep("else pgEl.innerHTML=PGS[pg]();pgEl.scrollTop=top;if(!q&&pg==='mouse')bindPrev()}",
    "else pgEl.innerHTML='<button class=\"sbk\" data-k=\"back\">&#8249; Settings</button>'+PGS[pg]();pgEl.scrollTop=top;if(!q&&pg==='mouse')bindPrev();if(!q&&pg==='battery'&&window.NX3)NX3.bat($('#batx',B))}")
rep("if(k==='pg'){pg=v;q='';$('#sq2',B).value='';keep=false}",
    "if(k==='pg'){pg=v;q='';$('#sq2',B).value='';keep=false;sxEl.classList.add('det');sxEl.classList.remove('sch')}\nelse if(k==='back'){sxEl.classList.remove('det','sch');q='';$('#sq2',B).value='';keep=false}\nelse if(k==='app')openApp(v)\nelse if(k==='ap'||k==='rm'){S[k]=v==='1';ls('aur.'+k,v);NX3.apply()}\nelse if(k==='nl'||k==='dm'){S[k]=+v;ls('aur.'+k,v);NX3.apply()}")
rep("$('#sq2',B).oninput=e=>{q=e.target.value.trim();show()};",
    "$('#sq2',B).oninput=e=>{q=e.target.value.trim();sxEl.classList.toggle('sch',!!q);if(q)sxEl.classList.remove('det');show()};")
rep("w.open=a=>{pg=a||'about';q='';$('#sq2',B).value='';show()};",
    "w.open=a=>{pg=a||'about';q='';$('#sq2',B).value='';sxEl.classList.remove('sch');if(a)sxEl.classList.add('det');show()};")

css = (here / 'c.css').read_text(encoding='utf-8'); js = (here / 'c.js').read_text(encoding='utf-8')
rep("</style><!--NEXOS-END--></head>", "/*SET-3.2.4*/\n" + css + "\n</style><!--NEXOS-END--></head>")
rep("</script><!--NEXOS-END--></body></html>", js + "\n</script><!--NEXOS-END--></body></html>")
s, n = re.subn(r'Version 3\.2\.3', 'Version 3.2.4', s); assert n >= 1
rep("var VER='3.2.3'", "var VER='3.2.4'")
a = s.index('var ITEMS=['); b = s.index('];', a) + 2
s = s[:a] + """var ITEMS=[
['🔋','Battery page','Big charge bar with animation, health, temperature, voltage and power source'],
['📱','Settings on phones','On a narrow window Settings shows a list first, then the page with a back button'],
['⚙️','Performance page','Performance mode, reduce motion and auto power saving at 15%'],
['🌙','Night light and dim','Warm tint and software brightness in Display & size'],
['🧭','Correct version info','About and Update now show the real version']
];""" + s[b:]
idx.write_text(s, encoding='utf-8')

# Java: battery numbers in sysInfo
old = '            r.put("cores", Runtime.getRuntime().availableProcessors());\n'
assert j.count(old) == 1
new = old + '''            try { /* SET-3.2.4 battery details */
                android.content.Intent bi = getContext().registerReceiver(null, new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED));
                if (bi != null) {
                    r.put("batLevel", bi.getIntExtra("level", -1));
                    r.put("batScale", bi.getIntExtra("scale", 100));
                    r.put("batTemp", bi.getIntExtra("temperature", 0) / 10.0);
                    r.put("batVolt", bi.getIntExtra("voltage", 0));
                    r.put("batHealth", bi.getIntExtra("health", 1));
                    r.put("batPlug", bi.getIntExtra("plugged", 0));
                    String bt = bi.getStringExtra("technology");
                    r.put("batTech", bt == null ? "" : bt);
                }
                android.os.BatteryManager bm = (android.os.BatteryManager) getContext().getSystemService(Context.BATTERY_SERVICE);
                if (bm != null) {
                    r.put("batCounter", bm.getLongProperty(android.os.BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER));
                    r.put("batCurrent", bm.getLongProperty(android.os.BatteryManager.BATTERY_PROPERTY_CURRENT_NOW));
                }
            } catch (Exception ignored) { }
'''
jv.write_text(j.replace(old, new), encoding='utf-8')
pj = root / 'package.json'
if pj.exists():
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.2.4"', pj.read_text(encoding='utf-8'), count=1), encoding='utf-8')
with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.2.4 (SET-3.2.4، بخش C): Settings: حالت موبایل (کلاس nar وقتی عرض<560: اول لیست، بعد صفحه با دکمه‌ی back، حالت sch برای جستجو)، صفحه‌ی Battery (NX3.bat با getBattery و NF.sysInfo؛ فیلدهای batLevel/batTemp/batVolt/batHealth/batPlug/batTech/batCounter/batCurrent در AuroraFilesPlugin.sysInfo)، صفحه‌ی Performance، Night light/Dim (#nlx/#dmx)، Reduce motion (body.rm)، Auto performance در ۱۵٪ (S.ap). رشته‌ی ورژن در About/Update درست شد. NX3 در window.\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.2.4\nسلامت واقعی (درصد فرسودگی) از اندروید در دسترس برنامه‌ها نیست؛ فقط وضعیت Good/Overheated و ظرفیت تخمینی. برای نسخه‌ی بعدی ورژن را از یک ثابت مرکزی بخوانیم (الان چند جا دستی عوض میشه).\n")
print('ok')
