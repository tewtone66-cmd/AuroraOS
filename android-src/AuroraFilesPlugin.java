package com.auroraos.desktop;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.provider.Settings;
import android.webkit.MimeTypeMap;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;

/** Real file system access (needs "All files access" on Android 11+). Paths are limited to internal storage. */
@CapacitorPlugin(name = "AuroraFiles")
public class AuroraFilesPlugin extends Plugin {

    private File root() { return Environment.getExternalStorageDirectory(); }

    private boolean hasAll() {
        if (Build.VERSION.SDK_INT >= 30) return Environment.isExternalStorageManager();
        return getContext().checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    /** Resolve a path and make sure it stays inside internal storage. */
    private File safe(String p) throws Exception {
        if (p == null || p.isEmpty()) throw new Exception("Invalid path");
        File f = new File(p).getCanonicalFile();
        String r = root().getCanonicalPath();
        if (!f.getPath().equals(r) && !f.getPath().startsWith(r + "/")) throw new Exception("Path is outside storage");
        return f;
    }

    private String mime(File f) {
        String n = f.getName();
        int i = n.lastIndexOf('.');
        if (i < 0) return "*/*";
        String m = MimeTypeMap.getSingleton().getMimeTypeFromExtension(n.substring(i + 1).toLowerCase(Locale.ROOT));
        return m == null ? "*/*" : m;
    }

    @PluginMethod
    public void info(PluginCall call) {
        JSObject o = new JSObject();
        o.put("hasAll", hasAll());
        try {
            StatFs s = new StatFs(root().getPath());
            o.put("total", s.getTotalBytes());
            o.put("free", s.getAvailableBytes());
        } catch (Exception e) { o.put("total", 0); o.put("free", 0); }
        call.resolve(o);
    }

    @PluginMethod
    public void requestAll(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= 30) {
                try {
                    getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                        Uri.parse("package:" + getContext().getPackageName())));
                } catch (Exception e) {
                    getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION));
                }
            } else {
                getActivity().requestPermissions(new String[]{
                    Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE}, 4242);
            }
            call.resolve();
        } catch (Exception e) { call.reject("Could not open permission screen", e); }
    }

    @PluginMethod
    public void list(PluginCall call) {
        try {
            File d = safe(call.getString("path", ""));
            File[] kids = d.listFiles();
            if (kids == null) { call.reject(hasAll() ? "Cannot read this folder" : "Access not granted"); return; }
            JSArray items = new JSArray();
            for (File k : kids) {
                JSObject it = new JSObject();
                boolean dir = k.isDirectory();
                it.put("name", k.getName());
                it.put("path", k.getPath());
                it.put("isDirectory", dir);
                it.put("size", dir ? -1L : k.length());
                it.put("lastModified", k.lastModified());
                it.put("mimeType", dir ? "" : mime(k));
                items.put(it);
            }
            JSObject out = new JSObject();
            out.put("items", items);
            call.resolve(out);
        } catch (Exception e) { call.reject(e.getMessage() == null ? "Error" : e.getMessage()); }
    }

    private static String cleanName(String n) throws Exception {
        if (n == null) throw new Exception("Invalid name");
        n = n.trim();
        if (n.isEmpty() || n.contains("/") || n.equals(".") || n.equals("..")) throw new Exception("Invalid name");
        return n;
    }

    @PluginMethod
    public void mkdir(PluginCall call) {
        try {
            File f = safe(call.getString("path", ""));
            cleanName(f.getName());
            if (f.exists()) { call.reject("Already exists"); return; }
            if (f.mkdirs()) call.resolve(); else call.reject("Could not create folder");
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void rename(PluginCall call) {
        try {
            File f = safe(call.getString("path", ""));
            File t = new File(f.getParentFile(), cleanName(call.getString("name", "")));
            if (t.exists()) { call.reject("A file with that name already exists"); return; }
            if (f.renameTo(t)) call.resolve(); else call.reject("Could not rename");
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    private boolean rm(File f) {
        boolean link = false;
        try { link = !f.getCanonicalFile().equals(f.getAbsoluteFile()); } catch (Exception ignored) { }
        if (f.isDirectory() && !link) {
            File[] k = f.listFiles();
            if (k != null) for (File c : k) if (!rm(c)) return false;
        }
        return f.delete();
    }

    @PluginMethod
    public void remove(PluginCall call) {
        try {
            File f = safe(call.getString("path", ""));
            if (f.equals(root().getCanonicalFile())) { call.reject("Cannot delete the drive"); return; }
            if (rm(f)) call.resolve(); else call.reject("Could not delete");
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    private void cp(File a, File b) throws Exception {
        if (a.isDirectory()) {
            if (!b.exists() && !b.mkdirs()) throw new Exception("Could not create folder");
            File[] k = a.listFiles();
            if (k != null) for (File c : k) cp(c, new File(b, c.getName()));
        } else {
            try (InputStream in = new FileInputStream(a); OutputStream out = new FileOutputStream(b)) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
        }
    }

    @PluginMethod
    public void copy(PluginCall call) {
        new Thread(() -> {
            try {
                File from = safe(call.getString("from", ""));
                File dir = safe(call.getString("toDir", ""));
                boolean move = Boolean.TRUE.equals(call.getBoolean("move", false));
                if (!dir.isDirectory()) throw new Exception("Destination is not a folder");
                if (dir.getPath().equals(from.getPath()) || dir.getPath().startsWith(from.getPath() + "/")) throw new Exception("Cannot copy a folder into itself");
                String name = from.getName();
                File to = new File(dir, name);
                if (to.exists()) {
                    if (move && to.equals(from)) { call.resolve(); return; }
                    int i = 1;
                    String stem = name, ext = "";
                    int dot = name.lastIndexOf('.');
                    if (dot > 0 && !from.isDirectory()) { stem = name.substring(0, dot); ext = name.substring(dot); }
                    do { to = new File(dir, stem + " - Copy" + (i > 1 ? " (" + i + ")" : "") + ext); i++; } while (to.exists());
                }
                if (move && from.renameTo(to)) { call.resolve(); return; }
                cp(from, to);
                if (move && !rm(from)) throw new Exception("Copied, but could not remove the original");
                call.resolve();
            } catch (Exception e) { call.reject(e.getMessage() == null ? "Error" : e.getMessage()); }
        }).start();
    }

    @PluginMethod
    public void open(PluginCall call) {
        try {
            File f = safe(call.getString("path", ""));
            Uri u = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(u, mime(f));
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("No app can open this file");
        } catch (Exception e) { call.reject(e.getMessage() == null ? "Could not open file" : e.getMessage()); }
    }
}
