# Home sound cards — focused verification

final result: passed

Scope: sound cards only. This is not approval of the previously implemented hero or whole screen.

## Source and evidence

- Day source: `/Users/serhii/Desktop/Зображення Codex 28 вер. 2026 р., 17_17_30.png`
- Night source: `/Users/serhii/Desktop/Зображення Codex 28 вер. 2026 р., 17_12_33.png`
- Browser: `http://127.0.0.1:4174/index.html`
- Day implementation: `/tmp/button-cards-day-final.png`
- Focused source: `/tmp/button-cards-reference.png`
- Focused implementation: `/tmp/button-cards-implementation-final.png`
- CSS viewport / screenshot: 412 × 891, 1×. Source 853 × 1844, normalized to 412px wide for card comparison. Region crops are aligned by their first thumbnail; source crop includes 11px of leading space.

## Comparison and fixes

Initial state had a horizontal single-row carousel, different artwork and visible premium badges. Replaced with stacked rows, original thumbnail pixels extracted from the supplied source, hidden visual badges (access checks and accessible premium labels retained), thin separators and filled play icons inside outlined circles. A follow-up capture found a stronger legacy badge rule; corrected specificity and captured again.

Both themes were inspected in the browser. The day source and corrected implementation card crops were displayed together for the final comparison.

- Typography: sans-serif titles approximately 18px, descriptions 14px at the tested phone width; full Ukrainian names fit without mid-word breaks.
- Layout: approximately 82px thumbnails, 18px text gap, 36px outlined play affordance, vertically stacked rows and thin full-width dividers.
- Colors: existing day/night ink, secondary-text and divider tokens remain active. No solid card backgrounds or poster overlays.
- Imagery: forest, crystals and canyon come directly from the supplied reference; no regenerated substitutes.
- Copy: Рожевий шум / М’який баланс; Помаранчевий шум / Теплий фокус; Інфрачервоний шум / Глибока тиша.

## Checks and limits

- Theme switching and vertical scrolling checked visually.
- Browser error log: no captured errors.
- Inline JavaScript syntax check passed; root and www HTML match.
- Existing sound access and click handlers preserved. Paid playback was not bypassed or exercised.
- Other existing sounds remain available below the three reference rows. The reference only depicts three; none of the app's sounds were removed.
- Minor P3: the thumbnails inherit the reference's raster corner pixels. The main hero remains outside this narrowly requested card change.
