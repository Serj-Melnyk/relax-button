# Chat Handoff — 2026-06-11

## Current state

- Project: `/Users/serhii/Desktop/Button`
- App preview URL: `http://127.0.0.1:4173/`
- Latest pushed commit: `e107a96` (`Polish release UI and rebrand store assets`)
- Current worktree has uncommitted changes

## What is already done

- Brand/store/landing updated to `Digital Fidget: Mental ASMR`
- Support email updated to `oktober15sm@gmail.com`
- Premium gating works:
  - `Classic` theme is free
  - `Classic Click` sound is free
  - all other themes/sounds are Premium
- Theme carousel visuals were redesigned to feel closer to the main button
- Active theme previews now use per-theme accent rings

## Rotary Phone status

The current `Rotary Phone` implementation exists in code, but should be treated as temporary and likely removed.

What is currently wired:

- `Rotary Phone` exists in `SOUNDS`
- card uses `old-phone.jpeg` as the icon image
- the whole card opens the rotary detail screen
- the separate `Dial` button was removed
- the card has a subtle image accent using `old-phone.jpeg`
- `rotary-phone.mp3` is connected through the current audio engine

Current files/assets:

- `old-phone.jpeg`
- `rotary-phone.mp3`
- legacy/temporary files still present:
  - `rotary-phone-icon.jpeg`
  - mirrored copies in `www/`

## Important user decision

The user does **not** like the current Rotary Dial experience and wants it removed/rebuilt from scratch.

Do not continue polishing the current rotary UI as the final direction.

## Additional UI decision — 2026-07-06

The current background images in the noise-player screens for `White Noise` and `Radio Noise` are approved as-is.

Leave these background images unchanged for now.

Do not start a new polish pass on those specific background images unless there is a functional bug or a new explicit design request.

`Waterfall` should use the fixed background image `assets/home-posters/waterfall.jpg` / `www/assets/home-posters/waterfall.jpg`.

## Architecture direction requested by user

We need to redesign the app data model so `sound` and `skin` are separate concepts.

Recommended direction:

- `interaction skins`
  - `id`
  - `title`
  - `description`
  - `premium`
  - `uiType`
  - `gestureType`
  - `hapticProfile`
  - `soundProfileId`

- `sound profiles`
  - `id`
  - `mode` (`single`, `roundRobin`, `sprite`)
  - `files` or `sprite map`
  - `pitchJitter`
  - `gain`
  - `timing hints`

## Technical follow-up requested

1. Remove or disable the current rotary-specific path cleanly
2. Redesign the data model around `skins` vs `sound profiles`
3. Refactor audio playback to support:
   - Round Robin variations
   - micro-pitch modulation
   - future tighter haptics sync
4. Only after that, rebuild `Rotary Phone` as a fresh interactive skin

## Current rotary-related code locations

In both `index.html` and `www/index.html`:

- rotary photo icon styles:
  - `.sound-icon--photo`
- rotary card image accent:
  - `.sound-item.rotary-sound::after`
- rotary full-screen UI:
  - `#rotary-screen-scrim`
  - `#rotary-screen`
- rotary screen HTML:
  - around line `2027`
- `SOUNDS` entry:
  - around line `2160`
- rotary card click handling in `SoundManager.buildList()`:
  - around line `2635`
- `RotaryDialPreview`:
  - around line `2672`
- `RotaryDialScreen`:
  - around line `2772`

## Current git status at handoff

- modified:
  - `index.html`
  - `www/index.html`
- untracked:
  - `old-phone.jpeg`
  - `rotary-phone-icon.jpeg`
  - `rotary-phone.mp3`
  - `www/old-phone.jpeg`
  - `www/rotary-phone-icon.jpeg`
  - `www/rotary-phone.mp3`

## Suggested first step in next chat

Start by auditing and removing the current rotary implementation, then redesign the data model before any new UI work.
