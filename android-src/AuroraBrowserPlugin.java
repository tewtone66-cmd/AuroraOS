package com.auroraos.desktop;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.app.DownloadManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.os.SystemClock;
import android.view.MotionEvent;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.net.Uri;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashMap;
import java.util.Map;

/** Real browser: one native Android WebView per tab, placed over the Aurora window area. */
@CapacitorPlugin(name = "AuroraBrowser")
public class AuroraBrowserPlugin extends Plugin {
    private static final String DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    private final Map<String, WebView> views = new HashMap<>();
    private final Map<String, float[]> origin = new HashMap<>();
    private boolean vmOn = false, injecting = false;
    private long downTime = 0;
    private CursorView cursor;
    static ValueCallback<Uri[]> pendingChooser;

    /** Arrow cursor drawn natively so it stays visible above the browser WebView. */
    static class CursorView extends View {
        private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG), line = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path path = new Path();
        CursorView(Context c, float d) {
            super(c);
            fill.setColor(0xFFFFFFFF);
            line.setColor(0xFF111111);
            line.setStyle(Paint.Style.STROKE);
            line.setStrokeWidth(1.5f * d);
            line.setStrokeJoin(Paint.Join.ROUND);
            float k = d * 26f / 24f;
            path.moveTo(4 * k, 2 * k); path.lineTo(19 * k, 11 * k); path.lineTo(12.5f * k, 12.5f * k);
            path.lineTo(9 * k, 19 * k); path.close();
            setClickable(false); setFocusable(false);
        }
        @Override protected void onDraw(Canvas c) { c.drawPath(path, fill); c.drawPath(path, line); }
    }

    static void handleChooser(int req, int res, Intent data) {
        if (req != 7711 || pendingChooser == null) return;
        pendingChooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
        pendingChooser = null;
    }

    private float density() { return getContext().getResources().getDisplayMetrics().density; }
    private void ui(Runnable r) { getActivity().runOnUiThread(r); }

    private void emit(String id, WebView v, boolean loading) {
        JSObject o = new JSObject();
        o.put("id", id);
        o.put("url", v.getUrl() == null ? "" : v.getUrl());
        o.put("title", v.getTitle() == null ? "" : v.getTitle());
        o.put("canBack", v.canGoBack());
        o.put("canFwd", v.canGoForward());
        o.put("loading", loading);
        notifyListeners("nav", o);
    }

    @SuppressLint("SetJavaScriptEnabled")
    @PluginMethod
    public void create(final PluginCall call) {
        final String id = call.getString("id", "");
        final String url = call.getString("url", "about:blank");
        ui(() -> {
            if (views.containsKey(id)) { call.resolve(); return; }
            final WebView w = new WebView(getContext());
            WebSettings s = w.getSettings();
            s.setJavaScriptEnabled(true);
            s.setDomStorageEnabled(true);
            s.setLoadWithOverviewMode(true);
            s.setUseWideViewPort(true);
            s.setSupportZoom(true);
            s.setBuiltInZoomControls(true);
            s.setDisplayZoomControls(false);
            s.setMediaPlaybackRequiresUserGesture(false);
            s.setSupportMultipleWindows(true);
            s.setJavaScriptCanOpenWindowsAutomatically(true);
            s.setAllowFileAccess(false);
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
            s.setUserAgentString(DESKTOP_UA);
            CookieManager.getInstance().setAcceptCookie(true);
            CookieManager.getInstance().setAcceptThirdPartyCookies(w, true);
            w.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                    String u = r.getUrl().toString();
                    if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("about:")) return false;
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(u));
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(i);
                    } catch (Exception ignored) { }
                    return true;
                }
                @Override public void onPageStarted(WebView v, String u, Bitmap f) { emit(id, v, true); }
                @Override public void onPageFinished(WebView v, String u) { emit(id, v, false); }
            });
            w.setOnTouchListener((v, e) -> vmOn && !injecting);
            w.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView v, boolean dialog, boolean gesture, Message msg) {
                    final WebView t = new WebView(getContext());
                    t.setWebViewClient(new WebViewClient() {
                        boolean done = false;
                        void go(String u) {
                            if (done || u == null || u.equals("about:blank")) return;
                            done = true;
                            JSObject o = new JSObject();
                            o.put("from", id);
                            o.put("url", u);
                            notifyListeners("newtab", o);
                            new Handler(Looper.getMainLooper()).post(t::destroy);
                        }
                        @Override public boolean shouldOverrideUrlLoading(WebView x, WebResourceRequest r) { go(r.getUrl().toString()); return true; }
                        @Override public void onPageStarted(WebView x, String u, Bitmap f) { go(u); }
                    });
                    ((WebView.WebViewTransport) msg.obj).setWebView(t);
                    msg.sendToTarget();
                    return true;
                }
                @Override
                public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                    if (pendingChooser != null) pendingChooser.onReceiveValue(null);
                    pendingChooser = cb;
                    try { getActivity().startActivityForResult(p.createIntent(), 7711); }
                    catch (Exception e) { pendingChooser = null; return false; }
                    return true;
                }
                @Override public void onReceivedTitle(WebView v, String t) { emit(id, v, v.getProgress() < 100); }
                @Override public void onProgressChanged(WebView v, int p) { if (p == 100) emit(id, v, false); }
            });
            w.setDownloadListener((u, ua, cd, mime, len) -> {
                try {
                    String name = URLUtil.guessFileName(u, cd, mime);
                    DownloadManager.Request r = new DownloadManager.Request(Uri.parse(u));
                    r.setMimeType(mime);
                    r.addRequestHeader("User-Agent", ua);
                    String ck = CookieManager.getInstance().getCookie(u);
                    if (ck != null) r.addRequestHeader("Cookie", ck);
                    r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                    ((DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(r);
                    JSObject o = new JSObject();
                    o.put("msg", "Downloading " + name + " to Downloads");
                    notifyListeners("download", o);
                } catch (Exception e) {
                    JSObject o = new JSObject();
                    o.put("msg", "Download failed");
                    notifyListeners("download", o);
                }
            });
            w.setVisibility(View.GONE);
            getActivity().addContentView(w, new FrameLayout.LayoutParams(1, 1));
            views.put(id, w);
            w.loadUrl(url);
            call.resolve();
        });
    }

    @PluginMethod
    public void show(final PluginCall call) {
        final String id = call.getString("id", "");
        final float x = call.getFloat("x", 0f), y = call.getFloat("y", 0f);
        final float ww = call.getFloat("w", 100f), hh = call.getFloat("h", 100f);
        ui(() -> {
            int[] a = new int[2], b = new int[2];
            getBridge().getWebView().getLocationOnScreen(a);
            View content = getActivity().findViewById(android.R.id.content);
            content.getLocationOnScreen(b);
            float d = density();
            for (Map.Entry<String, WebView> e : views.entrySet()) {
                WebView w = e.getValue();
                if (e.getKey().equals(id)) {
                    FrameLayout.LayoutParams p = new FrameLayout.LayoutParams(Math.max(1, Math.round(ww * d)), Math.max(1, Math.round(hh * d)));
                    p.gravity = Gravity.TOP | Gravity.START;
                    p.leftMargin = Math.round(x * d) + (a[0] - b[0]);
                    p.topMargin = Math.round(y * d) + (a[1] - b[1]);
                    origin.put(id, new float[]{x, y});
                    w.setLayoutParams(p);
                    w.setVisibility(View.VISIBLE);
                    w.bringToFront();
                    if (cursor != null) cursor.bringToFront();
                } else {
                    w.setVisibility(View.GONE);
                }
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void hideAll(final PluginCall call) {
        ui(() -> {
            for (WebView w : views.values()) w.setVisibility(View.GONE);
            call.resolve();
        });
    }

    @PluginMethod
    public void nav(final PluginCall call) {
        final WebView w = views.get(call.getString("id", ""));
        final String url = call.getString("url", "");
        if (w == null) { call.reject("No such tab"); return; }
        ui(() -> { w.loadUrl(url); call.resolve(); });
    }

    @PluginMethod
    public void act(final PluginCall call) {
        final WebView w = views.get(call.getString("id", ""));
        final String a = call.getString("a", "");
        if (w == null) { call.reject("No such tab"); return; }
        ui(() -> {
            if ("back".equals(a) && w.canGoBack()) w.goBack();
            else if ("fwd".equals(a) && w.canGoForward()) w.goForward();
            else if ("rl".equals(a)) w.reload();
            call.resolve();
        });
    }

    @PluginMethod
    public void vm(final PluginCall call) {
        vmOn = Boolean.TRUE.equals(call.getBoolean("on", false));
        call.resolve();
    }

    @PluginMethod
    public void cursor(final PluginCall call) {
        final float x = call.getFloat("x", 0f), y = call.getFloat("y", 0f);
        final boolean v = Boolean.TRUE.equals(call.getBoolean("v", false));
        ui(() -> {
            float d = density();
            if (cursor == null) {
                if (!v) { call.resolve(); return; }
                cursor = new CursorView(getContext(), d);
                getActivity().addContentView(cursor, new FrameLayout.LayoutParams(Math.round(28 * d), Math.round(28 * d)));
            }
            int[] a = new int[2], b = new int[2];
            getBridge().getWebView().getLocationOnScreen(a);
            getActivity().findViewById(android.R.id.content).getLocationOnScreen(b);
            cursor.setTranslationX(x * d + (a[0] - b[0]));
            cursor.setTranslationY(y * d + (a[1] - b[1]));
            cursor.setVisibility(v ? View.VISIBLE : View.GONE);
            if (v) cursor.bringToFront();
            call.resolve();
        });
    }

    /** Inject a touch into a tab's WebView for the virtual mouse. x/y are CSS px in the app viewport. */
    @PluginMethod
    public void touch(final PluginCall call) {
        final WebView w = views.get(call.getString("id", ""));
        final String type = call.getString("type", "");
        final float x = call.getFloat("x", 0f), y = call.getFloat("y", 0f);
        if (w == null) { call.resolve(); return; }
        ui(() -> {
            float[] o = origin.get(call.getString("id", ""));
            if (o == null) { call.resolve(); return; }
            float d = density();
            float lx = (x - o[0]) * d, ly = (y - o[1]) * d;
            int action = "down".equals(type) ? MotionEvent.ACTION_DOWN : "move".equals(type) ? MotionEvent.ACTION_MOVE : MotionEvent.ACTION_UP;
            long now = SystemClock.uptimeMillis();
            if (action == MotionEvent.ACTION_DOWN) downTime = now;
            MotionEvent e = MotionEvent.obtain(downTime, now, action, lx, ly, 0);
            injecting = true;
            try { w.dispatchTouchEvent(e); } finally { injecting = false; e.recycle(); }
            call.resolve();
        });
    }

    @PluginMethod
    public void scroll(final PluginCall call) {
        final WebView w = views.get(call.getString("id", ""));
        final float dx = call.getFloat("dx", 0f), dy = call.getFloat("dy", 0f);
        if (w == null) { call.resolve(); return; }
        ui(() -> {
            float d = density();
            w.scrollBy(Math.round(dx * d), Math.round(dy * d));
            call.resolve();
        });
    }

    @PluginMethod
    public void close(final PluginCall call) {
        final String id = call.getString("id", "");
        ui(() -> {
            WebView w = views.remove(id);
            origin.remove(id);
            if (w != null) {
                if (w.getParent() instanceof ViewGroup) ((ViewGroup) w.getParent()).removeView(w);
                w.destroy();
            }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        for (WebView w : views.values()) w.destroy();
        views.clear();
    }
}
