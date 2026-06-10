const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const IAPTIC_API_KEY = defineSecret("IAPTIC_API_KEY");
const IAPTIC_APP_NAME = defineSecret("IAPTIC_APP_NAME");
const PRODUCT_ID = "premium_lifetime";
const MAX_BODY_BYTES = 256 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_REQUESTS = 30;
const requestBuckets = new Map();

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return origin === "capacitor://localhost"
    || origin === "http://localhost"
    || origin === "https://localhost";
}

function includesProductId(value) {
  if (value === PRODUCT_ID) return true;
  if (Array.isArray(value)) return value.some(includesProductId);
  if (value && typeof value === "object") {
    return Object.values(value).some(includesProductId);
  }
  return false;
}

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = requestBuckets.get(ip);
  if (!bucket || now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) {
    requestBuckets.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_REQUESTS;
}

exports.validateReceipt = onRequest({
  secrets: [IAPTIC_API_KEY, IAPTIC_APP_NAME],
  maxInstances: 10,
  timeoutSeconds: 30
}, async (req, res) => {
  const origin = req.get("origin");
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ ok: false, error: "Origin not allowed" });
    return;
  }

  if (origin) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const contentLength = Number(req.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    res.status(413).json({ ok: false, error: "Request too large" });
    return;
  }

  const ip = req.ip || req.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    res.status(429).json({ ok: false, error: "Too many requests" });
    return;
  }

  const body = req.body;
  const serializedBody = JSON.stringify(body || {});
  if (!body || serializedBody.length > MAX_BODY_BYTES || !includesProductId(body)) {
    res.status(400).json({ ok: false, error: "Invalid receipt payload" });
    return;
  }

  const apiKey = IAPTIC_API_KEY.value();
  const appName = IAPTIC_APP_NAME.value();
  if (!apiKey || !appName) {
    res.status(503).json({ ok: false, error: "Receipt validation is not configured" });
    return;
  }

  try {
    const validatorUrl = new URL("https://validator.iaptic.com/v1/validate");
    validatorUrl.searchParams.set("appName", appName);
    validatorUrl.searchParams.set("apiKey", apiKey);

    const response = await fetch(validatorUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serializedBody
    });
    const responseBody = await response.text();

    res.status(response.status);
    res.set("Content-Type", response.headers.get("content-type") || "application/json");
    res.send(responseBody);
  } catch (error) {
    console.error("Receipt validation proxy failed:", error.message);
    res.status(502).json({ ok: false, error: "Receipt validator unavailable" });
  }
});
