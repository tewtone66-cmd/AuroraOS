package com.auroraos.desktop;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Environment;
import android.view.Gravity;
import android.view.WindowManager;
import androidx.preference.PreferenceManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.winlator.XServerDisplayActivity;
import com.winlator.container.Container;
import com.winlator.container.ContainerManager;
import com.winlator.core.AppUtils;
import com.winlator.core.DefaultVersion;
import com.winlator.core.EnvVars;
import com.winlator.core.FileUtils;
import com.winlator.core.TarCompressorUtils;
import com.winlator.core.WineInfo;
import com.winlator.xenvironment.RootFS;
import com.winlator.xenvironment.RootFSInstaller;
import java.io.File;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.json.JSONObject;

/**
 * Windows program runner built on the Winlator core (Wine + Box64/Box86), compiled into this app.
 * Part 2: install the runtime, create a container, run an .exe and report its state.
 * Methods: status, init, runExe, stopExe, listRunning, setExeRect, minimizeExe, restoreExe.
 * Events: progress {step,pct}, exeStarted {id,path}, exeExited {id,path},
 *         exeState {id,path,state,msg} with state = preparing | launching | running | error.
 * Rect objects use CSS pixels of the Aurora page: {x, y, w, h, vw, vh} (vw/vh = window.innerWidth/innerHeight).
 */
@CapacitorPlugin(name = "AuroraWine")
public class AuroraWinePlugin extends Plugin {
    private static volatile AuroraWinePlugin inst;
    private volatile boolean busy = false;
    private int runSeq = 0;
    private int curId = 0;
    private String curPath = "";
    private Activity curActivity = null;
    private volatile long lastRunStart = 0;
    /** One-line result of the last Java install attempt; written to Download/aurora-wine.log (not an app error). */
    private volatile String javaNote = "";

    /** Called from the patched XServerDisplayActivity (aurora-embed). Safe from any thread. */
    public static void exeState(String state, String msg) {
        AuroraWinePlugin p = inst;
        if (p == null) return;
        JSObject o = new JSObject();
        o.put("id", p.curId);
        o.put("path", p.curPath);
        o.put("state", state);
        String m = msg == null ? "" : msg;
        o.put("msg", m.length() > 600 ? m.substring(0, 600) : m);
        p.notifyListeners("exeState", o);
    }

    /** Puts the program window on a screen rectangle {x, y, w, h} (pixels); touches outside it reach Aurora OS. */
    public static void applyRect(Activity a, int[] r) {
        if (a == null || r == null || r.length < 4) return;
        android.view.Window w = a.getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        WindowManager.LayoutParams lp = w.getAttributes();
        if (lp.x == r[0] && lp.y == r[1] && lp.width == r[2] && lp.height == r[3] && lp.gravity == (Gravity.TOP | Gravity.LEFT)) return; // aurora-p08
        lp.gravity = Gravity.TOP | Gravity.LEFT;
        lp.x = r[0];
        lp.y = r[1];
        lp.width = r[2];
        lp.height = r[3];
        w.setAttributes(lp);
    }

