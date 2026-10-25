#!/usr/bin/env python3
"""NexOS 3.2.7 (part H: Wine/EXE): virtual mouse -> Wine, Fill/Keep aspect, rAF-synced window rect.
Patches src/index.html + android-src/AuroraWinePlugin.java + notes. Every anchor must occur exactly once
(otherwise NOTHING is written). Idempotent: markers EXE-3.2.7 (html) and aurora-fill-3.2.7 (java)."""
import os, re, sys, shutil, subprocess, tempfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p):
    with open(os.path.join(R, p), encoding='utf-8') as f: return f.read()
def wr(p, s):
    with open(os.path.join(R, p), 'w', encoding='utf-8', newline='') as f: f.write(s)
def rep(s, old, new, name, cnt=1):
    n = s.count(old)
    assert n == cnt, 'PATCH FAILED (%s): found %d places, expected %d. Send this message back.' % (name, n, cnt)
    return s.replace(old, new)

JS_BLOCK = r'''/*EXE-3.2.7*/S.exf=ls('aur.exf')==='keep'?'keep':'fill';
function xpos(){try{const w=exeW;if(!VM.on||!w||!w.owns||!w.exeUp||w.exeVis===false||!W[w.id]||!NW||!NW.exePointer)return null;const r=exeRect(w);if(VM.x>=r.x&&VM.x<r.x+r.w&&VM.y>=r.y&&VM.y<r.y+r.h)return{id:'exe',x:VM.x-r.x,y:VM.y-r.y}}catch(e){}return null}
const exeNat=(b,a,o)=>{let r;try{r=exeRect(exeW)}catch(e){return Promise.resolve()}return Promise.resolve(NW.exePointer({a,x:b.x,y:b.y,rw:r.w,rh:r.h,dx:(o&&o.dx)||0,dy:(o&&o.dy)||0})).then(res=>{if(res&&res.ok===false&&!exeNat.w){exeNat.w=1;toast('This Wine build does not accept virtual-mouse input')}},()=>{if(!exeNat.w){exeNat.w=1;toast('Mouse input for Windows programs needs the updated app')}})};
/*/EXE-3.2.7*/'''

EDITS = [
 ('exeW', 'let exeW=null;', 'let exeW=null;' + JS_BLOCK),
 ('nrw', "const nrw=(b,a,o)=>NB.pointer(", "const nrw=(b,a,o)=>b.id==='exe'?exeNat(b,a,o):NB.pointer("),
 ('bpos', "function bpos(){if(!NB||!shown)return null;let el,id;", "function bpos(){const xp=xpos();if(xp)return xp;if(!NB||!shown)return null;let el,id;"),
 ('vmcur', "visible:!!bpos(),cw:innerWidth,s:S.ms", "visible:(q=>!!q&&q.id!=='exe')(bpos()),cw:innerWidth,s:S.ms"),
 ('sched', "w.sched=()=>{if(!t1)t1=setTimeout(()=>{t1=0;push()},16);clearTimeout(w.tf);",
           "w.sched=()=>{if(!t1)t1=requestAnimationFrame(()=>{t1=0;push()});clearTimeout(w.tf);"),
 ('push', "last=k;NW.setExeRect(r).catch(()=>{})};",
          "last=k;w.xq=r;if(w.xb&&Date.now()-w.xs>600)w.xb=0;if(!w.xb){const fl=()=>{const q=w.xq;if(!q){w.xb=0;return}w.xq=null;w.xs=Date.now();Promise.resolve(NW.setExeRect(q)).then(fl,fl)};w.xb=1;w.xs=Date.now();fl()}};"),
 ('vis1', "let vis=true;const vi=setInterval(()=>{if(!w.owns)return;const mn=", "let vis=true;w.exeVis=true;const chk=()=>{if(!w.owns)return;const mn="),
 ('vis2', "if(want!==vis){vis=want;", "if(want!==vis){vis=want;w.exeVis=want;"),
 ('vis3', "if(w.forcePush)w.forcePush()},60)}},120);",
          "if(w.forcePush)w.forcePush()},60)}};w.chk=chk;const vi=setInterval(chk,250),pd=()=>requestAnimationFrame(chk);document.addEventListener('pointerdown',pd,true);"),
 ('mo', "},380)}}w.sched()});", "},380)}}w.sched();if(w.chk)w.chk()});"),
 ('close', "w.onclose=()=>{clearInterval(vi);mo.disconnect();ro.disconnect();clearTimeout(t1);clearTimeout(w.tf);",
           "w.onclose=()=>{clearInterval(vi);document.removeEventListener('pointerdown',pd,true);mo.disconnect();ro.disconnect();cancelAnimationFrame(t1);clearTimeout(w.tf);w.exeUp=false;"),
 ('up1', "w.exeHide=()=>{u.style.display='none'};", "w.exeHide=()=>{w.exeUp=true;u.style.display='none'};"),
 ('up2', "$('.exb',u).style.display=err?'':'none';u.style.display='flex'}", "$('.exb',u).style.display=err?'':'none';w.exeUp=false;u.style.display='flex'}"),
 ('fit', "try{await pushCursor()}catch(e){}let run=p;", "try{await pushCursor()}catch(e){}try{if(NW.setExeFit)await NW.setExeFit({fill:S.exf!=='keep'})}catch(e){}let run=p;"),
 ('ui', "<h4>Size</h4>${chips('ms',[.3,.4,.5,.6,.8,1,1.4],S.ms,v=>Math.round(v*100)+'%'+(v===.6?' (default)':''))}",
        "<h4>Size</h4>${chips('ms',[.3,.4,.5,.6,.8,1,1.4],S.ms,v=>Math.round(v*100)+'%'+(v===.6?' (default)':''))}<h4>Windows programs: screen</h4>${chips('exf',['fill','keep'],S.exf,v=>v==='keep'?'Keep aspect':'Fill (stretch)')}"),
 ('set', "else if(k==='ms'){S.ms=+v;ls('aur.ms2',S.ms);applyMouse();vmCursor()}",
         "else if(k==='ms'){S.ms=+v;ls('aur.ms2',S.ms);applyMouse();vmCursor();if(exeW&&exeW.owns)pushCursor().catch(()=>{})}else if(k==='exf'){S.exf=v==='keep'?'keep':'fill';ls('aur.exf',S.exf);if(NW&&NW.setExeFit)NW.setExeFit({fill:S.exf!=='keep'}).then(r=>{if(r&&r.ok===false){S.exf='fill';ls('aur.exf','fill');toast('This Wine build cannot keep aspect: using Fill')}},()=>{})}"),
]

