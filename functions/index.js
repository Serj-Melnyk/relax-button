const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const IAPTIC_API_KEY = defineSecret("IAPTIC_API_KEY");
const IAPTIC_APP_NAME = defineSecret("IAPTIC_APP_NAME");
const PIXABAY_API_KEY = defineSecret("PIXABAY_API_KEY");
const PRODUCT_ID = "premium_lifetime";
const MAX_BODY_BYTES = 256 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_REQUESTS = 30;
const requestBuckets = new Map();
const PIXABAY_MAX_QUERY_LENGTH = 100;
const PIXABAY_MAX_PAGE = 10;
const PIXABAY_MAX_PER_PAGE = 20;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return origin === "capacitor://localhost"
    || origin === "http://localhost"
    || origin === "https://localhost"
    || origin === "http://127.0.0.1:4173"
    || origin === "http://localhost:8080"
    || origin === "http://127.0.0.1:8080"
    || origin === "https://relaxbutton.melnyklabs.com";
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

function applyCors(req, res, methods) {
  const origin = req.get("origin");
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ ok: false, error: "Origin not allowed" });
    return false;
  }

  if (origin) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", methods);
  return true;
}

function getClientIp(req) {
  return req.ip || req.get("x-forwarded-for") || "unknown";
}

function parseBooleanParam(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return value === "true" || value === "1";
}

function parseBoundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function sanitizePixabaySearch(req) {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query || query.length < 2 || query.length > PIXABAY_MAX_QUERY_LENGTH) {
    return { ok: false, error: "Search query must be between 2 and 100 characters." };
  }

  const allowedImageTypes = new Set(["all", "photo", "illustration", "vector"]);
  const allowedOrientations = new Set(["all", "horizontal", "vertical"]);
  const allowedOrder = new Set(["popular", "latest"]);
  const allowedColors = new Set([
    "grayscale", "transparent", "red", "orange", "yellow", "green", "turquoise",
    "blue", "lilac", "pink", "white", "gray", "black", "brown"
  ]);

  const imageType = typeof req.query.image_type === "string" && allowedImageTypes.has(req.query.image_type)
    ? req.query.image_type
    : "photo";
  const orientation = typeof req.query.orientation === "string" && allowedOrientations.has(req.query.orientation)
    ? req.query.orientation
    : "all";
  const order = typeof req.query.order === "string" && allowedOrder.has(req.query.order)
    ? req.query.order
    : "popular";
  const colors = typeof req.query.colors === "string" && allowedColors.has(req.query.colors)
    ? req.query.colors
    : "";

  return {
    ok: true,
    params: {
      q: query,
      page: parseBoundedInt(req.query.page, 1, 1, PIXABAY_MAX_PAGE),
      per_page: parseBoundedInt(req.query.per_page, 12, 3, PIXABAY_MAX_PER_PAGE),
      image_type: imageType,
      orientation,
      order,
      safesearch: parseBooleanParam(req.query.safesearch, true),
      editors_choice: parseBooleanParam(req.query.editors_choice, false),
      colors
    }
  };
}

exports.validateReceipt = onRequest({
  secrets: [IAPTIC_API_KEY, IAPTIC_APP_NAME],
  maxInstances: 10,
  timeoutSeconds: 30
}, async (req, res) => {
  if (!applyCors(req, res, "POST, OPTIONS")) return;
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

  const ip = getClientIp(req);
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

exports.searchPixabay = onRequest({
  secrets: [PIXABAY_API_KEY],
  maxInstances: 10,
  timeoutSeconds: 30
}, async (req, res) => {
  if (!applyCors(req, res, "GET, OPTIONS")) return;
  res.set("Cache-Control", "public, max-age=300, s-maxage=300");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({ ok: false, error: "Too many requests" });
    return;
  }

  const apiKey = PIXABAY_API_KEY.value();
  if (!apiKey) {
    res.status(503).json({ ok: false, error: "Pixabay search is not configured" });
    return;
  }

  const search = sanitizePixabaySearch(req);
  if (!search.ok) {
    res.status(400).json({ ok: false, error: search.error });
    return;
  }

  try {
    const url = new URL("https://pixabay.com/api/");
    url.searchParams.set("key", apiKey);
    Object.entries(search.params).forEach(([key, value]) => {
      if (value !== "" && value != null) {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Pixabay proxy upstream error:", response.status, text);
      res.status(502).json({ ok: false, error: "Pixabay upstream request failed" });
      return;
    }

    const payload = await response.json();
    const hits = Array.isArray(payload.hits) ? payload.hits : [];

    res.json({
      ok: true,
      total: Number(payload.total) || 0,
      totalHits: Number(payload.totalHits) || 0,
      hits: hits.map((hit) => ({
        id: hit.id,
        pageURL: hit.pageURL,
        type: hit.type,
        tags: hit.tags,
        previewURL: hit.previewURL,
        previewWidth: hit.previewWidth,
        previewHeight: hit.previewHeight,
        webformatURL: hit.webformatURL,
        webformatWidth: hit.webformatWidth,
        webformatHeight: hit.webformatHeight,
        largeImageURL: hit.largeImageURL,
        imageWidth: hit.imageWidth,
        imageHeight: hit.imageHeight,
        imageSize: hit.imageSize,
        views: hit.views,
        downloads: hit.downloads,
        likes: hit.likes,
        user: hit.user,
        userImageURL: hit.userImageURL
      }))
    });
  } catch (error) {
    console.error("Pixabay proxy failed:", error.message);
    res.status(502).json({ ok: false, error: "Pixabay search unavailable" });
  }
});
