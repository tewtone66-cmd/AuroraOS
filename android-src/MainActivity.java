package com.auroraos.desktop;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public interface PickCb { void done(int resultCode, Intent data); }

    private PickCb pending;
    private ActivityResultLauncher<Intent> pickLauncher;

    /** Used by the browser tab for website file-upload buttons. */
    public void pick(Intent intent, PickCb cb) {
        pending = cb;
        try {
            pickLauncher.launch(intent);
        } catch (Exception e) {
            pending = null;
            cb.done(RESULT_CANCELED, null);
        }
    }

    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AuroraFilesPlugin.class);
        registerPlugin(AuroraBrowserPlugin.class);
        pickLauncher = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), r -> {
            PickCb c = pending;
            pending = null;
            if (c != null) c.done(r.getResultCode(), r.getData());
        });
        super.onCreate(savedInstanceState);
        try {
            android.webkit.WebSettings ws = getBridge().getWebView().getSettings();
            ws.setUseWideViewPort(true);
            ws.setLoadWithOverviewMode(true);
        } catch (Exception ignored) { }
        immersive();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }
}
