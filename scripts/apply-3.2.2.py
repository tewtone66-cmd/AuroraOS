#!/usr/bin/env python3
# NexOS 3.2.2 (part G) - browser zoom 10%..250%, default 50%, "Auto/Fit" instead of 0%, windowed page size.
# Touches src/index.html AND android-src/AuroraBrowserPlugin.java (needs a new APK build). Run from repo root after 3.2.1.
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
jv = root / 'android-src' / 'AuroraBrowserPlugin.java'
s = idx.read_text(encoding='utf-8'); j = jv.read_text(encoding='utf-8')
if 'ZOOM-3.2.2' in s:
    print('already applied'); sys.exit(0)
assert 'SEL-3.2.1' in s, 'apply 3.2.1 first'

def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, f'html: expected {count}, found {n}: {old[:80]}'
    s = s.replace(old, new)
def repj(old, new, count=1):
    global j
    n = j.count(old); assert n == count, f'java: expected {count}, found {n}: {old[:80]}'
    j = j.replace(old, new)

# ---- JS ----
rep("ZMIN=50,ZMAX=250,", "ZMIN=10,ZMAX=250,DZ=50,ZV=t=>(t&&t.zoom!=null)?t.zoom:DZ,/*ZOOM-3.2.2*/")
rep("ZL=[50,60,70,80,90,100,110,125,150,175,200,250]", "ZL=[0,10,15,20,25,30,35,40,50,60,70,75,80,90,100,110,125,150,175,200,250]")
rep("const zui=()=>{const t=tab(),z=(t&&t.zoom)||100,p=((z-ZMIN)/(ZMAX-ZMIN)*100)+'%';zk.style.left=p;zfill.style.width=p;zv.textContent=z+'%';zchip.lastElementChild.textContent=z+'%';$('.br',B).classList.toggle('zmod',z!==100)};",
    "const zui=()=>{const t=tab(),z=ZV(t),p=(z?((z-ZMIN)/(ZMAX-ZMIN)*100):0)+'%',lb=z?z+'%':'Auto';zk.style.left=p;zfill.style.width=p;zv.textContent=lb;zchip.lastElementChild.textContent=lb;$('.br',B).classList.toggle('zmod',z!==DZ);const ba=$('.bza',B);if(ba)ba.classList.toggle('on',z===0)};")
rep("const zstep=d=>{const t=tab(),z=(t&&t.zoom)||100,", "const zstep=d=>{const t=tab(),z=ZV(t),")
rep("n=d>0?ZL.find(x=>x>z):[...ZL].reverse().find(x=>x<z);if(n)zset(n)};", "n=d>0?ZL.find(x=>x>z):[...ZL].reverse().find(x=>x<z);if(n!=null)zset(n)};")
rep("z=Math.max(ZMIN,Math.min(ZMAX,Math.round(z/5)*5));if(z===(t.zoom||100)&&t.zdone)return;t.zoom=z;t.zdone=1;{const hh=hostOf(t.url);if(hh){if(z===100)delete ZM[hh];else ZM[hh]=z;ls('aur.zm',JSON.stringify(ZM))}}zui();if(NB&&t.made)Promise.resolve(NB.act({id:t.id,a:'zset',v:z})).catch(()=>{})};",
    "z=z===0?0:Math.max(ZMIN,Math.min(ZMAX,Math.round(z/5)*5));if(z===ZV(t)&&t.zdone)return;t.zoom=z;t.zdone=1;{const hh=hostOf(t.url);if(hh){if(z===DZ)delete ZM[hh];else ZM[hh]=z;ls('aur.zm',JSON.stringify(ZM))}}zui();if(NB&&t.made)Promise.resolve(NB.act({id:t.id,a:'zset',v:z,zx:z!==DZ})).catch(()=>{})};")
rep("$('.bzr',B).onclick=()=>{const t=tab();if(t)t.zdone=0;zset(100)}", "$('.bzr',B).onclick=()=>{const t=tab();if(t)t.zdone=0;zset(DZ)};{const ba=$('.bza',B);if(ba)ba.onclick=()=>zset(ZV(tab())===0?DZ:0)}")
rep('<span class="bzv">100%</span><button class="ib bzr">Reset</button>', '<span class="bzv">50%</span><button class="ib bza" title="Fit the page to the window">Auto</button><button class="ib bzr">Reset</button>')
rep("<span>100%</span></button><button class=\"ib\" data-a=\"star\"", "<span>50%</span></button><button class=\"ib\" data-a=\"star\"")
rep("else if(k==='0'){e.preventDefault();const zt=tab();if(zt)zt.zdone=0;zset(100)}", "else if(k==='0'){e.preventDefault();const zt=tab();if(zt)zt.zdone=0;zset(DZ)}")
rep("z:ZM[hostOf(u)]||100}).then(sync)}", "z:ZM[hostOf(u)]==null?DZ:ZM[hostOf(u)],zx:ZM[hostOf(u)]!=null}).then(sync)}")
rep("const z=ZM[hh]||100;t.zoom=z;t.zdone=z===100?0:1;if(NB&&t.made)Promise.resolve(NB.act({id:t.id,a:'zset',v:z})).catch(()=>{});",
    "const z=ZM[hh]==null?DZ:ZM[hh];t.zoom=z;t.zdone=z===DZ?0:1;if(NB&&t.made)Promise.resolve(NB.act({id:t.id,a:'zset',v:z,zx:ZM[hh]!=null})).catch(()=>{});")
