#!/usr/bin/env python3
"""NexOS 3.2.10 (run AFTER apply-3.2.9.py): NexOS cursor shapes (hand, I-beam, busy) for Wine cursors.
- JS: pushShapes sends the NexOS hand/I-beam/busy images to Java (setExeCursor {shape,hx,hy}); setting "cursor shapes" (aur.exs, default on).
- Java: a Wine cursor is identified (1) by crc via optional Download/aurora-cursor-map.txt (lines "crc=hand|ibeam|busy|arrow|wine"),
  (2) otherwise by a geometric GUESS for hand and I-beam only (UNVERIFIED, marked guess= in aurora-cursors.txt). Unknown = Wine's own cursor.
Every anchor is checked first, otherwise NOTHING is written. Idempotent (aurora-shapes-3.2.10)."""
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

HELP = r'''/** aurora-shapes-3.2.10 */
    private static volatile boolean shapesOn = true;
    private static volatile float curHx = 0f, curHy = 0f;
    private static final java.util.concurrent.ConcurrentHashMap<String, android.graphics.Bitmap> shapeBmp = new java.util.concurrent.ConcurrentHashMap<>();
    private static final java.util.concurrent.ConcurrentHashMap<String, float[]> shapeHot = new java.util.concurrent.ConcurrentHashMap<>();
    private static volatile com.winlator.xserver.Cursor shapeCu;
    private static volatile String shapeVal;

    /** {on}: NexOS shapes for known Wine cursors (false = Wine draws every shape except the arrow). */
    @PluginMethod
    public void setExeShapes(final PluginCall call) {
        Boolean on = call.getBoolean("on", true);
        shapesOn = on == null || on;
        shapeCu = null;
        call.resolve();
    }

    /** Geometric GUESS (unverified on real devices): "hand", "ibeam" or null. */
    static String guessShape(byte[] b, int W, int H, int hx, int hy) {
        int x0 = W, y0 = H, x1 = -1, y1 = -1, cnt = 0;
        for (int y = 0; y < H; y++) {
            for (int x = 0; x < W; x++) {
                int i = (y * W + x) * 4 + 3;
                if (i < b.length && (b[i] & 0xff) > 127) {
                    cnt++;
                    if (x < x0) x0 = x;
                    if (x > x1) x1 = x;
                    if (y < y0) y0 = y;
                    if (y > y1) y1 = y;
                }
            }
        }
        if (cnt == 0) return null;
        int bw = x1 - x0 + 1, bh = y1 - y0 + 1;
        if (bh >= 12 && bh >= bw * 1.6f && Math.abs(hx - (x0 + bw / 2)) <= bw && Math.abs(hy - (y0 + bh / 2)) <= bh / 4 + 2) {
            int top = Math.max(rowCnt(b, W, y0, x0, x1), rowCnt(b, W, y0 + 1, x0, x1));
            int bot = Math.max(rowCnt(b, W, y1, x0, x1), rowCnt(b, W, y1 - 1, x0, x1));
            int mid = 0;
            for (int y = y0 + bh / 2 - 1; y <= y0 + bh / 2 + 1; y++) mid = Math.max(mid, rowCnt(b, W, y, x0, x1));
            if (top >= mid + 2 && bot >= mid + 2 && mid <= Math.max(4, bw / 3)) return "ibeam";
        }
        float asp = bw / (float) bh, fill = cnt / (float) (bw * bh);
        if (hy <= 2 && hx > 0 && bw >= 10 && bh >= 12 && asp >= 0.65f && asp <= 1.35f && fill >= 0.35f && fill <= 0.85f && hx <= x0 + bw * 0.6f) return "hand";
        return null;
    }

    private static int rowCnt(byte[] b, int W, int y, int x0, int x1) {
        int n = 0;
        if (y < 0) return 0;
        for (int x = x0; x <= x1; x++) {
            int i = (y * W + x) * 4 + 3;
            if (i < b.length && (b[i] & 0xff) > 127) n++;
        }
        return n;
    }

    private static String tabLookup(String crc) {
        try {
            File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File f = dl == null ? null : new File(dl, "aurora-cursor-map.txt");
            if (f == null || !f.isFile() || f.length() > 20000) return null;
            for (String line : new String(java.nio.file.Files.readAllBytes(f.toPath()), java.nio.charset.StandardCharsets.UTF_8).split("\\r?\\n")) {
                String t = line.trim();
                int e = t.indexOf('=');
                if (t.startsWith("#") || e <= 0) continue;
                if (t.substring(0, e).trim().equalsIgnoreCase(crc)) return t.substring(e + 1).trim().toLowerCase();
            }
        } catch (Throwable ignored) { }
        return null;
    }

    /** Shape name of a visible Wine cursor, or null = no NexOS shape (arrow handled by hotspot, everything else = Wine's own). Cached per cursor. */
    private static String shapeOf(com.winlator.xserver.Cursor cu) {
        if (!shapesOn || shapeBmp.isEmpty()) return null;
        if (cu == shapeCu) return shapeVal;
        String r = null;
        try {
            com.winlator.xserver.Drawable d = cu.cursorImage;
            if (!(cu.hotSpotX == 0 && cu.hotSpotY == 0) && d != null && d.getData() != null && d.width > 0 && d.height > 0) {
                int W = d.width, H = d.height;
                java.nio.ByteBuffer bb = d.getData().duplicate();
                bb.rewind();
                byte[] b = new byte[Math.min(bb.remaining(), W * H * 4)];
                bb.get(b);
                java.util.zip.CRC32 crc = new java.util.zip.CRC32();
                crc.update(b);
                String t = tabLookup(Long.toHexString(crc.getValue()));
                r = t != null ? t : guessShape(b, W, H, cu.hotSpotX, cu.hotSpotY);
            }
        } catch (Throwable ignored) { }
        shapeVal = r;
        shapeCu = cu;
        return r;
    }

    '''
