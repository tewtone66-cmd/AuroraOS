"""Part 3b (EXE embed): the Winlator program window sits on the rectangle of its Aurora OS window and reports its state.

Run after scripts/setup-winlator.py, scripts/patch-exe-window.py and scripts/patch-exe-diagnostics.py.
Only changes XServerDisplayActivity. Every anchor must occur exactly once, otherwise NOTHING is written.
  1. onCreate: puts the window on the intent extra "aurora_rect" (x,y,w,h in screen px) via AuroraWinePlugin.applyRect.
  2. The full-screen "Starting up..." dialog is skipped when aurora_rect is given (the state goes to Aurora OS instead).
  3. State events for the Aurora window: preparing, launching, running, error (AuroraWinePlugin.exeState).
Without the aurora_rect extra every behaviour stays exactly as before (fallback).
"""
import json
from pathlib import Path

MARK = 'aurora-embed'
APP_ID = json.loads(Path('capacitor.config.json').read_text(encoding='utf-8'))['appId']
XA = Path('android/app/src/main/java/com/winlator/XServerDisplayActivity.java')
if not XA.is_file():
    raise SystemExit('Missing %s: run scripts/setup-winlator.py first' % XA)
if 'aurora-diag' not in XA.read_text(encoding='utf-8'):
    raise SystemExit('Run scripts/patch-exe-diagnostics.py before this patch')

P = APP_ID + '.AuroraWinePlugin'
xa = XA.read_text(encoding='utf-8')
if MARK in xa:
    print('EXE embed patch already applied')
    raise SystemExit(0)

EDITS = [
    ('AppUtils.hideSystemUI(this);',
     'AppUtils.hideSystemUI(this);\n        %s.applyRect(this, getIntent().getIntArrayExtra("aurora_rect")); // %s' % (P, MARK)),
    ('preloaderDialog.show(R.string.starting_up);',
     'if (!getIntent().hasExtra("aurora_rect")) preloaderDialog.show(R.string.starting_up);'),
    ('setupWineSystemFiles();',
     '%s.exeState("preparing", ""); setupWineSystemFiles();' % P),
    ('setupXEnvironment();',
     '%s.exeState("launching", ""); setupXEnvironment();' % P),
    ('auroraMapped = true;',
     'auroraMapped = true; %s.exeState("running", "");' % P),
    ('android.util.Log.e("AuroraWine", msg);',
     'android.util.Log.e("AuroraWine", msg); %s.exeState("error", msg);' % P),
]
for old, _ in EDITS:
    n = xa.count(old)
    if n != 1:
        raise SystemExit('XServerDisplayActivity: anchor found %d times (need exactly 1): %s' % (n, old))

for old, new in EDITS:
    xa = xa.replace(old, new)
XA.write_text(xa, encoding='utf-8')
print('EXE embed patch applied: window rect, in-window state events')
