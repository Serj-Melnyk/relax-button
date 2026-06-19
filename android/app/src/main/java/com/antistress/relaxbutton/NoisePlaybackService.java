package com.antistress.relaxbutton;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

public class NoisePlaybackService extends Service {
    public static final String ACTION_START = "com.antistress.relaxbutton.START_NOISE";
    public static final String ACTION_STOP = "com.antistress.relaxbutton.STOP_NOISE";
    public static final String ACTION_VOLUME = "com.antistress.relaxbutton.NOISE_VOLUME";
    public static final String EXTRA_FILE = "file";
    public static final String EXTRA_VOLUME = "volume";
    private static final String CHANNEL_ID = "relax_noise_playback";
    private static final int NOTIFICATION_ID = 7001;
    private static final String TAG = "NoisePlaybackService";
    private static final String PREFS_NAME = "noise_playback_service";
    private static final String PREF_FILE = "active_file";
    private static final String PREF_VOLUME = "active_volume";
    private static final String PREF_PLAYING = "is_playing";
    private static final long WATCHDOG_INTERVAL_MS = 15000L;
    private static final long LOOP_CROSSFADE_MS = 420L;
    private static final int LOOP_FADE_STEPS = 12;
    private static volatile boolean serviceRunning = false;
    private static volatile boolean playbackActive = false;
    private static volatile String activePlaybackFile = null;
    private static volatile float activePlaybackVolume = 0.72f;

