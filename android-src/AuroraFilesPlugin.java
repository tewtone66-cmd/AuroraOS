package com.auroraos.desktop;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.provider.Settings;
import android.webkit.MimeTypeMap;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Real file system access (All files access permission) so File Explorer behaves like Windows. */
@CapacitorPlugin(name = "AuroraFiles")
public class AuroraFilesPlugin extends Plugin {

    // ---------- permission ----------
    private boolean hasAccess() {
        if (Build.VERSION.SDK_INT >= 30) return Environment.isExternalStorageManager();
        Context c = getContext();
        return ContextCompat.checkSelfPermission(c, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
            && ContextCompat.checkSelfPermission(c, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject o = new JSObject();
        o.put("granted", hasAccess());
        o.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(o);
    }

    @PluginMethod
    public void requestAccess(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= 30) {
                Intent i;
                try {
                    i = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
                    getActivity().startActivity(i);
                } catch (Exception e) {
                    i = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                    getActivity().startActivity(i);
                }
            } else {
                ActivityCompat.requestPermissions(getActivity(), new String[] {
                    Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE }, 7001);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open permission screen", e);
        }
    }

    // ---------- helpers ----------
    private List<File> rootFiles() {
        List<File> r = new ArrayList<>();
        File internal = Environment.getExternalStorageDirectory();
        r.add(internal);
        try {
            File[] dirs = getContext().getExternalFilesDirs(null);
            if (dirs != null) {
                for (File d : dirs) {
                    if (d == null) continue;
                    String p = d.getAbsolutePath();
                    int i = p.indexOf("/Android/data");
                    if (i > 0) {
                        File root = new File(p.substring(0, i));
                        boolean dup = false;
                        for (File x : r) if (x.getAbsolutePath().equals(root.getAbsolutePath())) dup = true;
                        if (!dup && root.exists()) r.add(root);
                    }
                }
            }
        } catch (Exception ignored) { }
        return r;
    }

    private File guard(String path) throws Exception {
        if (path == null || path.isEmpty()) throw new Exception("No path");
        File f = new File(path).getCanonicalFile();
        String cp = f.getAbsolutePath();
        for (File r : rootFiles()) {
            String rp = r.getCanonicalFile().getAbsolutePath();
            if (cp.equals(rp) || cp.startsWith(rp + "/")) return f;
        }
        if (cp.startsWith("/storage/emulated/0/") || cp.equals("/storage/emulated/0")) return f;
        throw new Exception("Path is outside storage");
    }

    private String mimeOf(File f) {
        if (f.isDirectory()) return "inode/directory";
        String n = f.getName();
        int i = n.lastIndexOf('.');
        if (i < 0) return "application/octet-stream";
        String m = MimeTypeMap.getSingleton().getMimeTypeFromExtension(n.substring(i + 1).toLowerCase());
        return m == null ? "application/octet-stream" : m;
    }

    private JSObject describe(File f) {
        JSObject it = new JSObject();
        it.put("name", f.getName());
        it.put("path", f.getAbsolutePath());
        it.put("isDirectory", f.isDirectory());
        it.put("size", f.isDirectory() ? -1L : f.length());
        it.put("lastModified", f.lastModified());
        it.put("mimeType", mimeOf(f));
        it.put("hidden", f.getName().startsWith("."));
        return it;
    }

    private List<String> strings(PluginCall call, String key) {
        List<String> out = new ArrayList<>();
        try {
            JSArray a = call.getArray(key);
            if (a != null) for (int i = 0; i < a.length(); i++) out.add(a.getString(i));
        } catch (Exception ignored) { }
        return out;
    }

    // ---------- listing ----------
    @PluginMethod
    public void roots(PluginCall call) {
        JSArray arr = new JSArray();
        List<File> rs = rootFiles();
        for (int i = 0; i < rs.size(); i++) {
            File r = rs.get(i);
            JSObject o = new JSObject();
            o.put("path", r.getAbsolutePath());
            o.put("internal", i == 0);
            o.put("name", i == 0 ? "Internal storage" : "SD card " + i);
            try {
                StatFs s = new StatFs(r.getAbsolutePath());
                o.put("total", s.getTotalBytes());
                o.put("free", s.getAvailableBytes());
            } catch (Exception e) {
                o.put("total", 0L);
                o.put("free", 0L);
            }
            arr.put(o);
        }
        JSObject out = new JSObject();
        out.put("roots", arr);
        call.resolve(out);
    }

    @PluginMethod
    public void list(PluginCall call) {
        try {
            if (!hasAccess()) { call.reject("Storage access is not allowed yet"); return; }
            File d = guard(call.getString("path", ""));
            File[] kids = d.listFiles();
            if (kids == null) { call.reject("Cannot open this folder"); return; }
            JSArray items = new JSArray();
            for (File k : kids) items.put(describe(k));
            JSObject out = new JSObject();
            out.put("items", items);
            out.put("path", d.getAbsolutePath());
            call.resolve(out);
        } catch (Exception e) { call.reject(e.getMessage() == null ? "Could not read folder" : e.getMessage(), e); }
    }

    @PluginMethod
    public void info(PluginCall call) {
        try {
            File f = guard(call.getString("path", ""));
            long[] acc = new long[] { 0, 0, 0 }; // size, files, folders
            long deadline = System.currentTimeMillis() + 3000;
            if (f.isDirectory()) walk(f, acc, deadline); else { acc[0] = f.length(); acc[1] = 1; }
            JSObject o = describe(f);
            o.put("totalSize", acc[0]);
            o.put("files", acc[1]);
            o.put("folders", acc[2]);
            o.put("partial", System.currentTimeMillis() > deadline);
            call.resolve(o);
        } catch (Exception e) { call.reject("Could not read properties", e); }
    }

    private void walk(File d, long[] acc, long deadline) {
        File[] kids = d.listFiles();
        if (kids == null) return;
        for (File k : kids) {
            if (System.currentTimeMillis() > deadline) return;
            if (k.isDirectory()) { acc[2]++; walk(k, acc, deadline); }
            else { acc[0] += k.length(); acc[1]++; }
        }
    }

    // ---------- changes ----------
    @PluginMethod
    public void mkdir(PluginCall call) {
        try {
            File parent = guard(call.getString("path", ""));
            String name = call.getString("name", "New folder");
            if (name.contains("/") || name.isEmpty()) { call.reject("Invalid name"); return; }
            File n = new File(parent, name);
            if (n.exists()) { call.reject("A file or folder with this name already exists"); return; }
            if (n.mkdirs()) call.resolve(); else call.reject("Could not create folder");
        } catch (Exception e) { call.reject("Could not create folder", e); }
    }

    @PluginMethod
    public void rename(PluginCall call) {
        try {
            File f = guard(call.getString("path", ""));
            String name = call.getString("name", "");
            if (name.isEmpty() || name.contains("/")) { call.reject("Invalid name"); return; }
            File t = new File(f.getParentFile(), name);
            if (t.exists()) { call.reject("A file or folder with this name already exists"); return; }
            if (f.renameTo(t)) call.resolve(); else call.reject("Could not rename");
        } catch (Exception e) { call.reject("Could not rename", e); }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        try {
            int fail = 0;
            for (String p : strings(call, "paths")) {
                File f = guard(p);
                if (!delRec(f)) fail++;
            }
            if (fail > 0) call.reject("Could not delete " + fail + " item(s)"); else call.resolve();
        } catch (Exception e) { call.reject("Could not delete", e); }
    }

    private boolean delRec(File f) {
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) for (File k : kids) delRec(k);
        }
        return f.delete();
    }

    private File unique(File dir, String name) {
        File f = new File(dir, name);
        if (!f.exists()) return f;
        String base = name, ext = "";
        int i = name.lastIndexOf('.');
        if (i > 0) { base = name.substring(0, i); ext = name.substring(i); }
        for (int n = 1; n < 1000; n++) {
            f = new File(dir, base + " - Copy" + (n > 1 ? " (" + n + ")" : "") + ext);
            if (!f.exists()) return f;
        }
        return new File(dir, base + "_" + System.currentTimeMillis() + ext);
    }

    private void copyRec(File s, File d) throws Exception {
        if (s.isDirectory()) {
            if (!d.mkdirs() && !d.isDirectory()) throw new Exception("Could not create folder");
            File[] kids = s.listFiles();
            if (kids != null) for (File k : kids) copyRec(k, new File(d, k.getName()));
        } else {
            try (InputStream in = new FileInputStream(s); OutputStream out = new FileOutputStream(d)) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
        }
    }

    /** paths[] + dest folder; move=true moves instead of copying. */
    @PluginMethod
    public void paste(PluginCall call) {
        try {
            File dest = guard(call.getString("dest", ""));
            boolean move = Boolean.TRUE.equals(call.getBoolean("move", false));
            int done = 0;
            for (String p : strings(call, "paths")) {
                File s = guard(p);
                if (!s.exists()) continue;
                String sp = s.getAbsolutePath(), dp = dest.getAbsolutePath();
                if (s.isDirectory() && (dp.equals(sp) || dp.startsWith(sp + "/"))) {
                    if (move) { call.reject("You can't move a folder into itself"); return; }
                    call.reject("You can't copy a folder into itself");
                    return;
                }
                if (move && dest.equals(s.getParentFile())) continue; // already there
                File t = unique(dest, s.getName());
                if (move) {
                    if (!s.renameTo(t)) { copyRec(s, t); delRec(s); }
                } else {
                    copyRec(s, t);
                }
                done++;
            }
            JSObject o = new JSObject();
            o.put("count", done);
            call.resolve(o);
        } catch (Exception e) { call.reject(e.getMessage() == null ? "Paste failed" : e.getMessage(), e); }
    }

    // ---------- text + open ----------
    @PluginMethod
    public void readText(PluginCall call) {
        try {
            File f = guard(call.getString("path", ""));
            if (f.length() > 3L * 1024 * 1024) { call.reject("File is too large for Notepad (3 MB max)"); return; }
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            try (InputStream in = new FileInputStream(f)) {
                byte[] buf = new byte[16384];
                int n;
                while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
            }
            JSObject o = new JSObject();
            o.put("text", new String(bo.toByteArray(), StandardCharsets.UTF_8));
            call.resolve(o);
        } catch (Exception e) { call.reject("Could not read file", e); }
    }

    @PluginMethod
    public void writeText(PluginCall call) {
        try {
            File f = guard(call.getString("path", ""));
            String text = call.getString("text", "");
            try (OutputStream out = new FileOutputStream(f)) { out.write(text.getBytes(StandardCharsets.UTF_8)); }
            call.resolve();
        } catch (Exception e) { call.reject("Could not save file", e); }
    }

    @PluginMethod
    public void open(PluginCall call) {
        try {
            File f = guard(call.getString("path", ""));
            Uri u = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".aurorafiles", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            String mime = call.getString("mimeType", mimeOf(f));
            i.setDataAndType(u, mime == null || mime.isEmpty() ? "*/*" : mime);
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (android.content.ActivityNotFoundException e) {
            call.reject("No app can open this file", e);
        } catch (Exception e) {
            call.reject("Could not open file", e);
        }
    }
}