    /** CSS-pixel rect of the Aurora page -> screen pixels. Must run on the UI thread. Returns null when unusable. */
    private int[] rectToScreen(JSONObject o) {
        if (o == null) return null;
        try {
            double vw = o.optDouble("vw", 0), vh = o.optDouble("vh", 0);
            android.webkit.WebView wv = getBridge().getWebView();
            if (vw <= 0 || vh <= 0 || wv == null || wv.getWidth() <= 0 || wv.getHeight() <= 0) return null;
            int[] loc = new int[2];
            wv.getLocationOnScreen(loc);
            double sx = wv.getWidth() / vw, sy = wv.getHeight() / vh;
            int w = (int) Math.round(o.optDouble("w", 0) * sx);
            int h = (int) Math.round(o.optDouble("h", 0) * sy);
            if (w < 64 || h < 64) return null;
            return new int[]{loc[0] + (int) Math.round(o.optDouble("x", 0) * sx),
                loc[1] + (int) Math.round(o.optDouble("y", 0) * sy), w, h};
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public void load() {
        inst = this;
        try { // aurora-p08c: the back button goes to the Aurora page (blue "keep / shut down" screen)
            getActivity().getOnBackPressedDispatcher().addCallback(getActivity(), new androidx.activity.OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    notifyListeners("backPressed", new JSObject());
                }
            });
        } catch (Throwable ignored) { }
        Application app = (Application) getContext().getApplicationContext();
        app.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks() {
            @Override
            public void onActivityCreated(Activity a, Bundle state) {
                if (a instanceof XServerDisplayActivity) {
                    curActivity = a;
                    JSObject o = new JSObject();
                    o.put("id", curId);
                    o.put("path", curPath);
                    notifyListeners("exeStarted", o);
                }
            }

            @Override
            public void onActivityStarted(Activity a) { }

            @Override
            public void onActivityResumed(Activity a) { if (a == getActivity()) notifyListeners("appResumed", new JSObject()); }

            @Override
            public void onActivityPaused(Activity a) { }

            @Override
            public void onActivityStopped(Activity a) { }

            @Override
            public void onActivitySaveInstanceState(Activity a, Bundle state) { }

            @Override
            public void onActivityDestroyed(Activity a) {
                if (a == curActivity) {
                    curActivity = null;
                    JSObject o = new JSObject();
                    o.put("id", curId);
                    o.put("path", curPath);
                    notifyListeners("exeExited", o);
                }
            }
        });
    }

    private void progress(String step, int pct) {
        JSObject p = new JSObject();
        p.put("step", step);
        p.put("pct", pct);
        notifyListeners("progress", p);
    }

    private boolean runtimeReady(Context ctx) {
        RootFS rfs = RootFS.find(ctx);
        return rfs.isValid() && rfs.getVersion() >= RootFSInstaller.LATEST_VERSION;
    }

    private static File box64File(Context ctx) {
        return new File(RootFS.find(ctx).getRootDir(), "usr/local/bin/box64");
    }

    /** box64 lives in its own archive; unpack it whenever the binary is missing (even if a version was already recorded). */
    private void ensureBox64(Context ctx) throws Exception {
        File bin = box64File(ctx);
        if (bin.isFile() && bin.length() > 0) {
            bin.setExecutable(true, false);
            return;
        }
        SharedPreferences.Editor ed = PreferenceManager.getDefaultSharedPreferences(ctx).edit();
        ed.putString("box64_version", DefaultVersion.BOX64);
        ed.remove("current_box64_version");
        ed.apply();
        File rootDir = RootFS.find(ctx).getRootDir();
        new File(rootDir, "usr/local/bin").mkdirs();
        boolean ok = TarCompressorUtils.extract(TarCompressorUtils.Type.ZSTD, ctx,
            "box64/box64-" + DefaultVersion.BOX64 + ".tzst", rootDir);
        if (!ok || !bin.isFile()) throw new Exception("Could not install the x86 translator (box64)");
        bin.setExecutable(true, false);
        PreferenceManager.getDefaultSharedPreferences(ctx).edit()
            .putString("current_box64_version", DefaultVersion.BOX64).apply();
    }

    // ---------------------------------------------------------------- Java for Windows programs (C:\Java)

    private static final String JAVA_ZIP = "aurora-java.zip";

    /**
     * When Download/aurora-java.zip exists and C:\Java does not exist in the container's Wine prefix, unpacks the zip
     * into drive_c/Java (one common top-level folder inside the zip is dropped, so Java/bin/javaw.exe is direct).
     * The zip is unpacked into a temporary folder first and renamed at the end, so a half-finished unpack never
     * looks like an installed Java. Never throws: a failure is only noted in aurora-wine.log, ordinary programs
     * keep starting.
     */
    private void ensureJava(Context ctx, int containerId) {
        javaNote = "";
        File tmp = null;
        try {
            File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File zip = dl == null ? null : new File(dl, JAVA_ZIP);
            if (zip == null || !zip.isFile() || zip.length() == 0) return;
            Container c = new ContainerManager(ctx).getContainerById(containerId);
            if (c == null || c.getRootDir() == null) return;
            File driveC = new File(c.getRootDir(), ".wine/drive_c");
            if (!driveC.isDirectory()) {
                javaNote = "java: skipped, drive_c not found in the container";
                return;
            }
            if (resolveCI(driveC, "Java") != null) return;
            exeState("preparing", "Installing Java (first run)...");
            tmp = new File(driveC, ".aurora-java-tmp");
            if (tmp.exists()) FileUtils.delete(tmp);
            int n = unzipJava(zip, tmp);
            File javaw = resolveCI(tmp, "bin/javaw.exe");
            if (javaw == null || !javaw.isFile()) throw new Exception(JAVA_ZIP + " has no bin/javaw.exe");
            if (!tmp.renameTo(new File(driveC, "Java"))) throw new Exception("could not rename the temporary folder to C:\\Java");
            tmp = null;
            javaNote = "java: installed C:\\Java from " + JAVA_ZIP + " (" + n + " files)";
        } catch (Throwable e) {
            javaNote = "java: install FAILED: " + e;
            if (tmp != null) FileUtils.delete(tmp);
        }
    }

    /** Zip entry name with '/' separators, without leading or trailing slashes ("" for nothing). */
    private static String zipName(String raw) {
        String s = raw.replace('\\', '/');
        while (s.startsWith("/")) s = s.substring(1);
        while (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        return s;
    }

    /**
     * Unpacks zip into the new folder dest. A single common top-level folder is dropped. Entries that would land
     * outside dest (zip-slip: "..", absolute paths) abort the unpack. Returns the number of files written.
     */
    private static int unzipJava(File zip, File dest) throws Exception {
        if (!dest.mkdirs()) throw new Exception("could not create " + dest.getPath());
        final String destCanon = dest.getCanonicalPath() + File.separator;
        try (java.util.zip.ZipFile zf = new java.util.zip.ZipFile(zip)) {
            String top = null;
            boolean strip = true, nested = false, any = false;
            java.util.Enumeration<? extends java.util.zip.ZipEntry> en = zf.entries();
            while (en.hasMoreElements()) {
                java.util.zip.ZipEntry e = en.nextElement();
                String nm = zipName(e.getName());
                if (nm.isEmpty()) continue;
                any = true;
                int i = nm.indexOf('/');
                if (i < 0 && !e.isDirectory()) {
                    strip = false;
                    break;
                }
                String first = i < 0 ? nm : nm.substring(0, i);
                if (top == null) top = first;
                else if (!top.equals(first)) {
                    strip = false;
                    break;
                }
                if (i >= 0) nested = true;
            }
            if (!any) throw new Exception("the zip is empty");
            strip = strip && nested;

            int files = 0;
            byte[] buf = new byte[65536];
            en = zf.entries();
            while (en.hasMoreElements()) {
                java.util.zip.ZipEntry e = en.nextElement();
                String nm = zipName(e.getName());
                if (nm.isEmpty()) continue;
                if (strip) {
                    int i = nm.indexOf('/');
                    if (i < 0) continue;
                    nm = nm.substring(i + 1);
                    if (nm.isEmpty()) continue;
                }
                File out = new File(dest, nm);
                if (("/" + nm + "/").contains("/../") || !(out.getCanonicalPath() + File.separator).startsWith(destCanon)) {
                    throw new Exception("unsafe path in zip: " + e.getName());
                }
                if (e.isDirectory()) {
                    if (!out.isDirectory() && !out.mkdirs()) throw new Exception("could not create " + out.getPath());
                    continue;
                }
                File parent = out.getParentFile();
                if (parent != null && !parent.isDirectory() && !parent.mkdirs()) throw new Exception("could not create " + parent.getPath());
                try (java.io.InputStream in = zf.getInputStream(e); java.io.FileOutputStream fo = new java.io.FileOutputStream(out)) {
                    int r;
                    while ((r = in.read(buf)) > 0) fo.write(buf, 0, r);
                }
                out.setExecutable(true, false);
                long t = e.getTime();
                if (t > 0) out.setLastModified(t);
                files++;
            }
            return files;
        }
    }

    private static final String JAVA_HOME_WIN = "C:\\Java";
    private static final String JAVA_BIN_WIN = "C:\\Java\\bin";

    /** True when the ';'-separated Windows path list already has dir (case-insensitive, trailing '\' ignored). */
    private static boolean hasPathEntry(String list, String dir) {
        if (list == null) return false;
        for (String part : list.split(";")) {
            String p = part.trim();
            while (p.endsWith("\\")) p = p.substring(0, p.length() - 1);
            if (p.equalsIgnoreCase(dir)) return true;
        }
        return false;
    }

    /**
     * Once C:\Java\bin\javaw.exe exists, makes the container's saved envVars (key "envVars" in its .container file,
     * which XServerDisplayActivity reads at every start and hands to the Wine process) contain JAVA_HOME=C:\Java and
     * C:\Java\bin in WINEPATH. Wine prepends WINEPATH to the Windows PATH; PATH itself must not be set there, because
     * the container envVars are applied after the launcher's own Linux PATH and would replace it. Runs for existing
     * containers too and only writes the file when something changes. Never throws.
     */
    private void ensureJavaEnv(Context ctx, int containerId) {
        try {
            Container c = new ContainerManager(ctx).getContainerById(containerId);
            if (c == null || c.getRootDir() == null) return;
            File javaw = resolveCI(new File(c.getRootDir(), ".wine/drive_c"), "Java/bin/javaw.exe");
            if (javaw == null || !javaw.isFile()) return;
            EnvVars env = new EnvVars(c.getEnvVars());
            boolean changed = false;
            if (!JAVA_HOME_WIN.equals(env.get("JAVA_HOME"))) {
                env.put("JAVA_HOME", JAVA_HOME_WIN);
                changed = true;
            }
            String wp = env.get("WINEPATH");
            if (!hasPathEntry(wp, JAVA_BIN_WIN)) {
                env.put("WINEPATH", wp.isEmpty() ? JAVA_BIN_WIN : JAVA_BIN_WIN + ";" + wp);
                changed = true;
            }
            if (!"-Dsun.java2d.d3d=false".equals(env.get("JAVA_TOOL_OPTIONS"))) {
                env.put("JAVA_TOOL_OPTIONS", "-Dsun.java2d.d3d=false");
                changed = true;
            }
            if (!changed) return;
            c.setEnvVars(env.toString());
            c.saveData();
            addJavaNote("java env: container " + containerId + " now has JAVA_HOME=" + JAVA_HOME_WIN + " and WINEPATH=" + env.get("WINEPATH"));
        } catch (Throwable e) {
            addJavaNote("java env: update FAILED: " + e);
        }
    }

    // ---------------------------------------------------------------- optional Wine debug output (diagnostics only)

    private static final String DEBUG_FLAG = "aurora-debug.txt";
    private static final String DEBUG_DEFAULT = "+err,+loaddll,+process,+seh";

    private static File debugFlagFile() {
        File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        return dl == null ? null : new File(dl, DEBUG_FLAG);
    }

    /** WINEDEBUG value wanted by Download/aurora-debug.txt: "" = file absent (debug off); an empty file = default channels. */
    private String wantedWineDebug() {
        File flag = debugFlagFile();
        if (flag == null || !flag.isFile()) return "";
        try {
            String s = new String(java.nio.file.Files.readAllBytes(flag.toPath()), java.nio.charset.StandardCharsets.UTF_8).trim();
            int nl = s.indexOf('\n');
            if (nl >= 0) s = s.substring(0, nl);
            s = s.trim().replaceAll("\\s+", ",").replaceAll("^,+|,+$", "");
            if (s.isEmpty()) return DEBUG_DEFAULT;
            if (s.matches("[A-Za-z0-9+,_\\-]+")) return s;
            addJavaNote("wine debug: invalid text in " + DEBUG_FLAG + ", using " + DEBUG_DEFAULT);
        } catch (Exception e) {
            addJavaNote("wine debug: could not read " + DEBUG_FLAG + ": " + e);
        }
        return DEBUG_DEFAULT;
    }

    /**
     * Download/aurora-debug.txt present -> the container's envVars get WINEDEBUG (the file's first line, or default
     * channels when the file is empty); file absent -> WINEDEBUG is removed again. Container envVars are applied after
     * Winlator's own WINEDEBUG=-all, so they win. Without the file nothing changes. Never throws.
     */
    private void ensureWineDebug(Context ctx, int containerId) {
        try {
            Container c = new ContainerManager(ctx).getContainerById(containerId);
            if (c == null || c.getRootDir() == null) return;
            String want = wantedWineDebug();
            EnvVars env = new EnvVars(c.getEnvVars());
            if (want.equals(env.get("WINEDEBUG"))) return;
            if (want.isEmpty()) env.remove("WINEDEBUG");
            else env.put("WINEDEBUG", want);
            c.setEnvVars(env.toString());
            c.saveData();
            addJavaNote("wine debug: WINEDEBUG=" + (want.isEmpty() ? "(off)" : want));
        } catch (Throwable e) {
            addJavaNote("wine debug: update FAILED: " + e);
        }
    }

    /** DXVK needs Vulkan, which this device lacks (DXVK throws and Wine crashes). Use Wine's own d3d instead. Never throws. */
    private void ensureWineD3D(Context ctx, int containerId) {
        try {
            Container c = new ContainerManager(ctx).getContainerById(containerId);
            if (c == null || c.getRootDir() == null) return;
            if ("wined3d".equals(c.getDXWrapper())) return;
            c.setDXWrapper("wined3d");
            c.saveData();
            addJavaNote("dxwrapper: container " + containerId + " switched to wined3d");
        } catch (Throwable e) {
            addJavaNote("dxwrapper: update FAILED: " + e);
        }
    }

    // aurora-p08: kill leftover wineserver/wine/box64 processes of an earlier run (they cause the esync error)
    private void killStaleWine() {
        int killed = 0;
        try {
            int me = android.os.Process.myPid();
            String rootDir = RootFS.find(getContext()).getRootDir().getPath().toLowerCase();
            File[] ps = new File("/proc").listFiles();
            java.util.ArrayList<Integer> dead = new java.util.ArrayList<>();
            if (ps != null) {
                for (File p : ps) {
                    String n = p.getName();
                    if (!n.matches("\\d+")) continue;
                    int pid = Integer.parseInt(n);
                    if (pid == me) continue;
                    String cmd;
                    try (java.io.FileInputStream in = new java.io.FileInputStream(new File(p, "cmdline"))) {
                        byte[] b = new byte[4096];
                        int len = Math.max(0, in.read(b));
                        cmd = new String(b, 0, len, java.nio.charset.StandardCharsets.UTF_8).replace('\0', ' ').toLowerCase();
                    } catch (Exception e) {
                        continue;
                    }
                    if (cmd.contains("wineserver") || cmd.contains("wine64") || cmd.contains("box64") || cmd.contains(rootDir)) {
                        android.os.Process.killProcess(pid);
                        dead.add(pid);
                        killed++;
                    }
                }
            }
            long end = System.currentTimeMillis() + 1500;
            while (!dead.isEmpty() && System.currentTimeMillis() < end) {
                for (int i = dead.size() - 1; i >= 0; i--) if (!new File("/proc/" + dead.get(i)).exists()) dead.remove(i);
                if (!dead.isEmpty()) Thread.sleep(50);
            }
            addJavaNote("killStaleWine: killed " + killed + " old process(es), still alive " + dead.size());
        } catch (Throwable e) {
            addJavaNote("killStaleWine FAILED: " + e);
        }
    }

    // ---- aurora-p08c: exe visibility, Aurora cursor overlay, background run, back button ----
    private static volatile android.graphics.Bitmap cursorBmp;
    private static volatile int cursorW = 26, cursorH = 28;
    private static volatile boolean overlayOk = false;
    // aurora-fill-3.2.7: Fill/Keep aspect + mouse injection state (set by cursorOverlay)
    private static volatile boolean exeFill = true;
    private static volatile Object xsRef;
    private static volatile android.widget.FrameLayout fitRoot;
    private static volatile int xsW = 0, xsH = 0;
    private static volatile com.winlator.renderer.GLRenderer fitRend; // aurora-fill-3.2.8
    private static volatile long fitT = 0;
    private final android.os.Handler bgH = new android.os.Handler(android.os.Looper.getMainLooper());
    private Runnable bgR;

    /** false = hide Wine's own cursor (the Aurora cursor overlay is drawn instead). */
    public static boolean xCursor(Intent it) {
        return !(it != null && it.hasExtra("aurora_rect") && cursorBmp != null && overlayOk);
    }

    /** Called from XServerDisplayActivity.setupUI: draws the Aurora cursor image at the X pointer position. */
    public static void cursorOverlay(final Activity a, final android.widget.FrameLayout root, final Object xs) {
        try {
            final android.graphics.Bitmap bmp = cursorBmp;
            curNote("overlay: called, nexos cursor image=" + (bmp != null) + ", screen=" + (a == null ? "null" : a.getIntent().getStringExtra("aurora_screen")));
            if (bmp == null || a == null || root == null || xs == null) return;
            String scr = a.getIntent().getStringExtra("aurora_screen");
            if (scr == null || scr.indexOf('x') < 0) return;
            final int sw = Integer.parseInt(scr.substring(0, scr.indexOf('x')));
            final int sh = Integer.parseInt(scr.substring(scr.indexOf('x') + 1));
            if (sw <= 0 || sh <= 0) return;
            Object po = xs.getClass().getField("pointer").get(xs);
            if (!(po instanceof com.winlator.xserver.Pointer)) { curNote("overlay: xs.pointer is not a Pointer"); return; }
            final com.winlator.xserver.Pointer pt = (com.winlator.xserver.Pointer) po;
            xsRef = xs; fitRoot = root; xsW = sw; xsH = sh; // aurora-fill-3.2.7
            applyFit(root);
            final android.widget.ImageView iv = new android.widget.ImageView(a);
            iv.setImageBitmap(bmp);
            iv.setScaleType(android.widget.ImageView.ScaleType.FIT_XY);
            iv.setClickable(false);
            iv.setFocusable(false);
            root.addView(iv, new android.widget.FrameLayout.LayoutParams(cursorW, cursorH));
            overlayOk = true;
            curNote("overlay: running (frame loop started)");
            android.view.Choreographer.getInstance().postFrameCallback(new android.view.Choreographer.FrameCallback() {
                @Override
                public void doFrame(long t) {
                    if (a.isFinishing() || a.isDestroyed()) {
                        fitRoot = null; xsRef = null; fitRend = null;
                        overlayOk = false;
                        return;
                    }
                    int vw = vwOf(root), vh = vhOf(root);
                    if (vw > 0 && vh > 0) {
                        float[] fm = fitMap(vw, vh, sw, sh);
                        iv.setTranslationX(xvTx(root) + fm[0] + pt.getClampedX() * fm[1] - curHx);
                        iv.setTranslationY(xvTy(root) + fm[2] + pt.getClampedY() * fm[3] - curHy);
                        try { // aurora-fill-3.2.8: arrow = NexOS cursor, other shapes = Wine's own, hidden stays hidden
                            com.winlator.xserver.Window pw = ((com.winlator.xserver.XServer) xs).inputDeviceManager.getPointWindow();
                            com.winlator.xserver.Cursor cu = pw != null ? pw.attributes.getCursor() : null;
                            curState(pw != null, cu);
                            if (cu != null && cu != lastCu) { lastCu = cu; logCursor(cu); }
                            boolean hide = cu != null && !cu.isVisible();
                            String shp = (cu != null && cu.isVisible()) ? shapeOf(cu) : null;
                            android.graphics.Bitmap sbm = shp == null ? null : shapeBmp.get(shp);
                            float[] sht = sbm == null ? null : shapeHot.get(shp);
                            curHx = sht != null ? sht[0] : 0f;
                            curHy = sht != null ? sht[1] : 0f;
                            android.graphics.Bitmap wantB = sbm != null ? sbm : bmp;
                            if (iv.getTag() != wantB) { iv.setImageBitmap(wantB); iv.setTag(wantB); }
                            boolean own = cu != null && cu.isVisible() && (cu.hotSpotX != 0 || cu.hotSpotY != 0) && sbm == null && !"arrow".equals(shp);
                            int vis = (hide || own) ? android.view.View.INVISIBLE : android.view.View.VISIBLE;
                            if (iv.getVisibility() != vis) iv.setVisibility(vis);
                            com.winlator.renderer.GLRenderer rr = fitRend;
                            if (rr != null && rr.isCursorVisible() != own) rr.setCursorVisible(own);
                        } catch (Throwable ignored) { }
                    }
                    android.view.Choreographer.getInstance().postFrameCallback(this);
                }
            });
        } catch (Throwable e) {
            overlayOk = false;
        }
    }

    /** {png: dataURL, w, h, vw}: the Aurora mouse image and its size in CSS px (vw = page width in CSS px). */
    @PluginMethod
    public void setExeCursor(final PluginCall call) {
        final String png = call.getString("png");
        final double cw = call.getDouble("w", 26.0);
        final double ch = call.getDouble("h", 28.0);
        final double vw = call.getDouble("vw", 0.0);
        final String shape = call.getString("shape");
        final double shx = call.getDouble("hx", 0.0), shy = call.getDouble("hy", 0.0);
        new Thread(() -> {
            try {
                if (png != null) {
                    int c = png.indexOf(',');
                    byte[] b = android.util.Base64.decode(c >= 0 ? png.substring(c + 1) : png, android.util.Base64.DEFAULT);
                    android.graphics.Bitmap bm = android.graphics.BitmapFactory.decodeByteArray(b, 0, b.length);
                    if (bm != null) {
                        android.webkit.WebView wv = getBridge().getWebView();
                        double k = (vw > 0 && wv != null && wv.getWidth() > 0) ? wv.getWidth() / vw
                            : getContext().getResources().getDisplayMetrics().density;
                        cursorW = Math.max(8, (int) Math.round(cw * k));
                        cursorH = Math.max(8, (int) Math.round(ch * k));
                        if (shape == null) cursorBmp = bm;
                        else { shapeBmp.put(shape, bm); shapeHot.put(shape, new float[]{(float) (shx * cursorW), (float) (shy * cursorH)}); }
                    }
                }
            } catch (Throwable ignored) { }
            call.resolve();
        }, "aurora-cursor").start();
    }

    /** {v}: false hides the program window and lets touches through (an Aurora window is in front of it); true shows it. */
    @PluginMethod
    public void setExeVisible(final PluginCall call) {
        final Activity a = curActivity;
        final boolean v = call.getBoolean("v", true);
        if (a == null) {
            call.resolve();
            return;
        }
        a.runOnUiThread(() -> {
            try {
                android.view.Window w = a.getWindow();
                if (v) w.clearFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE);
                else w.addFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE);
                w.getDecorView().setVisibility(v ? android.view.View.VISIBLE : android.view.View.INVISIBLE);
            } catch (Throwable ignored) { }
            call.resolve();
        });
    }

    /** aurora-fill-3.2.8: {offX, scaleX, offY, scaleY}: X-screen pixel -> pixel inside the program view (follows the renderer's real mode). */
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
                int vw = vwOf(root), vh = vhOf(root);
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

    /** aurora-clip-3.2.9: the X view (child of the program root) */
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
            if (d == null || d.getData() == null) {
                if (cuSeen.add("nodata " + cu.hotSpotX + "," + cu.hotSpotY)) curNote("cursor without image data: hot=" + cu.hotSpotX + "," + cu.hotSpotY + " image=" + (d != null));
                return;
            }
            if (cuSeen.size() >= 80) return;
            java.nio.ByteBuffer bb = d.getData().duplicate();
            bb.rewind();
            int W = d.width, H = d.height;
            if (W <= 0 || H <= 0) return;
            byte[] b = new byte[Math.min(bb.remaining(), W * H * 4)];
            bb.get(b);
            java.util.zip.CRC32 crc = new java.util.zip.CRC32();
            crc.update(b);
            String sig = W + "x" + H + " hot=" + cu.hotSpotX + "," + cu.hotSpotY + " crc=" + Long.toHexString(crc.getValue()) + " guess=" + guessShape(b, W, H, cu.hotSpotX, cu.hotSpotY);
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

    /** aurora-shapes-3.2.10 */
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
                String hx = Long.toHexString(crc.getValue());
                String t = tabLookup(hx);
                if (t == null) t = builtinShape(hx);
                r = t != null ? t : guessShape(b, W, H, cu.hotSpotX, cu.hotSpotY);
            }
        } catch (Throwable ignored) { }
        shapeVal = r;
        shapeCu = cu;
        return r;
    }

    /** aurora-diag-3.2.11 */
    private static int noteN = 0;
    private static String lastSt = "";
    /** Verified Wine cursors: lines "crc=hand|ibeam|busy|arrow|wine" (same format as Download/aurora-cursor-map.txt). Empty until aurora-cursors.txt gives real crc values. */
    private static final String BUILTIN_MAP = "";

    /** Appends one "# ..." line to Download/aurora-cursors.txt (at most 80 per app start). Never throws. */
    private static void curNote(String msg) {
        try {
            if (noteN >= 80) return;
            noteN++;
            File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (dl == null) return;
            String line = "# " + new java.util.Date() + " " + msg + "\n";
            try (java.io.FileOutputStream fo = new java.io.FileOutputStream(new File(dl, "aurora-cursors.txt"), true)) {
                fo.write(line.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
        } catch (Throwable ignored) { }
    }

    /** Notes a change of what X reports under the pointer (once per change). */
    private static void curState(boolean hasWin, com.winlator.xserver.Cursor cu) {
        String st = !hasWin ? "no window under pointer"
            : cu == null ? "window has no cursor set"
            : cu.isVisible() ? "cursor visible hot=" + cu.hotSpotX + "," + cu.hotSpotY
            : "cursor hidden";
        if (st.equals(lastSt)) return;
        lastSt = st;
        curNote("state: " + st);
    }

    private static String builtinShape(String crc) {
        for (String line : BUILTIN_MAP.split("\\r?\\n")) {
            String t = line.trim();
            int e = t.indexOf('=');
            if (t.startsWith("#") || e <= 0) continue;
            if (t.substring(0, e).trim().equalsIgnoreCase(crc)) return t.substring(e + 1).trim().toLowerCase();
        }
        return null;
    }

    /** Sends the whole app to the background (programs keep running). */
    @PluginMethod
    public void moveToBackground(final PluginCall call) {
        final Activity m = getActivity();
        if (m == null) {
            call.resolve();
            return;
        }
        m.runOnUiThread(() -> {
            try {
                m.moveTaskToBack(true);
            } catch (Throwable ignored) { }
            call.resolve();
        });
    }

    /** {ms}: native safety net. ms + 15 s after the app went to the background everything is closed and the app exits. */
    @PluginMethod
    public void bgSchedule(PluginCall call) {
        int ms = call.getInt("ms", 300000);
        if (bgR != null) bgH.removeCallbacks(bgR);
        bgR = () -> {
            new Thread(() -> {
                try {
                    killStaleWine();
                } catch (Throwable ignored) { }
            }, "aurora-bg-kill").start();
            Activity c = curActivity;
            if (c != null) c.finish();
            Activity m = getActivity();
            if (m != null) m.finishAndRemoveTask();
            bgH.postDelayed(() -> android.os.Process.killProcess(android.os.Process.myPid()), 900);
        };
        bgH.postDelayed(bgR, ms + 15000L);
        call.resolve();
    }

    @PluginMethod
    public void bgCancel(PluginCall call) {
        if (bgR != null) bgH.removeCallbacks(bgR);
        bgR = null;
        call.resolve();
    }

    /** Closes the program, stops Wine and exits the app. */
    @PluginMethod
    public void quitApp(final PluginCall call) {
        call.resolve();
        new Thread(() -> {
            try {
                killStaleWine();
            } catch (Throwable ignored) { }
            final Activity m = getActivity();
            if (m != null) {
                m.runOnUiThread(() -> {
                    Activity c = curActivity;
                    if (c != null) c.finish();
                    m.finishAndRemoveTask();
                });
            }
            try {
                Thread.sleep(900);
            } catch (Exception ignored) { }
            android.os.Process.killProcess(android.os.Process.myPid());
        }, "aurora-quit").start();
    }

    private void addJavaNote(String line) {
        String n = javaNote;
        javaNote = n.isEmpty() ? line : n + "\n" + line;
    }

    /** Same cleanup Winlator does before unpacking a new rootfs (keeps user data in home and installed wine builds). */
    private void clearOptDir(File optDir) {
        File[] files = optDir.listFiles();
        if (files == null) return;
        for (File f : files) {
            if (f.getName().equals("installed-wine")) continue;
            FileUtils.delete(f);
        }
    }

    private void clearRootDir(File rootDir) {
        if (!rootDir.isDirectory()) {
            rootDir.mkdirs();
            return;
        }
        File[] files = rootDir.listFiles();
        if (files == null) return;
        for (File f : files) {
            if (f.isDirectory()) {
                String name = f.getName();
                if (name.equals("home") || name.equals("opt")) {
                    if (name.equals("opt")) clearOptDir(f);
                    continue;
                }
            }
            FileUtils.delete(f);
        }
    }

    private void installRootFs(Context ctx) throws Exception {
        RootFS rfs = RootFS.find(ctx);
        File rootDir = rfs.getRootDir();

        SharedPreferences.Editor ed = PreferenceManager.getDefaultSharedPreferences(ctx).edit();
        ed.putString("box64_version", DefaultVersion.BOX64);
        ed.remove("current_box64_version");
        ed.remove("current_graphics_driver");
        ed.apply();

        progress("rootfs", 0);
        clearRootDir(rootDir);
        final long total = TarCompressorUtils.getContentLength(TarCompressorUtils.Type.ZSTD, ctx, RootFSInstaller.FILENAME, rootDir);
        final AtomicLong done = new AtomicLong();
        final int[] last = {-1};
        boolean ok = TarCompressorUtils.extract(TarCompressorUtils.Type.ZSTD, ctx, RootFSInstaller.FILENAME, rootDir, (file, size) -> {
            if (size > 0 && total > 0) {
                int pct = (int) (done.addAndGet(size) * 100 / total);
                if (pct != last[0]) {
                    last[0] = pct;
                    progress("rootfs", pct);
                }
            }
            return file;
        });
        if (!ok) throw new Exception("Could not install the Windows runtime files");

        rfs.createRFSVersionFile(RootFSInstaller.LATEST_VERSION);

        ContainerManager existing = new ContainerManager(ctx);
        for (Container c : existing.getContainers()) {
            String rfsVersion = c.getExtra("rfsVersion");
            String wineVersion = c.getWineVersion();
            if (!rfsVersion.isEmpty() && WineInfo.isMainWineVersion(wineVersion)
                && Short.parseShort(rfsVersion) <= RootFSInstaller.UPDATE_WINEPREFIX_VERSION) {
                c.putExtra("wineprefixNeedsUpdate", "t");
            }
            c.putExtra("rfsVersion", null);
            c.saveData();
        }
        progress("rootfs", 100);
    }

    /** Returns the id of the first container, creating a default one when none exists. */
    private int ensureContainer(Context ctx) throws Exception {
        final ContainerManager mgr = new ContainerManager(ctx);
        ArrayList<Container> list = mgr.getContainers();
        if (!list.isEmpty()) return list.get(0).id;

        progress("container", 0);
        final JSONObject data = new JSONObject();
        data.put("name", "Aurora");
        data.put("cpuList", Container.getFallbackCPUList());
        data.put("cpuListWoW64", Container.getFallbackCPUList());
        data.put("drives", "D:" + AppUtils.DIRECTORY_DOWNLOADS + "E:" + Environment.getExternalStorageDirectory().getPath());

        final Container[] out = new Container[1];
        final CountDownLatch latch = new CountDownLatch(1);
        getActivity().runOnUiThread(() -> mgr.createContainerAsync(data, created -> {
            out[0] = created;
            latch.countDown();
        }));
        if (!latch.await(180, TimeUnit.SECONDS) || out[0] == null) throw new Exception("Could not create the Windows container");
        progress("container", 100);
        return out[0].id;
    }

    @PluginMethod
    public void status(PluginCall call) {
        Context ctx = getContext();
        JSObject r = new JSObject();
        boolean ready = runtimeReady(ctx);
        r.put("installed", ready);
        r.put("busy", busy);
        r.put("containers", ready ? new ContainerManager(ctx).getContainers().size() : 0);
        r.put("running", curActivity != null);
        call.resolve(r);
    }

    /** Installs the runtime (first time only) and makes sure a container exists. Reports "progress" events. */
    @PluginMethod
    public void init(final PluginCall call) {
        if (busy) {
            call.reject("Setup is already running");
            return;
        }
        busy = true;
        final Context ctx = getContext();
        new Thread(() -> {
            try {
                if (!runtimeReady(ctx)) installRootFs(ctx);
                ensureBox64(ctx);
                int cid = ensureContainer(ctx);
                progress("done", 100);
                JSObject r = new JSObject();
                r.put("ok", true);
                r.put("containerId", cid);
                call.resolve(r);
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Setup failed" : e.getMessage());
            } finally {
                busy = false;
            }
        }, "aurora-wine-init").start();
    }

    /**
     * Runs a Windows program: {path, containerId?, rect?}. Resolves with {id} once the launch was requested.
     * With rect {x,y,w,h,vw,vh} the program window is placed over that Aurora window area and the X screen gets its
     * size; without rect the old full-screen behaviour is unchanged.
     */
    @PluginMethod
    public void runExe(final PluginCall call) {
        final String path = call.getString("path");
        if (path == null || path.isEmpty()) {
            call.reject("path is required");
            return;
        }
        if (!new File(path).isFile()) {
            call.reject("File not found: " + path);
            return;
        }
        if (busy) {
            call.reject("Setup is still running");
            return;
        }
        if (curActivity != null) {
            call.reject("A Windows program is already running");
            return;
        }
        final Context ctx = getContext();
        if (!runtimeReady(ctx)) {
            call.reject("The Windows runtime is not installed yet");
            return;
        }
        int cid = call.getInt("containerId", 0);
        if (cid <= 0) {
            ArrayList<Container> list = new ContainerManager(ctx).getContainers();
            if (list.isEmpty()) {
                call.reject("No Windows container yet");
                return;
            }
            cid = list.get(0).id;
        }
        final int containerId = cid;
        try {
            ensureBox64(ctx);
        } catch (Exception e) {
            call.reject(e.getMessage() == null ? "Could not prepare the runtime" : e.getMessage());
            return;
        }
        curId = ++runSeq;
        curPath = path;
        lastRunStart = System.currentTimeMillis();
        try {
            new File(ctx.getFilesDir(), "aurora-last-error.txt").delete();
        } catch (Exception ignored) { }
        busy = true;
        try {
            ensureJava(ctx, containerId);
            killStaleWine();
            ensureJavaEnv(ctx, containerId);
            ensureWineDebug(ctx, containerId);
            ensureWineD3D(ctx, containerId);
        } finally {
            busy = false;
        }
        final JSObject rectIn = call.getObject("rect");
        getActivity().runOnUiThread(() -> {
            try {
                Intent it = new Intent(ctx, XServerDisplayActivity.class);
                it.putExtra("container_id", containerId);
                it.putExtra("exec_path", path);
                int[] r = rectToScreen(rectIn);
                if (r != null) {
                    it.putExtra("aurora_rect", r);
                    it.putExtra("aurora_screen", Math.max(320, r[2] & ~1) + "x" + Math.max(240, r[3] & ~1));
                }
                getActivity().startActivity(it);
                JSObject o = new JSObject();
                o.put("id", curId);
                call.resolve(o);
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Could not start the program" : e.getMessage());
            }
        });
    }

    /** Moves/resizes the running program window: {x,y,w,h,vw,vh}. The X screen keeps its size (the view scales). */
    @PluginMethod
    public void setExeRect(final PluginCall call) {
        final Activity a = curActivity;
        if (a == null) {
            call.resolve();
            return;
        }
        final JSObject data = call.getData();
        getActivity().runOnUiThread(() -> {
            int[] r = rectToScreen(data);
            if (r != null) applyRectClip(curActivity, r, clipRect(data)); // aurora-clip-3.2.9
            call.resolve();
        });
    }

    // aurora-p08: coalesce rect updates to one per frame (no lag while dragging/resizing)
    private volatile int[] pendRect;
    private boolean rectQueued; // UI thread only

    private void queueRect(int[] r) {
        pendRect = r;
        if (rectQueued) return;
        rectQueued = true;
        android.view.Choreographer.getInstance().postFrameCallback(t -> {
            rectQueued = false;
            int[] p = pendRect;
            Activity a = curActivity;
            if (p != null && a != null) applyRect(a, p);
        });
    }

    /** Minimize: brings Aurora OS in front of the program window (the program keeps running). */
    @PluginMethod
    public void minimizeExe(final PluginCall call) {
        if (curActivity == null) {
            call.resolve();
            return;
        }
        final Activity m = getActivity();
        m.runOnUiThread(() -> {
            try {
                Intent it = new Intent(m, MainActivity.class);
                it.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                m.startActivity(it);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Could not minimize" : e.getMessage());
            }
        });
    }

    /** Restore: puts the program window back in front, optionally on a new rect {x,y,w,h,vw,vh}. */
    @PluginMethod
    public void restoreExe(final PluginCall call) {
        final Activity a = curActivity;
        if (a == null) {
            call.resolve();
            return;
        }
        final Activity m = getActivity();
        final JSObject data = call.getData();
        m.runOnUiThread(() -> {
            try {
                int[] r = rectToScreen(data);
                if (r != null) applyRectClip(a, r, null);
                Intent it = new Intent(m, XServerDisplayActivity.class);
                it.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                m.startActivity(it);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Could not restore" : e.getMessage());
            }
        });
    }

    // ---------------------------------------------------------------- installed programs (Start Menu / Program Files)

    private File prefixDir(Context ctx) {
        return new File(RootFS.find(ctx).getRootDir(), RootFS.WINEPREFIX);
    }

    /** Case-insensitive lookup of "a/b/c" below base (Wine paths are case-insensitive, Android's are not). */
    private static File resolveCI(File base, String rel) {
        File cur = base;
        for (String part : rel.split("/")) {
            if (part.isEmpty() || part.equals(".")) continue;
            File next = new File(cur, part);
            if (!next.exists()) {
                next = null;
                File[] list = cur.listFiles();
                if (list != null) {
                    for (File c : list) {
                        if (c.getName().equalsIgnoreCase(part)) {
                            next = c;
                            break;
                        }
                    }
                }
                if (next == null) return null;
            }
            cur = next;
        }
        return cur;
    }

    /** "C:\Program Files\X\x.exe" -> the real file inside the Wine prefix, or null. */
    private File winToFile(Context ctx, String w) {
        if (w == null) return null;
        w = w.trim();
        if (w.length() < 3 || w.charAt(1) != ':') return null;
        char d = Character.toLowerCase(w.charAt(0));
        if (d < 'a' || d > 'z') return null;
        String rest = w.substring(2).replace('\\', '/');
        File pre = prefixDir(ctx);
        File base = d == 'c' ? new File(pre, "drive_c") : new File(pre, "dosdevices/" + d + ":");
        if (!base.exists()) return null;
        return resolveCI(base, rest);
    }

    private static boolean isJunkExe(String name) {
        return name.toLowerCase().matches(".*(unins|uninst|uninstall|setup|install|redist|dxsetup|crashhandler|crashreport|updater).*");
    }

    private void collectLnk(Context ctx, File dir, int depth, JSArray items, java.util.HashSet<String> seen) {
        File[] list = dir.listFiles();
        if (list == null || depth > 6) return;
        for (File f : list) {
            if (f.isDirectory()) {
                collectLnk(ctx, f, depth + 1, items, seen);
                continue;
            }
            String n = f.getName();
            if (!n.toLowerCase().endsWith(".lnk") || f.length() > 262144 || !seen.add(f.getPath())) continue;
            try {
                AuroraLnk l = AuroraLnk.parse(java.nio.file.Files.readAllBytes(f.toPath()));
                if (l == null || l.target.isEmpty()) continue;
                if (!l.target.toLowerCase().endsWith(".exe") || l.target.toLowerCase().startsWith("c:\\windows")) continue;
                File t = winToFile(ctx, l.target);
                String name = n.substring(0, n.length() - 4);
                if (t == null || !t.isFile() || isJunkExe(t.getName()) || isJunkExe(name)) continue;
                File ic = l.iconPath.isEmpty() ? null : winToFile(ctx, l.iconPath);
                File wd = l.workDir.isEmpty() ? null : winToFile(ctx, l.workDir);
                JSObject o = new JSObject();
                o.put("lnk", f.getPath());
                o.put("target", t.getPath());
                o.put("name", name);
                o.put("args", l.args);
                o.put("cwd", wd == null ? "" : wd.getPath());
                o.put("iconPath", ic == null ? "" : ic.getPath());
                o.put("iconIndex", l.iconIndex);
                items.put(o);
            } catch (Exception ignored) { }
        }
    }

    /** Largest plausible program .exe in the folder or one level below it (installers/uninstallers skipped). */
    private static File mainExe(File dir) {
        File best = null;
        File[] list = dir.listFiles();
        if (list == null) return null;
        for (File f : list) {
            File[] cand = f.isDirectory() ? f.listFiles() : new File[]{f};
            if (cand == null) continue;
            for (File c : cand) {
                String n = c.getName();
                if (c.isFile() && n.toLowerCase().endsWith(".exe") && !isJunkExe(n) && (best == null || c.length() > best.length())) best = c;
            }
        }
        return best;
    }

    /**
     * Snapshot of what an installer can leave behind: Start Menu / Desktop shortcuts (.lnk with an .exe target) and the
     * top-level folders of Program Files. Returns {items:[{lnk,target,name,args,cwd,iconPath,iconIndex}],
     * dirs:[{k,name,dir,exe}]}. Called before and after a program runs; the web side compares the two.
     */
    @PluginMethod
    public void scanStart(final PluginCall call) {
        final Context ctx = getContext();
        new Thread(() -> {
            try {
                File drive = new File(prefixDir(ctx), "drive_c");
                java.util.ArrayList<File> roots = new java.util.ArrayList<>();
                roots.add(new File(drive, "ProgramData/Microsoft/Windows/Start Menu"));
                File[] users = new File(drive, "users").listFiles();
                if (users != null) {
                    for (File u : users) {
                        roots.add(new File(u, "AppData/Roaming/Microsoft/Windows/Start Menu"));
                        roots.add(new File(u, "Desktop"));
                    }
                }
                JSArray items = new JSArray();
                java.util.HashSet<String> seen = new java.util.HashSet<>();
                for (File r : roots) collectLnk(ctx, r, 0, items, seen);

                final java.util.Set<String> skip = new java.util.HashSet<>(java.util.Arrays.asList(
                    "common files", "internet explorer", "windows media player", "windows nt", "windows photo viewer",
                    "windows mail", "windowspowershell", "windows defender", "uninstall information", "reference assemblies"));
                JSArray dirs = new JSArray();
                String[] pfs = {"Program Files", "Program Files (x86)"};
                for (String pf : pfs) {
                    File[] ds = new File(drive, pf).listFiles();
                    if (ds == null) continue;
                    for (File d : ds) {
                        if (!d.isDirectory() || skip.contains(d.getName().toLowerCase())) continue;
                        File exe = mainExe(d);
                        JSObject o = new JSObject();
                        o.put("k", pf + "/" + d.getName());
                        o.put("name", d.getName());
                        o.put("dir", d.getPath());
                        o.put("exe", exe == null ? "" : exe.getPath());
                        dirs.put(o);
                    }
                }
                JSObject res = new JSObject();
                res.put("items", items);
                res.put("dirs", dirs);
                call.resolve(res);
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Could not read the Start Menu" : e.getMessage());
            }
        }, "aurora-scan").start();
    }

    private byte[] iconFor(Context ctx, String p, int idx) {
        if (p == null || p.isEmpty()) return null;
        File f = new File(p);
        if (!f.isFile()) {
            File w = winToFile(ctx, p);
            if (w != null) f = w;
        }
        if (!f.isFile()) return null;
        if (f.getName().toLowerCase().endsWith(".ico")) return AuroraPeIcon.fromIco(f);
        return AuroraPeIcon.extract(f, idx);
    }

    /** {path, index?, fallback?} -> {png: "data:image/png;base64,..."} (empty string when no icon was found). */
    @PluginMethod
    public void exeIcon(final PluginCall call) {
        final Context ctx = getContext();
        final String path = call.getString("path");
        final String fb = call.getString("fallback");
        final int idx = call.getInt("index", 0);
        new Thread(() -> {
            byte[] png = iconFor(ctx, path, idx);
            if (png == null && fb != null && !fb.equals(path)) png = iconFor(ctx, fb, 0);
            JSObject r = new JSObject();
            r.put("png", png == null ? "" : "data:image/png;base64," + android.util.Base64.encodeToString(png, android.util.Base64.NO_WRAP));
            call.resolve(r);
        }, "aurora-icon").start();
    }

    /**
     * Status lines the launcher writes into aurora-last-error.txt on EVERY run. They are information, not errors:
     * if they were returned by getLastError the web page would show "Windows app error" after every program and skip
     * the "installed program -> desktop icon" step. Real problems (Wine exit status, spawn failure, Java/.NET hints,
     * broken downloads) are still returned.
     */
    private static final java.util.regex.Pattern INFO_LINE = java.util.regex.Pattern.compile(
        "^(box64 interpreter (ok:|patched:|\\(already patched\\)).*"
            + "|rootfs paths already patched.*"
            + "|rootfs paths patched: .* errors 0( \\[.*)?"
            + "|Program type: [^,]+, native Windows program"
            + "|aurora-v2 launch: .*)$");

    /** Copies .log/.txt files written during this run (users folder of the prefix) to Download/aurora-app-logs, plus _files.txt. Never throws. */
    private void copyAppLogs(File dl) {
        try {
            File base = new File(prefixDir(getContext()), "drive_c/users");
            File out = new File(dl, "aurora-app-logs");
            if (!(out.isDirectory() || out.mkdirs())) return;
            StringBuilder list = new StringBuilder();
            walkLogs(base, base, out, lastRunStart - 5000, 0, list, new int[]{0});
            try (java.io.FileOutputStream fo = new java.io.FileOutputStream(new File(out, "_files.txt"))) {
                fo.write(list.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
        } catch (Throwable ignored) { }
    }

    private static void walkLogs(File base, File dir, File out, long since, int depth, StringBuilder list, int[] n) throws Exception {
        File[] fs = dir.listFiles();
        if (fs == null || depth > 7) return;
        for (File f : fs) {
            if (f.isDirectory()) {
                walkLogs(base, f, out, since, depth + 1, list, n);
                continue;
            }
            if (f.lastModified() < since) continue;
            String rel = base.toURI().relativize(f.toURI()).getPath();
            list.append(rel).append("  ").append(f.length()).append('\n');
            String nm = f.getName().toLowerCase();
            if (n[0] < 30 && f.length() > 0 && f.length() < 3000000 && (nm.endsWith(".log") || nm.endsWith(".txt"))) {
                n[0]++;
                java.nio.file.Files.copy(f.toPath(), new File(out, rel.replace('/', '_')).toPath(),
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
        }
    }

    /** Keeps the complete launcher notes plus the end of the Wine output in Download/aurora-wine.log (best effort). */
    private void saveRunLog(String raw) {
        try {
            File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (dl == null || !(dl.isDirectory() || dl.mkdirs())) return;
            StringBuilder sb = new StringBuilder();
            sb.append(new java.util.Date()).append("  ").append(curPath).append('\n').append(raw.trim()).append('\n');
            if (!javaNote.isEmpty()) sb.append(javaNote).append('\n');
            File g = new File(RootFS.find(getContext()).getRootDir(), "tmp/aurora-guest.log");
            if (g.isFile() && g.length() > 0) {
                int n = (int) Math.min(g.length(), 2000);
                byte[] b = new byte[n];
                try (java.io.RandomAccessFile rf = new java.io.RandomAccessFile(g, "r")) {
                    rf.seek(g.length() - n);
                    rf.readFully(b);
                }
                sb.append("--- guest output ---\n").append(new String(b, java.nio.charset.StandardCharsets.UTF_8)).append('\n');
            }
            File flag = debugFlagFile();
            if (flag != null && flag.isFile() && g.isFile() && g.length() > 0) {
                // debug mode: the last 200 KB of this run's guest output, overwritten on every run
                long glen = g.length();
                int dn = (int) Math.min(glen, 200000);
                byte[] db = new byte[dn];
                try (java.io.RandomAccessFile rf = new java.io.RandomAccessFile(g, "r")) {
                    rf.seek(glen - dn);
                    rf.readFully(db);
                }
                try (java.io.FileOutputStream dout = new java.io.FileOutputStream(new File(dl, "aurora-wine-debug.log"))) {
                    dout.write((new java.util.Date() + "  " + curPath + "  (last " + dn + " of " + glen + " bytes)\n")
                        .getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    dout.write(db);
                }
            }
            copyAppLogs(dl);
            sb.append('\n');
            File log = new File(dl, "aurora-wine.log");
            try (java.io.FileOutputStream o = new java.io.FileOutputStream(log, !(log.isFile() && log.length() > 300000))) {
                o.write(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
        } catch (Throwable ignored) { }
    }

    /** Error text left by the launcher for the run that just ended ("" when there is none). */
    @PluginMethod
    public void getLastError(PluginCall call) {
        JSObject r = new JSObject();
        String msg = "";
        try {
            File f = new File(getContext().getFilesDir(), "aurora-last-error.txt");
            if (f.isFile() && f.lastModified() >= lastRunStart && f.length() > 0) {
                byte[] b = java.nio.file.Files.readAllBytes(f.toPath());
                String all = new String(b, java.nio.charset.StandardCharsets.UTF_8);
                saveRunLog(all);
                StringBuilder sb = new StringBuilder();
                for (String line : all.split("\\r?\\n")) {
                    String t = line.trim();
                    if (t.isEmpty() || INFO_LINE.matcher(t).matches()) continue;
                    sb.append(t).append('\n');
                }
                msg = sb.toString().trim();
                if (msg.length() > 900) msg = msg.substring(0, 900);
            }
        } catch (Exception ignored) { }
        r.put("error", msg);
        call.resolve(r);
    }

    /** Closes the running Windows program window (and its Wine session). */
    @PluginMethod
    public void stopExe(final PluginCall call) {
        final Activity a = curActivity;
        if (a == null) {
            call.resolve();
            return;
        }
        a.runOnUiThread(() -> {
            a.finish();
            call.resolve();
        });
    }

    @PluginMethod
    public void listRunning(PluginCall call) {
        JSArray arr = new JSArray();
        if (curActivity != null) {
            JSObject o = new JSObject();
            o.put("id", curId);
            o.put("path", curPath);
            arr.put(o);
        }
        JSObject r = new JSObject();
        r.put("items", arr);
        call.resolve(r);
    }
}
