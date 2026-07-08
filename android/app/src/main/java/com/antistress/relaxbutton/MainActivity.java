package com.antistress.relaxbutton;

import android.os.Bundle;
import android.view.WindowManager;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private OnBackPressedCallback nativeBackCallback;

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

    private void applyStableRefreshRate() {
        if (getWindow() == null) return;
        WindowManager.LayoutParams params = getWindow().getAttributes();
        if (params.preferredRefreshRate == 60f) return;
        params.preferredRefreshRate = 60f;
        getWindow().setAttributes(params);
    }

    private void registerBackHandler() {
        nativeBackCallback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                dispatchBackToWeb();
            }
        };
        getOnBackPressedDispatcher().addCallback(this, nativeBackCallback);
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
        if (nativeBackCallback == null) {
            getOnBackPressedDispatcher().onBackPressed();
            return;
        }

        nativeBackCallback.setEnabled(false);
        try {
            getOnBackPressedDispatcher().onBackPressed();
        } finally {
            nativeBackCallback.setEnabled(true);
        }
    }
}
