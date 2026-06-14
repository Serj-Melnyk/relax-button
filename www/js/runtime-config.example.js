window.__APP_RUNTIME_CONFIG__ = {
  billing: {
    premiumProductId: "premium_lifetime",
    // Optional: use an Iaptic or compatible cordova-plugin-purchase validator.
    validatorUrl: "https://validator.example.com/v1/validate",
    requireServerValidation: true,
    previewPremiumOnLocalhost: false
  },
  legal: {
    privacyUrl: "https://example.com/privacy",
    termsUrl: "https://example.com/terms",
    supportUrl: "https://example.com/support"
  },
  store: {
    landingUrl: "https://example.com",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.app",
    appStoreUrl: "https://apps.apple.com/app/id0000000000"
  }
};
