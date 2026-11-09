package com.auroraos.desktop;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioManager;
import android.media.MediaMetadataRetriever;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.util.Set;

/**
 * NexOS system helpers: Wi-Fi / Bluetooth / network status, system panels (the real connect screens),
 * system volume, and the whole-phone audio library (MediaStore) with embedded album art.
 */
@CapacitorPlugin(name = "AuroraSys")
public class AuroraSysPlugin extends Plugin {

    @SuppressLint({ "MissingPermission", "HardwareIds" })
    @SuppressWarnings("deprecation")
    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        Context c = getContext().getApplicationContext();
        try {
            WifiManager wm = (WifiManager) c.getSystemService(Context.WIFI_SERVICE);
            r.put("wifiOn", wm != null && wm.isWifiEnabled());
            String transport = "none";
            ConnectivityManager cm = (ConnectivityManager) c.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                try {
                    Network n = cm.getActiveNetwork();
                    NetworkCapabilities nc = n == null ? null : cm.getNetworkCapabilities(n);
                    if (nc != null) {
                        if (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) transport = "wifi";
                        else if (nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) transport = "cellular";
                        else if (nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) transport = "ethernet";
                        else if (nc.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) transport = "bluetooth";
                        r.put("down", nc.getLinkDownstreamBandwidthKbps());
                    }
                } catch (Throwable ignored) { }
            }
            r.put("transport", transport);
            if ("wifi".equals(transport) && wm != null) {
                try {
                    android.net.wifi.WifiInfo wi = wm.getConnectionInfo();
                    if (wi != null) {
                        String s = wi.getSSID();
                        if (s == null || s.contains("unknown ssid")) s = "";
                        r.put("ssid", s.replace("\"", ""));
                        int rssi = wi.getRssi();
                        r.put("level", rssi > -55 ? 4 : rssi > -65 ? 3 : rssi > -75 ? 2 : rssi > -85 ? 1 : 0);
                    }
                } catch (Throwable ignored) { }
            }
            BluetoothAdapter ba = null;
            try {
                BluetoothManager bm = (BluetoothManager) c.getSystemService(Context.BLUETOOTH_SERVICE);
                if (bm != null) ba = bm.getAdapter();
            } catch (Throwable ignored) { }
            r.put("btSupported", ba != null);
            boolean on = false;
            try { on = ba != null && ba.isEnabled(); } catch (Throwable ignored) { }
            r.put("btOn", on);
            JSArray devs = new JSArray();
            if (on) {
                try {
                    Set<BluetoothDevice> bd = ba.getBondedDevices();
                    if (bd != null) {
                        for (BluetoothDevice d : bd) {
                            JSObject o = new JSObject();
                            o.put("name", d.getName());
                            o.put("addr", d.getAddress());
                            devs.put(o);
                        }
                    }
                } catch (Throwable ignored) { }
            }
            r.put("btDevices", devs);
            boolean needPerm = false;
            if (Build.VERSION.SDK_INT >= 31) {
                needPerm = c.checkSelfPermission("android.permission.BLUETOOTH_CONNECT") != PackageManager.PERMISSION_GRANTED;
            }
            r.put("btNeedsPermission", needPerm);
            try {
                r.put("air", Settings.Global.getInt(c.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) == 1);
            } catch (Throwable ignored) { }
            call.resolve(r);
        } catch (Throwable e) {
            call.reject(e.getMessage() == null ? "status failed" : e.getMessage());
        }
    }

    /** Asks for the Bluetooth permission (Android 12+) so paired devices can be listed. */
    @PluginMethod
    public void btPermission(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= 31 && getContext().checkSelfPermission("android.permission.BLUETOOTH_CONNECT") != PackageManager.PERMISSION_GRANTED) {
                getActivity().requestPermissions(new String[] { "android.permission.BLUETOOTH_CONNECT" }, 4177);
            }
        } catch (Throwable ignored) { }
        call.resolve();
    }

    /** Opens the real system connect screen: wifi | bluetooth | internet | airplane | hotspot | volume | display. */
    @PluginMethod
    public void panel(PluginCall call) {
        String k = call.getString("k", "wifi");
        boolean q = Build.VERSION.SDK_INT >= 29;
        String act;
        switch (k) {
            case "wifi": act = q ? Settings.Panel.ACTION_WIFI : Settings.ACTION_WIFI_SETTINGS; break;
            case "internet": case "data": act = q ? Settings.Panel.ACTION_INTERNET_CONNECTIVITY : Settings.ACTION_WIRELESS_SETTINGS; break;
            case "volume": act = q ? Settings.Panel.ACTION_VOLUME : Settings.ACTION_SOUND_SETTINGS; break;
            case "bluetooth": act = Settings.ACTION_BLUETOOTH_SETTINGS; break;
            case "airplane": act = Settings.ACTION_AIRPLANE_MODE_SETTINGS; break;
            case "hotspot": act = "android.settings.TETHER_SETTINGS"; break;
            case "display": act = Settings.ACTION_DISPLAY_SETTINGS; break;
            default: act = Settings.ACTION_SETTINGS;
        }
        try {
            Intent i = new Intent(act);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage() == null ? "Could not open settings" : e.getMessage());
        }
    }

    /** Reads (and optionally sets) the system media volume as a percentage. */
    @PluginMethod
    public void volume(PluginCall call) {
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            int max = Math.max(1, am.getStreamMaxVolume(AudioManager.STREAM_MUSIC));
            if (call.hasOption("set")) {
                Integer pc = call.getInt("set");
                if (pc != null) am.setStreamVolume(AudioManager.STREAM_MUSIC, Math.round(max * Math.max(0, Math.min(100, pc)) / 100f), 0);
            }
            JSObject r = new JSObject();
            r.put("v", Math.round(am.getStreamVolume(AudioManager.STREAM_MUSIC) * 100f / max));
            call.resolve(r);
        } catch (Throwable e) {
            call.reject(e.getMessage() == null ? "volume failed" : e.getMessage());
        }
    }

    /** Every song on the phone from MediaStore: {items:[{p,t,a,al,d,aid,da}]}. */
    @PluginMethod
    public void audioList(final PluginCall call) {
        new Thread(() -> {
            Cursor cur = null;
            try {
                ContentResolver cr = getContext().getContentResolver();
                String[] proj = {
                    MediaStore.Audio.Media._ID, MediaStore.Audio.Media.DATA, MediaStore.Audio.Media.TITLE,
                    MediaStore.Audio.Media.ARTIST, MediaStore.Audio.Media.ALBUM, MediaStore.Audio.Media.DURATION,
                    MediaStore.Audio.Media.ALBUM_ID, MediaStore.Audio.Media.DATE_ADDED
                };
                String sel = MediaStore.Audio.Media.DURATION + " > 15000 AND " + MediaStore.Audio.Media.IS_RINGTONE + " = 0 AND "
                    + MediaStore.Audio.Media.IS_NOTIFICATION + " = 0 AND " + MediaStore.Audio.Media.IS_ALARM + " = 0";
                cur = cr.query(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, proj, sel, null, MediaStore.Audio.Media.TITLE + " COLLATE NOCASE ASC");
                JSArray arr = new JSArray();
                if (cur != null) {
                    while (cur.moveToNext()) {
                        String p = cur.getString(1);
                        if (p == null) continue;
                        JSObject o = new JSObject();
                        o.put("p", p);
                        o.put("t", cur.getString(2));
                        o.put("a", cur.getString(3));
                        o.put("al", cur.getString(4));
                        o.put("d", cur.getLong(5));
                        o.put("aid", cur.getLong(6));
                        o.put("da", cur.getLong(7));
                        arr.put(o);
                    }
                }
                JSObject r = new JSObject();
                r.put("items", arr);
                call.resolve(r);
            } catch (Throwable e) {
                call.reject(e.getMessage() == null ? "audioList failed" : e.getMessage());
            } finally {
                if (cur != null) cur.close();
            }
        }).start();
    }

    /** Embedded cover of an audio file as a small JPEG data URL ({img} or empty). */
    @PluginMethod
    public void art(final PluginCall call) {
        final String p = call.getString("path", "");
        new Thread(() -> {
            MediaMetadataRetriever mmr = new MediaMetadataRetriever();
            try {
                mmr.setDataSource(p);
                byte[] b = mmr.getEmbeddedPicture();
                JSObject r = new JSObject();
                if (b != null) {
                    BitmapFactory.Options o = new BitmapFactory.Options();
                    o.inJustDecodeBounds = true;
                    BitmapFactory.decodeByteArray(b, 0, b.length, o);
                    int s = 1;
                    int mx = Math.max(o.outWidth, o.outHeight);
                    while (mx / s > 640) s *= 2;
                    BitmapFactory.Options o2 = new BitmapFactory.Options();
                    o2.inSampleSize = s;
                    Bitmap bm = BitmapFactory.decodeByteArray(b, 0, b.length, o2);
                    if (bm != null) {
                        ByteArrayOutputStream bo = new ByteArrayOutputStream();
                        bm.compress(Bitmap.CompressFormat.JPEG, 82, bo);
                        r.put("img", "data:image/jpeg;base64," + Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP));
                        bm.recycle();
                    }
                }
                call.resolve(r);
            } catch (Throwable e) {
                call.resolve(new JSObject());
            } finally {
                try { mmr.release(); } catch (Throwable ignored) { }
            }
        }).start();
    }
}
