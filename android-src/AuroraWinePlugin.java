package com.auroraos.desktop;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Environment;
import android.view.Gravity;
import android.view.Window;
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
 * Methods: status, init, runExe, stopExe, listRunning.
 * Events: progress {step,pct}, exeStarted {id,path}, exeExited {id,path}.
 */
@CapacitorPlugin(name = "AuroraWine")
public class AuroraWinePlugin extends Plugin {
    private volatile boolean busy = false;
    private int runSeq = 0;
    private int curId = 0;
    private String curPath = "";
    private Activity curActivity = null;

    /** Frame of the program window in CSS px of the Aurora page; gd = device px per CSS px. */
    private float gx = 0, gy = 0, gw = 640, gh = 480, gd = 1;
    private boolean gvis = true, gfocus = true, hasGeom = false;

    @Override
    public void load() {
        Application app = (Application) getContext().getApplicationContext();
        app.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks() {
            @Override
            public void onActivityCreated(Activity a, Bundle state) {
                if (a instanceof XServerDisplayActivity) {
                    curActivity = a;
                    applyGeom(a);
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
                    hasGeom = false;
                    JSObject o = new JSObject();
                    o.put("id", curId);
                    o.put("path", curPath);
                    notifyListeners("exeExited", o);
                }
            }
        });
    }

    /** Reads x,y,w,h (CSS px), cw (page width in CSS px), visible, focus from a call into the stored frame. */
    private void readGeom(PluginCall call) {
        float d = getContext().getResources().getDisplayMetrics().density;
        try {
            Float cw = call.getFloat("cw", 0f);
            int wpx = getBridge().getWebView().getWidth();
            if (cw != null && cw > 0 && wpx > 0) d = wpx / cw;
        } catch (Exception ignored) { }
        gd = d;
        gx = call.getFloat("x", gx);
        gy = call.getFloat("y", gy);
        gw = call.getFloat("w", gw);
        gh = call.getFloat("h", gh);
        Boolean v = call.getBoolean("visible", gvis);
        gvis = v == null || v;
        Boolean f = call.getBoolean("focus", gfocus);
        gfocus = f == null || f;
    }

    /** Puts the program window (a transparent, non-modal Activity window) exactly over the Aurora window frame. UI thread only. */
    private void applyGeom(Activity a) {
        if (!hasGeom || a == null) return;
        try {
            Window win = a.getWindow();
            int[] loc = new int[2];
            try { getBridge().getWebView().getLocationOnScreen(loc); } catch (Exception ignored) { }
            WindowManager.LayoutParams lp = win.getAttributes();
            lp.gravity = Gravity.TOP | Gravity.START;
            lp.x = loc[0] + Math.round(gx * gd);
            lp.y = loc[1] + Math.round(gy * gd);
            lp.width = Math.max(1, Math.round(gw * gd));
            lp.height = Math.max(1, Math.round(gh * gd));
            lp.alpha = gvis ? 1f : 0f;
            win.setAttributes(lp);
            win.addFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
            if (gvis) win.clearFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE);
            else win.addFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE);
            if (gvis && gfocus) win.clearFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
            else win.addFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
        } catch (Throwable ignored) { }
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

    /** Runs a Windows program: {path, containerId?}. Resolves with {id} once the launch was requested. */
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
        if (call.hasOption("w")) {
            readGeom(call);
            hasGeom = true;
        }
        curId = ++runSeq;
        curPath = path;
        final Intent it = new Intent(ctx, XServerDisplayActivity.class);
        it.putExtra("container_id", containerId);
        it.putExtra("exec_path", path);
        String scr = call.getString("screen");
        if (scr != null && scr.matches("\\d{3,4}x\\d{3,4}")) it.putExtra("aurora_screen", scr);
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().startActivity(it);
                JSObject r = new JSObject();
                r.put("id", curId);
                call.resolve(r);
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Could not start the program" : e.getMessage());
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

    /** Moves/resizes/shows/hides the running program's window: {x,y,w,h,cw,visible?,focus?} (CSS px of the Aurora page). */
    @PluginMethod
    public void place(final PluginCall call) {
        readGeom(call);
        hasGeom = true;
        final Activity a = curActivity;
        if (a == null) {
            call.resolve();
            return;
        }
        a.runOnUiThread(() -> {
            applyGeom(a);
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
