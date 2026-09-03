const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createHarness({ initiallyOwned = false, adapterReady = true, nativePurchases = [], onRestore } = {}) {
  let owned = initiallyOwned;
  let restoreCalls = 0;
  let updateCalls = 0;
  const when = {};
  ['productUpdated', 'receiptUpdated', 'receiptsReady', 'approved', 'verified', 'unverified', 'receiptsVerified']
    .forEach((eventName) => { when[eventName] = () => when; });

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
      if (onRestore) onRestore(() => { owned = true; });
      return undefined;
    },
    update: async () => { updateCalls += 1; }
  };

  const listeners = new Map();
  const window = {
    __APP_RUNTIME_CONFIG__: { billing: { premiumProductId: 'premium_lifetime' } },
    Capacitor: {
      getPlatform: () => 'android',
      isNativePlatform: () => true,
      Plugins: {
        PurchasePlugin: { getPurchases: async () => ({ purchases: nativePurchases }) }
      }
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
  return {
    bridge: window.BillingBridge,
    stats: () => ({ restoreCalls, updateCalls })
  };
}

async function run() {
  const eventHarness = createHarness({
    onRestore: (markOwned) => setTimeout(markOwned, 20)
  });
  assert.equal(await eventHarness.bridge.restore(), true, 'restore should wait for library ownership');
  assert.equal(eventHarness.bridge.isPremium(), true);
  assert.deepEqual(eventHarness.stats(), { restoreCalls: 1, updateCalls: 0 });

  const nativeHarness = createHarness({
    nativePurchases: [{ productIds: ['premium_lifetime'], getPurchaseState: 1 }]
  });
  assert.equal(await nativeHarness.bridge.restore(), true, 'restore should use the direct Google Play result');
  assert.equal(nativeHarness.bridge.isPremium(), true);
  assert.deepEqual(nativeHarness.stats(), { restoreCalls: 1, updateCalls: 0 });

  const ownedHarness = createHarness({ initiallyOwned: true, adapterReady: false });
  assert.equal(await ownedHarness.bridge.restore(), true, 'an already-owned purchase should restore immediately');
  assert.deepEqual(ownedHarness.stats(), { restoreCalls: 0, updateCalls: 0 });

  console.log('Billing restore checks passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
