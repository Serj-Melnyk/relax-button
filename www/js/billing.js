/* eslint-disable no-console */
(function createBillingBridge() {
  const config = (window.__APP_RUNTIME_CONFIG__ || {}).billing || {};
  const productId = config.premiumProductId || "premium_lifetime";
  const validatorUrl = config.validatorUrl || "";
  const requireServerValidation = config.requireServerValidation === true;
  const listeners = new Set();

  const state = {
    available: false,
    ready: false,
    premium: false,
    price: "",
    productId,
    error: null
  };

  let initPromise = null;

  function snapshot() {
    return { ...state };
  }

  function publish(patch) {
    Object.assign(state, patch);
    const detail = snapshot();
    window.__billingEntitlements = detail;
    window.dispatchEvent(new CustomEvent("billing:updated", { detail }));
    listeners.forEach((listener) => listener(detail));
  }

  function currentPlatform(CdvPurchase) {
    const nativePlatform = window.Capacitor && typeof window.Capacitor.getPlatform === "function"
      ? window.Capacitor.getPlatform()
      : window.cordova && window.cordova.platformId;

    if (nativePlatform === "ios") {
      return CdvPurchase.Platform.APPLE_APPSTORE;
    }
    if (nativePlatform === "android") {
      return CdvPurchase.Platform.GOOGLE_PLAY;
    }
    return null;
  }

  function productPrice(product) {
    if (!product) return "";
    if (product.pricing && product.pricing.price) return product.pricing.price;

    const offers = Array.isArray(product.offers) ? product.offers : [];
    for (const offer of offers) {
      const phases = offer && Array.isArray(offer.pricingPhases)
        ? offer.pricingPhases
        : [];
      if (phases[0] && phases[0].price) return phases[0].price;
    }
    return "";
  }

  function waitForPremium(timeoutMs) {
    if (state.premium) return Promise.resolve(true);

    return new Promise((resolve) => {
      let settled = false;
      const timer = window.setTimeout(() => finish(false), timeoutMs);

      function finish(value) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        listeners.delete(onUpdate);
        resolve(value);
      }

      function onUpdate(nextState) {
        if (nextState.premium) finish(true);
        if (nextState.error) finish(false);
      }

      listeners.add(onUpdate);
    });
  }

  async function waitForNativeReady() {
    const isNative = !!(window.Capacitor
      && typeof window.Capacitor.isNativePlatform === "function"
      && window.Capacitor.isNativePlatform());
    if (!isNative || window.CdvPurchase) return;

    await new Promise((resolve) => {
      const timer = window.setTimeout(resolve, 10000);
      document.addEventListener("deviceready", () => {
        window.clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  }

  async function initialize() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      await waitForNativeReady();
      const CdvPurchase = window.CdvPurchase;
      const store = CdvPurchase && CdvPurchase.store;
      const platform = CdvPurchase && currentPlatform(CdvPurchase);

      if (!store || !platform) {
        publish({ available: false, ready: true, premium: false });
        return snapshot();
      }

      if (requireServerValidation && !validatorUrl) {
        publish({
          available: false,
          ready: true,
          premium: false,
          error: "Receipt validation is not configured."
        });
        return snapshot();
      }

      if (validatorUrl) {
        store.validator = validatorUrl;
        store.validator_privacy_policy = ["fraud", "support"];
      }

      store.register({
        id: productId,
        type: CdvPurchase.ProductType.NON_CONSUMABLE,
        platform
      });

      store.when()
        .productUpdated((product) => {
          if (!product || product.id !== productId) return;
          publish({
            available: true,
            price: productPrice(product),
            premium: store.owned(productId),
            error: null
          });
        })
        .approved((transaction) => {
          transaction.verify();
        })
        .verified((receipt) => {
          receipt.finish();
          publish({
            available: true,
            ready: true,
            premium: store.owned(productId),
            error: null
          });
        })
        .unverified((result) => {
          const message = result && result.payload && result.payload.message
            ? result.payload.message
            : "Purchase verification failed.";
          publish({ ready: true, premium: false, error: message });
        })
        .receiptsVerified(() => {
          publish({
            available: true,
            ready: true,
            premium: store.owned(productId),
            error: null
          });
        });

      store.error((error) => {
        if (error && error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
          publish({ error: null });
          return;
        }
        publish({ error: error && error.message ? error.message : "Store error." });
      });

      const errors = await store.initialize([{
        platform,
        options: platform === CdvPurchase.Platform.APPLE_APPSTORE
          ? { needAppReceipt: true }
          : {}
      }]);

      const firstError = Array.isArray(errors) ? errors.find(Boolean) : errors;
      publish({
        available: !firstError,
        ready: true,
        premium: store.owned(productId),
        error: firstError && firstError.message ? firstError.message : null
      });
      return snapshot();
    })();

    return initPromise;
  }

  async function purchase() {
    await initialize();
    const CdvPurchase = window.CdvPurchase;
    const store = CdvPurchase && CdvPurchase.store;

    if (!state.available || !store) {
      throw new Error(state.error || "Purchases are only available in the installed app.");
    }

    const product = store.get(productId);
    const offer = product && product.getOffer && product.getOffer();
    if (!offer) throw new Error("Premium is not available from the store yet.");

    publish({ error: null });
    const error = await offer.order();
    if (error) throw new Error(error.message || "Purchase could not be started.");
    return waitForPremium(120000);
  }

  async function restore() {
    await initialize();
    const CdvPurchase = window.CdvPurchase;
    const store = CdvPurchase && CdvPurchase.store;

    if (!state.available || !store) {
      throw new Error(state.error || "Restore is only available in the installed app.");
    }

    publish({ error: null });
    const error = await store.restorePurchases();
    if (error) throw new Error(error.message || "Restore failed.");
    await store.update();
    publish({ premium: store.owned(productId), ready: true });
    return state.premium;
  }

  window.BillingBridge = {
    initialize,
    purchase,
    restore,
    getState: snapshot,
    isPremium: () => state.premium === true,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    }
  };

  document.addEventListener("deviceready", initialize, { once: true });
})();
