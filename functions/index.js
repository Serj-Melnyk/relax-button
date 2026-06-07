const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

exports.validateReceipt = functions.https.onRequest(async (req, res) => {
  res.set('Content-Type', 'application/json');
  res.set('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const { platform, receipt, productId, userId } = req.body || {};

  if (!platform || !receipt || !productId) {
    res.status(400).json({ ok: false, error: 'Missing platform, receipt, or productId' });
    return;
  }

  try {
    // TODO: Replace this placeholder with Apple / Google server-side receipt validation.
    // The function currently only records the intended verification path and returns a safe false result.
    await admin.firestore().collection('receiptValidationRequests').add({
      platform,
      productId,
      userId: userId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      verified: false
    });

    res.status(200).json({
      ok: true,
      verified: false,
      entitlement: {
        premium: false
      },
      message: 'Receipt validation scaffold in place. Implement Apple/Google verification next.'
    });
  } catch (error) {
    console.error('validateReceipt failed:', error);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});
