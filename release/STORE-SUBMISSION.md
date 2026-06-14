# Store Submission Checklist

## Repository Ready

- Run `npm install`
- Run `npm run sync`
- Run `npm run check`
- Confirm only Classic is available without Premium
- Confirm Premium unlocks every other theme and all additional sounds
- Confirm Purchase and Restore use the localized store product
- Confirm Privacy, Terms, and Support pages are deployed over HTTPS
- Confirm `oktober15sm@gmail.com` is monitored

## Android

- Create a private upload keystore outside the repository
- Configure release signing using local Gradle properties or CI secrets
- Use JDK 21
- Build with `npm run build:android`
- Test the AAB through Play internal testing
- Enable Play App Signing
- Complete App Content, Data Safety, target audience, content rating, ads, and app-access forms
- Upload phone screenshots, 512 px icon, and 1024 x 500 feature graphic
- Prepared assets are in `release/google-play/`

## iOS

- Open the project with full Xcode, select the Apple Developer Team, and confirm automatic signing
- Confirm In-App Purchase capability
- Archive with the current store-required Xcode and iOS SDK
- Validate the archive privacy report and `PrivacyInfo.xcprivacy`
- Test through TestFlight and Apple Sandbox
- Complete App Privacy, age rating, export compliance, content rights, and review contact
- Upload current iPhone screenshots
- Prepared 1290 x 2796 screenshots are in `release/app-store/screenshots/`

## App Review Notes

Digital Fidget: Mental ASMR does not require an account.

To review the in-app purchase:

1. Complete the three onboarding screens.
2. Open the bottom sheet using the Customize control or a swipe up gesture.
3. The `premium_lifetime` non-consumable unlocks every theme except Classic and Night, every sound except Classic Click, and all Premium skins.
4. Restore Purchase is available below the purchase button.

The app contains no ads and does not use behavioral analytics.

## Credentials Required Outside This Repository

- Apple Developer Program membership and Team ID
- App Store Connect app record, agreements, tax, and banking
- Google Play developer account, agreements, and payments profile
- Android upload keystore
- Apple signing certificates and provisioning
- Store product configuration for `premium_lifetime`
- Optional Firebase project and Iaptic validator credentials
