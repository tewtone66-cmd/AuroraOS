"""Diagnostics for the Winlator "Starting up..." hang.

Run after scripts/setup-winlator.py and scripts/patch-exe-window.py.
Upstream Winlator swallows every error while spawning box64 (empty catch block), so a failed start
looks like an endless "Starting up...". This patch changes ONLY error reporting, not behavior:

  1. ProcessHelper: remembers the root cause of a failed spawn (ProcessHelper.lastError) and sends the
     guest program's stdout/stderr to <rootfs>/tmp/aurora-guest.log instead of /dev/null.
  2. GuestProgramLauncherComponent: if the spawn failed, shows the error.
  3. XServerDisplayActivity: red banner at the TOP of the screen (tap = close). Shown when
     - the spawn failed,
     - Wine exited before any window appeared (with exit status),
     - no Wine window appeared after 60 s (still running, maybe just slow).
     The banner also shows the last lines of the guest log.

Every anchor must occur exactly once, otherwise nothing is written and the build fails loudly.
"""
import re
from pathlib import Path

MARK = 'aurora-diag'
BASE = Path('android/app/src/main/java/com/winlator')
PH = BASE / 'core/ProcessHelper.java'
GL = BASE / 'xenvironment/components/GuestProgramLauncherComponent.java'
XA = BASE / 'XServerDisplayActivity.java'

for p in (PH, GL, XA):
    if not p.is_file():
        raise SystemExit('Missing %s: run scripts/setup-winlator.py first' % p)


def once(text, needle, what):
    n = text.count(needle)
    if n != 1:
        raise SystemExit('%s: anchor found %d times (need exactly 1): %s' % (what, n, needle))


# ---------------- ProcessHelper ----------------
ph = PH.read_text(encoding='utf-8')
if MARK not in ph:
    a1 = 'private static final ArrayList<Callback<String>> debugCallbacks = new ArrayList<>();'
    once(ph, a1, 'ProcessHelper field')
    a2 = 'if (debugCallbacks.isEmpty()) processBuilder.redirectOutput(new File("/dev/null")).redirectErrorStream(true);'
    once(ph, a2, 'ProcessHelper redirect')
    sig = re.compile(r'(public static int exec\(String command, EnvVars envVars, File workingDir, Callback<Integer> terminationCallback\) \{)')
    if len(sig.findall(ph)) != 1:
        raise SystemExit('ProcessHelper: exec signature not found exactly once')
    catch = re.compile(r'catch \(Exception e\) \{\}(\s*)return pid;')
    if len(catch.findall(ph)) != 1:
        raise SystemExit('ProcessHelper: exec catch block not found exactly once')

    ph = ph.replace(a1, a1 + ' // ' + MARK + '\n    public static volatile String lastError = null;')
    ph = ph.replace(a2,
        'if (debugCallbacks.isEmpty()) processBuilder.redirectOutput(workingDir != null && new File(workingDir, "tmp").isDirectory() '
        '? new File(new File(workingDir, "tmp"), "aurora-guest.log") : new File("/dev/null")).redirectErrorStream(true);')
    ph = sig.sub(r'\1\n        lastError = null; // ' + MARK, ph)
    ph = catch.sub(
        'catch (Exception e) {\n'
        '            Throwable root = e;\n'
        '            while (root.getCause() != null) root = root.getCause();\n'
        '            String first = command == null ? "" : command.split(" ")[0];\n'
        '            lastError = root + "\\n(" + first + ")";\n'
        '        }\\1return pid;', ph)
    PH.write_text(ph, encoding='utf-8')

