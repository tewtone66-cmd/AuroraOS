package com.auroraos.desktop;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Real network access for the NexOS terminal (PowerShell Invoke-WebRequest, ping, nslookup, ipconfig). */
@CapacitorPlugin(name = "AuroraNet")
public class AuroraNetPlugin extends Plugin {
    private static final String UA =
        "Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.22631; en-US) WindowsPowerShell/5.1.19041.4648";

    private static HttpURLConnection open(String url, String method, JSObject hdr, String body, int timeout) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setRequestMethod(method);
        c.setConnectTimeout(timeout);
        c.setReadTimeout(timeout);
        c.setInstanceFollowRedirects(false);
        c.setRequestProperty("User-Agent", UA);
        c.setRequestProperty("Accept", "*/*");
        Iterator<String> it = hdr.keys();
        while (it.hasNext()) {
            String k = it.next();
            c.setRequestProperty(k, hdr.optString(k));
        }
        if (body != null && !method.equals("GET") && !method.equals("HEAD")) {
            if (c.getRequestProperty("Content-Type") == null) {
                c.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            }
            c.setDoOutput(true);
            byte[] data = body.getBytes("UTF-8");
            c.setFixedLengthStreamingMode(data.length);
            OutputStream os = c.getOutputStream();
            os.write(data);
            os.close();
        }
        return c;
    }

    @PluginMethod
    public void http(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("Missing url");
            return;
        }
        String method = call.getString("method", "GET").toUpperCase(Locale.ROOT);
        Integer to = call.getInt("timeout", 30000);
        Integer mb = call.getInt("maxBytes", 4 * 1024 * 1024);
        int timeout = to == null ? 30000 : to;
        int maxBytes = mb == null ? 4 * 1024 * 1024 : mb;
        String body = call.getString("body");
        String savePath = call.getString("savePath");
        JSObject hdr = call.getObject("headers", new JSObject());
        HttpURLConnection c = null;
        try {
            long t0 = System.currentTimeMillis();
            String cur = url;
            boolean done = false;
            for (int hop = 0; hop < 10; hop++) {
                c = open(cur, method, hdr, body, timeout);
                int code = c.getResponseCode();
                if (code >= 300 && code < 400 && code != 304) {
                    String loc = c.getHeaderField("Location");
                    if (loc != null) {
                        cur = new URL(new URL(cur), loc).toString();
                        if (code != 307 && code != 308) {
                            method = "GET";
                            body = null;
                        }
                        c.disconnect();
                        continue;
                    }
                }
                done = true;
                break;
            }
            if (!done) {
                call.reject("Too many redirects");
                return;
            }
            int status = c.getResponseCode();
            InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
            String ctype = c.getContentType();
            long size = 0;
            boolean truncated = false;
            String text = "";
            if (in != null) {
                byte[] buf = new byte[16384];
                int n;
                if (savePath != null && !savePath.isEmpty()) {
                    FileOutputStream fo = new FileOutputStream(savePath);
                    try {
                        while ((n = in.read(buf)) > 0) {
                            fo.write(buf, 0, n);
                            size += n;
                        }
                    } finally {
                        fo.close();
                    }
                } else {
                    ByteArrayOutputStream bo = new ByteArrayOutputStream();
                    while ((n = in.read(buf)) > 0) {
                        size += n;
                        if (bo.size() < maxBytes) {
                            int room = maxBytes - bo.size();
                            bo.write(buf, 0, Math.min(room, n));
                            if (n > room) truncated = true;
                        } else {
                            truncated = true;
                        }
                    }
                    String cs = "UTF-8";
                    if (ctype != null) {
                        int i = ctype.toLowerCase(Locale.ROOT).indexOf("charset=");
                        if (i >= 0) cs = ctype.substring(i + 8).replace("\"", "").split(";")[0].trim();
                    }
                    Charset charset;
                    try {
                        charset = Charset.forName(cs);
                    } catch (Exception e) {
                        charset = Charset.forName("UTF-8");
                    }
                    text = new String(bo.toByteArray(), charset);
                }
                in.close();
            }
            JSObject headers = new JSObject();
            for (Map.Entry<String, List<String>> e : c.getHeaderFields().entrySet()) {
                if (e.getKey() == null || e.getValue() == null || e.getValue().isEmpty()) continue;
                headers.put(e.getKey(), e.getValue().get(e.getValue().size() - 1));
            }
            JSObject res = new JSObject();
            res.put("status", status);
            res.put("statusText", c.getResponseMessage() == null ? "" : c.getResponseMessage());
            res.put("url", cur);
            res.put("headers", headers);
            res.put("body", text);
            res.put("size", size);
            res.put("truncated", truncated);
            res.put("contentType", ctype == null ? "" : ctype);
            res.put("ms", System.currentTimeMillis() - t0);
            call.resolve(res);
        } catch (Exception e) {
            call.reject(e.getClass().getSimpleName() + ": " + e.getMessage());
        } finally {
            if (c != null) c.disconnect();
        }
    }

    private static long tcpProbe(InetAddress a, int port, int timeout) {
        long t = System.nanoTime();
        Socket s = new Socket();
        try {
            s.connect(new InetSocketAddress(a, port), timeout);
            return Math.max(1, (System.nanoTime() - t) / 1000000L);
        } catch (Exception e) {
            return -1;
        } finally {
            try {
                s.close();
            } catch (Exception ignored) { }
        }
    }

    /** ICMP needs root on Android, so reachability is measured with TCP connects (443, then 80). */
    @PluginMethod
    public void ping(PluginCall call) {
        String host = call.getString("host");
        if (host == null || host.isEmpty()) {
            call.reject("Missing host");
            return;
        }
        Integer cn = call.getInt("count", 4);
        Integer to = call.getInt("timeout", 2000);
        int count = Math.max(1, Math.min(cn == null ? 4 : cn, 20));
        int timeout = to == null ? 2000 : to;
        try {
            InetAddress a = InetAddress.getByName(host);
            JSArray arr = new JSArray();
            for (int i = 0; i < count; i++) {
                long ms = tcpProbe(a, 443, timeout);
                if (ms < 0) ms = tcpProbe(a, 80, timeout);
                JSObject r = new JSObject();
                r.put("ok", ms >= 0);
                r.put("ms", ms);
                arr.put(r);
                if (i < count - 1) Thread.sleep(400);
            }
            JSObject res = new JSObject();
            res.put("address", a.getHostAddress());
            res.put("replies", arr);
            call.resolve(res);
        } catch (Exception e) {
            call.reject(e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    @PluginMethod
    public void tcp(PluginCall call) {
        String host = call.getString("host");
        Integer p = call.getInt("port", 80);
        Integer to = call.getInt("timeout", 3000);
        if (host == null || host.isEmpty()) {
            call.reject("Missing host");
            return;
        }
        try {
            InetAddress a = InetAddress.getByName(host);
            long ms = tcpProbe(a, p == null ? 80 : p, to == null ? 3000 : to);
            JSObject res = new JSObject();
            res.put("ok", ms >= 0);
            res.put("ms", ms);
            res.put("address", a.getHostAddress());
            call.resolve(res);
        } catch (Exception e) {
            call.reject(e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    @PluginMethod
    public void dns(PluginCall call) {
        String host = call.getString("host");
        if (host == null || host.isEmpty()) {
            call.reject("Missing host");
            return;
        }
        try {
            InetAddress[] all = InetAddress.getAllByName(host);
            JSArray arr = new JSArray();
            for (InetAddress a : all) {
                JSObject o = new JSObject();
                o.put("address", a.getHostAddress());
                o.put("family", a.getAddress().length == 4 ? 4 : 6);
                arr.put(o);
            }
            JSObject res = new JSObject();
            res.put("host", host);
            res.put("addresses", arr);
            call.resolve(res);
        } catch (Exception e) {
            call.reject(e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    @PluginMethod
    public void netinfo(PluginCall call) {
        try {
            JSArray ifs = new JSArray();
            List<NetworkInterface> list = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface ni : list) {
                if (ni.isLoopback()) continue;
                JSObject o = new JSObject();
                o.put("name", ni.getName());
                o.put("up", ni.isUp());
                JSArray addrs = new JSArray();
                for (InetAddress a : Collections.list(ni.getInetAddresses())) {
                    JSObject x = new JSObject();
                    String ad = a.getHostAddress();
                    int pct = ad.indexOf('%');
                    if (pct > 0) ad = ad.substring(0, pct);
                    x.put("address", ad);
                    x.put("family", a.getAddress().length == 4 ? 4 : 6);
                    addrs.put(x);
                }
                o.put("addresses", addrs);
                ifs.put(o);
            }
            JSObject res = new JSObject();
            res.put("interfaces", ifs);
            call.resolve(res);
        } catch (Exception e) {
            call.reject(e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }
}
