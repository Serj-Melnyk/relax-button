/* eslint-disable no-console */
(function initBilling() {
  const runtimeConfig = window.__APP_RUNTIME_CONFIG__ || {};
  const billingConfig = runtimeConfig.billing || {};
  const productId = billingConfig.premiumProductId || "premium_lifetime";
  const validationUrl = billingConfig.receiptValidationUrl || null;
  const store = window.CdvPurchase && window.CdvPurchase.store;

  async function validateWithBackend(payload) {
    if (!validationUrl) {
      return { ok: false, verified: false, entitlement: { premium: false } };
    }

    const response = await fetch(validationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Receipt validation failed");
    }

    return response.json();
  }

  function publishEntitlement(premium, source) {
    window.__billingEntitlements = { premium: !!premium, source: source || "unknown" };
    window.__billingReady = true;
    window.dispatchEvent(new CustomEvent("billing:updated", { detail: window.__billingEntitlements }));
  }

  if (!store) {
    console.info("[Billing] CdvPurchase not available yet.");
    window.__billingReady = false;
    window.__billingEntitlements = { premium: false, source: "no-store" };
    window.getBillingState = function getBillingState() {
      return window.__billingEntitlements;
    };
    return;
  }

  const products = [
    {
      id: productId,
      type: window.CdvPurchase.ProductType.NON_CONSUMABLE,
      platform: window.CdvPurchase.Platform.APPLE_APPSTORE
    },
    {
      id: productId,
      type: window.CdvPurchase.ProductType.NON_CONSUMABLE,
      platform: window.CdvPurchase.Platform.GOOGLE_PLAY
    }
  ];

  window.__billingEntitlements = { premium: false, source: "init" };
  window.__billingReady = false;

  function syncEntitlement(product) {
    const owned = !!(product && (product.owned || product.isOwned || product.active));
    window.__billingEntitlements.premium = owned;
    return owned;
  }

  try {
    store.register(products);

    store.when().productUpdated(function onProductUpdated(product) {
      syncEntitlement(product);
      console.info("[Billing] Product updated:", product && product.id);
    });

    store.when().approved(async function onApproved(transaction) {
      console.info("[Billing] Purchase approved. Verifying...");
      try {
        const receiptData = transaction && transaction.transaction && transaction.transaction.receipt
          ? transaction.transaction.receipt
          : null;

        if (receiptData) {
          const backend = await validateWithBackend({
            platform: transaction.platform || "unknown",
            receipt: receiptData,
            productId,
            userId: window.__firebaseAuthUserId || null
          });

          if (backend && backend.ok && backend.entitlement && backend.entitlement.premium) {
            publishEntitlement(true, "backend");
          }
        }

        transaction.verify();
      } catch (error) {
        console.error("[Billing] Backend validation failed:", error);
        transaction.verify();
      }
    });

    store.when().verified(function onVerified(receipt) {
      console.info("[Billing] Receipt verified. Finishing transaction.");
      if (receipt && typeof receipt.finish === "function") {
        receipt.finish();
      }
      publishEntitlement(true, "receipt");
    });

    store.error(function onStoreError(error) {
      console.error("[Billing] Store error:", error);
    });

    store.initialize([
      {
        platform: window.CdvPurchase.Platform.APPLE_APPSTORE,
        options: {
          needAppReceipt: true
        }
      },
      {
        platform: window.CdvPurchase.Platform.GOOGLE_PLAY
      }
    ]).then(function onInitialized() {
      window.__billingReady = true;
      console.info("[Billing] Store initialized.");
    }).catch(function onInitError(error) {
      console.error("[Billing] Store init failed:", error);
    });

    window.purchasePremium = function purchasePremium() {
      const product = store.get(productId);
      if (!product) {
        throw new Error("Premium product not registered");
      }
      const offer = product.getOffer && product.getOffer();
      if (!offer || typeof offer.order !== "function") {
        throw new Error("Premium offer not available");
      }
      return offer.order();
    };

    window.restorePremium = async function restorePremium() {
      const result = await store.restorePurchases();
      try {
        const backend = await validateWithBackend({
          platform: "restore",
          receipt: result || null,
          productId,
          userId: window.__firebaseAuthUserId || null
        });
        if (backend && backend.ok && backend.entitlement && backend.entitlement.premium) {
          publishEntitlement(true, "restore-backend");
        }
      } catch (error) {
        console.warn("[Billing] Restore validation failed:", error);
      }
      return result;
    };

    window.getBillingState = function getBillingState() {
      return window.__billingEntitlements;
    };
  } catch (error) {
    console.error("[Billing] Initialization failed:", error);
  }
})();
