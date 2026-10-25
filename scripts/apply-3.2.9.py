#!/usr/bin/env python3
"""NexOS 3.2.9 (run AFTER apply-3.2.8.py): clip of the Wine window behind NexOS windows + cursor signature log.
- JS: when a NexOS window covers part of the exe window, the largest visible rectangle is sent (rect.clip). Setting
  "Windows programs: show behind windows" (aur.exc, default on; Off = old behaviour: exe hidden whenever not on top).
- Java: Wine window shrinks to that rectangle (so the cut-off area does NOT catch touches); the X view keeps its full
  size and is only moved (no GL surface resize). Pointer/cursor mapping uses the full view size.
- Java: new cursor shapes are logged to Download/aurora-cursors.txt (size, hotspot, crc, ascii picture) for the next update.
Every anchor must occur exactly the expected number of times, otherwise NOTHING is written. Idempotent (aurora-clip-3.2.9)."""
import os, re, shutil, subprocess, tempfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p):
    with open(os.path.join(R, p), encoding='utf-8') as f: return f.read()
def wr(p, s):
    with open(os.path.join(R, p), 'w', encoding='utf-8', newline='') as f: f.write(s)
def rep(s, old, new, name, n=1):
    c = s.count(old)
    assert c == n, 'PATCH FAILED (%s): found %d places, expected %d. Send this message back.' % (name, c, n)
    return s.replace(old, new)

# ------------------------------------------------------------------ Java
HELPERS = r'''/** aurora-clip-3.2.9: the X view (child of the program root) */
    private static android.view.View xView(android.widget.FrameLayout root) {
        for (int i = 0; i < root.getChildCount(); i++) {
            android.view.View c = root.getChildAt(i);
            if (c instanceof com.winlator.widget.XServerView) return c;
        }
        return root;
    }

    private static int vwOf(android.widget.FrameLayout root) {
        android.view.View v = xView(root);
        android.view.ViewGroup.LayoutParams p = v.getLayoutParams();
        return (v != root && p != null && p.width > 0) ? p.width : v.getWidth();
    }

    private static int vhOf(android.widget.FrameLayout root) {
        android.view.View v = xView(root);
        android.view.ViewGroup.LayoutParams p = v.getLayoutParams();
        return (v != root && p != null && p.height > 0) ? p.height : v.getHeight();
    }

    private static float xvTx(android.widget.FrameLayout root) {
        android.view.View v = xView(root);
        return v == root ? 0f : v.getTranslationX();
    }

    private static float xvTy(android.widget.FrameLayout root) {
        android.view.View v = xView(root);
        return v == root ? 0f : v.getTranslationY();
    }

    /** w/h <= 0 = fill the window (normal), otherwise a fixed size moved by tx/ty (clipped by the smaller window). */
    private static void setViewBox(android.view.View v, int w, int h, float tx, float ty) {
        android.view.ViewGroup.LayoutParams p = v.getLayoutParams();
        android.widget.FrameLayout.LayoutParams lp = p instanceof android.widget.FrameLayout.LayoutParams
            ? (android.widget.FrameLayout.LayoutParams) p : new android.widget.FrameLayout.LayoutParams(-1, -1);
        int ww = w > 0 ? w : -1, hh = h > 0 ? h : -1;
        if (lp.width != ww || lp.height != hh || lp.gravity != (Gravity.TOP | Gravity.LEFT)) {
            lp.width = ww;
            lp.height = hh;
            lp.gravity = Gravity.TOP | Gravity.LEFT;
            v.setLayoutParams(lp);
        }
        if (v.getTranslationX() != tx) v.setTranslationX(tx);
        if (v.getTranslationY() != ty) v.setTranslationY(ty);
    }

    /** r = full program rect, c = visible part (screen px) or null. Window = visible part, view = full size moved back. UI thread. */
    public static void applyRectClip(Activity a, int[] r, int[] c) {
        if (a == null || r == null || r.length < 4) return;
        android.widget.FrameLayout root = fitRoot;
        android.view.View v = root != null ? xView(root) : null;
        boolean ok = c != null && v != null && v != root;
        int cx = 0, cy = 0, cx2 = 0, cy2 = 0;
        if (ok) {
            cx = Math.max(c[0], r[0]);
            cy = Math.max(c[1], r[1]);
            cx2 = Math.min(c[0] + c[2], r[0] + r[2]);
            cy2 = Math.min(c[1] + c[3], r[1] + r[3]);
            ok = cx2 - cx >= 64 && cy2 - cy >= 64;
        }
        if (!ok) {
            applyRect(a, r);
            if (v != null && v != root) setViewBox(v, -1, -1, 0f, 0f);
            return;
        }
        applyRect(a, new int[]{cx, cy, cx2 - cx, cy2 - cy});
        setViewBox(v, r[2], r[3], r[0] - cx, r[1] - cy);
    }

    /** {clip:{x,y,w,h}} of a rect object -> screen px, or null. */
    private int[] clipRect(JSONObject o) {
        try {
            JSONObject c = o == null ? null : o.optJSONObject("clip");
            if (c == null) return null;
            c.put("vw", o.optDouble("vw", 0));
            c.put("vh", o.optDouble("vh", 0));
            return rectToScreen(c);
        } catch (Throwable e) {
            return null;
        }
    }

    private static volatile com.winlator.xserver.Cursor lastCu;
    private static final java.util.HashSet<String> cuSeen = new java.util.HashSet<>();

    /** Writes every new Wine cursor (size, hotspot, crc, small ascii picture) to Download/aurora-cursors.txt. Never throws. */
    private static void logCursor(com.winlator.xserver.Cursor cu) {
        try {
            com.winlator.xserver.Drawable d = cu.cursorImage;
            if (d == null || d.getData() == null || cuSeen.size() >= 80) return;
            java.nio.ByteBuffer bb = d.getData().duplicate();
            bb.rewind();
            int W = d.width, H = d.height;
            if (W <= 0 || H <= 0) return;
            byte[] b = new byte[Math.min(bb.remaining(), W * H * 4)];
            bb.get(b);
            java.util.zip.CRC32 crc = new java.util.zip.CRC32();
            crc.update(b);
            String sig = W + "x" + H + " hot=" + cu.hotSpotX + "," + cu.hotSpotY + " crc=" + Long.toHexString(crc.getValue());
            if (!cuSeen.add(sig)) return;
            StringBuilder sb = new StringBuilder(sig).append('\n');
            int gw = Math.min(W, 24), gh = Math.min(H, 16);
            for (int gy = 0; gy < gh; gy++) {
                for (int gx = 0; gx < gw; gx++) {
                    int idx = ((gy * H / gh) * W + (gx * W / gw)) * 4 + 3;
                    sb.append(idx < b.length && (b[idx] & 0xff) > 127 ? '#' : '.');
                }
                sb.append('\n');
            }
            sb.append('\n');
            File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (dl == null) return;
            try (java.io.FileOutputStream fo = new java.io.FileOutputStream(new File(dl, "aurora-cursors.txt"), true)) {
                fo.write(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
        } catch (Throwable ignored) { }
    }

    ''' 
