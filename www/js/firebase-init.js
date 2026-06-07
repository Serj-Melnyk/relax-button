/* eslint-disable no-console */
(function initFirebase() {
  const firebaseConfig = window.__FIREBASE_CONFIG__ || null;

  if (!firebaseConfig) {
    console.info('[Firebase] Skipped initialization: no config provided.');
    return;
  }

  if (!window.firebase || typeof window.firebase.initializeApp !== 'function') {
    console.warn('[Firebase] Firebase SDK not available on window.');
    return;
  }

  try {
    const app = window.firebase.initializeApp(firebaseConfig);

    window.__firebaseApp = app;
    window.getFirebaseApp = function getFirebaseApp() {
      return window.__firebaseApp;
    };

    console.info('[Firebase] Initialized successfully.');
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
  }
})();