JAVA_FIELDS = '''private static volatile boolean overlayOk = false;
    // aurora-fill-3.2.7: Fill/Keep aspect + mouse injection state (set by cursorOverlay)
    private static volatile boolean exeFill = true;
    private static volatile Object xsRef;
    private static volatile android.widget.FrameLayout fitRoot;
    private static volatile int xsW = 0, xsH = 0;'''

JAVA_METHODS = '''/** aurora-fill-3.2.7: {offX, scaleX, offY, scaleY}: X-screen pixel -> pixel inside the program view. */
    private static float[] fitMap(int vw, int vh, int sw, int sh) {
        if (exeFill) return new float[]{0f, vw / (float) sw, 0f, vh / (float) sh};
        float s = Math.min(vw / (float) sw, vh / (float) sh);
        return new float[]{(vw - sw * s) / 2f, s, (vh - sh * s) / 2f, s};
    }

    /** Asks Winlator's renderer to stretch (Fill) or letterbox (Keep). Reflection: false when this build has no such switch. */
    private static boolean applyFit(android.widget.FrameLayout root) {
        try {
            for (int i = 0; i < root.getChildCount(); i++) {
                android.view.View c = root.getChildAt(i);
                if (!c.getClass().getSimpleName().contains("XServerView")) continue;
                Object rd = c.getClass().getMethod("getRenderer").invoke(c);
                if (rd == null) return false;
                java.lang.reflect.Method m = null;
                for (java.lang.reflect.Method x : rd.getClass().getMethods()) {
                    if (x.getName().equals("setFullscreen") && x.getParameterTypes().length == 1 && x.getParameterTypes()[0] == boolean.class) m = x;
                }
                if (m == null) return false;
                m.invoke(rd, exeFill);
                try { c.getClass().getMethod("requestRender").invoke(c); } catch (Throwable ignored) { }
                return true;
            }
        } catch (Throwable ignored) { }
        return false;
    }

    /** Calls a method of the X server by name (int args are converted to short/long when needed). */
    private static boolean xCall(Object o, String name, Object... args) {
        try {
            for (java.lang.reflect.Method m : o.getClass().getMethods()) {
                Class<?>[] pt = m.getParameterTypes();
                if (!m.getName().equals(name) || pt.length != args.length) continue;
                Object[] cv = new Object[args.length];
                for (int i = 0; i < args.length; i++) {
                    Object v = args[i];
                    if (v instanceof Integer) {
                        int n = (Integer) v;
                        if (pt[i] == short.class) v = (short) n;
                        else if (pt[i] == long.class) v = (long) n;
                        else if (pt[i] == float.class) v = (float) n;
                    }
                    cv[i] = v;
                }
                m.invoke(o, cv);
                return true;
            }
        } catch (Throwable ignored) { }
        return false;
    }

    private static Object xButton(String name) {
        try {
            for (Object c : Class.forName("com.winlator.xserver.Pointer$Button").getEnumConstants()) {
                if (c.toString().equals(name)) return c;
            }
        } catch (Throwable ignored) { }
        return null;
    }

    private static boolean xClick(Object xs, String btn) {
        Object b = xButton(btn);
        return b != null && xCall(xs, "injectPointerButtonPress", b) && xCall(xs, "injectPointerButtonRelease", b);
    }

    /** {fill}: Fill (stretch, no black bars) or Keep aspect. Resolves {ok}; ok=false = this Wine build cannot do Keep. */
    @PluginMethod
    public void setExeFit(final PluginCall call) {
        Boolean f = call.getBoolean("fill", true);
        exeFill = f == null || f;
        final android.widget.FrameLayout root = fitRoot;
        final Activity a = curActivity;
        if (root == null || a == null) {
            JSObject o = new JSObject();
            o.put("ok", true);
            call.resolve(o);
            return;
        }
        a.runOnUiThread(() -> {
            boolean ok = applyFit(root);
            if (!ok) exeFill = true;
            JSObject o = new JSObject();
            o.put("ok", ok || exeFill);
            call.resolve(o);
        });
    }

    /**
     * Virtual mouse -> Wine. {a: move|hover|down|up|rclick|scroll, x, y (CSS px inside the program rect), rw, rh (rect size, CSS px), dy}.
     * Moves the X pointer and presses/releases buttons on the X server (same path as a finger). Resolves {ok:false} when the server has no such calls.
     */
    @PluginMethod
    public void exePointer(final PluginCall call) {
        final Activity a = curActivity;
        final Object xs = xsRef;
        final android.widget.FrameLayout root = fitRoot;
        if (a == null || xs == null || root == null || xsW <= 0 || xsH <= 0) {
            call.resolve();
            return;
        }
        final String act = call.getString("a", "move");
        final double x = call.getDouble("x", 0.0), y = call.getDouble("y", 0.0);
        final double rw = call.getDouble("rw", 0.0), rh = call.getDouble("rh", 0.0);
        final double dy = call.getDouble("dy", 0.0);
        a.runOnUiThread(() -> {
            boolean ok = true;
            try {
                int vw = root.getWidth(), vh = root.getHeight();
                if (vw > 0 && vh > 0 && rw > 0 && rh > 0) {
                    float[] fm = fitMap(vw, vh, xsW, xsH);
                    int px = (int) Math.round((x / rw * vw - fm[0]) / fm[1]);
                    int py = (int) Math.round((y / rh * vh - fm[2]) / fm[3]);
                    px = Math.max(0, Math.min(xsW - 1, px));
                    py = Math.max(0, Math.min(xsH - 1, py));
                    if (!"scroll".equals(act)) ok = xCall(xs, "injectPointerMove", px, py);
                    if ("down".equals(act)) {
                        Object b = xButton("BUTTON_LEFT");
                        ok = ok && b != null && xCall(xs, "injectPointerButtonPress", b);
                    } else if ("up".equals(act)) {
                        Object b = xButton("BUTTON_LEFT");
                        ok = ok && b != null && xCall(xs, "injectPointerButtonRelease", b);
                    } else if ("rclick".equals(act)) {
                        ok = ok && xClick(xs, "BUTTON_RIGHT");
                    } else if ("scroll".equals(act) && dy != 0) {
                        int n = (int) Math.max(1, Math.min(6, Math.round(Math.abs(dy) / 40.0)));
                        for (int i = 0; i < n && ok; i++) ok = xClick(xs, dy > 0 ? "BUTTON_SCROLL_DOWN" : "BUTTON_SCROLL_UP");
                    }
                }
            } catch (Throwable e) {
                ok = false;
            }
            JSObject o = new JSObject();
            o.put("ok", ok);
            call.resolve(o);
        });
    }

    /** Sends the whole app to the background (programs keep running). */'''

