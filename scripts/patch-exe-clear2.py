"""aurora-clear2-3.2.15 (build-time, called at the end of patch-exe-clear.py, from the repo root).
Extra safety against the black Wine screen, read from Winlator 8077f37: the XServerDisplayActivity sets no background itself, so
the remaining opaque candidates are the activity window/decor background, the DrawerLayout/FrameLayout root and the surface format.
After rootView.addView(xServerView): window + decor + DrawerLayout + FrameLayout are made transparent and the holder format is
set to TRANSLUCENT again (GLSurfaceView can reset it). Anchor must occur exactly once, otherwise nothing is written."""
from pathlib import Path
MARK = 'aurora-clear2-3.2.15'
A = Path('android/app/src/main/java/com/winlator/XServerDisplayActivity.java')
if not A.is_file():
    raise SystemExit('Missing %s' % A)
s = A.read_text(encoding='utf-8')
if MARK in s:
    print(MARK, 'already applied')
else:
    old = 'rootView.addView(xServerView);'
    c = s.count(old)
    if c != 1:
        raise SystemExit('PATCH FAILED (clear2): found %d places, expected 1' % c)
    new = (old + '\n        try { // ' + MARK + '\n'
           '            getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(0));\n'
           '            getWindow().getDecorView().setBackgroundColor(0);\n'
           '            rootView.setBackgroundColor(0);\n'
           '            View aurDl = findViewById(R.id.DrawerLayout);\n'
           '            if (aurDl != null) aurDl.setBackgroundColor(0);\n'
           '            xServerView.getHolder().setFormat(android.graphics.PixelFormat.TRANSLUCENT);\n'
           '        } catch (Throwable ignored) { }')
    A.write_text(s.replace(old, new), encoding='utf-8')
    print(MARK, 'applied: transparent window/decor/root + translucent holder')
