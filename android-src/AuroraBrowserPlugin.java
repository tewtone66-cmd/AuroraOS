package com.auroraos.desktop;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.net.Uri;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.os.SystemClock;
import android.util.Base64;
import android.view.Gravity;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
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
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Real browser: one native Android WebView per tab, placed over the Aurora window area.
 * Also: downloads, file upload, pop-ups as tabs, fullscreen video, virtual-mouse forwarding.
 */
@CapacitorPlugin(name = "AuroraBrowser")
public class AuroraBrowserPlugin extends Plugin {
    private static final String DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";
    private final Map<String, WebView> views = new HashMap<>();
    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean virtual = false, synthetic = false;
    private float vx = 0, vy = 0; // top-left of the visible tab in CSS px (for touch -> page coordinates)
    private String shownId = null;
    private CursorView cursor;
    private View customView;
    private WebChromeClient.CustomViewCallback customCb;

    /** Time of the last synthetic ACTION_DOWN: every MOVE/UP of the same gesture must carry it as downTime. */
    private long downT = 0;

    /** Finger moves are merged and forwarded to JS at most once per ~16 ms (latest position per pointer). */
    private final Map<Integer, float[]> pend = new HashMap<>();
    private boolean pendOn = false;
    private final Runnable flushMoves = new Runnable() {
        @Override
        public void run() {
            pendOn = false;
            for (Map.Entry<Integer, float[]> en : pend.entrySet()) {
                sendTouch("move", en.getKey(), en.getValue()[0], en.getValue()[1]);
            }
            pend.clear();
        }
    };

    private float curD = 0;
    private float density() { return getContext().getResources().getDisplayMetrics().density; }
    /** Device pixels per CSS pixel of the Aurora page (works with any viewport scaling). */
    private float dens(PluginCall call) {
        try {
            Float cw = call.getFloat("cw", 0f);
            int wpx = getBridge().getWebView().getWidth();
            if (cw != null && cw > 0 && wpx > 0) { curD = wpx / cw; return curD; }
        } catch (Exception ignored) { }
        curD = density();
        return curD;
    }
    private void ui(Runnable r) { getActivity().runOnUiThread(r); }