END = '/** Sends the whole app to the background (programs keep running). */'

jp = 'android-src/AuroraWinePlugin.java'
j = rd(jp)
if 'aurora-clip-3.2.9' in j:
    print('java already patched, skipping')
else:
    assert 'aurora-fill-3.2.8' in j, 'Run scripts/apply-3.2.8.py first.'
    j = rep(j, END, HELPERS + END, 'helpers')
    j = rep(j, 'int vw = root.getWidth(), vh = root.getHeight();', 'int vw = vwOf(root), vh = vhOf(root);', 'view size', 2)
    j = rep(j, 'iv.setTranslationX(fm[0] + pt.getClampedX() * fm[1]);', 'iv.setTranslationX(xvTx(root) + fm[0] + pt.getClampedX() * fm[1]);', 'cursor x')
    j = rep(j, 'iv.setTranslationY(fm[2] + pt.getClampedY() * fm[3]);', 'iv.setTranslationY(xvTy(root) + fm[2] + pt.getClampedY() * fm[3]);', 'cursor y')
    j = rep(j, 'boolean hide = cu != null && !cu.isVisible();',
            'if (cu != null && cu != lastCu) { lastCu = cu; logCursor(cu); }\n                            boolean hide = cu != null && !cu.isVisible();', 'cursor log')
    j = rep(j, 'if (r != null) applyRect(curActivity, r); // aurora-fill-3.2.7: apply at once (JS already sends one per frame)',
            'if (r != null) applyRectClip(curActivity, r, clipRect(data)); // aurora-clip-3.2.9', 'setExeRect')
    j = rep(j, 'if (r != null) applyRect(a, r);', 'if (r != null) applyRectClip(a, r, null);', 'restoreExe')
    assert j.count('{') == j.count('}'), 'JAVA brace mismatch after patch'
    wr(jp, j); print('AuroraWinePlugin.java patched')

