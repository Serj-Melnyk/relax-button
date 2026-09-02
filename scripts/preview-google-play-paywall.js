/*
 * Screenshot-only fixture. Evaluate manually in a LOCAL browser tab after the
 * real app has initialized. Never include this file in index.html or www/.
 * Requires ?screenshot-preview=premium-obsidian&lang=en. Reload to discard it.
 * The real Paywall renderer supplies the text; BillingBridge is not modified.
 */
(() => {
  const params = new URLSearchParams(location.search);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)
      || params.get('screenshot-preview') !== 'premium-obsidian'
      || params.get('lang') !== 'en'
      || (window.Capacitor?.getPlatform?.() || 'web') !== 'web') {
    throw new Error('Screenshot preview is restricted to an explicit local web tab.');
  }
  if (document.body.dataset.theme !== 'obsidian' || I18n.lang !== 'en') {
    throw new Error('Select Obsidian and English in the real app first.');
  }
  if (EntitlementManager.hasPaidPremium()) {
    throw new Error('Use a tab without a paid entitlement for paywall screenshots.');
  }
  if (window.GooglePlayScreenshotPreview) {
    throw new Error('Preview is already installed; reload before reinstalling.');
  }

  const original = {
    updateBillingState: Paywall.updateBillingState,
    purchase: Paywall.purchase,
    restore: Paywall.restore,
  };
  const preview = {
    blockedPurchaseActions: 0,
    blockedRestoreActions: 0,
    stop() {
      Object.assign(Paywall, original);
      Paywall.updateBillingState(window.BillingBridge?.getState());
      delete document.body.dataset.screenshotPreview;
      delete window.GooglePlayScreenshotPreview;
    },
  };

  // Stop all paywall transaction paths BEFORE rendering an enabled-looking CTA.
  Paywall.purchase = async () => {
    preview.blockedPurchaseActions += 1;
    return false;
  };
  Paywall.restore = async () => {
    preview.blockedRestoreActions += 1;
    return false;
  };
  Paywall.updateBillingState = function () {
    original.updateBillingState.call(this, {
      ready: true,
      available: true,
      price: '$2.99',
    });
  };
  window.GooglePlayScreenshotPreview = preview;
  document.body.dataset.screenshotPreview = 'premium-obsidian';
  Paywall.updateBillingState();
})();
