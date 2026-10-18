package com.auroraos.desktop;

import android.content.Context;
import android.system.Os;
import com.winlator.xenvironment.RootFS;
import java.io.File;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.util.ArrayList;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

/**
 * Winlator's glibc binaries (box64) are linked with an absolute ELF interpreter inside its own data directory
 * (/data/data/com.winlator/files/rootfs/lib/ld-linux-aarch64.so.1). Under another application id that path does not
 * exist and execve() fails with error=2 (ENOENT) although the box64 file itself is present.
 * This class reads PT_INTERP of the binary and, only when the interpreter file does not exist, rewrites it in place:
 * directly to the real rootfs path when it fits, otherwise to a short symlink in the app data directory.
 * It also records what it found in files/aurora-last-error.txt (shown in the red error banner).
 */
public final class AuroraElf {
    private AuroraElf() { }

    private static final int PT_INTERP = 3;
    private static final String LD_NAME = "lib/ld-linux-aarch64.so.1";

    public static synchronized String fixInterpreter(Context ctx, File bin) {
        String result;
        try {
            result = doFix(ctx, bin);
        } catch (Throwable t) {
            result = "box64 interpreter check failed: " + t;
        }
        try {
            result += "\n" + fixPaths(ctx);
        } catch (Throwable t) {
            result += "\nrootfs path fix failed: " + t;
        }
        android.util.Log.i("AuroraWine", result);
        note(ctx, result);
        return result;
    }

    private static String doFix(Context ctx, File bin) throws Exception {
        if (!bin.isFile()) return "box64 file is missing: " + bin;
        File rootDir = RootFS.find(ctx).getRootDir();
        String pkg = ctx.getPackageName();
        String alias = "/data/data/" + pkg + "/.ld";

        try (RandomAccessFile f = new RandomAccessFile(bin, "r")) { // read-only: a running box64 cannot be opened for writing (ETXTBSY)
            byte[] eh = new byte[64];
            f.readFully(eh);
            if (eh[0] != 0x7f || eh[1] != 'E' || eh[2] != 'L' || eh[3] != 'F') return "box64 is not an ELF file: " + bin;
            if (eh[4] != 2 || eh[5] != 1) return "box64 is not a 64-bit little-endian ELF file";
            ByteBuffer h = ByteBuffer.wrap(eh).order(ByteOrder.LITTLE_ENDIAN);
            long phoff = h.getLong(0x20);
            int phentsize = h.getShort(0x36) & 0xffff;
            int phnum = h.getShort(0x38) & 0xffff;
            if (phentsize < 56) return "box64 has an unexpected ELF program header size: " + phentsize;

            for (int i = 0; i < phnum; i++) {
                byte[] ph = new byte[56];
                f.seek(phoff + (long) i * phentsize);
                f.readFully(ph);
                ByteBuffer p = ByteBuffer.wrap(ph).order(ByteOrder.LITTLE_ENDIAN);
                if (p.getInt(0) != PT_INTERP) continue;
                long off = p.getLong(8);
                long size = p.getLong(32);
                if (size < 2 || size > 4096) return "box64 has an unexpected PT_INTERP size: " + size;

                byte[] s = new byte[(int) size];
                f.seek(off);
                f.readFully(s);
                int n = 0;
                while (n < s.length && s[n] != 0) n++;
                String interp = new String(s, 0, n, StandardCharsets.UTF_8);

                // the interpreter we want to end up with: the loader that ships in this app's rootfs
                File realLd = new File(rootDir, LD_NAME);
                int idx = interp.indexOf("/rootfs/");
                if (idx >= 0) realLd = new File(rootDir, interp.substring(idx + "/rootfs/".length()));
                boolean viaAlias = interp.equals(alias);

                if (!realLd.isFile()) {
                    return "box64 interpreter " + interp + " cannot be fixed: " + realLd + " does not exist";
                }
                if (viaAlias) {
                    // already patched on an earlier run: make sure the symlink still points to the loader
                    makeLink(ctx, realLd);
                    return "box64 interpreter (already patched) " + interp + " -> " + realLd;
                }
                if (new File(interp).exists()) return "box64 interpreter ok: " + interp;

                String target = realLd.getPath();
                if (target.getBytes(StandardCharsets.UTF_8).length + 1 > size) {
                    makeLink(ctx, realLd);
                    target = alias;
                }
                byte[] nb = target.getBytes(StandardCharsets.UTF_8);
                if (nb.length + 1 > size) return "box64 interpreter " + interp + " cannot be fixed: new path too long (" + target + ")";
                byte[] out = new byte[(int) size];
                System.arraycopy(nb, 0, out, 0, nb.length);
                try (RandomAccessFile w = new RandomAccessFile(bin, "rw")) {
                    w.seek(off);
                    w.write(out);
                }
                bin.setExecutable(true, false);
                return "box64 interpreter patched: " + interp + " -> " + target;
            }
        }
        return "box64 has no PT_INTERP (statically linked?)";
    }