    private MediaPlayer player;
    private String currentFile;
    private float currentVolume = 0.72f;
    private int loopGeneration = 0;
    private int scheduledRolloverGeneration = -1;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private final Handler watchdogHandler = new Handler(Looper.getMainLooper());
    private final Runnable playbackWatchdog = new Runnable() {
        @Override
        public void run() {
            if (player == null || currentFile == null) return;
            try {
                if (!player.isPlaying()) {
                    Log.w(TAG, "Watchdog restarting silent loop " + currentFile);
                    restartPlayback(currentFile, currentVolume);
                    return;
                }
            } catch (IllegalStateException error) {
                Log.w(TAG, "Watchdog recovering player state", error);
                restartPlayback(currentFile, currentVolume);
                return;
            }
            watchdogHandler.postDelayed(this, WATCHDOG_INTERVAL_MS);
        }
    };

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            clearSavedState();
            abandonAudioFocus();
            stopPlayback();
            dismissPlaybackNotification();
            stopSelf();
            return START_NOT_STICKY;
        }
        if (intent != null && ACTION_VOLUME.equals(intent.getAction())) {
            setPlayerVolume(intent.getFloatExtra(EXTRA_VOLUME, 0f));
            savePlaybackState(currentFile, currentVolume, player != null);
            return START_REDELIVER_INTENT;
        }

        String file = intent != null ? intent.getStringExtra(EXTRA_FILE) : currentFile;
        float volume = intent != null ? intent.getFloatExtra(EXTRA_VOLUME, currentVolume) : currentVolume;
        if ((file == null || file.trim().isEmpty()) && isSavedPlaybackActive()) {
            file = getSavedFile();
            volume = getSavedVolume();
        }
        if (file == null || file.trim().isEmpty()) {
            dismissPlaybackNotification();
            stopSelf();
            return START_NOT_STICKY;
        }

        startForegroundCompat();
        startPlayback(file, volume);
        return START_REDELIVER_INTENT;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "onDestroy");
        clearLiveState();
        clearSavedState();
        stopWatchdog();
        abandonAudioFocus();
        stopPlayback();
        dismissPlaybackNotification();
        super.onDestroy();
    }

    private void startPlayback(String file, float volume) {
        float clampedVolume = Math.max(0f, Math.min(1f, volume));
        requestAudioFocus();
        if (player != null && file.equals(currentFile)) {
            currentVolume = clampedVolume;
            setPlayerVolume(clampedVolume);
            if (!player.isPlaying()) player.start();
            updateLiveState(true, file, clampedVolume);
            savePlaybackState(file, clampedVolume, true);
            startWatchdog();
            scheduleLoopRollover(player, file, loopGeneration);
            return;
        }

        stopPlayback();
        try {
            Log.d(TAG, "startPlayback " + file);
            AssetFileDescriptor afd = getAssets().openFd("public/" + file);
            player = new MediaPlayer();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build());
            }
            player.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
            player.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            player.setVolume(clampedVolume, clampedVolume);
            player.setLooping(false);
            player.setOnErrorListener((mediaPlayer, what, extra) -> {
                Log.w(TAG, "Player error, restarting loop what=" + what + " extra=" + extra);
                restartPlayback(file, currentVolume);
                return true;
            });
            player.setOnCompletionListener(mediaPlayer -> {
                Log.w(TAG, "Player completed unexpectedly, restarting loop");
                restartPlayback(file, currentVolume);
            });
            player.prepare();
            player.start();
            currentFile = file;
            currentVolume = clampedVolume;
            updateLiveState(true, file, clampedVolume);
            savePlaybackState(file, clampedVolume, true);
            startWatchdog();
            scheduleLoopRollover(player, file, loopGeneration);
        } catch (Exception error) {
            Log.e(TAG, "Unable to start playback", error);
            clearLiveState();
            clearSavedState();
            stopPlayback();
            dismissPlaybackNotification();
            stopSelf();
        }
    }

    private void restartPlayback(String file, float volume) {
        stopPlayback();
        startPlayback(file, volume);
    }

    private void stopPlayback() {
        loopGeneration += 1;
        stopWatchdog();
        if (player == null) return;
        try {
            player.stop();
        } catch (Exception ignored) {
        }
        player.release();
        player = null;
        currentFile = null;
        clearLiveState();
    }

    private MediaPlayer createPreparedPlayer(String file, float volume) throws Exception {
        AssetFileDescriptor afd = getAssets().openFd("public/" + file);
        MediaPlayer mediaPlayer = new MediaPlayer();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build());
        }
        mediaPlayer.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
        mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
        afd.close();
        mediaPlayer.setVolume(volume, volume);
        mediaPlayer.setLooping(false);
        mediaPlayer.setOnErrorListener((failedPlayer, what, extra) -> {
            Log.w(TAG, "Player error, restarting loop what=" + what + " extra=" + extra);
            restartPlayback(file, currentVolume);
            return true;
        });
        mediaPlayer.setOnCompletionListener(completedPlayer -> {
            if (completedPlayer == player) {
                Log.w(TAG, "Player completed before rollover, restarting loop");
                restartPlayback(file, currentVolume);
            }
        });
        mediaPlayer.prepare();
        return mediaPlayer;
    }

    private void scheduleLoopRollover(MediaPlayer scheduledPlayer, String file, int generation) {
        if (scheduledRolloverGeneration == generation) return;
        scheduledRolloverGeneration = generation;
        try {
            int durationMs = scheduledPlayer.getDuration();
            if (durationMs <= LOOP_CROSSFADE_MS + 300) {
                scheduledPlayer.setLooping(true);
                return;
            }
            long delayMs = Math.max(250L, durationMs - LOOP_CROSSFADE_MS);
            watchdogHandler.postDelayed(() -> rollToNextPlayer(scheduledPlayer, file, generation), delayMs);
        } catch (Exception error) {
            scheduledRolloverGeneration = -1;
            Log.w(TAG, "Unable to schedule loop rollover; using platform looping", error);
            try {
                scheduledPlayer.setLooping(true);
            } catch (Exception ignored) {
            }
        }
    }

    private void rollToNextPlayer(MediaPlayer oldPlayer, String file, int generation) {
        if (scheduledRolloverGeneration == generation) {
            scheduledRolloverGeneration = -1;
        }
        if (generation != loopGeneration || oldPlayer != player || currentFile == null) return;
        try {
            MediaPlayer nextPlayer = createPreparedPlayer(file, 0f);
            int nextGeneration = ++loopGeneration;
            player = nextPlayer;
            nextPlayer.start();
            fadeBetweenPlayers(oldPlayer, nextPlayer, currentVolume, nextGeneration);
            scheduleLoopRollover(nextPlayer, file, nextGeneration);
        } catch (Exception error) {
            Log.w(TAG, "Loop rollover failed; falling back to restart", error);
            restartPlayback(file, currentVolume);
        }
    }

    private void fadeBetweenPlayers(MediaPlayer oldPlayer, MediaPlayer nextPlayer, float targetVolume, int generation) {
        long stepDelay = Math.max(12L, LOOP_CROSSFADE_MS / LOOP_FADE_STEPS);
        for (int step = 0; step <= LOOP_FADE_STEPS; step += 1) {
            final int fadeStep = step;
            watchdogHandler.postDelayed(() -> {
                if (generation != loopGeneration) {
                    releasePlayerQuietly(oldPlayer);
                    return;
                }
                float progress = Math.min(1f, Math.max(0f, fadeStep / (float) LOOP_FADE_STEPS));
                float inVolume = targetVolume * progress;
                float outVolume = targetVolume * (1f - progress);
                try {
                    nextPlayer.setVolume(inVolume, inVolume);
                } catch (Exception ignored) {
                }
                try {
                    oldPlayer.setVolume(outVolume, outVolume);
                } catch (Exception ignored) {
                }
                if (fadeStep >= LOOP_FADE_STEPS) {
                    releasePlayerQuietly(oldPlayer);
                }
            }, stepDelay * step);
        }
    }

    private void releasePlayerQuietly(MediaPlayer mediaPlayer) {
        if (mediaPlayer == null) return;
        try {
            mediaPlayer.stop();
        } catch (Exception ignored) {
        }
        try {
            mediaPlayer.release();
        } catch (Exception ignored) {
        }
    }

    private void setPlayerVolume(float volume) {
        float clampedVolume = Math.max(0f, Math.min(1f, volume));
        currentVolume = clampedVolume;
        if (playbackActive) {
            activePlaybackVolume = clampedVolume;
        }
        if (player == null) return;
        player.setVolume(clampedVolume, clampedVolume);
    }

    private void requestAudioFocus() {
        if (audioManager == null) {
            audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        }
        if (audioManager == null) return;

        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (audioFocusRequest == null) {
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(attributes)
                    .setWillPauseWhenDucked(false)
                    .build();
            }
            audioManager.requestAudioFocus(audioFocusRequest);
            return;
        }

        audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
    }

    private void abandonAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            return;
        }
        audioManager.abandonAudioFocus(null);
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    }

    private void savePlaybackState(String file, float volume, boolean isPlaying) {
        SharedPreferences.Editor editor = prefs().edit();
        editor.putBoolean(PREF_PLAYING, isPlaying);
        if (file == null || file.trim().isEmpty()) {
            editor.remove(PREF_FILE);
        } else {
            editor.putString(PREF_FILE, file);
        }
        editor.putFloat(PREF_VOLUME, volume);
        editor.apply();
    }

    public static Bundle getSavedState(Context context) {
        Bundle bundle = new Bundle();
        bundle.putBoolean("isPlaying", serviceRunning && playbackActive);
        bundle.putString("file", activePlaybackFile);
        bundle.putDouble("volume", activePlaybackVolume);
        return bundle;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        serviceRunning = true;
    }

    private void updateLiveState(boolean isPlaying, String file, float volume) {
        serviceRunning = true;
        playbackActive = isPlaying;
        activePlaybackFile = file;
        activePlaybackVolume = volume;
    }

    private void clearLiveState() {
        playbackActive = false;
        activePlaybackFile = null;
        activePlaybackVolume = currentVolume;
        serviceRunning = false;
    }

    private void clearSavedState() {
        prefs().edit()
            .remove(PREF_FILE)
            .remove(PREF_VOLUME)
            .putBoolean(PREF_PLAYING, false)
            .apply();
    }

    private boolean isSavedPlaybackActive() {
        return prefs().getBoolean(PREF_PLAYING, false);
    }

    private String getSavedFile() {
        return prefs().getString(PREF_FILE, null);
    }

    private float getSavedVolume() {
        return prefs().getFloat(PREF_VOLUME, currentVolume);
    }

    private void startForegroundCompat() {
        createNotificationChannel();
        Notification notification;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notification = new Notification.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle("Relax noise")
                .setContentText("Playing calming audio")
                .setOngoing(true)
                .build();
        } else {
            notification = new Notification.Builder(this)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle("Relax noise")
                .setContentText("Playing calming audio")
                .setOngoing(true)
                .build();
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Relax noise playback",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setSound(null, null);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    private void dismissPlaybackNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.cancel(NOTIFICATION_ID);
        }
    }

    private void startWatchdog() {
        watchdogHandler.removeCallbacks(playbackWatchdog);
        watchdogHandler.postDelayed(playbackWatchdog, WATCHDOG_INTERVAL_MS);
    }

    private void stopWatchdog() {
        watchdogHandler.removeCallbacks(playbackWatchdog);
    }
}