END = '/** Sends the whole app to the background (programs keep running). */'

jp = 'android-src/AuroraWinePlugin.java'
j = rd(jp)
if 'aurora-shapes-3.2.10' in j:
    print('java already patched, skipping')
else:
    assert 'aurora-clip-3.2.9' in j, 'Run scripts/apply-3.2.9.py first.'
    j = rep(j, END, HELP + END, 'helpers')
    j = rep(j, 'final double vw = call.getDouble("vw", 0.0);',
            'final double vw = call.getDouble("vw", 0.0);\n        final String shape = call.getString("shape");\n        final double shx = call.getDouble("hx", 0.0), shy = call.getDouble("hy", 0.0);', 'setExeCursor args')
    j = rep(j, 'cursorBmp = bm;',
            'if (shape == null) cursorBmp = bm;\n                        else { shapeBmp.put(shape, bm); shapeHot.put(shape, new float[]{(float) (shx * cursorW), (float) (shy * cursorH)}); }', 'store')
    j = rep(j, 'iv.setTranslationX(xvTx(root) + fm[0] + pt.getClampedX() * fm[1]);', 'iv.setTranslationX(xvTx(root) + fm[0] + pt.getClampedX() * fm[1] - curHx);', 'tx')
    j = rep(j, 'iv.setTranslationY(xvTy(root) + fm[2] + pt.getClampedY() * fm[3]);', 'iv.setTranslationY(xvTy(root) + fm[2] + pt.getClampedY() * fm[3] - curHy);', 'ty')
    j = rep(j, 'boolean own = cu != null && cu.isVisible() && (cu.hotSpotX != 0 || cu.hotSpotY != 0);',
            '''String shp = (cu != null && cu.isVisible()) ? shapeOf(cu) : null;
                            android.graphics.Bitmap sbm = shp == null ? null : shapeBmp.get(shp);
                            float[] sht = sbm == null ? null : shapeHot.get(shp);
                            curHx = sht != null ? sht[0] : 0f;
                            curHy = sht != null ? sht[1] : 0f;
                            android.graphics.Bitmap wantB = sbm != null ? sbm : bmp;
                            if (iv.getTag() != wantB) { iv.setImageBitmap(wantB); iv.setTag(wantB); }
                            boolean own = cu != null && cu.isVisible() && (cu.hotSpotX != 0 || cu.hotSpotY != 0) && sbm == null && !"arrow".equals(shp);''', 'own')
    j = rep(j, 'String sig = W + "x" + H + " hot=" + cu.hotSpotX + "," + cu.hotSpotY + " crc=" + Long.toHexString(crc.getValue());',
            'String sig = W + "x" + H + " hot=" + cu.hotSpotX + "," + cu.hotSpotY + " crc=" + Long.toHexString(crc.getValue()) + " guess=" + guessShape(b, W, H, cu.hotSpotX, cu.hotSpotY);', 'log guess')
    assert j.count('{') == j.count('}'), 'JAVA brace mismatch after patch'
    wr(jp, j); print('AuroraWinePlugin.java patched')

