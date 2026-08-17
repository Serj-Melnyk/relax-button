# Design QA — clean responsive home dashboard

- Reference: `/Users/serhii/Desktop/Знімок екрана 2026-07-15 о 14.24.55.png`.
- Scope agreed with the user: reproduce the reference's element hierarchy and placement, not its final visual design; do not place card imagery yet.

## Implemented hierarchy

1. Greeting and settings control.
2. Supportive daily-insight card.
3. Prominent Click & Relax action block.
4. Explore heading and horizontal session carousel.
5. Persistent bottom navigation.

## Cleanup

- Removed the accumulated orbital, circular-card, Material carousel, rhythm-card, and Continue-block styling layers.
- Removed the orbital and Material-carousel JavaScript paths.
- Removed Home artwork loading and last-scene/Continue UI code.
- Home now has one scoped style section and one card-building path.
- No Home card image URLs are assigned. Session cards intentionally use neutral color surfaces.

## Responsive coverage

- Compact phones: up to 359px.
- Standard phones: 360–429px.
- Large phones / small tablets: 430–767px.
- Tablets: 768–1023px with a two-column insight/feature row.
- Desktop preview: 1024px and above, using a centred tablet composition.
- Landscape phones and tablets: 640px wide and above with height up to 700px.
- Short screens: height up to 740px.

## Verification

- Release checks: passed.
- `git diff --check`: passed.
- Inline JavaScript parse: passed (4 scripts).
- Source cleanup check: only the new Home reset section remains; obsolete Home experiment labels and handlers are absent.
- Visual browser comparison: blocked. The in-app browser refused the local `file://` preview under its URL policy, so a same-viewport rendered screenshot could not be captured without bypassing the browser restriction.

final result: blocked
