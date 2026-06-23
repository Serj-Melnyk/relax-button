package com.antistress.relaxbutton;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeHapticPlugin.class);
        super.onCreate(savedInstanceState);
        applyStableRefreshRate();
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
}
