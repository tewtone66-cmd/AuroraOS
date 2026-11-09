"""p08c (build time): the Aurora mouse is drawn inside XServerDisplayActivity and Wine's own cursor is hidden.
Run after patch-exe-embed.py. Every anchor must occur exactly once, otherwise NOTHING is written."""
import json
from pathlib import Path

APP_ID = json.loads(Path('capacitor.config.json').read_text(encoding='utf-8'))['appId']
XA = Path('android/app/src/main/java/com/winlator/XServerDisplayActivity.java')
if not XA.is_file():
    raise SystemExit('Missing %s: run scripts/setup-winlator.py first' % XA)
xa = XA.read_text(encoding='utf-8')
if 'aurora-embed' not in xa:
    raise SystemExit('Run scripts/patch-exe-embed.py before this patch')
if 'aurora-p08' in xa:
    print('p08 cursor patch already applied')
    raise SystemExit(0)
P = APP_ID + '.AuroraWinePlugin'
anchor = 'rootView.addView(inputControlsView);'
if xa.count(anchor) != 1:
    raise SystemExit('XServerDisplayActivity: %r found %d times (need 1)' % (anchor, xa.count(anchor)))
if xa.count('setCursorVisible(true)') < 1:
    raise SystemExit('XServerDisplayActivity: setCursorVisible(true) not found')
xa = xa.replace(anchor, anchor + '\n        if (getIntent().hasExtra("aurora_rect")) %s.cursorOverlay(this, rootView, xServer); // aurora-p08' % P)
xa = xa.replace('setCursorVisible(true)', 'setCursorVisible(%s.xCursor(getIntent()))' % P)
XA.write_text(xa, encoding='utf-8')
print('p08 cursor patch applied: Aurora cursor overlay, Wine cursor hidden')

# aurora-d3d: Direct3D mode patch (Roblox DX11 FL10+), run here so the CI workflow needs no change
import subprocess, sys
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-d3d.py'))])

# aurora-xinput: answer XInput ListInputDevices with an empty list (Roblox Studio startup crash)
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-xinput.py'))])
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-update.py'))])
