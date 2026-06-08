/* eslint-disable no-console */
(function initFirebase() {
  const runtimeConfig = window.__APP_RUNTIME_CONFIG__ || {};
  const firebaseConfig = runtimeConfig.firebase || window.__FIREBASE_CONFIG__ || null;

  function attachBillingBridge() {
    window.addEventListener("billing:updated", function onBillingUpdated(event) {
      const entitlement = event && event.detail ? event.detail : null;
      if (!entitlement) {
        return;
      }

      if (window.firebase && typeof window.firebase.analytics === "function") {
        try {
          const analytics = window.firebase.analytics();
          if (analytics && typeof analytics.setUserProperties === "function") {
            analytics.setUserProperties({ premium_entitled: String(!!entitlement.premium) });
          }
        } catch (error) {
          console.warn("[Firebase] Analytics sync failed:", error);
        }
      }

      window.__firebaseBillingEntitlement = entitlement;
    });
  }

  if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.info("[Firebase] Skipped initialization: no config provided.");
    attachBillingBridge();
    return;
  }

  if (!window.firebase || typeof window.firebase.initializeApp !== "function") {
    console.warn("[Firebase] Firebase SDK not available on window.");
    attachBillingBridge();
    return;
  }

  try {
    const app = window.firebase.initializeApp(firebaseConfig);

    window.__firebaseApp = app;
    window.getFirebaseApp = function getFirebaseApp() {
      return window.__firebaseApp;
    };

    attachBillingBridge();
    console.info("[Firebase] Initialized successfully.");
  } catch (error) {
    console.error("[Firebase] Initialization failed:", error);
    attachBillingBridge();
  }
})();