rep("</style><!--NEXOS-END--></head>", ".bz .bza{min-width:44px}.bz .bza.on{background:var(--acc);color:#fff}\n</style><!--NEXOS-END--></head>")

s, n = re.subn(r'Version 3\.2\.1', 'Version 3.2.2', s); assert n >= 1
rep("var VER='3.2.1'", "var VER='3.2.2'")
a = s.index('var ITEMS=['); b = s.index('];', a) + 2
s = s[:a] + """var ITEMS=[
['🔍','Zoom 10% to 250%','Zoom out much further to see a full PC page'],
['📐','Auto (Fit)','New Auto button fits the page to the window instead of a 0% zoom'],
['⭐','Default zoom is 50%','New pages open at 50%; Reset goes back to it'],
['🪟','Windowed browser','When the window is not full width the page now fits it automatically until you pick a zoom']
];""" + s[b:]

# ---- Java ----
repj("Integer zf = call.getInt(\"z\", 100);\n        final int z0 = zf == null ? 100 : zf;",
     "Integer zf = call.getInt(\"z\", 50);\n        final int z0 = zf == null ? 50 : zf;\n        final boolean zx0 = call.getBoolean(\"zx\", false);")
repj("zoomOf.put(id, Math.max(40, Math.min(300, z0)));", "zoomOf.put(id, z0 == 0 ? 0 : Math.max(10, Math.min(300, z0)));\n            zxOf.put(id, zx0);")
repj("zoomOf.put(call.getString(\"id\", \"\"), Math.max(40, Math.min(300, zv)));",
     "zoomOf.put(call.getString(\"id\", \"\"), zv == 0 ? 0 : Math.max(10, Math.min(300, zv)));\n                zxOf.put(call.getString(\"id\", \"\"), call.getBoolean(\"zx\", true));")
repj("private final Map<String, Integer> zoomOf = new HashMap<>();", "private final Map<String, Integer> zoomOf = new HashMap<>();\n    /** true = the user (or a saved site zoom) chose this zoom; false = default value. */\n    private final Map<String, Boolean> zxOf = new HashMap<>();")
repj("""        Integer z = zoomOf.get(tabId);
        float zoom = (z == null ? 100 : z) / 100f;""",
"""        Integer z = zoomOf.get(tabId);
        int zi = (z == null ? 50 : z);
        Boolean zx = zxOf.get(tabId);
        boolean windowed = screenW > 200f && w < screenW * 0.85f;
        /* ZOOM-3.2.2: Auto (0) or default zoom in a non-full-width window = fit the page to the window */
        if (zi == 0 || (windowed && (zx == null || !zx))) {
            return Math.max(320, Math.min(10000, Math.round(w / PAGE_K)));
        }
        float zoom = zi / 100f;""")
repj("return Math.max(320, Math.min(4000, Math.round(base)));", "return Math.max(320, Math.min(10000, Math.round(base)));")
idx.write_text(s, encoding='utf-8'); jv.write_text(j, encoding='utf-8')
pj = root / 'package.json'
if pj.exists():
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.2.2"', pj.read_text(encoding='utf-8'), count=1), encoding='utf-8')
with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.2.2 (ZOOM-3.2.2، بخش G): زوم مرورگر ۱۰..۲۵۰٪، پیش‌فرض DZ=50، مقدار 0 = «Auto/Fit» (دکمه‌ی Auto)، فلگ zx (انتخاب صریح کاربر/سایت ذخیره‌شده). Java: cssWidth در حالت پنجره‌ای (<۸۵٪ عرض صفحه) و zoom پیش‌فرض یا Auto، عرض layout = w/PAGE_K (شبیه موبایل) و سقف عرض ۱۰۰۰۰. نیاز به build جدید APK.\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.2.2\nفقط روی گوشی قابل تست: ظاهر Auto و حالت پنجره‌ای؛ اگه حالت پنجره‌ای هنوز بد بود PAGE_K یا آستانه ۰.۸۵ در cssWidth تنظیم شود. زوم ۱۰٪ یعنی عرض layout ≈ ۱۰۰۰۰px (سقف Chromium).\n")
print('ok')
