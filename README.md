# Relax Button

Relax Button is a Capacitor-based anti-stress app for iOS and Android.

## What is included
- Neomorphic main interaction button
- Three-step onboarding flow
- Theme and sound selector
- Premium paywall shell
- Native haptics bridge

## Current release notes
- Premium entitlement is wired to a native billing bridge placeholder and does not trust local client storage.
- Android backup is disabled for release hardening.
- Local development junk such as `node_modules` and build artifacts are ignored.

## Build targets
- Android via Capacitor
- iOS via Capacitor

## Next steps
- Wire real StoreKit and Google Play Billing plugins
- Add receipt validation and restore flow
- Configure CI and release automation