JAVA_EDITS = [
 ('fields', 'private static volatile boolean overlayOk = false;', JAVA_FIELDS),
 ('capture', 'final com.winlator.xserver.Pointer pt = (com.winlator.xserver.Pointer) po;',
  'final com.winlator.xserver.Pointer pt = (com.winlator.xserver.Pointer) po;\n            xsRef = xs; fitRoot = root; xsW = sw; xsH = sh; // aurora-fill-3.2.7\n            if (!applyFit(root)) exeFill = true;'),
 ('end', 'if (a.isFinishing() || a.isDestroyed()) {', 'if (a.isFinishing() || a.isDestroyed()) {\n                        fitRoot = null; xsRef = null;'),
 ('tx', 'iv.setTranslationX(pt.getClampedX() * (float) vw / sw);', 'float[] fm = fitMap(vw, vh, sw, sh);\n                        iv.setTranslationX(fm[0] + pt.getClampedX() * fm[1]);'),
 ('ty', 'iv.setTranslationY(pt.getClampedY() * (float) vh / sh);', 'iv.setTranslationY(fm[2] + pt.getClampedY() * fm[3]);'),
 ('methods', '/** Sends the whole app to the background (programs keep running). */', JAVA_METHODS),
 ('rect', 'if (r != null) queueRect(r);', 'if (r != null) applyRect(curActivity, r); // aurora-fill-3.2.7: apply at once (JS already sends one per frame)'),
]

