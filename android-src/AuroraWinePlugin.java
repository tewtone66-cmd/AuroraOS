package com.auroraos.desktop;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Environment;
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
import com.winlator.container.Drive;
import com.winlator.core.AppUtils;
import com.winlator.core.DefaultVersion;
import com.winlator.core.FileUtils;
import com.winlator.core.TarCompressorUtils;
import com.winlator.core.WineInfo;
import com.winlator.xenvironment.RootFS;
import com.winlator.xenvironment.RootFSInstaller;
import android.util.Base64;
import java.io.File;
import java.io.FileInputStream;
import java.io.ByteArrayOutputStream;
import java.util.HashSet;
import java.util.Locale;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.json.JSONObject;

/**
 * Windows program runner built on the Winlator core (Wine + Box64/Box86), compiled into this app.
 * Part 2: install the runtime, create a container, run an .exe and report its state.
 * Methods: status, init, runExe, stopExe, listRunning, scanStart, exeIcon.
 * Events: progress {step,pct}, exeStarted {id,path}, exeExited {id,path}.
 */
@CapacitorPlugin(name = "AuroraWine")
public class AuroraWinePlugin extends Plugin {
    private volatile boolean busy = false;
    private int runSeq = 0;
    private int curId = 0;
    private String curPath = "";
    private Activity curActivity = null;