# ------------------------------------------------------------------ JS
EXECLIP = r'''/*CLIP-3.2.9*/const exeClip=w=>{const R=exeRect(w),zi=e=>{const z=parseInt(getComputedStyle(e).zIndex,10);return isNaN(z)?0:z},zw=zi(w.el),cv=[];for(const k in W){const o=W[k];if(!o||o===w||!o.el||!o.el.isConnected)continue;const c=o.el.classList;if(c.contains('min')||c.contains('minning'))continue;const cs=getComputedStyle(o.el);if(cs.display==='none'||cs.visibility==='hidden')continue;const zo=zi(o.el);if(!(o.id===topId||zo>zw||(zo===zw&&(w.el.compareDocumentPosition(o.el)&4))))continue;const b=o.el.getBoundingClientRect(),x1=Math.max(b.left,R.x),y1=Math.max(b.top,R.y),x2=Math.min(b.right,R.x+R.w),y2=Math.min(b.bottom,R.y+R.h);if(x2-x1>1&&y2-y1>1)cv.push([x1,y1,x2,y2])}
if(!cv.length)return{x:R.x,y:R.y,w:R.w,h:R.h,full:true};if(cv.length>6)return null;
const X=[R.x,R.x+R.w],Y=[R.y,R.y+R.h];cv.forEach(c=>{X.push(c[0],c[2]);Y.push(c[1],c[3])});X.sort((a,b)=>a-b);Y.sort((a,b)=>a-b);let best=null,ba=0;
for(let i=0;i<X.length;i++)for(let k=i+1;k<X.length;k++){const a=X[i],b=X[k];if(b-a<96)continue;for(let j=0;j<Y.length;j++)for(let m=j+1;m<Y.length;m++){const c=Y[j],d=Y[m];if(d-c<64)continue;const ar=(b-a)*(d-c);if(ar<=ba)continue;if(cv.some(q=>a<q[2]&&b>q[0]&&c<q[3]&&d>q[1]))continue;ba=ar;best={x:a,y:c,w:b-a,h:d-c}}}
return best};
'''
CHK_OLD = "want=!mn&&topId===w.id&&!menuOpen&&!document.body.classList.contains('shutting')&&!document.body.classList.contains('bsod');if(want!==vis){vis=want;w.exeVis=want;w.body.classList.toggle('exbehind',!want);NW.setExeVisible({v:want}).catch(()=>{});if(want)setTimeout(()=>{if(w.forcePush)w.forcePush()},60)}};w.chk=chk;"
CHK_NEW = "base=!mn&&!menuOpen&&!document.body.classList.contains('shutting')&&!document.body.classList.contains('bsod');let want=base&&topId===w.id,cl=null;if(base&&!want&&S.exc!=='off'){try{cl=exeClip(w)}catch(e){cl=null}want=!!cl}const ck=cl&&!cl.full?[cl.x|0,cl.y|0,cl.w|0,cl.h|0].join():'';const chg=ck!==(w.cclip||'');if(want!==vis||chg){const wasV=vis;vis=want;w.exeVis=want;w.cclip=ck;w.clipR=ck?cl:null;w.body.classList.toggle('exbehind',!want);if(want!==wasV)NW.setExeVisible({v:want}).catch(()=>{});if(want)setTimeout(()=>{if(w.forcePush)w.forcePush()},want!==wasV?60:0)}};w.chk=chk;"
PUSH_OLD = "const k=[r.x|0,r.y|0,r.w|0,r.h|0].join();if(k===last&&!fin)return;last=k;w.xq=r;"
PUSH_NEW = "if(w.clipR)r.clip={x:w.clipR.x,y:w.clipR.y,w:w.clipR.w,h:w.clipR.h};const k=[r.x|0,r.y|0,r.w|0,r.h|0].join()+(r.clip?'c'+[r.clip.x|0,r.clip.y|0,r.clip.w|0,r.clip.h|0].join():'');if(k===last&&!fin)return;last=k;w.xq=r;"
VI_OLD = "const vi=setInterval(chk,250),pd=()=>requestAnimationFrame(chk);document.addEventListener('pointerdown',pd,true);"
VI_NEW = VI_OLD + "const crf=()=>{if(!W[w.id]||!w.el.isConnected)return;if(w.owns&&S.exc!=='off'&&topId!==w.id)chk();requestAnimationFrame(crf)};requestAnimationFrame(crf);"
CHIPS_OLD = "${chips('exf',['fill','keep'],S.exf,v=>v==='keep'?'Keep aspect':'Fill (stretch)')}"
CHIPS_NEW = CHIPS_OLD + "<h4>Windows programs: behind other windows</h4>${chips('exc',['on','off'],S.exc,v=>v==='on'?'Show visible part':'Hide fully')}"