# ---------------- GuestProgramLauncherComponent ----------------
gl = GL.read_text(encoding='utf-8')
if MARK not in gl:
    a = 'pid = execGuestProgram();'
    once(gl, a, 'GuestProgramLauncherComponent start')
    gl = gl.replace(a, a + ' // ' + MARK + '\n'
        '            if (pid == -1 && environment.getContext() instanceof com.winlator.XServerDisplayActivity) {\n'
        '                ((com.winlator.XServerDisplayActivity)environment.getContext()).auroraError('
        '"Wine could not be started:\\n" + com.winlator.core.ProcessHelper.lastError);\n'
        '            }')
    GL.write_text(gl, encoding='utf-8')

# ---------------- XServerDisplayActivity ----------------
xa = XA.read_text(encoding='utf-8')
if MARK not in xa:
    f = 'private String screenEffectProfile;'
    once(xa, f, 'XServerDisplayActivity field')
    p1 = 'final PreloaderDialog preloaderDialog = new PreloaderDialog(this);'
    once(xa, p1, 'XServerDisplayActivity preloader')
    p2 = 'preloaderDialog.closeOnUiThread();'
    once(xa, p2, 'XServerDisplayActivity preloader close')
    p3 = 'setupUI();'
    once(xa, p3, 'XServerDisplayActivity setupUI call')
    p4 = 'guestProgramLauncherComponent.setTerminationCallback((status) -> exit());'
    once(xa, p4, 'XServerDisplayActivity termination callback')

    methods = '''private PreloaderDialog auroraPreloader; // aurora-diag
    private volatile boolean auroraMapped = false;
    private android.widget.TextView auroraBanner;

    private void auroraWatchdog() {
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (!auroraMapped && !isFinishing()) auroraError("No Wine window after 60 s (still running - may just be a slow first start).");
        }, 60000);
    }

    private String auroraLogTail() {
        try {
            java.io.File f = new java.io.File(rootFS.getRootDir(), "tmp/aurora-guest.log");
            if (!f.isFile() || f.length() == 0) return "";
            long len = f.length();
            int n = (int)Math.min(len, 1200);
            byte[] b = new byte[n];
            try (java.io.RandomAccessFile r = new java.io.RandomAccessFile(f, "r")) {
                r.seek(len - n);
                r.readFully(b);
            }
            return "\\n\\n--- guest output ---\\n" + new String(b, "UTF-8");
        }
        catch (Exception e) {
            return "";
        }
    }

    public void auroraError(final String msg0) {
        final String msg = msg0 + auroraLogTail();
        android.util.Log.e("AuroraWine", msg);
        runOnUiThread(() -> {
            if (isFinishing()) return;
            if (auroraPreloader != null) auroraPreloader.close();
            FrameLayout root = findViewById(R.id.FLXServerDisplay);
            if (root == null) return;
            if (auroraBanner != null) root.removeView(auroraBanner);
            android.widget.TextView t = new android.widget.TextView(this);
            t.setText(msg + "\\n\\n(tap to close)");
            t.setTextColor(0xffffffff);
            t.setBackgroundColor(0xF0B00020);
            t.setTextSize(13);
            int pad = (int)(12 * getResources().getDisplayMetrics().density);
            t.setPadding(pad, pad, pad, pad);
            t.setOnClickListener(v -> finish());
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(-1, -2);
            lp.gravity = android.view.Gravity.TOP;
            root.addView(t, lp);
            auroraBanner = t;
        });
    }'''
    xa = xa.replace(f, f + '\n    ' + methods)
    xa = xa.replace(p1, 'final PreloaderDialog preloaderDialog = auroraPreloader = new PreloaderDialog(this);')
    xa = xa.replace(p2, p2 + ' auroraMapped = true;')
    xa = xa.replace(p3, p3 + ' auroraWatchdog();')
    xa = xa.replace(p4,
        'guestProgramLauncherComponent.setTerminationCallback((status) -> {\n'
        '                if (!auroraMapped) auroraError("Wine exited with status " + status + " before showing any window.");\n'
        '                else exit();\n'
        '            });')
    XA.write_text(xa, encoding='utf-8')

print('EXE diagnostics patch applied (error banner, guest log, spawn error capture)')
