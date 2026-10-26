"""aurora-clear-3.2.13 (build-time, runs at the end of patch-exe-window.py, from the repo root).
Goal: no black Wine screen. The program window shows only the program; Aurora OS is visible wherever Wine draws nothing.
Cause (read from Winlator source 8077f37): GLRenderer draws the Wine desktop window (explorer.exe, black) and the GL surface
is opaque. Changes (each anchor must occur exactly once, otherwise nothing is written):
  1. GLRenderer: public static flag auroraClear (default false); when true, windows with isDesktopWindow() are not drawn
     (their children still are).
  2. XServerView: translucent surface format (the EGL config already has alpha, glClearColor alpha is already 0).
  3. AuroraExeWindow theme: transparent window background."""
from pathlib import Path
MARK = 'aurora-clear-3.2.13'
J = Path('android/app/src/main/java/com/winlator')
GL, XV = J / 'renderer/GLRenderer.java', J / 'widget/XServerView.java'
STY = Path('android/app/src/main/res/values/aurora_exe_window.xml')
for p in (GL, XV, STY):
    if not p.is_file():
        raise SystemExit('Missing %s: run setup-winlator.py and patch-exe-window.py first' % p)

def rep(s, old, new, name):
    c = s.count(old)
    if c != 1:
        raise SystemExit('PATCH FAILED (%s): found %d places, expected 1' % (name, c))
    return s.replace(old, new)

g = GL.read_text(encoding='utf-8')
x = XV.read_text(encoding='utf-8')
y = STY.read_text(encoding='utf-8')
if MARK not in g:
    g = rep(g, 'private boolean cursorVisible = true;',
            'private boolean cursorVisible = true;\n    public static volatile boolean auroraClear = false; // ' + MARK, 'flag')
    g = rep(g, 'if (window != xServer.windowManager.rootWindow && window.attributes.isViewable()) {',
            'if (window != xServer.windowManager.rootWindow && window.attributes.isViewable() && !(auroraClear && window.isDesktopWindow())) {', 'skip desktop')
if MARK not in x:
    x = rep(x, 'setEGLConfigChooser(8, 8, 8, 8, 0, 0);',
            'setEGLConfigChooser(8, 8, 8, 8, 0, 0);\n        getHolder().setFormat(android.graphics.PixelFormat.TRANSLUCENT); // ' + MARK, 'format')
if 'android:windowBackground' not in y:
    y = rep(y, '<item name="android:windowAnimationStyle">@null</item>',
            '<item name="android:windowAnimationStyle">@null</item>\n        <item name="android:windowBackground">@android:color/transparent</item> <!-- ' + MARK + ' -->', 'theme')
GL.write_text(g, encoding='utf-8'); XV.write_text(x, encoding='utf-8'); STY.write_text(y, encoding='utf-8')
print('aurora-clear applied: Wine desktop not drawn, translucent surface, transparent window background')
