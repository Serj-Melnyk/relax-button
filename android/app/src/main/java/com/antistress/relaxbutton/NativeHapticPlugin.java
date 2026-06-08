package com.antistress.relaxbutton;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeHapticPlugin")
public class NativeHapticPlugin extends Plugin {

    @PluginMethod
    public void playPremiumClick(PluginCall call) {
        Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null) {
            call.reject("Vibrator service unavailable");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            boolean supported = vibrator.areAllPrimitivesSupported(
                VibrationEffect.Composition.PRIMITIVE_CLICK,
                VibrationEffect.Composition.PRIMITIVE_LOW_TICK
            );

            if (supported) {
                // Multi-phase haptic feedback: strong click + spring bounce tick after 60ms
                vibrator.vibrate(
                    VibrationEffect.startComposition()
                        .addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 0.9f)
                        .addPrimitive(VibrationEffect.Composition.PRIMITIVE_LOW_TICK, 0.4f, 60)
                        .compose()
                );
            } else {
                fallbackLegacyVibration(vibrator);
            }
        } else {
            fallbackLegacyVibration(vibrator);
        }
        call.resolve();
    }

    private void fallbackLegacyVibration(Vibrator vibrator) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            long[] timings = new long[]{0, 12, 40};
            int[] amplitudes = new int[]{0, 220, 0};
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1));
        } else {
            vibrator.vibrate(12);
        }
    }
}