    @Override
    public void load() {
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
        File exeFile = new File(path);
        if (!exeFile.isFile()) {
            call.reject("File not found: " + path + " (check that file access is allowed)");
            return;
        }
        if (!exeFile.canRead()) {
            call.reject("Cannot read file: " + path);
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
        try { new File(ctx.getFilesDir(), "aurora-last-error.txt").delete(); } catch (Exception ignored) { }
        curId = ++runSeq;
        curPath = path;
        final Intent it = new Intent(ctx, XServerDisplayActivity.class);
        it.putExtra("container_id", containerId);
        it.putExtra("exec_path", path);
        final String screen = call.getString("screen", "");
        if (screen != null && screen.matches("\\d{3,4}x\\d{3,4}")) it.putExtra("aurora_screen", screen);
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

    /** Returns the most recent captured guest-process startup error, if any. */
    @PluginMethod
    public void getLastError(PluginCall call) {
        File f = new File(getContext().getFilesDir(), "aurora-last-error.txt");
        if (!f.isFile()) { JSObject r = new JSObject(); r.put("error", ""); call.resolve(r); return; }
        try (FileInputStream in = new FileInputStream(f); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[2048]; int n; while ((n = in.read(buf)) > 0 && out.size() < 12000) out.write(buf, 0, n);
            String message = new String(out.toByteArray(), java.nio.charset.StandardCharsets.UTF_8).trim();
            JSObject r = new JSObject(); r.put("error", message); call.resolve(r);
        } catch (Exception e) { JSObject r = new JSObject(); r.put("error", "Could not read native error log: " + e.getMessage()); call.resolve(r); }
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

    // ---------- desktop icons: Start Menu scan (.lnk) and icon extraction ----------

    /** Case-insensitive walk of a Windows-style relative path below {@code base}; returns null when nothing matches. */
    private static File resolveCi(File base, String rel) {
        File cur = base;
        for (String part : rel.split("[\\\\/]+")) {
            if (part.isEmpty() || part.equals(".")) continue;
            File direct = new File(cur, part);
            if (direct.exists()) {
                cur = direct;
                continue;
            }
            File[] kids = cur.listFiles();
            File hit = null;
            if (kids != null) {
                for (File k : kids) {
                    if (k.getName().equalsIgnoreCase(part)) {
                        hit = k;
                        break;
                    }
                }
            }
            if (hit == null) return null;
            cur = hit;
        }
        return cur;
    }

    /** "C:\\Program Files\\X\\x.exe" -> real file below the container (null if the drive is unknown or the file is missing). */
    private static File dosToFile(Container c, String dos) {
        if (dos == null) return null;
        dos = dos.trim();
        if (dos.length() < 3 || dos.charAt(1) != ':') return null;
        String letter = dos.substring(0, 1).toUpperCase(Locale.ROOT);
        File base = null;
        if (letter.equals("C")) {
            base = new File(c.getRootDir(), ".wine/drive_c");
        } else {
            for (Drive d : c.drivesIterator()) {
                if (d.letter.equalsIgnoreCase(letter)) {
                    base = new File(d.path);
                    break;
                }
            }
        }
        if (base == null || !base.isDirectory()) return null;
        return resolveCi(base, dos.substring(2));
    }

    private static boolean skipDirName(String n) {
        n = n.toLowerCase(Locale.ROOT);
        return n.equals("accessories") || n.equals("system tools") || n.equals("wine") || n.equals("startup");
    }

    private static boolean skipLinkName(String n) {
        n = n.toLowerCase(Locale.ROOT);
        return n.contains("uninstall") || n.contains("unins") || n.contains("remove ") || n.contains("readme")
            || n.contains("manual") || n.contains("documentation") || n.contains("license") || n.contains("website");
    }

    private void scanDir(Container c, File dir, int depth, JSArray out, HashSet<String> seen) {
        File[] kids = dir.listFiles();
        if (kids == null || depth > 6) return;
        for (File k : kids) {
            String name = k.getName();
            if (k.isDirectory()) {
                if (depth == 0 && skipDirName(name)) continue;
                scanDir(c, k, depth + 1, out, seen);
                continue;
            }
            if (!name.toLowerCase(Locale.ROOT).endsWith(".lnk") || k.length() > 65536) continue;
            String base = name.substring(0, name.length() - 4);
            if (skipLinkName(base) || !seen.add(k.getAbsolutePath())) continue;
            try {
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                FileInputStream in = new FileInputStream(k);
                try {
                    byte[] buf = new byte[4096];
                    int n;
                    while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
                } finally {
                    in.close();
                }
                AuroraLnk l = AuroraLnk.parse(bo.toByteArray());
                if (l == null || l.target.isEmpty()) continue;
                String lower = l.target.toLowerCase(Locale.ROOT);
                if (!lower.endsWith(".exe") || lower.contains("\\windows\\") || lower.contains("unins")) continue;
                File exe = dosToFile(c, l.target);
                if (exe == null || !exe.isFile()) continue;
                JSObject o = new JSObject();
                o.put("lnk", k.getAbsolutePath());
                o.put("name", base);
                o.put("target", exe.getAbsolutePath());
                o.put("args", l.args);
                File wd = l.workDir.isEmpty() ? null : dosToFile(c, l.workDir);
                o.put("cwd", wd != null && wd.isDirectory() ? wd.getAbsolutePath() : (exe.getParent() == null ? "" : exe.getParent()));
                String ip = "";
                if (!l.iconPath.isEmpty()) {
                    File icf = dosToFile(c, l.iconPath);
                    if (icf != null && icf.isFile()) ip = icf.getAbsolutePath();
                }
                o.put("iconPath", ip);
                o.put("iconIndex", l.iconIndex);
                o.put("mtime", k.lastModified());
                out.put(o);
            } catch (Exception ignored) {
                // an unreadable shortcut is simply not listed
            }
        }
    }

    /** Lists the programs in the container's Start Menu folders: {containerId?} -> {items:[{lnk,name,target,args,cwd,iconPath,iconIndex,mtime}]}. */
    @PluginMethod
    public void scanStart(final PluginCall call) {
        final Context ctx = getContext();
        final int want = call.getInt("containerId", 0);
        new Thread(() -> {
            try {
                if (!runtimeReady(ctx)) {
                    JSObject r0 = new JSObject();
                    r0.put("items", new JSArray());
                    call.resolve(r0);
                    return;
                }
                Container found = null;
                for (Container x : new ContainerManager(ctx).getContainers()) {
                    if (want <= 0 || x.id == want) {
                        found = x;
                        break;
                    }
                }
                JSArray items = new JSArray();
                if (found != null) {
                    HashSet<String> seen = new HashSet<>();
                    scanDir(found, found.getStartMenuDir(), 0, items, seen);
                    scanDir(found, new File(found.getUserDir(), "AppData/Roaming/Microsoft/Windows/Start Menu"), 0, items, seen);
                    scanDir(found, new File(found.getUserDir(), "Application Data/Microsoft/Windows/Start Menu"), 0, items, seen);
                }
                JSObject r = new JSObject();
                r.put("items", items);
                call.resolve(r);
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Could not scan the Start Menu" : e.getMessage());
            }
        }, "aurora-wine-scan").start();
    }

    /** Extracts an icon as a PNG data URL: {path (exe/dll/ico), index?, fallback?} -> {png: "data:image/png;base64,..." or ""}. */
    @PluginMethod
    public void exeIcon(final PluginCall call) {
        final String path = call.getString("path", "");
        final String fallback = call.getString("fallback", "");
        final int index = call.getInt("index", 0);
        new Thread(() -> {
            byte[] png = null;
            try {
                if (path != null && !path.isEmpty()) {
                    File f = new File(path);
                    if (path.toLowerCase(Locale.ROOT).endsWith(".ico")) png = AuroraPeIcon.fromIco(f);
                    else png = AuroraPeIcon.extract(f, index);
                    if (png == null && index != 0) png = AuroraPeIcon.extract(f, 0);
                }
                if (png == null && fallback != null && !fallback.isEmpty()) png = AuroraPeIcon.extract(new File(fallback), 0);
            } catch (Exception ignored) {
                png = null;
            }
            JSObject r = new JSObject();
            r.put("png", png == null ? "" : "data:image/png;base64," + Base64.encodeToString(png, Base64.NO_WRAP));
            call.resolve(r);
        }, "aurora-wine-icon").start();
    }
}
