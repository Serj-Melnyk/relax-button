package com.antistress.relaxbutton;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Build;
import android.os.VibrationAttributes;
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
    public void playPremiumRelease(PluginCall call) {
        Log.d(TAG, "playPremiumRelease");
        playHapticWithStyle(call, "release");
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
            boolean handled;
            if ("premium".equals(style)) {
                handled = triggerVibratorWithStyle(style);
            } else if ("release".equals(style)) {
                handled = true;
            } else {
                handled = triggerSystemHaptic(style);
                if (!handled && shouldUseVibratorFallback(style)) {
                    handled = triggerVibratorWithStyle(style);
                }
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

            View decorView = getActivity().getWindow().getDecorView();
            View webView = getBridge() != null ? getBridge().getWebView() : null;
            if (decorView == null && webView == null) {
                return false;
            }

            int feedbackConstant;
            if ("release".equals(style)) {
                feedbackConstant = HapticFeedbackConstants.VIRTUAL_KEY_RELEASE;
            } else if ("heavy".equals(style) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                feedbackConstant = HapticFeedbackConstants.CONTEXT_CLICK;
            } else if ("light".equals(style) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                feedbackConstant = HapticFeedbackConstants.CLOCK_TICK;
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                feedbackConstant = HapticFeedbackConstants.VIRTUAL_KEY;
            } else {
                feedbackConstant = HapticFeedbackConstants.VIRTUAL_KEY;
            }

            return performSystemHaptic(webView, feedbackConstant)
                || performSystemHaptic(decorView, feedbackConstant);
        } catch (Exception error) {
            Log.w(TAG, "System haptic failed", error);
            return false;
        }
    }

    private boolean performSystemHaptic(View view, int feedbackConstant) {
        if (view == null) return false;
        view.setHapticFeedbackEnabled(true);
        return view.performHapticFeedback(
            feedbackConstant,
            HapticFeedbackConstants.FLAG_IGNORE_VIEW_SETTING
        );
    }

    private boolean shouldUseVibratorFallback(String style) {
        return !("premium".equals(style) || "release".equals(style) || "light".equals(style));
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
                if ("premium".equals(style)
                    && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    && vibrator.areAllPrimitivesSupported(
                        VibrationEffect.Composition.PRIMITIVE_CLICK,
                        VibrationEffect.Composition.PRIMITIVE_TICK
                    )) {
                    Log.d(TAG, "Vibrator premium mechanical CLICK/TICK");
                    vibrateEffect(
                        vibrator,
                        VibrationEffect.startComposition()
                            .addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 0.48f)
                            .addPrimitive(VibrationEffect.Composition.PRIMITIVE_LOW_TICK, 0.14f, 28)
                            .compose(),
                        true
                    );
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    && vibrator.areAllPrimitivesSupported(VibrationEffect.Composition.PRIMITIVE_CLICK)) {
                    float scale = "premium".equals(style) ? 0.70f : ("heavy".equals(style) ? 0.85f : ("medium".equals(style) ? 0.65f : 0.48f));
                    Log.d(TAG, "Vibrator primitive CLICK scale=" + scale);
                    vibrateEffect(
                        vibrator,
                        VibrationEffect.startComposition()
                            .addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, scale)
                            .compose(),
                        "premium".equals(style)
                    );
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    int effect = ("premium".equals(style) || "heavy".equals(style))
                        ? VibrationEffect.EFFECT_CLICK
                        : VibrationEffect.EFFECT_TICK;
                    Log.d(TAG, "Vibrator predefined effect=" + effect);
                    vibrateEffect(vibrator, VibrationEffect.createPredefined(effect), "premium".equals(style));
                } else {
                    long duration = "premium".equals(style) ? 12 : ("heavy".equals(style) ? 10 : 6);
                    int amplitude = "premium".equals(style) ? 180 : VibrationEffect.DEFAULT_AMPLITUDE;
                    Log.d(TAG, "Vibrator oneshot duration=" + duration + " amplitude=" + amplitude);
                    vibrateEffect(vibrator, VibrationEffect.createOneShot(duration, amplitude), "premium".equals(style));
                }
            } else {
                vibrator.vibrate("premium".equals(style) ? 12 : ("heavy".equals(style) ? 10 : 6));
            }
            return true;
        } catch (Exception error) {
            Log.w(TAG, "Vibrator fallback failed", error);
            return false;
        }
    }

    private void vibrateEffect(Vibrator vibrator, VibrationEffect effect, boolean useHardwareFeedback) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && useHardwareFeedback) {
            VibrationAttributes attributes = new VibrationAttributes.Builder()
                .setUsage(VibrationAttributes.USAGE_HARDWARE_FEEDBACK)
                .build();
            Log.d(TAG, "Vibrator attributes usage=HARDWARE_FEEDBACK");
            vibrator.vibrate(effect, attributes);
            return;
        }
        vibrator.vibrate(effect);
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
    public void setNoiseSleepTimer(PluginCall call) {
        Double durationMs = call.getDouble("durationMs", 0.0);
        Intent intent = new Intent(getContext(), NoisePlaybackService.class);
        intent.setAction(NoisePlaybackService.ACTION_SLEEP_TIMER);
        intent.putExtra(NoisePlaybackService.EXTRA_SLEEP_TIMER_MS, durationMs.longValue());
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void clearNoiseSleepTimer(PluginCall call) {
        Intent intent = new Intent(getContext(), NoisePlaybackService.class);
        intent.setAction(NoisePlaybackService.ACTION_SLEEP_TIMER);
        intent.putExtra(NoisePlaybackService.EXTRA_SLEEP_TIMER_MS, 0L);
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
