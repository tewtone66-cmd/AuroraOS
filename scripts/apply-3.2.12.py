#!/usr/bin/env python3
"""NexOS 3.2.12 (run AFTER apply-3.2.11.py): a Wine cursor that has no NexOS shape (move/resize/other) is now DRAWN BY NexOS
from the cursor's own bitmap, instead of asking Wine's renderer to draw it. Reason (tested on phone, 3.2.10): the mouse
vanished while dragging a window - the case where NexOS hid its overlay and left the drawing to Wine's renderer.
If the bitmap cannot be read (no data / fully transparent), the old behaviour is kept. Arrow, hand, I-beam unchanged.
Anchors must match exactly, otherwise nothing is written. Idempotent (aurora-owncur-3.2.12)."""
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

HELP = r'''/** aurora-owncur-3.2.12 */
    private static volatile com.winlator.xserver.Cursor wbCu;
    private static volatile android.graphics.Bitmap wbBmp;

    /** The Wine cursor as an Android bitmap (assumes B,G,R,A bytes; a red/blue swap would only change colours). null = unusable. Cached. */
    private static android.graphics.Bitmap wineBmp(com.winlator.xserver.Cursor cu) {
        if (cu == wbCu) return wbBmp;
        android.graphics.Bitmap r = null;
        try {
            com.winlator.xserver.Drawable d = cu.cursorImage;
            if (d != null && d.getData() != null && d.width > 0 && d.height > 0 && d.width * d.height <= 128 * 128) {
                int W = d.width, H = d.height;
                java.nio.ByteBuffer bb = d.getData().duplicate();
                bb.rewind();
                byte[] b = new byte[W * H * 4];
                if (bb.remaining() >= b.length) {
                    bb.get(b);
                    int[] px = new int[W * H];
                    boolean any = false;
                    for (int i = 0; i < px.length; i++) {
                        int bl = b[i * 4] & 255, gr = b[i * 4 + 1] & 255, rd = b[i * 4 + 2] & 255, al = b[i * 4 + 3] & 255;
                        if (al > 0) any = true;
                        px[i] = (al << 24) | (rd << 16) | (gr << 8) | bl;
                    }
                    if (any) r = android.graphics.Bitmap.createBitmap(px, W, H, android.graphics.Bitmap.Config.ARGB_8888);
                }
            }
        } catch (Throwable ignored) { }
        wbBmp = r;
        wbCu = cu;
        return r;
    }

    /** Size of the overlay image: NexOS cursor size, or the Wine bitmap scaled like the NexOS arrow (28 css px = cursorH); sets the hotspot offset. */
    private static void sizeCursor(android.widget.ImageView iv, android.graphics.Bitmap ownB, com.winlator.xserver.Cursor cu) {
        int w = cursorW, h = cursorH;
        if (ownB != null) {
            float k = cursorH / 28f;
            w = Math.max(8, Math.round(ownB.getWidth() * k));
            h = Math.max(8, Math.round(ownB.getHeight() * k));
            curHx = cu.hotSpotX * k;
            curHy = cu.hotSpotY * k;
        }
        android.view.ViewGroup.LayoutParams lp = iv.getLayoutParams();
        if (lp != null && (lp.width != w || lp.height != h)) {
            lp.width = w;
            lp.height = h;
            iv.setLayoutParams(lp);
        }
    }

    '''
END = '/** Sends the whole app to the background (programs keep running). */'
jp = 'android-src/AuroraWinePlugin.java'
j = rd(jp)
if 'aurora-owncur-3.2.12' in j:
    print('java already patched, skipping')
else:
    assert 'aurora-diag-3.2.11' in j, 'Run scripts/apply-3.2.11.py first.'
    j = rep(j, END, HELP + END, 'helpers')
    j = rep(j, 'android.graphics.Bitmap wantB = sbm != null ? sbm : bmp;',
            'boolean own0 = cu != null && cu.isVisible() && (cu.hotSpotX != 0 || cu.hotSpotY != 0) && sbm == null && !"arrow".equals(shp);\n'
            '                            android.graphics.Bitmap ownB = own0 ? wineBmp(cu) : null;\n'
            '                            android.graphics.Bitmap wantB = ownB != null ? ownB : (sbm != null ? sbm : bmp);\n'
            '                            sizeCursor(iv, ownB, cu);', 'wantB')
    j = rep(j, 'boolean own = cu != null && cu.isVisible() && (cu.hotSpotX != 0 || cu.hotSpotY != 0) && sbm == null && !"arrow".equals(shp);',
            'boolean own = own0 && ownB == null;', 'own')
    assert j.count('{') == j.count('}'), 'JAVA brace mismatch after patch'
    wr(jp, j); print('AuroraWinePlugin.java patched')

p = 'src/index.html'
s = rd(p)
if "'Installed version','3.2.12'" in s:
    print('index.html already patched, skipping')
else:
    pat = re.compile(r"('Installed version',\s*')[0-9][0-9.]*(')")
    n = len(pat.findall(s))
    if n == 0: print('WARNING: no "Installed version" label found in index.html; label not changed (cosmetic only).')
    else: s = pat.sub(r"\g<1>3.2.12\g<2>", s)
    if shutil.which('node'):
        for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
            body = m.group(1)
            if not body.strip(): continue
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(body)
            r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True); os.unlink(t.name)
            assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    wr(p, s); print('index.html patched (%d version place(s))' % n)
pj = rd('package.json'); pj2 = re.sub(r'("version"\s*:\s*")[^"]*(")', r'\g<1>3.2.12\g<2>', pj, count=1)
if pj2 != pj: wr('package.json', pj2); print('package.json -> 3.2.12')
d = rd('DEV-NOTES.md')
if '## 3.2.12' not in d:
    wr('DEV-NOTES.md', d.rstrip('\n') + '''

## 3.2.12 - Wine cursors drawn by NexOS (aurora-owncur-3.2.12)
- Phone test of 3.2.10: mouse vanished while dragging a window. Unknown Wine cursors (hotspot != 0, no NexOS shape) were left to Wine's renderer while the NexOS overlay hid itself. Now NexOS draws the cursor's own bitmap in the overlay (wineBmp/sizeCursor); the old renderer path remains only if the bitmap is unusable.
- Unverified on device: byte order (B,G,R,A assumed), size scale (cursorH/28 per bitmap pixel), hotspot position.
''' + '\n'); print('DEV-NOTES.md updated')
nx = rd('NEXT.md')
if 'Done in 3.2.12' not in nx:
    wr('NEXT.md', nx.rstrip('\n') + '''

## Done in 3.2.12
- Unknown Wine cursors drawn by NexOS (drag-vanish fix, phone test pending). Open: Wine black screen, Wine/NexOS window overlap bug, Wine window delay, BUILTIN_MAP.
''' + '\n'); print('NEXT.md updated')
print('OK')
