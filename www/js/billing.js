/* eslint-disable no-console */
(function initBilling() {
  const PRODUCT_ID = 'premium_lifetime';
  const store = window.CdvPurchase && window.CdvPurchase.store;

  if (!store) {
    console.info('[Billing] CdvPurchase not available yet.');
    window.__billingReady = false;
    window.__billingEntitlements = { premium: false };
    window.getBillingState = function getBillingState() {
      return window.__billingEntitlements;
    };
    return;
  }

  const products = [
    {
      id: PRODUCT_ID,
      type: window.CdvPurchase.ProductType.NON_CONSUMABLE,
      platform: window.CdvPurchase.Platform.APPLE_APPSTORE
    },
    {
      id: PRODUCT_ID,
      type: window.CdvPurchase.ProductType.NON_CONSUMABLE,
      platform: window.CdvPurchase.Platform.GOOGLE_PLAY
    }
  ];

  window.__billingEntitlements = { premium: false };
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
      console.info('[Billing] Product updated:', product && product.id);
    });

    store.when().approved(function onApproved(transaction) {
      console.info('[Billing] Purchase approved. Verifying...');
      transaction.verify();
    });

    store.when().verified(function onVerified(receipt) {
      console.info('[Billing] Receipt verified. Finishing transaction.');
      if (receipt && typeof receipt.finish === 'function') {
        receipt.finish();
      }
      window.__billingEntitlements.premium = true;
      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('billing:updated', { detail: window.__billingEntitlements }));
      }
    });

    store.error(function onStoreError(error) {
      console.error('[Billing] Store error:', error);
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
      console.info('[Billing] Store initialized.');
    }).catch(function onInitError(error) {
      console.error('[Billing] Store init failed:', error);
    });

    window.purchasePremium = function purchasePremium() {
      const product = store.get(PRODUCT_ID);
      if (!product) {
        throw new Error('Premium product not registered');
      }
      const offer = product.getOffer && product.getOffer();
      if (!offer || typeof offer.order !== 'function') {
        throw new Error('Premium offer not available');
      }
      return offer.order();
    };

    window.restorePremium = function restorePremium() {
      return store.restorePurchases();
    };

    window.getBillingState = function getBillingState() {
      return window.__billingEntitlements;
    };
  } catch (error) {
    console.error('[Billing] Initialization failed:', error);
  }
})();
