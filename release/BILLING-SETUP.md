# Billing Setup

Digital Fidget: Mental ASMR uses one non-consumable product on both stores.

## Product

- Product ID: `premium_lifetime`
- Type: Non-consumable / one-time product
- Display name: Digital Fidget Premium
- Description: Unlock all Premium themes and sound packs with lifetime access.
- Suggested first price tier: USD 0.99 or the closest store-managed tier

The app never hardcodes the displayed price. It reads the localized price from Apple App Store or Google Play.

## Apple App Store Connect

1. Register bundle ID `com.antistress.relaxbutton`.
2. Create a non-consumable in-app purchase with product ID `premium_lifetime`.
3. Add localization, price, and a review screenshot showing the paywall.
4. Add the In-App Purchase capability to the Xcode target if Xcode does not add it during signing.
5. Create a Sandbox tester.
6. Submit the in-app purchase with the first app version.

## Google Play Console

1. Create the app with package name `com.antistress.relaxbutton`.
2. Upload an internal-testing AAB before creating or activating the product.
3. Create a one-time product with product ID `premium_lifetime`.
4. Add the purchase option, regional availability, and price.
5. Add license-test accounts and publish the product.

## Receipt Validation

The client supports an optional validator compatible with `cordova-plugin-purchase`.

1. Deploy `functions/validateReceipt` with Firebase Functions.
2. Set Firebase secrets:

```sh
firebase functions:secrets:set IAPTIC_API_KEY
firebase functions:secrets:set IAPTIC_APP_NAME
```

3. Put the deployed HTTPS function URL in `www/js/runtime-config.js` as `billing.validatorUrl`.
4. Set `billing.requireServerValidation` to `true`.
5. Run `npm run sync`.

Never place the Iaptic API key, Apple credentials, Google service-account keys, signing keys, or store passwords in the app bundle or repository.

## Test Matrix

- New purchase
- User cancellation
- Pending/parent-approved Google purchase
- Restore after reinstall
- Restore on a second device using the same store account
- Offline app launch
- Store unavailable
- Product unavailable or not yet approved
- Refunded or revoked purchase after receipt refresh
- App upgrade while Premium is already owned
