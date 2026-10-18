"""Part 3b (EXE embed): the Winlator program window sits on the rectangle of its Aurora OS window and reports its state.

Run after scripts/setup-winlator.py, scripts/patch-exe-window.py and scripts/patch-exe-diagnostics.py.
Only changes XServerDisplayActivity. Every anchor must occur exactly once, otherwise NOTHING is written.
  1. onCreate: puts the window on the intent extra "aurora_rect" (x,y,w,h in screen px) via AuroraWinePlugin.applyRect.
  2. The full-screen "Starting up..." dialog is skipped when aurora_rect is given (the state goes to Aurora OS instead).
  3. State events for the Aurora window: preparing, launching, running, error (AuroraWinePlugin.exeState).
  4. In-window status: a small "Starting.../Preparing.../Launching" panel inside the program window (removed when
     Wine shows its first window or on error), because the program window covers the Aurora window body.
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


METHODS = """private android.view.View auroraStatusView; // aurora-embed
    private android.widget.TextView auroraStatusText;

    private void auroraStatus(final String text) {
        if (!getIntent().hasExtra("aurora_rect")) return;
        runOnUiThread(() -> {
            FrameLayout root = findViewById(R.id.FLXServerDisplay);
            if (root == null || isFinishing()) return;
            if (text == null) {
                if (auroraStatusView != null) root.removeView(auroraStatusView);
                auroraStatusView = null;
                auroraStatusText = null;
                return;
            }
            if (auroraStatusView == null) {
                android.widget.LinearLayout box = new android.widget.LinearLayout(this);
                box.setOrientation(android.widget.LinearLayout.VERTICAL);
                box.setGravity(android.view.Gravity.CENTER);
                box.setBackgroundColor(0xFF111827);
                android.widget.ProgressBar pb = new android.widget.ProgressBar(this);
                pb.setIndeterminate(true);
                android.widget.TextView t = new android.widget.TextView(this);
                t.setTextColor(0xFFFFFFFF);
                t.setTextSize(15);
                t.setGravity(android.view.Gravity.CENTER);
                t.setPadding(24, 24, 24, 0);
                box.addView(pb);
                box.addView(t);
                root.addView(box, new FrameLayout.LayoutParams(-1, -1));
                auroraStatusView = box;
                auroraStatusText = t;
            }
            auroraStatusText.setText(text);
        });
    }"""

EDITS = [
    ('private String screenEffectProfile;',
     'private String screenEffectProfile;\n    ' + METHODS),
    ('setupUI();', 'setupUI(); auroraStatus("Starting...");'),
    ('AppUtils.hideSystemUI(this);',
     'AppUtils.hideSystemUI(this);\n        %s.applyRect(this, getIntent().getIntArrayExtra("aurora_rect")); // %s' % (P, MARK)),
    ('preloaderDialog.show(R.string.starting_up);',
     'if (!getIntent().hasExtra("aurora_rect")) preloaderDialog.show(R.string.starting_up);'),
    ('setupWineSystemFiles();',
     '%s.exeState("preparing", ""); auroraStatus("Preparing system files..."); setupWineSystemFiles();' % P),
    ('setupXEnvironment();',
     '%s.exeState("launching", ""); auroraStatus("Starting Wine..."); setupXEnvironment();' % P),
    ('auroraMapped = true;',
     'auroraMapped = true; %s.exeState("running", ""); auroraStatus(null);' % P),
    ('android.util.Log.e("AuroraWine", msg);',
     'android.util.Log.e("AuroraWine", msg); %s.exeState("error", msg); auroraStatus(null);' % P),
]
for old, _ in EDITS:
    n = xa.count(old)
    if n != 1:
        raise SystemExit('XServerDisplayActivity: anchor found %d times (need exactly 1): %s' % (n, old))

for old, new in EDITS:
    xa = xa.replace(old, new)
XA.write_text(xa, encoding='utf-8')
print('EXE embed patch applied: window rect, in-window state events')