PUSHSH = r'''/*SHAPES-3.2.10*/async function pushShapes(cf,ck,W2,H2,k){const H={hand:['.sh',9.2,1.2],ibeam:['.si',13,14],busy:['.sb',13,14]};for(const n in H){const el=document.querySelector('#cur '+H[n][0]);if(!el)continue;try{const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W2*k+'" height="'+H2*k+'" viewBox="0 0 26 28"><style>.ln{fill:none;stroke:#111;stroke-width:1;stroke-linecap:round}</style>'+el.innerHTML+'</svg>';const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});const c=document.createElement('canvas');c.width=W2*k;c.height=H2*k;c.getContext('2d').drawImage(img,0,0);await NW.setExeCursor({png:c.toDataURL('image/png'),w:W2,h:H2,vw:innerWidth,shape:n,hx:H[n][1]/26,hy:H[n][2]/28})}catch(e){}}if(NW.setExeShapes)try{await NW.setExeShapes({on:S.exs!=='off'})}catch(e){}}
'''
TAIL_OLD = "await NW.setExeCursor({png:c.toDataURL('image/png'),w:W2,h:H2,vw:innerWidth})}"
TAIL_NEW = "await NW.setExeCursor({png:c.toDataURL('image/png'),w:W2,h:H2,vw:innerWidth});try{await pushShapes(cf,ck,W2,H2,k)}catch(e){}}"
p = 'src/index.html'
s = rd(p)
if '/*SHAPES-3.2.10*/' in s:
    print('index.html already patched, skipping')
else:
    assert '/*CLIP-3.2.9*/' in s, 'Run scripts/apply-3.2.9.py first.'
    s = rep(s, 'async function pushCursor(){', PUSHSH + 'async function pushCursor(){', 'pushShapes')
    s = rep(s, TAIL_OLD, TAIL_NEW, 'pushCursor tail')
    s = rep(s, "S.exc=ls('aur.exc')==='off'?'off':'on';", "S.exc=ls('aur.exc')==='off'?'off':'on';S.exs=ls('aur.exs')==='off'?'off':'on';", 'S.exs')
    s = rep(s, "'Show visible part':'Hide fully')}", "'Show visible part':'Hide fully')}<h4>Windows programs: cursor shapes</h4>${chips('exs',['on','off'],S.exs,v=>v==='on'?'NexOS shapes (when known)':'Wine shapes')}", 'chips')
    s = rep(s, "else if(k==='exc'){", "else if(k==='exs'){S.exs=v==='off'?'off':'on';ls('aur.exs',S.exs);if(NW&&NW.setExeShapes)NW.setExeShapes({on:S.exs!=='off'}).catch(()=>{})}else if(k==='exc'){", 'setting')
    n = s.count("'Installed version','3.2.9'"); assert n >= 1, 'PATCH FAILED (version): not found'
    s = s.replace("'Installed version','3.2.9'", "'Installed version','3.2.10'")
    if shutil.which('node'):
        for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
            body = m.group(1)
            if not body.strip(): continue
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(body)
            r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True); os.unlink(t.name)
            assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    wr(p, s); print('index.html patched')

pj = rd('package.json'); pj2 = re.sub(r'("version"\s*:\s*")[^"]*(")', r'\g<1>3.2.10\g<2>', pj, count=1)
if pj2 != pj: wr('package.json', pj2); print('package.json -> 3.2.10')
d = rd('DEV-NOTES.md')
if '## 3.2.10' not in d:
    wr('DEV-NOTES.md', d.rstrip('\n') + '''

## 3.2.10 - NexOS cursor shapes for Wine (aurora-shapes-3.2.10)
- NexOS has 4 cursor shapes in #cur: arrow (.sa), hand (.sh), I-beam (.si), busy (.sb, static frame). pushShapes sends hand/ibeam/busy with their hotspot (fractions of the 26x28 box).
- Java shapeOf(cursor): hotspot (0,0) = arrow; else crc lookup in Download/aurora-cursor-map.txt ("crc=hand|ibeam|busy|arrow|wine"), else guessShape (hand + I-beam only, geometry, UNVERIFIED). null = Wine's own cursor. aurora-cursors.txt now shows guess= per cursor: compare with the real shape, then add exact crc lines / a built-in table.
- Setting aur.exs (default on); off = 3.2.9 behaviour.
''' + '\n'); print('DEV-NOTES.md updated')
nx = rd('NEXT.md')
if 'Done in 3.2.10' not in nx:
    wr('NEXT.md', nx.rstrip('\n') + '''

## Done in 3.2.10
- Cursor shapes (map file + guess). Phone test pending. Next: built-in crc table from verified aurora-cursors.txt.
''' + '\n'); print('NEXT.md updated')
print('OK')
