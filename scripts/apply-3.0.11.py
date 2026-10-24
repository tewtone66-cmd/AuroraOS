#!/usr/bin/env python3
# NexOS 3.0.11: File Manager reaches Android/data, Android/obb and app folders (SAF grant or root). Run from the repo root.
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))

def rd(p):
    with io.open(p, encoding='utf-8', newline='') as f:
        return f.read()

def wr(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

# ---------- Java: plugin hooks ----------
jp = os.path.join(ROOT, 'android-src', 'AuroraFilesPlugin.java')
j = rd(jp)
if 'AuroraRestricted' in j:
    print('AuroraFilesPlugin.java already patched, skipping')
else:
    def after(src, pattern, text):
        ms = list(re.finditer(pattern, src))
        assert len(ms) == 1, 'Java anchor not found exactly once: %s (%d)' % (pattern, len(ms))
        m = ms[0]
        return src[:m.end()] + '\n            ' + text + src[m.end():]

    imp = 'import com.getcapacitor.annotation.CapacitorPlugin;'
    assert j.count(imp) == 1, 'import anchor'
    j = j.replace(imp, imp + '\nimport com.getcapacitor.annotation.ActivityCallback;\nimport androidx.activity.result.ActivityResult;')

    def head(name):
        return r'public void %s\(PluginCall call\) \{\s*try \{' % name

    j = after(j, head('list'), 'if (rh(call.getString("path", ""))) { rList(call); return; }')
    j = after(j, head('info'), 'if (rh(call.getString("path", ""))) { rInfo(call); return; }')
    j = after(j, head('mkdir'), 'if (rh(call.getString("path", ""))) { rMkdir(call); return; }')
    j = after(j, head('rename'), 'if (rh(call.getString("path", ""))) { rRename(call); return; }')
    j = after(j, head('readText'), 'if (rh(call.getString("path", ""))) { rRead(call); return; }')
    j = after(j, head('writeText'), 'if (rh(call.getString("path", ""))) { rWrite(call); return; }')
    j = after(j, head('open'), 'if (rh(call.getString("path", ""))) { rOpen(call); return; }')
    j = after(j, head('remove'), 'for (String q0 : strings(call, "paths")) { if (rh(q0)) { rRemove(call); return; } }')
    j = after(j, head('paste'), 'boolean rr = rh(call.getString("dest", ""));\n            for (String q0 : strings(call, "paths")) { if (rh(q0)) rr = true; }\n            if (rr) { rPaste(call); return; }')

    anchor = '    // ---------- Winlator Cmod hand-off ----------'
    assert j.count(anchor) == 1, 'Winlator anchor'
    methods = rd(os.path.join(HERE, 'plugin-methods-3.0.11.txt'))
    j = j.replace(anchor, methods + anchor)
    wr(jp, j)
    print('patched AuroraFilesPlugin.java')

# ---------- index.html ----------
SRC = os.path.join(ROOT, 'src', 'index.html')
html = rd(SRC)
if 'ACCESS-3.0.11' in html:
    print('index.html already patched, skipping')
else:
    old_load = "async function load(){E.sr=0;if(E.path==null){E.items=[];E.sel.clear();return draw()}try{const r=await NF.list({path:E.path});E.items=r.items||[]}catch(e){E.items=[];err(e)}E.sel.clear();draw()}"
    assert html.count(old_load) == 1, 'file manager load() not found exactly once: %d' % html.count(old_load)
    new_load = r'''/* ACCESS-3.0.11 */
async function showAcc(e){const m=/NEEDS_(GRANT_DATA|GRANT_OBB|ROOT)/.exec(String((e&&e.code)||'')+' '+String((e&&e.message)||''));if(!m)return;let s={sdk:0};try{s=await NF.restrictedStatus({})}catch(x){}const root=m[1]==='ROOT',w=m[1]==='GRANT_OBB'?'obb':'data',mid=s.sdk>=30&&s.sdk<=32;
const c=h('div','facc');c.innerHTML='<b></b><p></p><div class="fab"></div>';
$('b',c).textContent=root?'This folder needs root':'Android/'+w+' is protected by Android';
$('p',c).textContent=root?'App data folders (like /data/data) are private to each app. Opening them needs a rooted phone. Without root, only this app\u2019s own folder is open.':mid?'On Android 11 and 12 you can allow access once: tap Grant access, open Android/'+w+' in the picker and tap \u201cUse this folder\u201d.':'Android 13 and newer block apps from opening Android/'+w+' on most phones. You can still try Grant access (it works on some devices), or use root.';
const bar=$('.fab',c),bt=(t,f)=>{const b=h('button','ib pri');b.textContent=t;b.onclick=f;bar.appendChild(b)};
if(!root)bt(mid?'Grant access':'Try Grant access',async()=>{try{await NF.restrictedGrant({which:w});toast('Access granted');load()}catch(x){err(x)}});
bt('Use root',async()=>{toast('Asking for root\u2026',4000);try{const r=await NF.restrictedStatus({probe:true});if(r.root){toast('Root granted');load()}else toast('Root is not available on this phone',4000)}catch(x){err(x)}});
L.prepend(c)}
async function load(){let acc=null;E.sr=0;if(E.path==null){E.items=[];E.sel.clear();return draw()}try{const r=await NF.list({path:E.path});E.items=r.items||[]}catch(e){E.items=[];if(/NEEDS_(GRANT|ROOT)/.test(String((e&&e.code)||'')+' '+String((e&&e.message)||'')))acc=e;else err(e)}E.sel.clear();draw();if(acc)showAcc(acc)}'''
    html = html.replace(old_load, new_load)

    old_q = "['Camera','DCIM']].forEach(([n,f])=>{if(names.includes(f))E.quick.push({n,path:base+'/'+f})})}"
    assert html.count(old_q) == 1, 'quick access line not found exactly once: %d' % html.count(old_q)
    new_q = "['Camera','DCIM']].forEach(([n,f])=>{if(names.includes(f))E.quick.push({n,path:base+'/'+f})});E.quick.push({n:'Android data',path:base+'/Android/data'},{n:'Android obb',path:base+'/Android/obb'},{n:'App data',path:'/data/data'})}"
    html = html.replace(old_q, new_q)

    css = ("/* ACCESS-3.0.11 */\n.facc{margin:10px;padding:14px 16px;border-radius:10px;background:var(--surf2);border:1px solid var(--line);max-width:520px;direction:ltr;text-align:left}"
           ".facc b{display:block;margin-bottom:6px}.facc p{margin:0 0 10px;color:var(--mut);font-size:13px;line-height:1.45}.facc .fab{display:flex;gap:8px;flex-wrap:wrap}\n")
    a_css = '</style><!--NEXOS-END--></head>'
    assert html.count(a_css) == 1, 'CSS anchor'
    html = html.replace(a_css, css + a_css)

    n = html.count('3.0.10 alpha')
    assert n >= 3, 'version strings not found (%d)' % n
    html = html.replace('3.0.10 alpha', '3.0.11 alpha')
    wr(SRC, html)
    print('patched src/index.html')

# ---------- version + notes ----------
pj = os.path.join(ROOT, 'package.json')
if os.path.exists(pj):
    t = rd(pj)
    t2, k = re.subn(r'("version"\s*:\s*")[^"]+(")', r'\g<1>3.0.11\g<2>', t, count=1)
    assert k == 1, 'version field not found in package.json'
    wr(pj, t2)

dn = os.path.join(ROOT, 'DEV-NOTES.md')
NOTE = ("- v3.0.11 Android/data: جاوا `android-src/AuroraRestricted.java` (جدید، بدون وابستگی به Capacitor) + پچ روی AuroraFilesPlugin "
        "(هوک `rh(path)` اول list/info/mkdir/rename/remove/readText/writeText/open/paste؛ متدهای جدید rList/rInfo/... و `restrictedStatus`، `restrictedGrant`). "
        "مسیرهای /storage/emulated/0/Android/data|obb (فقط SDK>=30، به‌جز پوشه‌ی خود برنامه) از SAF (گرانت درخت primary:Android/data|obb توی SharedPreferences `aurora_restricted`) یا root (`su -c`) میرن؛ "
        "مسیرهای /data/* فقط root (پوشه‌ی خود برنامه مستقیم). خطای دسترسی کد NEEDS_GRANT_DATA / NEEDS_GRANT_OBB / NEEDS_ROOT داره. "
        "توی index.html: بلاک `/* ACCESS-3.0.11 */` داخل appFiles (تابع showAcc قبل از load: کارت «Grant access / Use root») + Quick access: Android data، Android obb، App data. "
        "paste بین حافظه‌ی معمولی و این پوشه‌ها استریمی کپی میکنه (بدون نوار پیشرفت). VS Code و بقیه هم از همین NF.readText/writeText استفاده میکنن.")
t = rd(dn)
if 'v3.0.11 Android/data' not in t:
    wr(dn, t.rstrip('\n') + '\n\n' + NOTE + '\n')

nx = os.path.join(ROOT, 'NEXT.md')
NEXT = """# NEXT (بعد از v3.0.11 Android/data)
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
"""
if 'v3.0.11 Android/data' not in rd(nx):
    wr(nx, NEXT)
print('done')
