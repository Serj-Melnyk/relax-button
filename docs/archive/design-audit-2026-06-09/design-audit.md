# Relax Button Design Audit

Date: 2026-06-09
Product: Relax Button
Audit scope: onboarding, main screen, settings surface, premium/paywall entry
Evidence folder: `/Users/serhii/Desktop/Button/design-audit-2026-06-09/screenshots`

## Step List

1. Onboarding step 1 (`01-onboarding-step-1.png`) — Health: good
2. Onboarding step 2 (`02-onboarding-step-2.png`) — Health: good with copy/layout issues
3. Onboarding step 3 (`03-onboarding-step-3.png`) — Health: strongest screen in the flow
4. Main screen (`04-main-screen.png`) — Health: visually clean but under-informative
5. Settings surface (`05-settings-sheet-top.png`) — Health: weak
6. Settings lower content attempt (`06-settings-sheet-options.png`) — Health: problematic / unclear
7. Premium entry attempt (`07-paywall.png`) — Health: blocked / inconclusive

## What Already Works

- The dark onboarding atmosphere is coherent. The typography, gradients, and restrained motion fit the product mood well.
- Step 3 is the clearest emotional hook. The sphere, headline, and interaction cue create a strong “device ritual” feeling.
- The main screen has strong whitespace discipline. Nothing feels noisy or cheap.
- The central button itself feels premium and tactile. Its scale, depth, and shadow treatment are the strongest visual asset in the app.

## Findings

### 1. Main screen lacks orientation after onboarding
Evidence: `04-main-screen.png`

After onboarding, the app becomes almost too minimal. The user sees a large button but gets almost no confirmation of what to do next, what the current state is, or why settings/premium exist. The result is elegant but slightly empty.

Recommendation:
- Add one very light line of helper context near the button or below it.
- Example directions: “Tap to reset”, “Press for a tactile pause”, or a tiny state label for current sound/theme.
- Keep it secondary and quiet; the issue is not missing decoration, it is missing orientation.

### 2. Settings feels structurally disconnected from the rest of the app
Evidence: `05-settings-sheet-top.png`, `06-settings-sheet-options.png`

The settings surface does not feel like it belongs to the same product system as the onboarding and button screen. The onboarding is cinematic and tactile; settings feels like a generic white utility sheet with default toggles.

Recommendation:
- Bring more of the product language into settings: softer spacing rhythm, better section grouping, stronger close affordance, and more intentional component styling.
- Reduce the sense that the sheet is “just a settings panel” and make it feel like part of the same crafted object.

### 3. Settings information architecture is too thin at the top and too unclear below
Evidence: `05-settings-sheet-top.png`, `06-settings-sheet-options.png`

The top of settings shows only `Sound` and `Vibration`, while the rest of the screen is mostly blank in the captured state. In code, there are more controls, but visually the surface does not reveal or communicate them well. From an audit perspective, the screen reads as unfinished or clipped.

Recommendation:
- Rework section pacing so the user immediately understands that more controls exist.
- Use clearer section headers, stronger vertical grouping, and less dead white space above the fold.
- Consider moving “Button Position”, themes, and sounds into visibly distinct cards or grouped stacks instead of a single long plain sheet.

### 4. The premium entry is visually too quiet
Evidence: main screen star icon in `04-main-screen.png`; paywall step blocked in `07-paywall.png`

The star icon in the top-right is low-emphasis and visually close to a decorative status mark, not a monetization entry point. Even before testing interaction, it does not clearly announce value.

Recommendation:
- Increase semantic clarity: consider a gem/crown/starburst style or a stronger badge treatment.
- Use a tiny “Premium” label, pill, glow, or accent state on first sessions.
- If monetization matters, the current icon is too easy to ignore.

### 5. The second onboarding screen is the weakest in the sequence
Evidence: `02-onboarding-step-2.png`

Screen 2 is conceptually useful, but it has the least visual tension. The label `AUDIO SHIFT`, waveform icon, headline, and two text lines are all centered and similarly weighted. This makes the composition feel static.

Recommendation:
- Tighten the vertical stack and create one stronger focal relationship between the waveform icon and headline.
- Either shrink the icon and make the headline dominant, or enlarge the waveform treatment so the screen feels more ownable.
- Reduce the feeling of “stacked centered elements”.

### 6. Onboarding navigation is serviceable but not polished enough
Evidence: `01-onboarding-step-1.png`, `02-onboarding-step-2.png`, `03-onboarding-step-3.png`

The dots and `Next` CTA work, but they feel like implementation controls rather than designed controls. On screen 2 in particular, the navigation begins to compete with content because the content stack is already centered and quiet.

Recommendation:
- Soften the dots further and reduce their contrast.
- Make the `Next` affordance slightly more refined: either more subtle or more deliberate, but not halfway between text link and CTA.
- Consider a more consistent bottom rhythm between content block and nav block.

### 7. Screen 1 headline stack is good, but the microcopy above it still feels slightly floating
Evidence: `01-onboarding-step-1.png`

The line “A small ritual for overstimulated moments” is conceptually strong, but it still reads slightly detached from the headline because the whole screen is very airy.

Recommendation:
- Keep the copy, but tighten the relationship between eyebrow and headline by a few pixels or make the eyebrow slightly lighter and more label-like.
- Another option: reduce width slightly so the two-line eyebrow feels more intentional and less like body copy.

### 8. Step 3 copy is close, but the two supporting lines could form a cleaner hierarchy
Evidence: `03-onboarding-step-3.png`

“Tap, hear the click, feel the haptic” and “3 more presses to enter” are both useful, but they currently compete as two similar-priority lines.

Recommendation:
- Make the instruction line lighter/smaller and keep the press counter as the primary status line.
- That will make the user understand both “what to do” and “how far I am” faster.

## Accessibility Risks

- Contrast on secondary gray text against the dark onboarding background is acceptable visually but still worth formal testing, especially the smallest labels and navigation dots.
- The premium star icon and settings icon are visually subtle and may be hard to discover for low-vision users.
- The settings sheet relies heavily on spatial reading and low-contrast dividers; section separation may be weak for some users.
- The UI audit here is screenshot-based. It does not verify VoiceOver labels, focus order, switch hit areas, reduced motion behavior, or dynamic type scaling.

## Highest-Impact Improvements

1. Strengthen the post-onboarding main screen orientation without losing minimalism.
2. Redesign settings to feel like part of the same premium product language.
3. Clarify premium entry and paywall access.
4. Improve hierarchy on onboarding step 2 and step 3 support text.
5. Clean up bottom navigation rhythm across onboarding.

## Limits

- The paywall state could not be reliably validated from the captured browser run, so its critique is limited to the premium entry point and failed opening behavior.
- Screenshot evidence does not confirm full interaction quality, haptics, audio responsiveness, accessibility semantics, or native runtime behavior.
