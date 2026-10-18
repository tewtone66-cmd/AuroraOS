package com.auroraos.desktop;

import android.content.Context;
import android.system.Os;
import com.winlator.xenvironment.RootFS;
import java.io.File;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
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
        android.util.Log.i("AuroraWine", result);
        note(ctx, result);
        return result;
    }

    private static String doFix(Context ctx, File bin) throws Exception {
        if (!bin.isFile()) return "box64 file is missing: " + bin;
        File rootDir = RootFS.find(ctx).getRootDir();
        String pkg = ctx.getPackageName();
        String alias = "/data/data/" + pkg + "/.ld";

        try (RandomAccessFile f = new RandomAccessFile(bin, "rw")) {
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
                f.seek(off);
                f.write(out);
                bin.setExecutable(true, false);
                return "box64 interpreter patched: " + interp + " -> " + target;
            }
        }
        return "box64 has no PT_INTERP (statically linked?)";
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
    }
}
