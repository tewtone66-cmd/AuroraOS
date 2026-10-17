package com.auroraos.desktop;

import android.os.Build;
import android.system.Os;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.concurrent.atomic.AtomicBoolean;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.compressors.zstandard.ZstdCompressorInputStream;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Winlator core, step 1 (infrastructure): installs rootfs and prepares the default container.
 * Layout follows Winlator 11.2 (winlator-app @ 8077f374): filesDir/rootfs, home/xuser-N, opt/wine.
 */
@CapacitorPlugin(name = "AuroraWine")
public class AuroraWinePlugin extends Plugin {

    /** Same value as RootFSInstaller.LATEST_VERSION in the pinned Winlator commit. */
    static final int RFS_VERSION = 23;
    static final String CONTAINER_NAME = "xuser-1";
    static final String READY_MARK = ".aurora-ready";
    static final long MIN_FREE_BYTES = 1024L * 1024L * 1024L;

    private final AtomicBoolean busy = new AtomicBoolean(false);

    private interface Progress { void on(int pct); }

    private static class CountingStream extends FilterInputStream {
        long count = 0;
        CountingStream(InputStream in) { super(in); }
        @Override public int read() throws IOException {
            int b = super.read();
            if (b >= 0) count++;
            return b;
        }
        @Override public int read(byte[] b, int off, int len) throws IOException {
            int n = super.read(b, off, len);
            if (n > 0) count += n;
            return n;
        }
    }

    // ---------- helpers ----------
    private File rootDir() { return new File(getContext().getFilesDir(), "rootfs"); }

    private void emit(String stage, int pct, String msg) {
        JSObject o = new JSObject();
        o.put("stage", stage);
        o.put("percent", pct);
        o.put("message", msg);
        notifyListeners("progress", o);
    }

