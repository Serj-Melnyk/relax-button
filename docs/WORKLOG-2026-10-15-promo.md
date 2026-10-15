# 2026-10-15 — promo video in Remotion (Claude, video-shotcraft mode 2)

Not app code: the video project lives outside the repo, in `~/Desktop/Button/tmp/promo-remotion/`
(Remotion 4.0.521, node_modules cloned from the Codex project `~/.codex/worktrees/82c9/Button/promo-video/`).

- Inputs and owner constraints: `~/Desktop/Button/CHAT-HANDOFF-2026-10-15-promo.md`.
- Design spec, shot list and beat grid: `tmp/promo-remotion/DESIGN.md`, `analysis/beat_data.json`.
  "Soft Focus" 82.05 BPM, beat 0.73125 s, beat 0 = 0.08 s (the handoff's 0.015 phase was off by ~2 frames).
- Timing lives in one place: `src/timeline.ts` (everything in beats, `beatF(n)`); sounds in `src/sfx.ts`
  (app click peak is 0.218 s into `sound-click.mp3` — compensated; output audio offset 0.027 s measured).
- Render: `tmp/promo-remotion/render-all.sh` → `out/promo_{en,uk}.mp4` and `out/promo_{en,uk}_nobgm.mp4`
  (+6 dB master with limiter, ≈ −20 LUFS). Copies: `tmp/promo-references-2026-10-15/digital-fidget-promo-remotion_{en,uk}[_nomusic].mp4`.
- Result: 24.4 s, 9:16. Hook (Agnes, original hand motion and framing) → soft dissolve → 3 clicks
  Arctic/Sage/Blush → noise card deck Radio/Birds/Rain/Pink → themes Classic/Obsidian/Sage with
  "No ads. No account. No subscription." → live Home folds into the icon → end card (Exhale).
- Owner feedback applied: hook was too zoomed in (now same framing as the approved hook, no push-in);
  circular iris from the wooden button to the app and its whoosh rejected (now a plain dissolve, no sound);
  tempo a bit slower (cuts every 2 beats instead of 1.5). EN version: "вроде норм", owner checking on the phone.
- Clicks land on the touch within 0.5 frame in both languages (cross-correlation of the render).
- Owner approved the final on the phone (EN + UA): "На телефоні все добре, фінал."
