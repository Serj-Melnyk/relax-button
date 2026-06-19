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
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;

public class NoisePlaybackService extends Service {
    public static final String ACTION_START = "com.antistress.relaxbutton.START_NOISE";
    public static final String ACTION_STOP = "com.antistress.relaxbutton.STOP_NOISE";
    public static final String ACTION_VOLUME = "com.antistress.relaxbutton.NOISE_VOLUME";
    public static final String EXTRA_FILE = "file";
    public static final String EXTRA_VOLUME = "volume";
    public static final String EXTRA_LOOP_START_MS = "loopStartMs";
    public static final String EXTRA_LOOP_END_TRIM_MS = "loopEndTrimMs";
    private static final String CHANNEL_ID = "relax_noise_playback";
    private static final int NOTIFICATION_ID = 7001;
    private static final String TAG = "NoisePlaybackService";
    private static final String PREFS_NAME = "noise_playback_service";
    private static final String PREF_FILE = "active_file";
    private static final String PREF_VOLUME = "active_volume";
    private static final String PREF_PLAYING = "is_playing";
    private static final String PREF_LOOP_START_MS = "loop_start_ms";
    private static final String PREF_LOOP_END_TRIM_MS = "loop_end_trim_ms";
    private static final long WATCHDOG_INTERVAL_MS = 15000L;
    private static final long LOOP_CROSSFADE_MS = 420L;
    private static final int LOOP_FADE_STEPS = 12;
    private static final long EXO_LOOP_CROSSFADE_MS = 780L;
    private static final long EXO_LOOP_PREPARE_LEAD_MS = 2500L;
    private static final int EXO_LOOP_FADE_STEPS = 24;
    private static volatile boolean serviceRunning = false;
    private static volatile boolean playbackActive = false;
    private static volatile String activePlaybackFile = null;
    private static volatile float activePlaybackVolume = 0.72f;