    private static int readInt(File f) {
        try {
            return Integer.parseInt(new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8).trim());
        } catch (Exception ignored) {
            return 0;
        }
    }

    private static void writeText(File f, String s) throws IOException {
        File p = f.getParentFile();
        if (p != null) p.mkdirs();
        try (OutputStream o = new FileOutputStream(f)) {
            o.write(s.getBytes(StandardCharsets.UTF_8));
        }
    }

    private String assetText(String name) throws IOException {
        try (InputStream in = getContext().getAssets().open(name)) {
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
            return new String(bo.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    private static void delRec(File f) {
        try {
            if (!Files.isSymbolicLink(f.toPath()) && f.isDirectory()) {
                File[] kids = f.listFiles();
                if (kids != null) for (File k : kids) delRec(k);
            }
        } catch (Exception ignored) { }
        f.delete();
    }

    private static void deleteQuiet(File f) {
        try {
            if (Files.isSymbolicLink(f.toPath()) || f.exists()) f.delete();
        } catch (Exception ignored) { }
    }

    private static void chmod(File f) {
        try {
            Os.chmod(f.getAbsolutePath(), 0771);
        } catch (Exception ignored) { }
    }

    /** Same rules as Winlator RootFSInstaller.clearRootDir: keep home and opt/installed-wine. */
    private static void clearRoot(File root) {
        File[] kids = root.listFiles();
        if (kids == null) {
            root.mkdirs();
            return;
        }
        for (File k : kids) {
            String n = k.getName();
            if (k.isDirectory() && !Files.isSymbolicLink(k.toPath())) {
                if (n.equals("home")) continue;
                if (n.equals("opt")) {
                    File[] inner = k.listFiles();
                    if (inner != null) {
                        for (File o : inner) {
                            if (!o.getName().equals("installed-wine")) delRec(o);
                        }
                    }
                    continue;
                }
            }
            delRec(k);
        }
    }

    /** Extracts a .tzst (zstd + tar) asset the same way Winlator TarCompressorUtils does. */
    private void extractAsset(String asset, File dest, Progress cb) throws Exception {
        InputStream raw = getContext().getAssets().open(asset);
        long total = Math.max(1L, (long) raw.available());
        CountingStream cs = new CountingStream(new BufferedInputStream(raw, 65536));
        Path destPath = dest.toPath().toAbsolutePath().normalize();
        dest.mkdirs();
        int last = -1;
        byte[] buf = new byte[65536];
        try (TarArchiveInputStream tar = new TarArchiveInputStream(new ZstdCompressorInputStream(cs))) {
            TarArchiveEntry en;
            while ((en = tar.getNextTarEntry()) != null) {
                File f = new File(dest, en.getName());
                Path fp = f.toPath().toAbsolutePath().normalize();
                if (!fp.startsWith(destPath)) continue;
                if (en.isDirectory()) {
                    if (!f.isDirectory()) f.mkdirs();
                    chmod(f);
                } else {
                    File parent = f.getParentFile();
                    if (parent != null && !parent.isDirectory()) parent.mkdirs();
                    if (en.isSymbolicLink()) {
                        deleteQuiet(f);
                        Os.symlink(en.getLinkName(), f.getAbsolutePath());
                    } else if (en.isLink()) {
                        File src = new File(dest, en.getLinkName());
                        deleteQuiet(f);
                        if (src.isFile()) Files.copy(src.toPath(), f.toPath(), StandardCopyOption.REPLACE_EXISTING);
                        else f.createNewFile();
                        chmod(f);
                    } else {
                        deleteQuiet(f);
                        try (OutputStream out = new FileOutputStream(f)) {
                            int n;
                            while ((n = tar.read(buf)) > 0) out.write(buf, 0, n);
                        }
                        chmod(f);
                    }
                }
                int pct = (int) Math.min(100L, cs.count * 100L / total);
                if (pct != last) {
                    last = pct;
                    cb.on(pct);
                }
            }
        }
        cb.on(100);
    }

    /** Restores the DLLs that container_pattern.tzst leaves out (list in common_dlls.json). */
    private int copyCommonDlls(File root, File cdir) throws Exception {
        JSONObject j = new JSONObject(assetText("common_dlls.json"));
        String[][] maps = { { "system32", "x86_64-windows" }, { "syswow64", "i386-windows" } };
        int missing = 0;
        for (String[] m : maps) {
            JSONArray arr = j.optJSONArray(m[0]);
            if (arr == null) continue;
            File src = new File(root, "opt/wine/lib/wine/" + m[1]);
            File dst = new File(cdir, ".wine/drive_c/windows/" + m[0]);
            dst.mkdirs();
            for (int i = 0; i < arr.length(); i++) {
                String nm = arr.getString(i);
                File s = new File(src, nm);
                if (s.isFile()) Files.copy(s.toPath(), new File(dst, nm).toPath(), StandardCopyOption.REPLACE_EXISTING);
                else missing++;
            }
        }
        return missing;
    }

    // ---------- plugin methods ----------
    @PluginMethod
    public void status(PluginCall call) {
        File root = rootDir();
        int v = readInt(new File(root, ".winlator/.rfs_version"));
        JSObject o = new JSObject();
        o.put("rootfsVersion", v);
        o.put("rootfsReady", v >= RFS_VERSION);
        o.put("containerReady", new File(root, "home/" + CONTAINER_NAME + "/" + READY_MARK).isFile());
        o.put("busy", busy.get());
        call.resolve(o);
    }

    /** Installs rootfs (if needed) and prepares the default container. Emits "progress" events. */
    @PluginMethod
    public void init(final PluginCall call) {
        boolean arm = false;
        for (String abi : Build.SUPPORTED_ABIS) {
            if ("arm64-v8a".equals(abi)) arm = true;
        }
        if (!arm) {
            call.reject("This device is not arm64");
            return;
        }
        if (!busy.compareAndSet(false, true)) {
            call.reject("Installation is already running");
            return;
        }
        final File root = rootDir();
        new Thread(() -> {
            try {
                File vf = new File(root, ".winlator/.rfs_version");
                boolean rootDone = readInt(vf) >= RFS_VERSION;
                if (!rootDone) {
                    if (getContext().getFilesDir().getUsableSpace() < MIN_FREE_BYTES) {
                        throw new IOException("Not enough free storage (about 1 GB needed)");
                    }
                    emit("rootfs", 0, "Installing system files");
                    clearRoot(root);
                    extractAsset("rootfs.tzst", root, pct -> emit("rootfs", pct * 85 / 100, "Installing system files"));
                    writeText(vf, String.valueOf(RFS_VERSION));
                }

                File home = new File(root, "home");
                File c1 = new File(home, CONTAINER_NAME);
                int missingDlls = 0;
                if (!new File(c1, READY_MARK).isFile()) {
                    emit("container", 85, "Creating default container");
                    delRec(c1);
                    c1.mkdirs();
                    extractAsset("container_pattern.tzst", c1, pct -> emit("container", 85 + pct * 14 / 100, "Creating default container"));
                    missingDlls = copyCommonDlls(root, c1);
                    writeText(new File(c1, READY_MARK), "1");
                }

                File act = new File(home, "xuser");
                if (!Files.isSymbolicLink(act.toPath())) {
                    delRec(act);
                    Os.symlink(CONTAINER_NAME, act.getAbsolutePath());
                }

                emit("done", 100, "Ready");
                JSObject out = new JSObject();
                out.put("rootfs", root.getAbsolutePath());
                out.put("containerId", 1);
                out.put("containerPath", c1.getAbsolutePath());
                out.put("rootfsVersion", RFS_VERSION);
                out.put("missingDlls", missingDlls);
                call.resolve(out);
            } catch (Throwable err) {
                String msg = err.getMessage();
                call.reject(msg == null || msg.isEmpty() ? "Installation failed" : msg);
            } finally {
                busy.set(false);
            }
        }, "aurora-wine-init").start();
    }
}