    // ---- hard-coded rootfs path inside Winlator's own binaries (wine, wineserver, ntdll.so, ...) ----
    private static final String OLD_ROOT = "/data/data/com.winlator/files/rootfs";
    private static final String MARKER = ".aurora-paths-v1";
    private static final int CHUNK = 1 << 20;

    /**
     * Wine (and other binaries) from Winlator contain the absolute string /data/data/com.winlator/files/rootfs
     * (e.g. wineserver creates /data/data/com.winlator/files/rootfs/tmp/.wine-UID, which cannot exist under another
     * application id). The string is replaced IN PLACE by a same-length path that goes through a symlink in this
     * app's data directory: "/data/data/<pkg>/r" followed by slashes up to the original length (extra slashes are
     * harmless in paths), where <data dir>/r is a symlink to the real rootfs. Runs once per rootfs install.
     */
    private static String fixPaths(Context ctx) throws Exception {
        File rootDir = RootFS.find(ctx).getRootDir();
        byte[] oldB = OLD_ROOT.getBytes(StandardCharsets.UTF_8);
        StringBuilder nb = new StringBuilder("/data/data/" + ctx.getPackageName() + "/r");
        if (nb.length() > oldB.length) return "rootfs path fix skipped: package name too long";
        while (nb.length() < oldB.length) nb.append('/');
        byte[] newB = nb.toString().getBytes(StandardCharsets.UTF_8);

        // symlink <data dir>/r -> rootfs (refreshed on every launch)
        File link = new File(ctx.getApplicationInfo().dataDir, "r");
        try {
            if (!link.getCanonicalPath().equals(rootDir.getCanonicalPath())) {
                link.delete();
                Os.symlink(rootDir.getPath(), link.getPath());
            }
        } catch (Exception e) {
            link.delete();
            Os.symlink(rootDir.getPath(), link.getPath());
        }

        // XServerDisplayActivity re-extracts rootfs_patches.tzst (original, unpatched files) whenever the app version
        // differs from the one stored in the container, so the marker is tied to the app's versionCode.
        String version = "v1:" + appVersion(ctx);
        File marker = new File(rootDir, MARKER);
        if (marker.isFile() && version.equals(readText(marker))) {
            return "rootfs paths already patched (" + nb.toString().replaceAll("/+$", "") + ")";
        }

        int[] stat = new int[4]; // files scanned, files patched, occurrences, errors
        StringBuilder errs = new StringBuilder();
        walk(rootDir, true, oldB, newB, stat, errs);
        String summary = "rootfs paths patched: scanned " + stat[0] + " ELF files, changed " + stat[1] + " files, "
            + stat[2] + " occurrences, errors " + stat[3] + (errs.length() > 0 ? " [" + errs + "]" : "");
        if (stat[3] == 0) {
            try (FileOutputStream o = new FileOutputStream(marker)) {
                o.write(version.getBytes(StandardCharsets.UTF_8));
            }
        }
        return summary;
    }

