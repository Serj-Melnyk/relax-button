package com.antistress.relaxbutton;

import android.content.Intent;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeHapticPlugin.class);
        registerPlugin(AppUpdatePlugin.class);
        super.onCreate(savedInstanceState);
        applyStableRefreshRate();
        registerBackHandler();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyStableRefreshRate();
    }

    @Override
    public void onDestroy() {
        if (isFinishing()) {
            stopService(new Intent(this, NoisePlaybackService.class));
        }
        super.onDestroy();
    }

    private void applyStableRefreshRate() {
        if (getWindow() == null) return;
        WindowManager.LayoutParams params = getWindow().getAttributes();
        // Cross-fade on rotation instead of rotating a screenshot: the WebView
        // needs a frame to relayout, and a rotated screenshot shows it cropped.
        boolean changed = false;
        if (params.rotationAnimation != WindowManager.LayoutParams.ROTATION_ANIMATION_CROSSFADE) {
            params.rotationAnimation = WindowManager.LayoutParams.ROTATION_ANIMATION_CROSSFADE;
            changed = true;
        }
        if (params.preferredRefreshRate != 60f) {
            params.preferredRefreshRate = 60f;
            changed = true;
        }
        if (changed) getWindow().setAttributes(params);
    }

    private void registerBackHandler() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                dispatchBackToWeb();
            }
        });
    }

    private void dispatchBackToWeb() {
        if (getBridge() == null) {
            fallbackToSystemBack();
            return;
        }

        getBridge().eval(
            "(function(){ return !!(window.__handleAndroidBack && window.__handleAndroidBack()); })();",
            value -> {
                if ("true".equals(value)) return;
                runOnUiThread(this::fallbackToSystemBack);
            }
        );
    }

    private void fallbackToSystemBack() {
        finish();
    }
}