    /** Polls DownloadManager and reports "dlprogress" events {id,name,got,total,state,path} until the download ends. */
    private void trackDownload(final DownloadManager mgr, final long dlId, final String fileName) {
        main.postDelayed(new Runnable() {
            @Override
            public void run() {
                JSObject p = new JSObject();
                p.put("id", String.valueOf(dlId));
                p.put("name", fileName);
                boolean again = true;
                Cursor c = null;
                try {
                    c = mgr.query(new DownloadManager.Query().setFilterById(dlId));
                    if (c != null && c.moveToFirst()) {
                        int st = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                        long got = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                        long tot = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                        p.put("got", got);
                        p.put("total", tot);
                        if (st == DownloadManager.STATUS_SUCCESSFUL) {
                            String lu = c.getString(c.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI));
                            String path = null;
                            if (lu != null) {
                                Uri pu = Uri.parse(lu);
                                if ("file".equals(pu.getScheme())) path = pu.getPath();
                            }
                            if (path == null) path = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getAbsolutePath() + "/" + fileName;
                            p.put("path", path);
                            p.put("state", "done");
                            again = false;
                        } else if (st == DownloadManager.STATUS_FAILED) {
                            p.put("state", "failed");
                            again = false;
                        } else {
                            p.put("state", "run");
                        }
                    } else {
                        p.put("state", "failed");
                        again = false;
                    }
                } catch (Exception ex) {
                    p.put("state", "failed");
                    again = false;
                } finally {
                    if (c != null) c.close();
                }
                notifyListeners("dlprogress", p);
                if (again) main.postDelayed(this, 400);
            }
        }, 400);
    }
    private final Map<String, Integer> zoomOf = new HashMap<>();
    /** Width (Aurora CSS px) of each tab's visible area; set by create()/show(). */
    private final Map<String, Float> viewW = new HashMap<>();
    /** Aurora CSS px per page CSS px at 100% zoom (bigger = bigger pages). Tune here. */
    private static final float PAGE_K = 1.4f;
    private float screenW = 0f;
    private float refW = 1280f;

    /** Page layout width in CSS px = window width / (PAGE_K * zoom). 0 = size not known yet. */
    private int cssWidth(String tabId) {
        Float w = viewW.get(tabId);
        if (w == null || w < 40f) return 0;
        Integer z = zoomOf.get(tabId);
        float zoom = (z == null ? 100 : z) / 100f;
        /* BRSIZE-3.0.4: lay the page out like a PC screen refW px wide (default 1280) when the Aurora window is full width */
        float base = (screenW > 200f) ? (w * refW / (screenW * zoom)) : (w / (PAGE_K * zoom));
        return Math.max(320, Math.min(4000, Math.round(base)));
    }

    /** Forces <meta viewport width=W> (and keeps it forced); the WebView then fits the page to the view, like Chrome zoom. */
    private static String vpScript(int cssW) {
        return "(function(W){try{var d=document,w=window;w.__aurW=W;"
            + "var fix=function(){try{var h=d.head||d.documentElement;if(!h)return;var c='width='+w.__aurW+',user-scalable=no';"
            + "var ms=d.querySelectorAll('meta[name=viewport i]'),m=ms[0];"
            + "for(var i=1;i<ms.length;i++){if(ms[i].parentNode)ms[i].parentNode.removeChild(ms[i])}"
            + "if(!m){m=d.createElement('meta');m.setAttribute('name','viewport');m.setAttribute('content',c);h.appendChild(m)}"
            + "else if(m.getAttribute('content')!==c){m.setAttribute('content',c)}}catch(e){}};"
            + "w.__aurFix=fix;fix();"
            + "if(!w.__aurObs&&w.MutationObserver){w.__aurObs=1;try{new MutationObserver(function(){if(w.__aurFix)w.__aurFix()}).observe(d.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['content','name']})}catch(e){}}"
            + "}catch(e){}})(" + cssW + ")";
    }

    private void applyZoom(WebView v, String tabId) {
        try {
            int cw = cssWidth(tabId);
            if (cw <= 0) return;
            v.evaluateJavascript(vpScript(cw), null);
        } catch (Throwable ignored) { }
    }

    /** Applies now and again shortly after: some pages add their own viewport meta late. */
    private void applyZoomSoon(final WebView v, final String tabId) {
        applyZoom(v, tabId);
        long[] delays = { 250, 900, 2500 };
        for (long dl : delays) {
            main.postDelayed(new Runnable() {
                @Override public void run() { if (views.get(tabId) == v) applyZoom(v, tabId); }
            }, dl);
        }
    }

    /** Arrow cursor drawn natively so it stays visible above the browser surface. */
    private static class CursorView extends View {
        private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG), line = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path path = new Path();
        CursorView(Context c, float d) {
            super(c);
            fill.setColor(Color.WHITE);
            line.setColor(Color.parseColor("#111111"));
            line.setStyle(Paint.Style.STROKE);
            line.setStrokeWidth(1.5f * d);
            line.setStrokeJoin(Paint.Join.ROUND);
            float s = d * 1.0f;
            path.moveTo(1 * s, 1 * s);
            path.lineTo(1 * s, 20 * s);
            path.lineTo(6 * s, 15 * s);
            path.lineTo(10 * s, 24 * s);
            path.lineTo(14 * s, 22 * s);
            path.lineTo(10 * s, 14 * s);
            path.lineTo(17 * s, 14 * s);
            path.close();
            setClickable(false);
            setFocusable(false);
        }
        @Override protected void onDraw(Canvas c) { c.drawPath(path, fill); c.drawPath(path, line); }
    }

    private void emit(String id, WebView v, boolean loading) {
        JSObject o = new JSObject();
        o.put("id", id);
        o.put("url", v.getUrl() == null ? "" : v.getUrl());
        o.put("title", v.getTitle() == null ? "" : v.getTitle());
        o.put("canBack", v.canGoBack());
        o.put("canFwd", v.canGoForward());
        o.put("loading", loading);
        o.put("progress", v.getProgress());
        notifyListeners("nav", o);
    }

    private void popup(String url) {
        if (url == null || url.isEmpty() || url.equals("about:blank")) return;
        JSObject o = new JSObject();
        o.put("url", url);
        notifyListeners("popup", o);
    }

    @SuppressLint({ "SetJavaScriptEnabled", "ClickableViewAccessibility" })
    @PluginMethod
    public void create(final PluginCall call) {
        final String id = call.getString("id", "");
        final String url = call.getString("url", "about:blank");
        Float vwf = call.getFloat("vw", 0f);
        final float vw0 = vwf == null ? 0f : vwf;
        Integer zf = call.getInt("z", 100);
        final int z0 = zf == null ? 100 : zf;
        Float cwf0 = call.getFloat("cw", 0f); if (cwf0 != null && cwf0 > 200f) screenW = cwf0;
        Float rf0 = call.getFloat("ref", 0f); if (rf0 != null && rf0 > 300f) refW = rf0;
        dens(call);
        ui(() -> {
            if (views.containsKey(id)) { call.resolve(); return; }
            if (vw0 > 40f) viewW.put(id, vw0);
            zoomOf.put(id, Math.max(40, Math.min(300, z0)));
            final WebView w = new WebView(getContext());
            WebSettings s = w.getSettings();
            s.setJavaScriptEnabled(true);
            s.setDomStorageEnabled(true);
            s.setDatabaseEnabled(true);
            s.setLoadWithOverviewMode(false);
            s.setUseWideViewPort(true);
            w.setInitialScale(0);
            s.setSupportZoom(false);
            s.setBuiltInZoomControls(false);
            s.setDisplayZoomControls(false);
            s.setSupportMultipleWindows(true);
            s.setJavaScriptCanOpenWindowsAutomatically(true);
            s.setAllowFileAccess(false);
            s.setMediaPlaybackRequiresUserGesture(false);
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
            s.setUserAgentString(DESKTOP_UA);
            CookieManager.getInstance().setAcceptCookie(true);
            CookieManager.getInstance().setAcceptThirdPartyCookies(w, true);
            w.setFocusable(true);
            w.setFocusableInTouchMode(true);
            w.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                    String u = r.getUrl().toString();
                    if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("about:") || u.startsWith("blob:") || u.startsWith("data:")) return false;
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(u));
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(i);
                    } catch (Exception ignored) { }
                    return true;
                }
                @Override public void onPageStarted(WebView v, String u, Bitmap f) { applyZoom(v, id); emit(id, v, true); }
                @Override public void onPageFinished(WebView v, String u) { applyZoomSoon(v, id); emit(id, v, false); }
                @Override public void onPageCommitVisible(WebView v, String u) { applyZoom(v, id); }
                @Override public void doUpdateVisitedHistory(WebView v, String u, boolean reload) { emit(id, v, v.getProgress() < 100); }
            });
            w.setWebChromeClient(new WebChromeClient() {
                @Override public void onReceivedTitle(WebView v, String t) { emit(id, v, v.getProgress() < 100); }
                @Override public void onProgressChanged(WebView v, int p) { emit(id, v, p < 100); }

                /** Real site icon (favicon) so pinned sites show it instead of a screenshot. */
                @Override
                public void onReceivedIcon(WebView v, Bitmap icon) {
                    if (icon == null) return;
                    try {
                        Bitmap sm = Bitmap.createScaledBitmap(icon, 96, 96, true);
                        ByteArrayOutputStream bo = new ByteArrayOutputStream();
                        sm.compress(Bitmap.CompressFormat.PNG, 100, bo);
                        JSObject o = new JSObject();
                        o.put("id", id);
                        o.put("url", v.getUrl() == null ? "" : v.getUrl());
                        o.put("img", "data:image/png;base64," + Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP));
                        notifyListeners("icon", o);
                        if (sm != icon) sm.recycle();
                    } catch (Throwable ignored) { }
                }

                @Override
                public boolean onShowFileChooser(WebView v, final ValueCallback<Uri[]> cb, FileChooserParams p) {
                    try {
                        Intent intent = p.createIntent();
                        ((MainActivity) getActivity()).pick(intent, (code, data) -> cb.onReceiveValue(FileChooserParams.parseResult(code, data)));
                        return true;
                    } catch (Exception e) {
                        cb.onReceiveValue(null);
                        return true;
                    }
                }

                @Override
                public boolean onCreateWindow(WebView v, boolean dialog, boolean gesture, Message msg) {
                    final WebView t = new WebView(getContext());
                    t.setWebViewClient(new WebViewClient() {
                        private boolean sent = false;
                        private void take(String u) {
                            if (!sent && u != null && !u.equals("about:blank")) { sent = true; popup(u); }
                            main.post(() -> { try { t.stopLoading(); t.destroy(); } catch (Exception ignored) { } });
                        }
                        @Override public boolean shouldOverrideUrlLoading(WebView x, WebResourceRequest r) { take(r.getUrl().toString()); return true; }
                        @Override public void onPageStarted(WebView x, String u, Bitmap f) { take(u); }
                    });
                    WebView.WebViewTransport tr = (WebView.WebViewTransport) msg.obj;
                    tr.setWebView(t);
                    msg.sendToTarget();
                    return true;
                }

                @Override
                public void onShowCustomView(View view, CustomViewCallback cb) {
                    if (customView != null) { cb.onCustomViewHidden(); return; }
                    customView = view;
                    customCb = cb;
                    view.setBackgroundColor(Color.BLACK);
                    getActivity().addContentView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                    view.bringToFront();
                }

                @Override
                public void onHideCustomView() {
                    if (customView == null) return;
                    if (customView.getParent() instanceof ViewGroup) ((ViewGroup) customView.getParent()).removeView(customView);
                    customView = null;
                    if (customCb != null) customCb.onCustomViewHidden();
                    customCb = null;
                }
            });
            w.setDownloadListener((u, ua, cd, mime, len) -> {
                JSObject o = new JSObject();
                try {
                    String fn = URLUtil.guessFileName(u, cd, mime);
                    if (u.startsWith("blob:") || u.startsWith("data:")) throw new Exception("This download type is not supported");
                    DownloadManager.Request r = new DownloadManager.Request(Uri.parse(u));
                    if (mime != null && !mime.isEmpty()) r.setMimeType(mime);
                    if (ua != null) r.addRequestHeader("User-Agent", ua);
                    String ck = CookieManager.getInstance().getCookie(u);
                    if (ck != null) r.addRequestHeader("Cookie", ck);
                    r.setTitle(fn);
                    r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fn);
                    DownloadManager dlMgr = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
                    long dlId = dlMgr.enqueue(r);
                    o.put("name", fn);
                    o.put("id", String.valueOf(dlId));
                    o.put("ok", true);
                    trackDownload(dlMgr, dlId, fn);
                } catch (Exception e) {
                    o.put("ok", false);
                    o.put("error", e.getMessage() == null ? "Download failed" : e.getMessage());
                }
                notifyListeners("download", o);
            });
            // Touch from the finger while the virtual mouse is on: forward to the web layer (touchpad).
            w.setOnTouchListener((v, e) -> {
                if (synthetic) return false;
                if (!virtual) {
                    if (e.getActionMasked() == MotionEvent.ACTION_DOWN) notifyListeners("tabtouch", new JSObject());
                    return false;
                }
                if (e.getToolType(0) == MotionEvent.TOOL_TYPE_MOUSE) return false; // real mouse works natively
                int a = e.getActionMasked();
                if (a == MotionEvent.ACTION_MOVE) {
                    for (int i = 0; i < e.getPointerCount(); i++) pend.put(e.getPointerId(i), new float[] { e.getX(i), e.getY(i) });
                    if (!pendOn) {
                        pendOn = true;
                        main.postDelayed(flushMoves, 16);
                    }
                } else {
                    // keep order: deliver any merged moves before down/up
                    main.removeCallbacks(flushMoves);
                    flushMoves.run();
                    int i = e.getActionIndex();
                    String t = (a == MotionEvent.ACTION_DOWN || a == MotionEvent.ACTION_POINTER_DOWN) ? "down" : "up";
                    sendTouch(t, e.getPointerId(i), e.getX(i), e.getY(i));
                }
                return true;
            });
            w.setVisibility(View.GONE);
            getActivity().addContentView(w, new FrameLayout.LayoutParams(1, 1));
            views.put(id, w);
            w.loadUrl(url);
            call.resolve();
        });
    }

    private void sendTouch(String type, int pid, float x, float y) {
        float d = curD > 0 ? curD : density();
        JSObject o = new JSObject();
        o.put("type", type);
        o.put("pid", pid);
        o.put("x", x / d + vx);
        o.put("y", y / d + vy);
        notifyListeners("vtouch", o);
    }

    @PluginMethod
    public void show(final PluginCall call) {
        final String id = call.getString("id", "");
        final float x = call.getFloat("x", 0f), y = call.getFloat("y", 0f);
        final float ww = call.getFloat("w", 100f), hh = call.getFloat("h", 100f);
        final float dd = dens(call);
        Float swf = call.getFloat("cw", 0f); if (swf != null && swf > 200f) screenW = swf;
        Float rff = call.getFloat("ref", 0f);
        final boolean refCh = rff != null && rff > 300f && Math.abs(rff - refW) > 0.5f;
        if (rff != null && rff > 300f) refW = rff;
        ui(() -> {
            int[] a = new int[2], b = new int[2];
            getBridge().getWebView().getLocationOnScreen(a);
            View content = getActivity().findViewById(android.R.id.content);
            content.getLocationOnScreen(b);
            float d = dd;
            vx = x;
            vy = y;
            shownId = id;
            for (Map.Entry<String, WebView> e : views.entrySet()) {
                WebView w = e.getValue();
                if (e.getKey().equals(id)) {
                    FrameLayout.LayoutParams p = new FrameLayout.LayoutParams(Math.max(1, Math.round(ww * d)), Math.max(1, Math.round(hh * d)));
                    p.gravity = Gravity.TOP | Gravity.START;
                    p.leftMargin = Math.round(x * d) + (a[0] - b[0]);
                    p.topMargin = Math.round(y * d) + (a[1] - b[1]);
                    w.setLayoutParams(p);
                    w.setVisibility(View.VISIBLE);
                    w.bringToFront();
                    Float oldW = viewW.put(id, ww);
                    if (oldW == null || Math.abs(oldW - ww) > 0.5f || refCh) applyZoomSoon(w, id); else applyZoom(w, id);
                } else {
                    w.setVisibility(View.GONE);
                }
            }
            if (cursor != null && cursor.getVisibility() == View.VISIBLE) cursor.bringToFront();
            call.resolve();
        });
    }

    /** Hides every tab. With an id it first returns a JPEG snapshot so the page stays visible behind other windows. */
    @PluginMethod
    public void hideAll(final PluginCall call) {
        final String id = call.getString("id", "");
        ui(() -> {
            Bitmap shot = null;
            try {
                WebView w = views.get(id);
                if (w != null && w.getVisibility() == View.VISIBLE && w.getWidth() > 0 && w.getHeight() > 0) {
                    Bitmap b = Bitmap.createBitmap(w.getWidth(), w.getHeight(), Bitmap.Config.ARGB_8888);
                    w.draw(new Canvas(b));
                    int tw = Math.min(1600, b.getWidth());
                    int th = Math.max(1, Math.round(b.getHeight() * (tw / (float) b.getWidth())));
                    Bitmap sm = tw == b.getWidth() ? b : Bitmap.createScaledBitmap(b, tw, th, true);
                    if (sm != b) b.recycle();
                    shot = sm;
                }
            } catch (Throwable ignored) { shot = null; }
            for (WebView w : views.values()) w.setVisibility(View.GONE);
            shownId = null;
            if (cursor != null) cursor.setVisibility(View.GONE);
            final Bitmap fin = shot;
            if (fin == null) { call.resolve(new JSObject()); return; }
            new Thread(() -> {
                JSObject out = new JSObject();
                try {
                    ByteArrayOutputStream bo = new ByteArrayOutputStream();
                    fin.compress(Bitmap.CompressFormat.JPEG, 82, bo);
                    out.put("img", "data:image/jpeg;base64," + Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP));
                } catch (Throwable ignored) { }
                fin.recycle();
                call.resolve(out);
            }).start();
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
            else if ("stop".equals(a)) w.stopLoading();
            else if ("zset".equals(a)) {
                int zv = call.getInt("v", 100);
                zoomOf.put(call.getString("id", ""), Math.max(40, Math.min(300, zv)));
                applyZoom(w, call.getString("id", ""));
            } else if ("zin".equals(a) || "zout".equals(a) || "zreset".equals(a)) {
                int zt = w.getSettings().getTextZoom();
                zt = "zin".equals(a) ? Math.min(250, zt + 10) : ("zout".equals(a) ? Math.max(40, zt - 10) : 100);
                w.getSettings().setTextZoom(zt);
            } else if ("mobile".equals(a) || "desktop".equals(a)) {
                w.getSettings().setUserAgentString("mobile".equals(a) ? null : DESKTOP_UA);
                w.reload();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void close(final PluginCall call) {
        final String id = call.getString("id", "");
        ui(() -> {
            WebView w = views.remove(id);
            zoomOf.remove(id);
            viewW.remove(id);
            if (w != null) {
                if (w.getParent() instanceof ViewGroup) ((ViewGroup) w.getParent()).removeView(w);
                w.destroy();
            }
            if (id.equals(shownId)) shownId = null;
            call.resolve();
        });
    }

    // ---------- virtual mouse ----------
    @PluginMethod
    public void setVirtual(final PluginCall call) {
        virtual = Boolean.TRUE.equals(call.getBoolean("on", false));
        if (!virtual) ui(() -> { if (cursor != null) cursor.setVisibility(View.GONE); });
        call.resolve();
    }

    /** Moves the native cursor (CSS px, screen coordinates of the Aurora page). */
    @PluginMethod
    public void cursor(final PluginCall call) {
        final float x = call.getFloat("x", 0f), y = call.getFloat("y", 0f);
        final boolean vis = Boolean.TRUE.equals(call.getBoolean("visible", true));
        final float dd = dens(call);
        final Float ksz = call.getFloat("s", 1f);
        final float kscale = (ksz != null && ksz >= 0.3f && ksz <= 5f) ? ksz : 1f;
        ui(() -> {
            if (cursor == null) {
                float d = dd;
                cursor = new CursorView(getContext(), d);
                getActivity().addContentView(cursor, new FrameLayout.LayoutParams(Math.round(26 * d), Math.round(28 * d)));
                cursor.setVisibility(View.GONE);
            }
            int[] a = new int[2], b = new int[2];
            getBridge().getWebView().getLocationOnScreen(a);
            getActivity().findViewById(android.R.id.content).getLocationOnScreen(b);
            float d = dd;
            cursor.setTranslationX(x * d + (a[0] - b[0]));
            cursor.setTranslationY(y * d + (a[1] - b[1]));
            cursor.setPivotX(0f);
            cursor.setPivotY(0f);
            cursor.setScaleX(kscale);
            cursor.setScaleY(kscale);
            if (vis && shownId != null) {
                if (cursor.getVisibility() != View.VISIBLE) cursor.setVisibility(View.VISIBLE);
                cursor.bringToFront();
            } else if (cursor.getVisibility() != View.GONE) {
                cursor.setVisibility(View.GONE);
            }
            call.resolve();
        });
    }

    /**
     * Sends a pointer action to a tab. x,y are CSS px relative to the tab's top-left.
     * action: hover | down | move | up | scroll | rclick
     */
    @PluginMethod
    public void pointer(final PluginCall call) {
        final WebView w = views.get(call.getString("id", ""));
        final String act = call.getString("action", "");
        final float x = call.getFloat("x", 0f), y = call.getFloat("y", 0f);
        final float dy = call.getFloat("dy", 0f), dx = call.getFloat("dx", 0f);
        if (w == null) { call.resolve(); return; }
        final float dd = dens(call);
        ui(() -> {
            float d = dd;
            float px = x * d, py = y * d;
            long now = SystemClock.uptimeMillis();
            synthetic = true;
            try {
                if ("down".equals(act)) {
                    downT = now;
                    MotionEvent e = MotionEvent.obtain(downT, now, MotionEvent.ACTION_DOWN, px, py, 0);
                    e.setSource(InputDevice.SOURCE_TOUCHSCREEN);
                    w.dispatchTouchEvent(e);
                    e.recycle();
                } else if ("move".equals(act)) {
                    long dtm = downT > 0 ? downT : now;
                    MotionEvent e = MotionEvent.obtain(dtm, now, MotionEvent.ACTION_MOVE, px, py, 0);
                    e.setSource(InputDevice.SOURCE_TOUCHSCREEN);
                    w.dispatchTouchEvent(e);
                    e.recycle();
                } else if ("up".equals(act)) {
                    long dtu = downT > 0 ? downT : now;
                    MotionEvent e = MotionEvent.obtain(dtu, now, MotionEvent.ACTION_UP, px, py, 0);
                    e.setSource(InputDevice.SOURCE_TOUCHSCREEN);
                    w.dispatchTouchEvent(e);
                    e.recycle();
                    downT = 0;
                } else if ("hover".equals(act)) {
                    MotionEvent e = MotionEvent.obtain(now, now, MotionEvent.ACTION_HOVER_MOVE, px, py, 0);
                    e.setSource(InputDevice.SOURCE_MOUSE);
                    w.dispatchGenericMotionEvent(e);
                    e.recycle();
                } else if ("scroll".equals(act)) {
                    MotionEvent.PointerProperties[] pp = { new MotionEvent.PointerProperties() };
                    pp[0].id = 0;
                    pp[0].toolType = MotionEvent.TOOL_TYPE_MOUSE;
                    MotionEvent.PointerCoords[] pc = { new MotionEvent.PointerCoords() };
                    pc[0].x = px;
                    pc[0].y = py;
                    float vsf = ViewConfiguration.get(getContext()).getScaledVerticalScrollFactor();
                    float hsf = ViewConfiguration.get(getContext()).getScaledHorizontalScrollFactor();
                    pc[0].setAxisValue(MotionEvent.AXIS_VSCROLL, -dy * d / (vsf <= 0 ? 1 : vsf));
                    pc[0].setAxisValue(MotionEvent.AXIS_HSCROLL, dx * d / (hsf <= 0 ? 1 : hsf));
                    MotionEvent e = MotionEvent.obtain(now, now, MotionEvent.ACTION_SCROLL, 1, pp, pc, 0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_MOUSE, 0);
                    w.dispatchGenericMotionEvent(e);
                    e.recycle();
                } else if ("rclick".equals(act)) {
                    String js = "(function(){var e=document.elementFromPoint(" + x + "," + y + ");if(e){e.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:" + x + ",clientY:" + y + ",button:2}));}})()";
                    w.evaluateJavascript(js, null);
                }
            } catch (Throwable ignored) {
            } finally {
                synthetic = false;
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void hideKeyboard(final PluginCall call) {
        ui(() -> {
            try {
                View v = getBridge().getWebView();
                android.view.inputmethod.InputMethodManager m = (android.view.inputmethod.InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                if (m != null) m.hideSoftInputFromWindow(v.getWindowToken(), 0);
            } catch (Throwable ignored) { }
            call.resolve();
        });
    }

    @PluginMethod
    public void showKeyboard(final PluginCall call) {
        ui(() -> {
            try {
                View v = getBridge().getWebView();
                v.requestFocus();
                android.view.inputmethod.InputMethodManager m = (android.view.inputmethod.InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                if (m != null) m.showSoftInput(v, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
            } catch (Throwable ignored) { }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        main.removeCallbacks(flushMoves);
        for (WebView w : views.values()) w.destroy();
        views.clear();
    }
}
