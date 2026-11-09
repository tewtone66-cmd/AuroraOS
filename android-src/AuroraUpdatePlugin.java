package com.auroraos.desktop;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Full app updates: downloads the APK of a GitHub Release into the cache and opens Android's installer. */
@CapacitorPlugin(name = "AuroraUpdate")
public class AuroraUpdatePlugin extends Plugin {
    private File apk() {
        File d = new File(getContext().getCacheDir(), "update");
        d.mkdirs();
        return new File(d, "NexOS-update.apk");
    }

    @PluginMethod
    public void info(PluginCall call) {
        try {
            PackageInfo pi = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            JSObject o = new JSObject();
            o.put("lastUpdate", pi.lastUpdateTime);
            o.put("versionName", pi.versionName == null ? "" : pi.versionName);
            File f = apk();
            o.put("cached", f.isFile() ? f.length() : 0);
            call.resolve(o);
        } catch (Throwable e) {
            call.reject(String.valueOf(e));
        }
    }

    /** Downloads the APK (progress events: {done,total}) and resolves with its size. */
    @PluginMethod
    public void download(final PluginCall call) {
        final String url = call.getString("url", "");
        if (!url.startsWith("https://")) {
            call.reject("Bad update address");
            return;
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                File f = apk(), tmp = new File(f.getPath() + ".part");
                try {
                    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                    c.setInstanceFollowRedirects(true);
                    c.setConnectTimeout(20000);
                    c.setReadTimeout(30000);
                    c.setRequestProperty("User-Agent", "NexOS-Updater");
                    int code = c.getResponseCode();
                    if (code / 100 != 2) throw new Exception("HTTP " + code);
                    long total = c.getContentLengthLong(), done = 0, last = 0;
                    InputStream in = c.getInputStream();
                    FileOutputStream out = new FileOutputStream(tmp);
                    byte[] buf = new byte[64 * 1024];
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n);
                        done += n;
                        if (done - last > 256 * 1024) {
                            last = done;
                            JSObject p = new JSObject();
                            p.put("done", done);
                            p.put("total", total);
                            notifyListeners("progress", p);
                        }
                    }
                    out.close();
                    in.close();
                    if (total > 0 && done != total) throw new Exception("Download was cut off");
                    if (done < 1024 * 1024) throw new Exception("File is too small to be the app");
                    if (f.exists()) f.delete();
                    if (!tmp.renameTo(f)) throw new Exception("Could not save the file");
                    JSObject o = new JSObject();
                    o.put("size", f.length());
                    call.resolve(o);
                } catch (Throwable e) {
                    tmp.delete();
                    call.reject(String.valueOf(e.getMessage() != null ? e.getMessage() : e));
                }
            }
        }, "nx-update").start();
    }

    /** Opens the Android installer for the downloaded file; asks for "install unknown apps" first if needed. */
    @PluginMethod
    public void install(PluginCall call) {
        try {
            File f = apk();
            if (!f.isFile()) {
                call.reject("Nothing downloaded yet");
                return;
            }
            JSObject o = new JSObject();
            if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent s = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
                s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(s);
                o.put("needPermission", true);
                call.resolve(o);
                return;
            }
            Uri u = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".aurorafiles", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(u, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            o.put("needPermission", false);
            call.resolve(o);
        } catch (Throwable e) {
            call.reject(String.valueOf(e));
        }
    }
}