p = 'src/index.html'
s = rd(p)
if '/*CLIP-3.2.9*/' in s:
    print('index.html already patched, skipping')
else:
    assert "'Installed version','3.2.8'" in s, 'Run scripts/apply-3.2.8.py first.'
    s = rep(s, 'const exeRect=w=>{', EXECLIP + 'const exeRect=w=>{', 'exeClip')
    s = rep(s, PUSH_OLD, PUSH_NEW, 'push')
    s = rep(s, CHK_OLD, CHK_NEW, 'chk')
    s = rep(s, VI_OLD, VI_NEW, 'rAF loop')
    s = rep(s, "S.exf=ls('aur.exf')==='keep'?'keep':'fill';", "S.exf=ls('aur.exf')==='keep'?'keep':'fill';S.exc=ls('aur.exc')==='off'?'off':'on';", 'S.exc')
    s = rep(s, CHIPS_OLD, CHIPS_NEW, 'chips')
    s = rep(s, "else if(k==='exf'){", "else if(k==='exc'){S.exc=v==='off'?'off':'on';ls('aur.exc',S.exc);if(exeW&&exeW.owns&&exeW.chk)exeW.chk()}else if(k==='exf'){", 'setting')
    s = rep(s, "'Installed version','3.2.8'", "'Installed version','3.2.9'", 'version')
    if shutil.which('node'):
        for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
            body = m.group(1)
            if not body.strip(): continue
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(body)
            r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True); os.unlink(t.name)
            assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    wr(p, s); print('index.html patched')

pj = rd('package.json'); pj2 = re.sub(r'("version"\s*:\s*")[^"]*(")', r'\g<1>3.2.9\g<2>', pj, count=1)
if pj2 != pj: wr('package.json', pj2); print('package.json -> 3.2.9')
d = rd('DEV-NOTES.md')
if '## 3.2.9' not in d:
    wr('DEV-NOTES.md', d.rstrip('\n') + '''

## 3.2.9 - clip behind windows + cursor log (aurora-clip-3.2.9)
- JS exeClip(w): covering NexOS windows (above in z-order or the top window) -> largest free rectangle (min 96x64 CSS px, max 6 covers). Sent as rect.clip. Setting aur.exc (default on); "Hide fully" = old behaviour.
- Java applyRectClip: Wine window = visible rectangle (so the cut-off part does not catch touches); XServerView gets a fixed full size + translation (GL surface is not resized). vwOf/vhOf/xvTx/xvTy keep pointer + cursor mapping on the full view.
- Part of the exe outside the rectangle but not covered stays empty (largest rectangle only).
- Wine inside the main Activity: NOT done. XServerView is a GLSurfaceView: a SurfaceView is either under the WebView (hole) or over it, so NexOS windows could still not be drawn over a program; needs a TextureView renderer rewrite.
- Cursor shapes: Winlator keeps only bitmap + hotspot (no shape name). New cursors are written to Download/aurora-cursors.txt; map them by crc in the next update.
''' + '\n'); print('DEV-NOTES.md updated')
nx = rd('NEXT.md')
if 'Done in 3.2.9' not in nx:
    wr('NEXT.md', nx.rstrip('\n') + '''

## Done in 3.2.9
- Clip behind windows (setting), cursor signature log. Phone test pending. Next: map cursor crcs from aurora-cursors.txt to NexOS shapes.
''' + '\n'); print('NEXT.md updated')
print('OK')
