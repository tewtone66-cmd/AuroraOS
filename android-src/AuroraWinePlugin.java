package com.auroraos.desktop;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
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
import com.winlator.core.FileUtils;
import com.winlator.core.TarCompressorUtils;
import com.winlator.core.WineInfo;
import com.winlator.core.WineUtils;
import com.winlator.xenvironment.RootFS;
import com.winlator.xenvironment.RootFSInstaller;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.json.JSONObject;

/**
 * Windows program runner built on the Winlator core (Wine + Box64/Box86), compiled into this app.
 * Part 2: install the runtime, create a container, run an .exe and report its state.
 * Methods: status, init, runExe, stopExe, listRunning, setExeRect, minimizeExe, restoreExe,
 *          installResult (what the last program installed), scanStart (all programs with a Start Menu/Desktop shortcut),
 *          getLastError (error of the last run, "" when none),
 *          exeIcon (icon of an exe/dll/ico as a PNG data URL: {path, index, fallback} -> {png}).
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
    private volatile String lastErrorMsg = "";
    private static final String BEFORE_FILE = "aurora-install-before.txt";

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
        if ("error".equals(state)) p.lastErrorMsg = m;
        p.notifyListeners("exeState", o);
    }

    /** Puts the program window on a screen rectangle {x, y, w, h} (pixels); touches outside it reach Aurora OS. */
    public static void applyRect(Activity a, int[] r) {
        if (a == null || r == null || r.length < 4) return;
        android.view.Window w = a.getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        WindowManager.LayoutParams lp = w.getAttributes();
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
            public void onActivityResumed(Activity a) { }

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
        lastErrorMsg = "";
        saveInstallSnapshot(ctx, containerId);
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
            if (r != null) applyRect(a, r);
            call.resolve();
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
                if (r != null) applyRect(a, r);
                Intent it = new Intent(m, XServerDisplayActivity.class);
                it.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                m.startActivity(it);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Could not restore" : e.getMessage());
            }
        });
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


    // ---------------------------------------------------------------- install detection

    private Container containerById(Context ctx, int id) {
        try {
            return id > 0 ? new ContainerManager(ctx).getContainerById(id) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static File driveCOf(Container c) {
        return new File(c.getRootDir(), ".wine/drive_c");
    }

    private static AuroraInstallScan.PathMapper pathMapper(final Container c) {
        return new AuroraInstallScan.PathMapper() {
            @Override
            public String toUnix(String dosPath) {
                try {
                    return WineUtils.dosToUnixPath(dosPath, c);
                } catch (Exception e) {
                    return "";
                }
            }
        };
    }

    /** Remembers Program Files / Start Menu / Desktop before the program runs; installResult compares against it. */
    private void saveInstallSnapshot(Context ctx, int containerId) {
        File f = new File(ctx.getFilesDir(), BEFORE_FILE);
        f.delete();
        try {
            Container c = containerById(ctx, containerId);
            if (c == null || !driveCOf(c).isDirectory()) return;
            Map<String, String> snap = AuroraInstallScan.snapshot(driveCOf(c));
            snap.put("#cid", String.valueOf(containerId));
            AuroraInstallScan.save(snap, f);
        } catch (Throwable t) {
            f.delete(); // no snapshot = no install detection for this run, the program still starts
        }
    }

    private static JSArray itemsToJson(List<AuroraInstallScan.Item> items) {
        JSArray arr = new JSArray();
        for (AuroraInstallScan.Item it : items) {
            JSObject o = new JSObject();
            o.put("lnk", it.lnk);
            o.put("name", it.name);
            o.put("target", it.target);
            o.put("args", it.args);
            o.put("cwd", it.cwd);
            o.put("iconPath", it.iconPath);
            o.put("iconIndex", it.iconIndex);
            o.put("startMenu", it.startMenu);
            arr.put(o);
        }
        return arr;
    }

    /**
     * What the program that just ran added to Program Files / Start Menu / Desktop: {ran, items[]}.
     * ran=false when there is no snapshot (already consumed, or the container is gone). One-shot: it consumes the snapshot.
     */
    @PluginMethod
    public void installResult(final PluginCall call) {
        final Context ctx = getContext();
        new Thread(() -> {
            JSObject r = new JSObject();
            try {
                File f = new File(ctx.getFilesDir(), BEFORE_FILE);
                Map<String, String> before = AuroraInstallScan.load(f);
                r.put("ran", false);
                r.put("items", new JSArray());
                if (before != null) {
                    f.delete();
                    int cid = 0;
                    try {
                        cid = Integer.parseInt(before.remove("#cid"));
                    } catch (RuntimeException e) {
                        cid = 0;
                    }
                    Container c = containerById(ctx, cid);
                    if (c != null) {
                        List<AuroraInstallScan.Item> items = AuroraInstallScan.changedSince(driveCOf(c), before, pathMapper(c));
                        r.put("ran", true);
                        r.put("items", itemsToJson(items));
                    }
                }
                call.resolve(r);
            } catch (Throwable t) {
                call.reject(t.getMessage() == null ? "Could not check the installation" : t.getMessage());
            }
        }, "aurora-install-result").start();
    }

    /** All programs that have a Start Menu or Desktop shortcut right now: {items[]}. Optional containerId. */
    @PluginMethod
    public void scanStart(final PluginCall call) {
        final Context ctx = getContext();
        final int want = call.getInt("containerId", 0);
        new Thread(() -> {
            try {
                int cid = want;
                if (cid <= 0) {
                    ArrayList<Container> list = new ContainerManager(ctx).getContainers();
                    cid = list.isEmpty() ? 0 : list.get(0).id;
                }
                Container c = containerById(ctx, cid);
                JSObject r = new JSObject();
                r.put("items", c == null ? new JSArray() : itemsToJson(AuroraInstallScan.allShortcuts(driveCOf(c), pathMapper(c))));
                call.resolve(r);
            } catch (Throwable t) {
                call.reject(t.getMessage() == null ? "Could not read the Start Menu" : t.getMessage());
            }
        }, "aurora-scan-start").start();
    }

    /** PNG of the icon in a PE file (index >= 0: n-th icon group, < 0: group id) or a .ico; null when there is none. */
    private byte[] iconBytes(Context ctx, String path, int index) {
        if (path == null || path.isEmpty()) return null;
        String p = path;
        if (p.length() > 2 && p.charAt(1) == ':' && (p.charAt(2) == '\\' || p.charAt(2) == '/')) {
            ArrayList<Container> list = new ContainerManager(ctx).getContainers();
            if (list.isEmpty()) return null;
            p = pathMapper(list.get(0)).toUnix(p);
        }
        if (p == null || p.isEmpty()) return null;
        File f = AuroraInstallScan.resolveCI(new File(p));
        if (f == null || !f.isFile()) return null;
        return f.getName().toLowerCase(java.util.Locale.ROOT).endsWith(".ico") ? AuroraPeIcon.fromIco(f) : AuroraPeIcon.extract(f, index);
    }

    /** Icon of a program: {path, index?, fallback?} -> {png: "data:image/png;base64,..."} ("" when it has none). */
    @PluginMethod
    public void exeIcon(final PluginCall call) {
        final Context ctx = getContext();
        final String path = call.getString("path");
        final String fallback = call.getString("fallback");
        final int index = call.getInt("index", 0);
        new Thread(() -> {
            String png = "";
            try {
                byte[] b = iconBytes(ctx, path, index);
                if (b == null && fallback != null && !fallback.equals(path)) b = iconBytes(ctx, fallback, 0);
                // the page keeps the icon in localStorage: skip unusually large ones
                if (b != null && b.length > 0 && b.length <= 120000) png = "data:image/png;base64," + Base64.encodeToString(b, Base64.NO_WRAP);
            } catch (Throwable t) {
                png = "";
            }
            JSObject r = new JSObject();
            r.put("png", png);
            call.resolve(r);
        }, "aurora-exe-icon").start();
    }

    /** Error of the last run ({error: ""} when it had none); cleared when the next program starts. */
    @PluginMethod
    public void getLastError(PluginCall call) {
        JSObject r = new JSObject();
        r.put("error", lastErrorMsg);
        call.resolve(r);
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
