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
        if (params.preferredRefreshRate == 60f) return;
        params.preferredRefreshRate = 60f;
        getWindow().setAttributes(params);
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