p = 'src/index.html'
s = rd(p)
if 'EXE-3.2.7' in s:
    print('index.html already patched, skipping')
else:
    for name, old, new in EDITS: s = rep(s, old, new, name)
    s = s.replace("'Installed version','3.2.6'", "'Installed version','3.2.7'")
    if shutil.which('node'):
        for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
            body = m.group(1)
            if not body.strip(): continue
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(body)
            r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True); os.unlink(t.name)
            assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
        print('syntax check ok')
    wr(p, s); print('index.html patched (%d edits)' % len(EDITS))

jp = 'android-src/AuroraWinePlugin.java'
j = rd(jp)
if 'aurora-fill-3.2.7' in j:
    print('java already patched, skipping')
else:
    for name, old, new in JAVA_EDITS: j = rep(j, old, new, 'java ' + name)
    assert j.count('{') == j.count('}'), 'JAVA brace mismatch after patch'
    wr(jp, j); print('AuroraWinePlugin.java patched (%d edits)' % len(JAVA_EDITS))

pj = rd('package.json'); pj2 = re.sub(r'("version"\s*:\s*")[^"]*(")', r'\g<1>3.2.7\g<2>', pj, count=1)
if pj2 != pj: wr('package.json', pj2); print('package.json -> 3.2.7')

d = rd('DEV-NOTES.md')
if '3.2.7' not in d:
    wr('DEV-NOTES.md', d.rstrip('\n') + '''

## 3.2.7 - Wine/EXE (EXE-3.2.7 in index.html, aurora-fill-3.2.7 in AuroraWinePlugin.java)
- Virtual mouse -> Wine: `xpos()` returns {id:'exe',x,y} when the VM is inside a visible, running exe window; `bpos()` returns it first, so the whole existing native pipeline (press/release/npt/scroll/rclick) reaches `nrw`, which sends id 'exe' to `exeNat` -> `NW.exePointer`. Java `exePointer` moves the X pointer and presses buttons through reflection on the XServer (injectPointerMove / injectPointerButtonPress / Release, Pointer$Button). Not compiled against Winlator here: if a name differs, `ok:false` -> one toast.
- Fill / Keep aspect: Settings > Mouse (bottom chips "Windows programs: screen", S.exf, ls aur.exf). Java `setExeFit` calls renderer.setFullscreen(bool) by reflection; `fitMap` maps pointer/cursor for both modes. If the switch is missing it stays on Fill.
- Window rect: JS `w.sched` uses requestAnimationFrame, `push` sends one setExeRect at a time (latest wins, serial); Java applies at once. Visibility check `w.chk` runs on pointerdown/class change + 250 ms safety timer (was 120 ms polling only).
''' + '\n'); print('DEV-NOTES.md updated')
nx = rd('NEXT.md')
if 'Done in 3.2.7' not in nx:
    wr('NEXT.md', nx.rstrip('\n') + '''

## Done in 3.2.7
- Exe: virtual mouse reaches Wine, Fill/Keep aspect, rAF rect sync. Only phone-testable. Not done: moving Wine into the main Activity (high risk), clipping the exe window behind other Aurora windows (currently it is hidden completely when another window is on top), cursor shapes other than the arrow inside Wine.
''' + '\n'); print('NEXT.md updated')
print('OK')
