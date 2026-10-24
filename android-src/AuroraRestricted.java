package com.auroraos.desktop;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.UriPermission;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.DocumentsContract;
import android.webkit.MimeTypeMap;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * v3.0.11: reaches folders that the plain File API cannot list on Android 11+:
 *  - Android/data and Android/obb  -> Storage Access Framework tree grant (Android 11-12, some 13+), or root
 *  - /data/data, /data/user, ...   -> root only (the app's own folder is always open)
 * All methods take normal absolute paths (like /storage/emulated/0/Android/data/com.x/files).
 */
public final class AuroraRestricted {
    private AuroraRestricted() { }

    public static final class Item {
        public String name, path, mime;
        public boolean dir;
        public long size = -1, mod;
    }

    public static final class AccessException extends Exception {
        public final String code;
        public AccessException(String code, String msg) { super(msg); this.code = code; }
    }

    private static final String AUTH = "com.android.externalstorage.documents";
    private static final String PREFS = "aurora_restricted";
    private static final String PRIMARY = "/storage/emulated/0";
    private static volatile int rootState = 0; // 0 unknown, 1 yes, -1 no

    // ---------- paths ----------
    public static String norm(String p) {
        if (p == null) return "";
        String s = p.replace('\\', '/');
        while (s.contains("//")) s = s.replace("//", "/");
        if (s.length() > 1 && s.endsWith("/")) s = s.substring(0, s.length() - 1);
        String[] aliases = { "/sdcard", "/storage/self/primary", "/mnt/sdcard", "/storage/emulated/legacy" };
        for (String a : aliases) {
            if (s.equals(a) || s.startsWith(a + "/")) { s = PRIMARY + s.substring(a.length()); break; }
        }
        return s;
    }

    private static boolean hasDots(String s) {
        for (String seg : s.split("/")) if (seg.equals("..") || seg.equals(".")) return true;
        return false;
    }

    private static String parent(String p) {
        int i = p.lastIndexOf('/');
        return i <= 0 ? "/" : p.substring(0, i);
    }

    private static String base(String p) {
        int i = p.lastIndexOf('/');
        return i < 0 ? p : p.substring(i + 1);
    }

    private static String join(String dir, String name) {
        return dir.equals("/") ? "/" + name : dir + "/" + name;
    }

    /** {"saf", "data"|"obb", rel} | {"root","",""} | null (normal path, plain File API works). */
    private static String[] kind(Context c, String path) {
        String s = norm(path);
        if (s.isEmpty() || hasDots(s)) return null;
        String pk = c.getPackageName();
        String[] ws = { "data", "obb" };
        for (String w : ws) {
            String b = PRIMARY + "/Android/" + w;
            if (s.equals(b) || s.startsWith(b + "/")) {
                if (Build.VERSION.SDK_INT < 30) return null;
                String rel = s.substring(b.length());
                if (rel.equals("/" + pk) || rel.startsWith("/" + pk + "/")) return null;
                return new String[] { "saf", w, rel };
            }
        }
        String[] sys = { "/data", "/system", "/vendor", "/product", "/apex", "/proc", "/sys", "/cache", "/etc", "/mnt/pass_through", "/mnt/runtime" };
        for (String b : sys) {
            if (s.equals(b) || s.startsWith(b + "/")) return new String[] { "root", "", "" };
        }
        return null;
    }

    public static boolean handles(Context c, String path) {
        try { return kind(c, path) != null; } catch (Exception e) { return false; }
    }

    /** 0 = plain File API, 1 = SAF, 2 = root. */
    private static int modeOf(Context c, String path) throws AccessException {
        String[] k = kind(c, path);
        if (k == null) return 0;
        if (k[0].equals("saf")) {
            if (treeUri(c, k[1]) != null) return 1;
            if (hasRoot(false)) return 2;
            throw new AccessException("NEEDS_GRANT_" + k[1].toUpperCase(), "Android/" + k[1] + " needs access.");
        }
        String s = norm(path), pk = c.getPackageName();
        String[] own = { "/data/data/", "/data/user/0/" };
        for (String b : own) {
            if (s.equals(b + pk) || s.startsWith(b + pk + "/")) return 0;
        }
        if (hasRoot(false)) return 2;
        throw new AccessException("NEEDS_ROOT", "This folder needs root access.");
    }

    // ---------- root ----------
    public static boolean rootAvailable(boolean probe) { return hasRoot(probe); }

    private static boolean hasRoot(boolean force) {
        if (rootState == 1) return true;
        if (rootState == -1 && !force) return false;
        boolean ok = false;
        try {
            final Process p = new ProcessBuilder("su", "-c", "id").start();
            final StringBuilder out = new StringBuilder();
            Thread t = new Thread(new Runnable() {
                @Override public void run() {
                    try { out.append(slurp(p.getInputStream())); } catch (IOException ignored) { }
                }
            });
            t.start();
            long end = System.currentTimeMillis() + 12000;
            boolean done = false;
            while (System.currentTimeMillis() < end) {
                try { p.exitValue(); done = true; break; } catch (IllegalThreadStateException e) { Thread.sleep(120); }
            }
            if (!done) p.destroy();
            t.join(1000);
            ok = done && out.toString().contains("uid=0");
        } catch (Exception e) {
            ok = false;
        }
        rootState = ok ? 1 : -1;
        return ok;
    }

    private static Process su(String cmd) throws IOException {
        return new ProcessBuilder("su", "-c", cmd).start();
    }

    private static String sq(String s) { return "'" + s.replace("'", "'\\''") + "'"; }

    private static String slurp(InputStream in) throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] b = new byte[4096];
        int r;
        while ((r = in.read(b)) > 0) bo.write(b, 0, r);
        return new String(bo.toByteArray(), StandardCharsets.UTF_8);
    }

    private static String runRoot(String cmd) throws Exception {
        final Process p = su(cmd);
        final StringBuilder err = new StringBuilder();
        Thread t = new Thread(new Runnable() {
            @Override public void run() {
                try { err.append(slurp(p.getErrorStream())); } catch (IOException ignored) { }
            }
        });
        t.start();
        String out = slurp(p.getInputStream());
        int rc = p.waitFor();
        t.join(2000);
        if (rc != 0) throw new IOException(err.length() > 0 ? err.toString().trim() : "Root command failed (" + rc + ")");
        return out;
    }

    private static Item parseStat(String line, String fullPath) {
        String[] f = line.split("\\|", 4);
        if (f.length < 4) return null;
        Item it = new Item();
        it.dir = f[0].startsWith("directory");
        try { it.size = it.dir ? -1 : Long.parseLong(f[1].trim()); } catch (Exception e) { it.size = -1; }
        try { it.mod = Long.parseLong(f[2].trim()) * 1000L; } catch (Exception e) { it.mod = 0; }
        it.name = fullPath != null ? base(fullPath) : f[3];
        it.path = fullPath;
        it.mime = it.dir ? "inode/directory" : mimeFor(it.name);
        return it;
    }

    private static List<Item> rootList(String path) throws Exception {
        String cmd = "cd " + sq(path) + " || exit 3; stat -L -c '%F|%s|%Y|%n' .[!.]* ..?* * 2>/dev/null; exit 0";
        String out = runRoot(cmd);
        List<Item> res = new ArrayList<Item>();
        for (String line : out.split("\n")) {
            if (line.trim().isEmpty()) continue;
            String[] f = line.split("\\|", 4);
            if (f.length < 4) continue;
            String name = f[3];
            if (name.equals(".") || name.equals("..")) continue;
            Item it = parseStat(line, join(path, name));
            if (it != null) res.add(it);
        }
        return res;
    }

    private static Item rootStat(String path) throws Exception {
        String out = runRoot("stat -L -c '%F|%s|%Y|%n' " + sq(path)).trim();
        Item it = parseStat(out.split("\n")[0], path);
        if (it == null) throw new FileNotFoundException(path);
        return it;
    }

    private static InputStream rootIn(String path) throws IOException {
        final Process p = su("cat " + sq(path));
        return new FilterInputStream(p.getInputStream()) {
            @Override public void close() throws IOException {
                try { super.close(); } finally { p.destroy(); }
            }
        };
    }

    private static OutputStream rootOut(String path) throws IOException {
        final Process p = su("cat > " + sq(path) + " && chown $(stat -c %u:%g " + sq(parent(path)) + ") " + sq(path));
        return new FilterOutputStream(p.getOutputStream()) {
            @Override public void write(byte[] b, int o, int l) throws IOException { out.write(b, o, l); }
            @Override public void close() throws IOException {
                try { super.close(); } finally {
                    try {
                        int rc = p.waitFor();
                        if (rc != 0) throw new IOException("Root write failed (" + rc + ")");
                    } catch (InterruptedException e) {
                        throw new IOException("Interrupted");
                    }
                }
            }
        };
    }

    // ---------- SAF ----------
    private static String prefKey(String w) { return "tree_" + w; }

    private static Uri treeUri(Context c, String w) {
        String s = c.getSharedPreferences(PREFS, 0).getString(prefKey(w), null);
        if (s == null) return null;
        Uri u = Uri.parse(s);
        try {
            for (UriPermission up : c.getContentResolver().getPersistedUriPermissions()) {
                if (up.getUri().equals(u) && up.isReadPermission() && up.isWritePermission()) return u;
            }
        } catch (Exception ignored) { }
        return null;
    }

    public static boolean hasGrant(Context c, String w) { return treeUri(c, w) != null; }

    public static Intent grantIntent(String w) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        i.putExtra(DocumentsContract.EXTRA_INITIAL_URI, DocumentsContract.buildDocumentUri(AUTH, "primary:Android/" + w));
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        return i;
    }

    /** Returns null when saved, otherwise a message for the user. */
    public static String saveGrant(Context c, String w, Uri tree) {
        String id;
        try { id = DocumentsContract.getTreeDocumentId(tree); } catch (Exception e) { return "Could not read the folder you picked"; }
        String want = "primary:Android/" + w;
        if (id == null || !(id.equals(want) || id.equals(want + "/"))) {
            return "Please open Android/" + w + " and tap \"Use this folder\" there (you picked: " + id + ").";
        }
        try {
            c.getContentResolver().takePersistableUriPermission(tree,
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        } catch (Exception e) {
            return "Android refused to keep the access: " + e.getMessage();
        }
        c.getSharedPreferences(PREFS, 0).edit().putString(prefKey(w), tree.toString()).apply();
        return null;
    }

    private static final String[] COLS = {
        DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
        DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.COLUMN_SIZE,
        DocumentsContract.Document.COLUMN_LAST_MODIFIED };

    private static String docId(String w, String rel) { return "primary:Android/" + w + rel; }

    private static Uri docUri(Context c, String w, String rel) throws AccessException {
        Uri t = treeUri(c, w);
        if (t == null) throw new AccessException("NEEDS_GRANT_" + w.toUpperCase(), "Android/" + w + " needs access.");
        return DocumentsContract.buildDocumentUriUsingTree(t, docId(w, rel));
    }

    private static Item fromCursor(Cursor cur, String fullPath) {
        Item it = new Item();
        it.name = cur.getString(1);
        it.mime = cur.getString(2);
        it.dir = DocumentsContract.Document.MIME_TYPE_DIR.equals(it.mime);
        it.size = (cur.isNull(3) || it.dir) ? -1 : cur.getLong(3);
        it.mod = cur.isNull(4) ? 0 : cur.getLong(4);
        it.path = fullPath;
        return it;
    }

    private static List<Item> safList(Context c, String path, String w, String rel) throws Exception {
        Uri t = treeUri(c, w);
        if (t == null) throw new AccessException("NEEDS_GRANT_" + w.toUpperCase(), "Android/" + w + " needs access.");
        Uri ch = DocumentsContract.buildChildDocumentsUriUsingTree(t, docId(w, rel));
        List<Item> out = new ArrayList<Item>();
        Cursor cur = c.getContentResolver().query(ch, COLS, null, null, null);
        if (cur == null) throw new IOException("Could not read this folder");
        try {
            while (cur.moveToNext()) {
                String nm = cur.getString(1);
                Item it = fromCursor(cur, join(path, nm == null ? "?" : nm));
                out.add(it);
            }
        } finally { cur.close(); }
        return out;
    }

    private static Item safStat(Context c, String path, String w, String rel) throws Exception {
        Uri u = docUri(c, w, rel);
        Cursor cur = null;
        try {
            cur = c.getContentResolver().query(u, COLS, null, null, null);
            if (cur == null || !cur.moveToFirst()) throw new FileNotFoundException(path);
            return fromCursor(cur, path);
        } finally { if (cur != null) cur.close(); }
    }

    // ---------- plain ----------
    private static Item fromFile(File f) {
        Item it = new Item();
        it.name = f.getName();
        it.path = f.getAbsolutePath();
        it.dir = f.isDirectory();
        it.size = it.dir ? -1 : f.length();
        it.mod = f.lastModified();
        it.mime = it.dir ? "inode/directory" : mimeFor(it.name);
        return it;
    }

    private static boolean delRec(File f) {
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) for (File k : kids) delRec(k);
        }
        return f.delete();
    }

    private static String mimeFor(String name) {
        int i = name.lastIndexOf('.');
        if (i < 0) return "application/octet-stream";
        String m = MimeTypeMap.getSingleton().getMimeTypeFromExtension(name.substring(i + 1).toLowerCase());
        return m == null ? "application/octet-stream" : m;
    }

    // ---------- public operations (work for every path) ----------
    public static List<Item> list(Context c, String path) throws Exception {
        String p = norm(path);
        int m = modeOf(c, p);
        if (m == 1) { String[] k = kind(c, p); return safList(c, p, k[1], k[2]); }
        if (m == 2) return rootList(p);
        File[] kids = new File(p).listFiles();
        if (kids == null) throw new IOException("Cannot open this folder");
        List<Item> out = new ArrayList<Item>();
        for (File k : kids) out.add(fromFile(k));
        return out;
    }

    public static Item stat(Context c, String path) throws Exception {
        String p = norm(path);
        int m = modeOf(c, p);
        if (m == 1) { String[] k = kind(c, p); return safStat(c, p, k[1], k[2]); }
        if (m == 2) return rootStat(p);
        File f = new File(p);
        if (!f.exists()) throw new FileNotFoundException(p);
        return fromFile(f);
    }

    private static boolean exists(Context c, String path) {
        try { stat(c, path); return true; } catch (AccessException e) { return false; } catch (Exception e) { return false; }
    }

    public static InputStream openIn(Context c, String path) throws Exception {
        String p = norm(path);
        int m = modeOf(c, p);
        if (m == 1) {
            String[] k = kind(c, p);
            InputStream in = c.getContentResolver().openInputStream(docUri(c, k[1], k[2]));
            if (in == null) throw new IOException("Could not open the file");
            return in;
        }
        if (m == 2) return rootIn(p);
        return new FileInputStream(p);
    }

    /** Creates or replaces the file; the parent folder must exist. */
    public static OutputStream openOut(Context c, String path) throws Exception {
        String p = norm(path);
        int m = modeOf(c, p);
        if (m == 1) {
            String[] k = kind(c, p);
            ContentResolver cr = c.getContentResolver();
            Uri target = docUri(c, k[1], k[2]);
            OutputStream o = null;
            if (exists(c, p)) {
                o = cr.openOutputStream(target, "wt");
            } else {
                String prel = k[2].substring(0, Math.max(0, k[2].lastIndexOf('/')));
                Uri made = DocumentsContract.createDocument(cr, docUri(c, k[1], prel), mimeFor(base(p)), base(p));
                if (made == null) throw new IOException("Could not create the file");
                o = cr.openOutputStream(made, "wt");
            }
            if (o == null) throw new IOException("Could not open the file for writing");
            return o;
        }
        if (m == 2) return rootOut(p);
        return new FileOutputStream(p);
    }

    public static void mkdir(Context c, String parentPath, String name) throws Exception {
        String pp = norm(parentPath);
        int m = modeOf(c, pp);
        if (m == 1) {
            String[] k = kind(c, pp);
            Uri made = DocumentsContract.createDocument(c.getContentResolver(), docUri(c, k[1], k[2]),
                DocumentsContract.Document.MIME_TYPE_DIR, name);
            if (made == null) throw new IOException("Could not create folder");
            return;
        }
        String t = join(pp, name);
        if (m == 2) {
            runRoot("mkdir " + sq(t) + " && chown $(stat -c %u:%g " + sq(pp) + ") " + sq(t));
            return;
        }
        File f = new File(t);
        if (!f.mkdirs() && !f.isDirectory()) throw new IOException("Could not create folder");
    }

    public static void rename(Context c, String path, String newName) throws Exception {
        String p = norm(path);
        int m = modeOf(c, p);
        if (m == 1) {
            String[] k = kind(c, p);
            Uri r = DocumentsContract.renameDocument(c.getContentResolver(), docUri(c, k[1], k[2]), newName);
            if (r == null) throw new IOException("Could not rename");
            return;
        }
        String t = join(parent(p), newName);
        if (m == 2) { runRoot("mv " + sq(p) + " " + sq(t)); return; }
        if (!new File(p).renameTo(new File(t))) throw new IOException("Could not rename");
    }

    public static void delete(Context c, String path) throws Exception {
        String p = norm(path);
        int m = modeOf(c, p);
        if (m == 1) {
            String[] k = kind(c, p);
            if (k[2].isEmpty()) throw new IOException("This folder cannot be deleted");
            if (!DocumentsContract.deleteDocument(c.getContentResolver(), docUri(c, k[1], k[2]))) throw new IOException("Could not delete");
            return;
        }
        if (m == 2) {
            if (p.equals("/") || p.equals("/data") || p.equals("/system") || p.equals("/data/data")) throw new IOException("Refusing to delete a system folder");
            runRoot("rm -rf " + sq(p));
            return;
        }
        if (!delRec(new File(p))) throw new IOException("Could not delete");
    }

    public static String readText(Context c, String path, long max) throws Exception {
        InputStream in = openIn(c, path);
        try {
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] b = new byte[16384];
            int r;
            while ((r = in.read(b)) > 0) {
                bo.write(b, 0, r);
                if (bo.size() > max) throw new IOException("File is too large (limit " + (max / 1024 / 1024) + " MB)");
            }
            return new String(bo.toByteArray(), StandardCharsets.UTF_8);
        } finally { in.close(); }
    }

    public static void writeText(Context c, String path, String text) throws Exception {
        OutputStream o = openOut(c, path);
        try { o.write(text.getBytes(StandardCharsets.UTF_8)); } finally { o.close(); }
    }

    /** Copies the file to the app cache so another app can open it. */
    public static File toCache(Context c, String path) throws Exception {
        File dir = new File(c.getCacheDir(), "restricted");
        dir.mkdirs();
        File out = new File(dir, base(norm(path)));
        InputStream in = openIn(c, path);
        try {
            OutputStream o = new FileOutputStream(out);
            try {
                byte[] b = new byte[65536];
                int r;
                while ((r = in.read(b)) > 0) o.write(b, 0, r);
            } finally { o.close(); }
        } finally { in.close(); }
        return out;
    }

    /** {bytes, files, folders}; stops at the deadline. */
    public static long[] sizeOf(Context c, String path, long deadline) throws Exception {
        long[] acc = new long[] { 0, 0, 0 };
        Item it = stat(c, path);
        if (!it.dir) { acc[0] = Math.max(0, it.size); acc[1] = 1; return acc; }
        walk(c, norm(path), acc, deadline);
        return acc;
    }

    private static void walk(Context c, String path, long[] acc, long deadline) {
        List<Item> kids;
        try { kids = list(c, path); } catch (Exception e) { return; }
        for (Item k : kids) {
            if (System.currentTimeMillis() > deadline) return;
            if (k.dir) { acc[2]++; walk(c, k.path, acc, deadline); } else { acc[0] += Math.max(0, k.size); acc[1]++; }
        }
    }

    private static String uniqueName(Context c, String dir, String name) {
        if (!exists(c, join(dir, name))) return name;
        String b = name, ext = "";
        int i = name.lastIndexOf('.');
        if (i > 0) { b = name.substring(0, i); ext = name.substring(i); }
        for (int n = 1; n < 1000; n++) {
            String cand = b + " - Copy" + (n > 1 ? " (" + n + ")" : "") + ext;
            if (!exists(c, join(dir, cand))) return cand;
        }
        return b + "_" + System.currentTimeMillis() + ext;
    }

    private static void copyNode(Context c, String src, boolean dir, String destDir, String name) throws Exception {
        String t = join(destDir, name);
        if (dir) {
            mkdir(c, destDir, name);
            for (Item k : list(c, src)) copyNode(c, k.path, k.dir, t, k.name);
        } else {
            InputStream in = openIn(c, src);
            try {
                OutputStream out = openOut(c, t);
                try {
                    byte[] b = new byte[65536];
                    int r;
                    while ((r = in.read(b)) > 0) out.write(b, 0, r);
                } finally { out.close(); }
            } finally { in.close(); }
        }
    }

    /** Copy or move between any two places (normal storage, Android/data, root folders). */
    public static int paste(Context c, List<String> srcs, String destDir, boolean move) throws Exception {
        String dest = norm(destDir);
        int n = 0;
        for (String s0 : srcs) {
            String s = norm(s0);
            Item st = stat(c, s);
            if (st.dir && (dest.equals(s) || dest.startsWith(s + "/"))) {
                throw new IOException("You can't " + (move ? "move" : "copy") + " a folder into itself");
            }
            if (move && parent(s).equals(dest)) continue;
            String name = uniqueName(c, dest, base(s));
            copyNode(c, s, st.dir, dest, name);
            if (move) delete(c, s);
            n++;
        }
        return n;
    }
}