    @SuppressWarnings("deprecation")
    private static int appVersion(Context ctx) {
        try {
            return ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0).versionCode;
        } catch (Throwable t) {
            return 0;
        }
    }

    private static String readText(File f) {
        try {
            return new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8).trim();
        } catch (Throwable t) {
            return "";
        }
    }

    private static void walk(File dir, boolean top, byte[] oldB, byte[] newB, int[] stat, StringBuilder errs) {
        File[] list = dir.listFiles();
        if (list == null) return;
        for (File f : list) {
            String name = f.getName();
            if (Files.isSymbolicLink(f.toPath())) continue;
            if (f.isDirectory()) {
                if (top && (name.equals("home") || name.equals("tmp"))) continue; // wineprefix and temp files
                if (name.equals("drive_c")) continue;
                walk(f, false, oldB, newB, stat, errs);
            } else if (f.isFile() && f.length() >= oldB.length) {
                try {
                    patchFile(f, oldB, newB, stat);
                } catch (Exception e) {
                    stat[3]++;
                    if (errs.length() < 300) errs.append(name).append(": ").append(e.getMessage()).append("; ");
                }
            }
        }
    }

    private static void patchFile(File f, byte[] oldB, byte[] newB, int[] stat) throws Exception {
        ArrayList<Long> hits = new ArrayList<>();
        try (RandomAccessFile r = new RandomAccessFile(f, "r")) {
            byte[] magic = new byte[4];
            r.readFully(magic);
            if (magic[0] != 0x7f || magic[1] != 'E' || magic[2] != 'L' || magic[3] != 'F') return;
            stat[0]++;
            r.seek(0);
            byte[] buf = new byte[CHUNK + oldB.length];
            int carry = 0;
            long pos = 0;
            while (true) {
                int n = r.read(buf, carry, CHUNK);
                if (n <= 0) break;
                int total = carry + n;
                long base = pos - carry;
                for (int i = 0; i + oldB.length <= total; i++) {
                    if (buf[i] != oldB[0]) continue;
                    int k = 1;
                    while (k < oldB.length && buf[i + k] == oldB[k]) k++;
                    if (k == oldB.length) {
                        hits.add(base + i);
                        i += oldB.length - 1;
                    }
                }
                carry = Math.min(oldB.length - 1, total);
                System.arraycopy(buf, total - carry, buf, 0, carry);
                pos += n;
            }
        }
        if (hits.isEmpty()) return;
        f.setWritable(true, true);
        try (RandomAccessFile w = new RandomAccessFile(f, "rw")) {
            for (long h : hits) {
                w.seek(h);
                w.write(newB);
            }
        }
        stat[1]++;
        stat[2] += hits.size();
    }

    private static void makeLink(Context ctx, File realLd) throws Exception {
        File link = new File(ctx.getApplicationInfo().dataDir, ".ld");
        try {
            if (link.getCanonicalPath().equals(realLd.getCanonicalPath())) return;
        } catch (Exception ignored) { }
        link.delete();
        Os.symlink(realLd.getPath(), link.getPath());
    }

    private static void note(Context ctx, String msg) {
        try {
            File f = new File(ctx.getFilesDir(), "aurora-last-error.txt");
            boolean append = f.isFile() && System.currentTimeMillis() - f.lastModified() < 120000;
            try (FileOutputStream o = new FileOutputStream(f, append)) {
                o.write((msg + "\n").getBytes(StandardCharsets.UTF_8));
            }
        } catch (Throwable ignored) { }
        // copy that survives the app: Download/aurora-wine.log (best effort; needs the storage permission the app already asks for)
        try {
            File dl = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
            if (dl != null && (dl.isDirectory() || dl.mkdirs())) {
                File log = new File(dl, "aurora-wine.log");
                boolean big = log.isFile() && log.length() > 200000;
                try (FileOutputStream o = new FileOutputStream(log, !big)) {
                    o.write((new java.util.Date() + "\n" + msg + "\n\n").getBytes(StandardCharsets.UTF_8));
                }
            }
        } catch (Throwable ignored) { }
    }
}
