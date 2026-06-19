package com.antistress.relaxbutton;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeHapticPlugin")
public class NativeHapticPlugin extends Plugin {
    private static final String TAG = "NativeHapticPlugin";

    @PluginMethod
    public void playPremiumClick(PluginCall call) {
        Log.d(TAG, "playPremiumClick");
        playHapticWithStyle(call, "premium");
    }

    @PluginMethod
    public void playHaptic(PluginCall call) {
        String style = call.getString("style", "light");
        playHapticWithStyle(call, style);
    }

    private void playHapticWithStyle(PluginCall call, String style) {
        if (getActivity() == null) {
            call.resolve();
            return;
        }

        getActivity().runOnUiThread(() -> {
            boolean handled = triggerSystemHaptic(style);
            if (!handled) {
                handled = triggerVibratorWithStyle(style);
            }
            Log.d(TAG, "playHaptic (" + style + ") handled=" + handled);
            call.resolve();
        });
    }

    private boolean triggerSystemHaptic(String style) {
        try {
            if (getActivity() == null || getActivity().getWindow() == null) {
                return false;
            }

            View view = getActivity().getWindow().getDecorView();
            if (view == null) {
                return false;
            }

            view.setHapticFeedbackEnabled(true);
            int feedbackConstant;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && "premium".equals(style)) {
                feedbackConstant = HapticFeedbackConstants.CONFIRM;
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                feedbackConstant = HapticFeedbackConstants.CONTEXT_CLICK;
            } else {
                feedbackConstant = HapticFeedbackConstants.VIRTUAL_KEY;
            }

            return view.performHapticFeedback(
                feedbackConstant,
                HapticFeedbackConstants.FLAG_IGNORE_VIEW_SETTING
            );
        } catch (Exception error) {
            Log.w(TAG, "System haptic failed", error);
            return false;
        }
    }

    private boolean triggerVibratorWithStyle(String style) {
        try {
            Vibrator vibrator;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vibratorManager = (VibratorManager) getContext().getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vibratorManager != null ? vibratorManager.getDefaultVibrator() : null;
            } else {
                vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            }

            if (vibrator == null || !vibrator.hasVibrator()) {
                return false;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    && vibrator.areAllPrimitivesSupported(VibrationEffect.Composition.PRIMITIVE_CLICK)) {
                    float scale = "heavy".equals(style) ? 0.85f : ("medium".equals(style) ? 0.65f : 0.48f);
                    vibrator.vibrate(
                        VibrationEffect.startComposition()
                            .addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, scale)
                            .compose()
                    );
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    int effect = "heavy".equals(style)
                        ? VibrationEffect.EFFECT_CLICK
                        : VibrationEffect.EFFECT_TICK;
                    vibrator.vibrate(VibrationEffect.createPredefined(effect));
                } else {
                    vibrator.vibrate(VibrationEffect.createOneShot("heavy".equals(style) ? 10 : 6, VibrationEffect.DEFAULT_AMPLITUDE));
                }
            } else {
                vibrator.vibrate("heavy".equals(style) ? 10 : 6);
            }
            return true;
        } catch (Exception error) {
            Log.w(TAG, "Vibrator fallback failed", error);
            return false;
        }
    }

    @PluginMethod
    public void startNoiseLoop(PluginCall call) {
        String file = call.getString("file");
        Double gain = call.getDouble("gain", 0.72);
        Integer loopStartMs = call.getInt("loopStartMs", 1000);
        Integer loopEndTrimMs = call.getInt("loopEndTrimMs", 1000);
        if (file == null || file.trim().isEmpty()) {
            call.reject("Missing audio file");
            return;
        }
        Log.d(TAG, "startNoiseLoop " + file);

        Intent intent = new Intent(getContext(), NoisePlaybackService.class);
        intent.setAction(NoisePlaybackService.ACTION_START);
        intent.putExtra(NoisePlaybackService.EXTRA_FILE, file);
        intent.putExtra(NoisePlaybackService.EXTRA_VOLUME, gain.floatValue());
        intent.putExtra(NoisePlaybackService.EXTRA_LOOP_START_MS, loopStartMs);
        intent.putExtra(NoisePlaybackService.EXTRA_LOOP_END_TRIM_MS, loopEndTrimMs);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopNoiseLoop(PluginCall call) {
        Log.d(TAG, "stopNoiseLoop");
        Intent intent = new Intent(getContext(), NoisePlaybackService.class);
        intent.setAction(NoisePlaybackService.ACTION_STOP);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void setNoiseVolume(PluginCall call) {
        Double gain = call.getDouble("gain", 0.0);
        Intent intent = new Intent(getContext(), NoisePlaybackService.class);
        intent.setAction(NoisePlaybackService.ACTION_VOLUME);
        intent.putExtra(NoisePlaybackService.EXTRA_VOLUME, gain.floatValue());
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void setKeepAwake(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        if (getActivity() == null) {
            call.reject("Activity unavailable");
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (enabled) {
                getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void getNoiseLoopState(PluginCall call) {
        Bundle state = NoisePlaybackService.getSavedState(getContext());
        JSObject result = new JSObject();
        result.put("isPlaying", state.getBoolean("isPlaying", false));
        result.put("file", state.getString("file"));
        result.put("volume", state.getDouble("volume", 0.0));
        call.resolve(result);
    }
}
