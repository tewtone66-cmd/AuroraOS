#!/usr/bin/env python3
"""NexOS 3.2.8 (part H follow-up, run AFTER apply-3.2.7.py): fixes against the real Winlator source (pin 8077f374).
- Java: typed calls instead of reflection (XServer.injectPointer*, Pointer.Button, GLRenderer.toggleFullscreen/isFullscreen).
  Winlator has no setFullscreen(boolean): Fill = renderer fullscreen (stretch), Keep = Winlator default (letterbox).
- Java: cursor shapes: arrow = NexOS cursor; any other Wine cursor (hand, I-beam, resize ...) is drawn by Wine itself;
  a cursor the program hides stays hidden.
- JS: toast text. Every anchor must occur exactly once, otherwise NOTHING is written. Idempotent (aurora-fill-3.2.8)."""
import os, re, shutil, subprocess, tempfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p):
    with open(os.path.join(R, p), encoding='utf-8') as f: return f.read()
def wr(p, s):
    with open(os.path.join(R, p), 'w', encoding='utf-8', newline='') as f: f.write(s)
def rep(s, old, new, name):
    n = s.count(old)
    assert n == 1, 'PATCH FAILED (%s): found %d places, expected 1. Send this message back.' % (name, n)
    return s.replace(old, new)

END = '/** Sends the whole app to the background (programs keep running). */'
V2 = '''/** aurora-fill-3.2.8: {offX, scaleX, offY, scaleY}: X-screen pixel -> pixel inside the program view (follows the renderer's real mode). */
    private static float[] fitMap(int vw, int vh, int sw, int sh) {
        com.winlator.renderer.GLRenderer r = fitRend;
        boolean fs = r != null ? r.isFullscreen() : exeFill;
        if (fs) return new float[]{0f, vw / (float) sw, 0f, vh / (float) sh};
        float s = Math.min(vw / (float) sw, vh / (float) sh);
        return new float[]{(int) ((vw - sw * s) * 0.5f), s, (int) ((vh - sh * s) * 0.5f), s};
    }

    /** Fill = renderer fullscreen (stretched), Keep = Winlator default (aspect kept, black bars). Toggles only when the mode differs. */
    private static boolean applyFit(final android.widget.FrameLayout root) {
        return applyFit(root, 4);
    }

    private static boolean applyFit(final android.widget.FrameLayout root, final int tries) {
        try {
            for (int i = 0; i < root.getChildCount(); i++) {
                android.view.View c = root.getChildAt(i);
                if (!(c instanceof com.winlator.widget.XServerView)) continue;
                final com.winlator.renderer.GLRenderer r = ((com.winlator.widget.XServerView) c).getRenderer();
                fitRend = r;
                if (r.isFullscreen() != exeFill) {
                    long now = android.os.SystemClock.uptimeMillis();
                    if (now - fitT > 300) {
                        fitT = now;
                        r.toggleFullscreen();
                    }
                    if (tries > 0) root.postDelayed(() -> applyFit(root, tries - 1), 350);
                }
                return true;
            }
        } catch (Throwable ignored) { }
        return false;
    }

    /** {fill}: Fill (stretch, no black bars) or Keep aspect. Resolves {ok}. */
    @PluginMethod
    public void setExeFit(final PluginCall call) {
        Boolean f = call.getBoolean("fill", true);
        exeFill = f == null || f;
        final android.widget.FrameLayout root = fitRoot;
        final Activity a = curActivity;
        if (root == null || a == null) {
            JSObject o = new JSObject();
            o.put("ok", true); // applied when the program starts
            call.resolve(o);
            return;
        }
        a.runOnUiThread(() -> {
            JSObject o = new JSObject();
            o.put("ok", applyFit(root));
            call.resolve(o);
        });
    }

    /**
     * Virtual mouse -> Wine. {a: move|hover|down|up|rclick|scroll, x, y (CSS px inside the program rect), rw, rh (rect size, CSS px), dy}.
     * Uses XServer.injectPointerMove / injectPointerButtonPress / injectPointerButtonRelease (the same calls a finger uses).
     */
    @PluginMethod
    public void exePointer(final PluginCall call) {
        final Activity a = curActivity;
        final Object xo = xsRef;
        final android.widget.FrameLayout root = fitRoot;
        if (a == null || !(xo instanceof com.winlator.xserver.XServer) || root == null || xsW <= 0 || xsH <= 0) {
            call.resolve();
            return;
        }
        final com.winlator.xserver.XServer xs = (com.winlator.xserver.XServer) xo;
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
                    int px = Math.max(0, Math.min(xsW - 1, (int) Math.round((x / rw * vw - fm[0]) / fm[1])));
                    int py = Math.max(0, Math.min(xsH - 1, (int) Math.round((y / rh * vh - fm[2]) / fm[3])));
                    if (!"scroll".equals(act)) xs.injectPointerMove(px, py);
                    if ("down".equals(act)) {
                        xs.injectPointerButtonPress(com.winlator.xserver.Pointer.Button.BUTTON_LEFT);
                    } else if ("up".equals(act)) {
                        xs.injectPointerButtonRelease(com.winlator.xserver.Pointer.Button.BUTTON_LEFT);
                    } else if ("rclick".equals(act)) {
                        xs.injectPointerButtonPress(com.winlator.xserver.Pointer.Button.BUTTON_RIGHT);
                        xs.injectPointerButtonRelease(com.winlator.xserver.Pointer.Button.BUTTON_RIGHT);
                    } else if ("scroll".equals(act) && dy != 0) {
                        com.winlator.xserver.Pointer.Button b = dy > 0 ? com.winlator.xserver.Pointer.Button.BUTTON_SCROLL_DOWN : com.winlator.xserver.Pointer.Button.BUTTON_SCROLL_UP;
                        int n = (int) Math.max(1, Math.min(6, Math.round(Math.abs(dy) / 40.0)));
                        for (int i = 0; i < n; i++) {
                            xs.injectPointerButtonPress(b);
                            xs.injectPointerButtonRelease(b);
                        }
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

    ''' + END

