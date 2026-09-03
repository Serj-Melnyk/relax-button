const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function run() {
  let owned = false;
  let adapterReady = true;
  let restoreCalls = 0;
  let updateCalls = 0;

  const when = {};
  ['productUpdated', 'receiptUpdated', 'receiptsReady', 'approved', 'verified', 'unverified', 'receiptsVerified']
    .forEach((eventName) => {
      when[eventName] = () => when;
    });

  const store = {
    getAdapter: () => ({ ready: adapterReady }),
    get: () => ({ owned }),
    owned: () => owned,
    register: () => {},
    when: () => when,
    error: () => {},
    initialize: async () => [{ message: 'Product details are still loading.' }],
    restorePurchases: async () => {
      restoreCalls += 1;
      setTimeout(() => { owned = true; }, 20);
      return undefined;
    },
    update: async () => { updateCalls += 1; }
  };

  const listeners = new Map();
  const window = {
    __APP_RUNTIME_CONFIG__: { billing: { premiumProductId: 'premium_lifetime' } },
    Capacitor: {
      getPlatform: () => 'android',
      isNativePlatform: () => true
    },
    CdvPurchase: {
      store,
      Platform: { GOOGLE_PLAY: 'google-play', APPLE_APPSTORE: 'apple' },
      ProductType: { NON_CONSUMABLE: 'non-consumable' },
      ErrorCode: { PAYMENT_CANCELLED: 1 }
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    dispatchEvent(event) {
      (listeners.get(event.type) || []).forEach((listener) => listener(event));
    },
    addEventListener(type, listener) {
      listeners.set(type, [...(listeners.get(type) || []), listener]);
    }
  };

  const context = {
    window,
    document: { addEventListener: () => {} },
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options.detail;
      }
    },
    console
  };

  const source = fs.readFileSync(path.join(__dirname, '../www/js/billing.js'), 'utf8');
  vm.runInNewContext(source, context, { filename: 'billing.js' });

  const restored = await window.BillingBridge.restore();
  assert.equal(restored, true, 'restore should wait for Google Play ownership');
  assert.equal(window.BillingBridge.isPremium(), true);
  assert.equal(restoreCalls, 1);
  assert.equal(updateCalls, 0, 'restore should not issue a racing store.update call');

  adapterReady = false;
  const restoredAgain = await window.BillingBridge.restore();
  assert.equal(restoredAgain, true, 'an already-owned purchase should restore immediately');
  assert.equal(restoreCalls, 1, 'an already-owned purchase should not query Play again');

  console.log('Billing restore checks passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
