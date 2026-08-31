# Google Play Release Plan

Last updated: 2026-08-28

## Current Status

- Package: `com.antistress.relaxbutton`
- App name: `Digital Fidget: Mental ASMR`
- Target SDK: 36
- Min SDK: 24
- Release check: `npm run check` passes
- Debug APK: builds and installs
- Release AAB: version 1.0 (versionCode 1) signed with the local upload key; Gradle build, strict signature check, and bundletool validation pass.
- Upload key: created outside the repository; ignored `android/keystore.properties` links to the private local configuration. Back up the key and credentials securely.
- Google Play: internal release `1.0 (1) - Internal test` published on 2026-08-28 after explicit owner confirmation. Console shows the track as active and the release as available to internal testers. The selected `Digital Fidget - Internal testers` list contains one owner-approved address. Public production rollout has not started.
- Internal opt-in link: https://play.google.com/apps/internaltest/4700651465197431234 (enabled in Console). The tester must join with the approved Google account, then install from Google Play. Device installation and behavior have not yet been verified.
- Google temporarily displays `com.antistress.relaxbutton (unreviewed)` until app setup/review is completed.
- Premium: merchant account setup is required in Play Console. Agreed launch price is USD 2.99 for `premium_lifetime`.
- Production access: Console requires closed testing with at least 12 opted-in testers for at least 14 days. Current opted-in count is 0; internal testing does not replace this requirement.
- App content: Console shows no outstanding declarations. The en-US store listing and declarations are saved as changes not yet submitted for review.
- Saved listing settings: Lifestyle category and target audience 18+. These are existing Console selections, not new changes made during release verification.

## Google Play Console Checklist

1. Create the app in Play Console.
   - Type: App
   - Pricing: Free
   - Category: Lifestyle (current saved Console selection)
   - Contact email: `melnyklabs@gmail.com`
   - Accept Developer Program Policies, export law declarations, and Play App Signing terms.

2. Configure Play App Signing.
   - Create an upload key outside the repo.
   - Put local signing values in `android/keystore.properties`, or use CI secrets:
     `ANDROID_KEYSTORE_FILE`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
     `ANDROID_KEY_PASSWORD`.
   - Keep upload key and Play app signing key separate.

3. Upload the first internal testing AAB.
   - Build the signed release with `npm run build:android`.
   - Upload `android/app/build/outputs/bundle/release/app-release.aab`.
   - Add release notes from `release/google-play/metadata.md`.
   - Use internal testing first, then closed testing, then production.

4. Complete App content.
   - Privacy policy URL: `https://relaxbutton.melnyklabs.com/privacy`
   - Data Safety: use `release/PRIVACY-DISCLOSURES.md`, then re-check after Firebase Auth/Sync is added.
   - Content rating: Everyone, no medical claims, no ads.
   - Target audience: 18+ (current saved Console selection; not directed at children).
   - Ads: No.
   - App access: no account required for base app. If sync account is added, provide test credentials or clear review notes.

5. Store listing.
   - Metadata: `release/google-play/metadata.md`
   - Icon: `release/google-play/icon-512.png`
   - Feature graphic: `release/google-play/feature-graphic.png`
   - Screenshots: `release/google-play/screenshots/`
   - Support URL: `https://relaxbutton.melnyklabs.com/support`

6. Google Play Billing.
   - Upload internal-testing AAB before activating product.
   - Create one-time product `premium_lifetime`.
   - Add purchase option, pricing, regional availability.
   - Add license testers.
   - Verify purchase, pending purchase, cancel, restore, refund/revoke.

## Firebase Plan

- Receipt validation:
  - Deploy `functions/validateReceipt`.
  - Set `IAPTIC_API_KEY` and `IAPTIC_APP_NAME` as Firebase secrets.
  - Set `www/js/runtime-config.js` `billing.validatorUrl` to the HTTPS function URL.
  - Set `billing.requireServerValidation` to `true`.
  - Run `npm run sync` and `npm run check`.
  - Update Google Play Data Safety before production if receipt validation processes purchase or transaction identifiers. Current Play Console Data Safety is saved as no data collected/no data shared for the pre-validator build.

- Optional artwork proxy:
  - Deploy `functions/searchPixabay`.
  - Set `PIXABAY_API_KEY` as a Firebase secret.
  - Set `media.pixabayProxyUrl` only if we intentionally want remote artwork.
  - Default release behavior should remain local/offline artwork only.

- Account sync:
  - Add Firebase Auth only when sync is ready.
  - Recommended first providers: Google Sign-In and Apple Sign-In if we ship iOS sync too.
  - Store only minimal sync state: entitlement mirror, selected skin/theme, favorites, settings.
  - Add account deletion flow before production if account creation is enabled.
  - Update Data Safety and Privacy Policy before shipping account sync.

## Security Checklist

- Keep `android:allowBackup="false"`.
- Keep `android:usesCleartextTraffic="false"`.
- Keep signing keys, Firebase service accounts, Iaptic keys, and store credentials out of repo.
- Require server receipt validation before production Premium launch.
- Avoid direct third-party CDN calls from WebView unless disclosed.
- Re-run a formal security scan before production once Firebase Auth/Sync lands.

## Performance Checklist

- Keep app bundle local-first: no Google Fonts in WebView, no direct Pixabay CDN by default.
- Test cold launch after clear data.
- Test button tap latency and haptic/audio sync on physical Android.
- Test continuous loops for gaps, background playback, notification behavior, and sleep timer.
- Watch Android vitals after internal testing: crash rate, ANR rate, excessive wakeups, stuck partial wake locks.

## Device QA Matrix

- Small phone: 360x640 CSS viewport / compact Android.
- Standard phone: Pixel-class 393x873 CSS viewport.
- Tall phone: 412x915 CSS viewport.
- Large phone/foldable portrait: 480-600dp width.
- Tablet: 600dp+ width.
- Checks on each:
  - Onboarding text and controls fit.
  - Main button reachable in bottom and center layouts.
  - Bottom sheet and paywall do not clip.
  - Android back closes top layer, then returns to home.
  - Edge swipe/back transition is smooth and has no black/white preview.
  - Premium purchase UI shows localized price or graceful unavailable state.

## Immediate Blockers Before Production

- Run device QA using the published internal release, then complete purchase testing after merchant/product and license-tester setup. Internal-test access does not automatically enable free license-test purchases.
- Owner must complete the merchant/payment profile, then configure `premium_lifetime` at USD 2.99 and add license testers.
- Configure closed-test countries and testers, submit a closed release, and complete the Console's 12-tester/14-day requirement before applying for production access.
- Enable server receipt validation for Premium.
- After enabling server receipt validation, update Google Play Data Safety for purchase or transaction identifiers before production submission.
- Decide whether account sync ships in v1.0 or a later release.
- If account sync ships in v1.0, implement account deletion and update Data Safety.
- Internal-release pre-review passed without warnings, and the approved internal rollout is active. Production remains blocked on the separate closed-test and release-readiness requirements above.
