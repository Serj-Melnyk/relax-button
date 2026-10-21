# Notes for coding agents (Codex, Claude)

Digital Fidget: Mental ASMR — Capacitor app (Android first, iOS also built), package
`com.antistress.relaxbutton`. The owner talks in Ukrainian; keep user-facing notes in Ukrainian.

## Where things are

- `index.html` (repo root) is the whole web app: markup, CSS and JS in one file (~13.7k lines).
  `www/` is the web payload Capacitor ships. **Edit the root files, then copy to `www/`**
  (`cp index.html www/index.html`; assets mirror `assets/` → `www/assets/`), then `npx cap sync`.
  `npm run check` (`scripts/release-check.js`) fails if `www/` or the native copies are stale.
- Android native: `android/app/src/main/java/com/antistress/relaxbutton/`
  - `NoisePlaybackService.java` — continuous noise loops (two ExoPlayers, crossfade timed from
    the outgoing player's position).
  - `NativeHapticPlugin.java` — JS ↔ native bridge (`startNoiseLoop` etc.).
- iOS native: `ios/App/App/NativeHapticPlugin.swift` — loops a PCM buffer with the crossfade baked in.
- Release notes, Play Console logs, store listing texts: `release/` (`CHANGELOG.md` is the
  per-version history, Ukrainian).
- Session logs: `docs/WORKLOG-*.md` — read the latest one first.
- `main` = latest released code (1.0.20 / vc22 as of 2026-10-13).
- Monitoring policy: no analytics/crash SDKs (Data Safety says nothing is collected). Use Play Console only:
  Android vitals, reviews, Statistics, pre-launch report, email notifications. See `docs/WORKLOG-2026-10-16.md`.
- Premium paywall entry points: Account panel row `#account-premium` (always visible), bottom-sheet `#sheet-premium`,
  top crown `#click-premium-button` (Classic Button skin only), taps on locked items (not during the 3-day trial).
  Buyers get the same `#paywall` card in `.is-owned` mode ("Premium is active", Done). The owner's phone has a
  license-test purchase, so it always shows the buyer state until that order is refunded in Play Console.
- Skin `ocean` (Ocean / Океан) sits before `people` on Home; Premium after the trial like every non-Click skin (access is
  only `ACCESS_DEFAULTS.freeSkinIds/freeSoundProfileIds`; the `free` flag in SKINS/SOUND_PROFILES does not gate anything).
  Ocean = `ocean-surf`, `ocean-gentle`, `ocean-soothing-waves` + the two pink-skin sea sounds `brown-ideal-ocean-waves`,
  `infrared-ocean-waves` (same ids, listed in both sets, no duplicate files). 2026-10-21 sounds kept: `rain-window-glass`,
  `rain-calming`, `rain-sleep`, `rain-city-roof`, `pink-low-noise`, `infrared-soft-noise`, `infrared-fan`.
  Removed on the owner's request (21.10): Radio Noise, Rainy Day in Town, Light Rain Outside, Tile Roof Rain, Gentle Rain,
  Soothing Deep Noise, Beach Waves, Soft Waves, Night Sea, People Catering. "New" badges: `NewContent.ids`.
- Green Noise skin uses `Loop-GREEN-rain-window.m4a` (real window rain EQ'd to a green shape, checked by
  `scripts/noise-psd.py` `green_shape`); the same file is `rain-green-window` "Green Rain" in the Rain skin. Pixabay files
  labelled "green noise" were not green when measured — always measure before using one.
- Web payload budget is 65 MB (`npm run check`); after the 2026-10-21 sounds it is ~64 MB. New loop files are cut to the part
  that plays (loopStart 0.3, loopEndTrim 0.05) to fit. Any further audio needs space found first.
- Keep standard R8 minification and resource shrinking. Do not enable `android.r8.optimizedResourceShrinking`: it removed Cordova's `res/xml/config.xml` and caused Android to open to a blank WebView (fixed in 1.0.24).

## Conventions that are easy to miss

- **Loudness of new loops.** Match the skin's recommended sound by *effective* loudness = file LUFS + 20*log10(profile
  `gain`) (Rain/Ocean ≈ -20.5, Pink ≈ -18.75, Infrared ≈ -18.0). If peaks would pass -3 dBFS, raise `gain` (max 1.0) first, then a
  fast look-ahead limiter (sparse rain drops: up to 10-12 dB is inaudible; waves: at most 6-9 dB). Encode AAC 32 kHz stereo 80k.
  Existing pre-2026-10-21 loops range from -10 to -28 LUFS and were not touched.
- **Loop points.** Every continuous sound profile in `index.html` has `loopStart`, `loopEndTrim`
  and `loopCrossfade` (seconds). They were chosen by `scripts/loop-points.py`
  (input `scripts/loop-profiles.json`). Re-run it for any new or re-encoded loop file instead of
  guessing numbers. All three players (Android, iOS, web) use the same seam model: the tail
  `[end − crossfade, end]` fades out (cos) over the head `[start, start + crossfade]` fading in (sin).
- **Noise backdrops.** `assets/noise-backdrops/<sound-id>.webp` (portrait 9:16) and
  `<sound-id>-landscape.webp` (16:9). `NoiseBackdropScene.orientArtworkUrl()` picks the landscape
  file when `(orientation: landscape)` matches and re-syncs on rotation. Adding a backdrop means
  adding both files and one line in `NoiseBackdropScene.fallbackArtwork`.
  Provenance and prompts: `docs/noise-backdrop-prompts.json` (AI-generated in Google Flow).
  Flow must be used from the **oktober15sm** Google account (check the avatar first); the 2026-10-21 batch went to
  melnyklabs by mistake and stays there (project "Нові звуки 2026-10-21"). Owner hearts the chosen variant in Flow.
- **Image rights.** Do not add images taken from Pinterest or other sites without a licence that
  allows commercial use. App artwork is AI-generated by the owner; sounds come from Pixabay.
- **Skin switching.** Opening a skin paints it beneath Home for three frames
  (`body.skin-prepaint`) before Home hides, so the photo is rasterized and the gradient under it
  never flashes. Keep that when touching `HomeSkinScene.openPoster`.
- **Home wooden button.** The button is part of the Home photo; `.home-feature` is a transparent hit area over it and
  `.home-feature-disc` is a clipped copy of the same photo that sinks on press (`assets/home-pause.css`). Opening the
  Click skin from it uses `HomeSkinScene.openPoster('click', { dissolve: true })` (promo-style dissolve). If the Home
  photo is replaced, re-measure the disc centre/radius in that CSS.
- **Themes.** 8 themes for the Click skin (`THEMES`); Classic and Night are free. Chocolate draws its button from
  `assets/themes/chocolate-button.webp` (a crop of the night Home photo) and sinks only the disc on press, like Home.
  `scripts/release-check.js` checks the theme count, so update it when adding a theme.
- Debug builds install as `com.antistress.relaxbutton.debug` beside the Play build
  (`./gradlew assembleDebug`), so device QA keeps the tester's data.
- Signing (`android/keystore.properties`) and `android/local.properties` are local only — never commit.
- Promo video (Reels/TikTok/Shorts) is a separate Remotion project, not in this repo:
  `~/Desktop/Button/tmp/promo-remotion/` (spec in its `DESIGN.md`, render with `render-all.sh`).
  Timing is written in music beats in `src/timeline.ts`; change beats there, never raw frame numbers.
- Production actions in Play Console (sending for review, promoting to production) are done by the owner.
