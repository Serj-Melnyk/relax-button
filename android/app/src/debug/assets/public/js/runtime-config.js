// Debug builds only (android/app/src/debug overrides www/js/runtime-config.js).
// Same as www/js/runtime-config.js plus billing.debugPremium, which unlocks Premium
// for testing on the owner's phone. Release builds never include this file.
window.__APP_RUNTIME_CONFIG__ = {
  billing: {
    premiumProductId: "premium_lifetime",
    validatorUrl: "",
    requireServerValidation: false,
    previewPremiumOnLocalhost: true,
    debugPremium: true
  },
  legal: {
    privacyUrl: "https://relaxbutton.melnyklabs.com/privacy",
    termsUrl: "https://relaxbutton.melnyklabs.com/terms",
    supportUrl: "https://relaxbutton.melnyklabs.com/support"
  },
  store: {
    landingUrl: "https://relaxbutton.melnyklabs.com",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.antistress.relaxbutton",
    appStoreUrl: ""
  },
  media: {
    pixabayProxyUrl: ""
  }
};
