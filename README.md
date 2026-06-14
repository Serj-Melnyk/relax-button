# Digital Fidget: Mental ASMR

Digital Fidget: Mental ASMR is a Capacitor-based tactile wellness app for iOS and Android.

## What is included
- Neomorphic main interaction button
- Three-step onboarding flow
- Theme and skin selector
- Premium paywall shell
- Native haptics bridge

## Current release notes
- Premium entitlement is wired to Apple App Store and Google Play through `cordova-plugin-purchase`.
- Classic and Night themes plus Classic Click are free; all other themes, sounds, and skins require Premium.
- Store pricing is localized and Restore Purchase is supported.
- Android backup is disabled for release hardening.
- The app contains no advertising or behavioral analytics SDK.
- Local development junk such as `node_modules` and build artifacts are ignored.

## Build targets
- Android via Capacitor
- iOS via Capacitor

## Next steps
- Create and activate `premium_lifetime` in App Store Connect and Play Console.
- Deploy the optional receipt validator and configure its URL.
- Configure release signing and publish the public `site/` directory.
- Regenerate store artwork when UI changes with `npm run assets:release`.
- Follow `release/STORE-SUBMISSION.md`.
