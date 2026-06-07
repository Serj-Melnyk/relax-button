package com.antistress.relaxbutton;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeHapticPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