CURSOR_LOGIC = '''iv.setTranslationY(fm[2] + pt.getClampedY() * fm[3]);
                        try { // aurora-fill-3.2.8: arrow = NexOS cursor, other shapes = Wine's own, hidden stays hidden
                            com.winlator.xserver.Window pw = ((com.winlator.xserver.XServer) xs).inputDeviceManager.getPointWindow();
                            com.winlator.xserver.Cursor cu = pw != null ? pw.attributes.getCursor() : null;
                            boolean hide = cu != null && !cu.isVisible();
                            boolean own = cu != null && cu.isVisible() && (cu.hotSpotX != 0 || cu.hotSpotY != 0);
                            int vis = (hide || own) ? android.view.View.INVISIBLE : android.view.View.VISIBLE;
                            if (iv.getVisibility() != vis) iv.setVisibility(vis);
                            com.winlator.renderer.GLRenderer rr = fitRend;
                            if (rr != null && rr.isCursorVisible() != own) rr.setCursorVisible(own);
                        } catch (Throwable ignored) { }'''

jp = 'android-src/AuroraWinePlugin.java'
j = rd(jp)
if 'aurora-fill-3.2.8' in j:
    print('java already patched, skipping')
else:
    assert 'aurora-fill-3.2.7' in j, 'Run scripts/apply-3.2.7.py first.'
    a = j.find('/** aurora-fill-3.2.7: {offX')
    b = j.find(END)
    assert a > 0 and b > a and j.count(END) == 1, 'PATCH FAILED (java region): markers not found as expected'
    j = j[:a] + V2 + j[b + len(END):]
    j = rep(j, 'private static volatile int xsW = 0, xsH = 0;',
            'private static volatile int xsW = 0, xsH = 0;\n    private static volatile com.winlator.renderer.GLRenderer fitRend; // aurora-fill-3.2.8\n    private static volatile long fitT = 0;', 'fields')
    j = rep(j, '            if (!applyFit(root)) exeFill = true;', '            applyFit(root);', 'capture')
    j = rep(j, 'fitRoot = null; xsRef = null;', 'fitRoot = null; xsRef = null; fitRend = null;', 'end')
    j = rep(j, 'iv.setTranslationY(fm[2] + pt.getClampedY() * fm[3]);', CURSOR_LOGIC, 'cursor')
    assert j.count('{') == j.count('}'), 'JAVA brace mismatch after patch'
    wr(jp, j); print('AuroraWinePlugin.java patched')

p = 'src/index.html'
s = rd(p)
OLD = "if(r&&r.ok===false){S.exf='fill';ls('aur.exf','fill');toast('This Wine build cannot keep aspect: using Fill')}"
if OLD in s:
    s = s.replace(OLD, "if(r&&r.ok===false)toast('Screen mode could not be changed')")
    s = s.replace("'Installed version','3.2.7'", "'Installed version','3.2.8'")
    if shutil.which('node'):
        for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
            body = m.group(1)
            if not body.strip(): continue
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(body)
            r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True); os.unlink(t.name)
            assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    wr(p, s); print('index.html patched')
else:
    print('index.html: nothing to change (already patched or 3.2.7 not applied)')

pj = rd('package.json'); pj2 = re.sub(r'("version"\s*:\s*")[^"]*(")', r'\g<1>3.2.8\g<2>', pj, count=1)
if pj2 != pj: wr('package.json', pj2); print('package.json -> 3.2.8')
d = rd('DEV-NOTES.md')
if '## 3.2.8' not in d:
    wr('DEV-NOTES.md', d.rstrip('\n') + '''

## 3.2.8 - Wine/EXE follow-up (aurora-fill-3.2.8 in AuroraWinePlugin.java)
- Checked against Winlator pin 8077f374: XServer.injectPointerMove(int,int), injectPointerButtonPress/Release(Pointer.Button) exist; GLRenderer has NO setFullscreen(boolean), only toggleFullscreen()/isFullscreen(). Fill = renderer fullscreen (stretch), Keep = default letterbox. `applyFit` toggles only when the mode differs (guard 300 ms, up to 4 re-checks); `fitMap` follows the renderer's real mode (isFullscreen), so pointer/cursor mapping is always right.
- Cursor shapes: Wine cursor with hotspot (0,0) = arrow -> NexOS cursor overlay. Any other visible Wine cursor (hand, I-beam, resize ...) is drawn by Wine (renderer.setCursorVisible(true)) and the overlay is hidden. A cursor the program hides stays hidden.
- Not done on purpose: clipping the exe window behind other windows (window-resize + offset needs Winlator view/touch changes; setClipBounds leaves the window capturing touches).
''' + '\n'); print('DEV-NOTES.md updated')
nx = rd('NEXT.md')
if 'Done in 3.2.8' not in nx:
    wr('NEXT.md', nx.rstrip('\n') + '''

## Done in 3.2.8
- Winlator calls verified against source, real Fill/Keep toggle, Wine cursor shapes. Phone test pending. Still open: partial clip behind other windows, Wine inside the main Activity.
''' + '\n'); print('NEXT.md updated')
print('OK')