    private ExoPlayer exoPlayer;
    private ExoPlayer preparedNextExoPlayer;
    private MediaPlayer player;
    private MediaPlayer preparedNextPlayer;
    private String currentFile;
    private float currentVolume = 0.72f;
    private int currentLoopStartMs = 80;
    private int currentLoopEndTrimMs = 120;
    private int loopGeneration = 0;
    private int scheduledExoRolloverGeneration = -1;
    private int scheduledRolloverGeneration = -1;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private final Handler watchdogHandler = new Handler(Looper.getMainLooper());
    private final Runnable playbackWatchdog = new Runnable() {
        @Override
        public void run() {
            if (exoPlayer == null || currentFile == null) return;
            try {
                if (!exoPlayer.isPlaying()) {
                    Log.w(TAG, "Watchdog restarting silent loop " + currentFile);
                    restartPlayback(currentFile, currentVolume);
                    return;
                }
            } catch (RuntimeException error) {
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
            savePlaybackState(currentFile, currentVolume, exoPlayer != null && exoPlayer.isPlaying(), currentLoopStartMs, currentLoopEndTrimMs);
            return START_REDELIVER_INTENT;
        }

        String file = intent != null ? intent.getStringExtra(EXTRA_FILE) : currentFile;
        float volume = intent != null ? intent.getFloatExtra(EXTRA_VOLUME, currentVolume) : currentVolume;
        int loopStartMs = intent != null ? intent.getIntExtra(EXTRA_LOOP_START_MS, currentLoopStartMs) : currentLoopStartMs;
        int loopEndTrimMs = intent != null ? intent.getIntExtra(EXTRA_LOOP_END_TRIM_MS, currentLoopEndTrimMs) : currentLoopEndTrimMs;
        if ((file == null || file.trim().isEmpty()) && isSavedPlaybackActive()) {
            file = getSavedFile();
            volume = getSavedVolume();
            loopStartMs = getSavedLoopStartMs();
            loopEndTrimMs = getSavedLoopEndTrimMs();
        }
        if (file == null || file.trim().isEmpty()) {
            dismissPlaybackNotification();
            stopSelf();
            return START_NOT_STICKY;
        }

        startForegroundCompat();
        startPlayback(file, volume, loopStartMs, loopEndTrimMs);
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

    private void startPlayback(String file, float volume, int loopStartMs, int loopEndTrimMs) {
        float clampedVolume = Math.max(0f, Math.min(1f, volume));
        int safeLoopStartMs = Math.max(0, loopStartMs);
        int safeLoopEndTrimMs = Math.max(0, loopEndTrimMs);
        requestAudioFocus();
        if (exoPlayer != null && file.equals(currentFile)) {
            currentVolume = clampedVolume;
            currentLoopStartMs = safeLoopStartMs;
            currentLoopEndTrimMs = safeLoopEndTrimMs;
            setPlayerVolume(clampedVolume);
            if (!exoPlayer.isPlaying()) exoPlayer.play();
            updateLiveState(true, file, clampedVolume);
            savePlaybackState(file, clampedVolume, true, safeLoopStartMs, safeLoopEndTrimMs);
            startWatchdog();
            return;
        }

        stopPlayback();
        try {
            Log.d(TAG, "startPlaybackExo " + file);
            exoPlayer = createExoPlayer(file, clampedVolume);
            exoPlayer.setVolume(clampedVolume);
            attachCurrentExoListener(exoPlayer, file, loopGeneration);
            exoPlayer.prepare();
            if (safeLoopStartMs > 0) {
                exoPlayer.seekTo(safeLoopStartMs);
            }
            exoPlayer.play();
            currentFile = file;
            currentVolume = clampedVolume;
            currentLoopStartMs = safeLoopStartMs;
            currentLoopEndTrimMs = safeLoopEndTrimMs;
            updateLiveState(true, file, clampedVolume);
            savePlaybackState(file, clampedVolume, true, safeLoopStartMs, safeLoopEndTrimMs);
            startWatchdog();
            scheduleExoLoopRollover(exoPlayer, file, loopGeneration);
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
        startPlayback(file, volume, currentLoopStartMs, currentLoopEndTrimMs);
    }

    private void stopPlayback() {
        loopGeneration += 1;
        scheduledExoRolloverGeneration = -1;
        stopWatchdog();
        if (exoPlayer != null) {
            try {
                exoPlayer.stop();
            } catch (Exception ignored) {
            }
            exoPlayer.release();
            exoPlayer = null;
        }
        releaseExoPlayerQuietly(preparedNextExoPlayer);
        preparedNextExoPlayer = null;
        releasePlayerQuietly(preparedNextPlayer);
        preparedNextPlayer = null;
        if (player == null) {
            currentFile = null;
            clearLiveState();
            return;
        }
        try {
            player.stop();
        } catch (Exception ignored) {
        }
        player.release();
        releasePlayerQuietly(preparedNextPlayer);
        preparedNextPlayer = null;
        player = null;
        currentFile = null;
        clearLiveState();
    }

    private ExoPlayer createExoPlayer(String file, float volume) {
        ExoPlayer newPlayer = new ExoPlayer.Builder(this).build();
        newPlayer.setVolume(volume);
        newPlayer.setRepeatMode(Player.REPEAT_MODE_OFF);
        newPlayer.setMediaItem(MediaItem.fromUri(Uri.parse("asset:///public/" + file)));
        return newPlayer;
    }

    private void attachCurrentExoListener(ExoPlayer targetPlayer, String file, int generation) {
        targetPlayer.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                if (targetPlayer != exoPlayer || generation != loopGeneration) return;
                if (playbackState == Player.STATE_READY) {
                    scheduleExoLoopRollover(targetPlayer, file, generation);
                    return;
                }
                if (playbackState == Player.STATE_ENDED) {
                    Log.w(TAG, "ExoPlayer completed before rollover, restarting loop");
                    restartPlayback(file, currentVolume);
                }
            }

            @Override
            public void onPlayerError(PlaybackException error) {
                if (targetPlayer != exoPlayer || generation != loopGeneration) return;
                Log.w(TAG, "ExoPlayer error, restarting loop", error);
                restartPlayback(file, currentVolume);
            }

            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                if (targetPlayer == exoPlayer && generation == loopGeneration) {
                    updateLiveState(isPlaying, file, currentVolume);
                }
            }
        });
    }

    private void scheduleExoLoopRollover(ExoPlayer scheduledPlayer, String file, int generation) {
        if (scheduledPlayer == null || scheduledExoRolloverGeneration == generation) return;
        try {
            long durationMs = scheduledPlayer.getDuration();
            if (durationMs == C.TIME_UNSET || durationMs <= EXO_LOOP_CROSSFADE_MS + 500L) {
                scheduledPlayer.setRepeatMode(Player.REPEAT_MODE_ONE);
                return;
            }
            scheduledExoRolloverGeneration = generation;
            long loopStartMs = Math.max(0L, Math.min(currentLoopStartMs, Math.max(durationMs - 1000L, 0L)));
            long loopEndMs = Math.max(loopStartMs + 1000L, durationMs - currentLoopEndTrimMs);
            long crossfadeDelayMs = Math.max(250L, loopEndMs - EXO_LOOP_CROSSFADE_MS);
            long prepareDelayMs = Math.max(250L, crossfadeDelayMs - EXO_LOOP_PREPARE_LEAD_MS);
            long startDelayAfterPrepareMs = Math.max(0L, crossfadeDelayMs - prepareDelayMs);
            Log.d(TAG, "scheduleExoLoopRollover file=" + file + " durationMs=" + durationMs
                + " loopEndMs=" + loopEndMs + " prepareDelayMs=" + prepareDelayMs
                + " startDelayAfterPrepareMs=" + startDelayAfterPrepareMs);
            watchdogHandler.postDelayed(
                () -> prepareNextExoForRollover(scheduledPlayer, file, generation, startDelayAfterPrepareMs),
                prepareDelayMs
            );
        } catch (Exception error) {
            scheduledExoRolloverGeneration = -1;
            Log.w(TAG, "Unable to schedule ExoPlayer rollover; using repeat mode", error);
            try {
                scheduledPlayer.setRepeatMode(Player.REPEAT_MODE_ONE);
            } catch (Exception ignored) {
            }
        }
    }

    private void prepareNextExoForRollover(ExoPlayer oldPlayer, String file, int generation, long startDelayMs) {
        if (scheduledExoRolloverGeneration == generation) {
            scheduledExoRolloverGeneration = -1;
        }
        if (generation != loopGeneration || oldPlayer != exoPlayer || currentFile == null) return;
        try {
            releaseExoPlayerQuietly(preparedNextExoPlayer);
            preparedNextExoPlayer = createExoPlayer(file, 0f);
            preparedNextExoPlayer.prepare();
            if (currentLoopStartMs > 0) {
                preparedNextExoPlayer.seekTo(currentLoopStartMs);
            }
            Log.d(TAG, "preparedNextExoPlayer file=" + file + " startDelayMs=" + startDelayMs);
            watchdogHandler.postDelayed(
                () -> rollToPreparedNextExoPlayer(oldPlayer, file, generation),
                startDelayMs
            );
        } catch (Exception error) {
            Log.w(TAG, "ExoPlayer loop preload failed; falling back to repeat mode", error);
            try {
                oldPlayer.setRepeatMode(Player.REPEAT_MODE_ONE);
            } catch (Exception ignored) {
            }
        }
    }

    private void rollToPreparedNextExoPlayer(ExoPlayer oldPlayer, String file, int generation) {
        if (generation != loopGeneration || oldPlayer != exoPlayer || preparedNextExoPlayer == null || currentFile == null) {
            releaseExoPlayerQuietly(preparedNextExoPlayer);
            preparedNextExoPlayer = null;
            return;
        }
        try {
            ExoPlayer nextPlayer = preparedNextExoPlayer;
            preparedNextExoPlayer = null;
            int nextGeneration = ++loopGeneration;
            exoPlayer = nextPlayer;
            attachCurrentExoListener(nextPlayer, file, nextGeneration);
            if (currentLoopStartMs > 0) {
                nextPlayer.seekTo(currentLoopStartMs);
            }
            nextPlayer.play();
            fadeBetweenExoPlayers(oldPlayer, nextPlayer, currentVolume, nextGeneration);
            scheduleExoLoopRollover(nextPlayer, file, nextGeneration);
        } catch (Exception error) {
            Log.w(TAG, "Prepared ExoPlayer rollover failed; restarting loop", error);
            restartPlayback(file, currentVolume);
        }
    }

    private void fadeBetweenExoPlayers(ExoPlayer oldPlayer, ExoPlayer nextPlayer, float targetVolume, int generation) {
        long stepDelay = Math.max(12L, EXO_LOOP_CROSSFADE_MS / EXO_LOOP_FADE_STEPS);
        for (int step = 0; step <= EXO_LOOP_FADE_STEPS; step += 1) {
            final int fadeStep = step;
            watchdogHandler.postDelayed(() -> {
                if (generation != loopGeneration) {
                    releaseExoPlayerQuietly(oldPlayer);
                    return;
                }
                double progress = Math.min(1d, Math.max(0d, fadeStep / (double) EXO_LOOP_FADE_STEPS));
                float inGain = (float) Math.sin(progress * Math.PI * 0.5d);
                float outGain = (float) Math.cos(progress * Math.PI * 0.5d);
                try {
                    nextPlayer.setVolume(targetVolume * inGain);
                } catch (Exception ignored) {
                }
                try {
                    oldPlayer.setVolume(targetVolume * outGain);
                } catch (Exception ignored) {
                }
                if (fadeStep >= EXO_LOOP_FADE_STEPS) {
                    releaseExoPlayerQuietly(oldPlayer);
                }
            }, stepDelay * step);
        }
    }

    private void releaseExoPlayerQuietly(ExoPlayer targetPlayer) {
        if (targetPlayer == null) return;
        try {
            targetPlayer.stop();
        } catch (Exception ignored) {
        }
        try {
            targetPlayer.release();
        } catch (Exception ignored) {
        }
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
            handlePlayerCompletion(completedPlayer, file);
        });
        mediaPlayer.prepare();
        seekToLoopStart(mediaPlayer, currentLoopStartMs);
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

    private void handlePlayerCompletion(MediaPlayer completedPlayer, String file) {
        if (completedPlayer == player) {
            Log.w(TAG, "Player completed before rollover, restarting loop");
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

    private void seekToLoopStart(MediaPlayer mediaPlayer, int loopStartMs) {
        if (mediaPlayer == null || loopStartMs <= 0) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                mediaPlayer.seekTo(loopStartMs, MediaPlayer.SEEK_CLOSEST);
            } else {
                mediaPlayer.seekTo(loopStartMs);
            }
        } catch (Exception error) {
            Log.w(TAG, "Unable to seek to loop start", error);
        }
    }

    private void setPlayerVolume(float volume) {
        float clampedVolume = Math.max(0f, Math.min(1f, volume));
        currentVolume = clampedVolume;
        if (playbackActive) {
            activePlaybackVolume = clampedVolume;
        }
        if (exoPlayer != null) {
            exoPlayer.setVolume(clampedVolume);
        }
        if (player != null) {
            player.setVolume(clampedVolume, clampedVolume);
        }
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

    private void savePlaybackState(String file, float volume, boolean isPlaying, int loopStartMs, int loopEndTrimMs) {
        SharedPreferences.Editor editor = prefs().edit();
        editor.putBoolean(PREF_PLAYING, isPlaying);
        if (file == null || file.trim().isEmpty()) {
            editor.remove(PREF_FILE);
        } else {
            editor.putString(PREF_FILE, file);
        }
        editor.putFloat(PREF_VOLUME, volume);
        editor.putInt(PREF_LOOP_START_MS, loopStartMs);
        editor.putInt(PREF_LOOP_END_TRIM_MS, loopEndTrimMs);
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
            .remove(PREF_LOOP_START_MS)
            .remove(PREF_LOOP_END_TRIM_MS)
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

    private int getSavedLoopStartMs() {
        return prefs().getInt(PREF_LOOP_START_MS, currentLoopStartMs);
    }

    private int getSavedLoopEndTrimMs() {
        return prefs().getInt(PREF_LOOP_END_TRIM_MS, currentLoopEndTrimMs);
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
