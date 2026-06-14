const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

function digest(relativePath) {
  return crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(root, relativePath)))
    .digest("hex");
}

function pngSize(relativePath) {
  const buffer = fs.readFileSync(path.join(root, relativePath));
  check(buffer.toString("ascii", 1, 4) === "PNG", `${relativePath} must be a PNG file.`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

const webIndex = read("www/index.html");
const soundSectionStart = webIndex.indexOf("const SOUND_PROFILES = [");
const themesBlock = webIndex.slice(
  webIndex.indexOf("const THEMES = ["),
  soundSectionStart === -1 ? webIndex.indexOf("const SOUNDS = [") : soundSectionStart
);
const themeFlags = [...themesBlock.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?free:\s*(true|false)/g)]
  .map((match) => ({ id: match[1], free: match[2] === "true" }));

check(themeFlags.length === 7, "Expected seven theme definitions.");
check(themeFlags.filter((theme) => theme.free).map((theme) => theme.id).join(",") === "classic,night",
  "Classic and Night must remain the free themes.");
check(!webIndex.includes("PreviewMode"), "Production web bundle must not contain Premium preview bypasses.");
check(webIndex.includes("window.BillingBridge"), "UI must use the shared BillingBridge.");
check(webIndex.includes("const PreviewAccess =") && webIndex.includes("127.0.0.1")
  && webIndex.includes("window.location.protocol === 'file:'"),
  "Local preview should allow temporary Premium inspection without changing production entitlement logic.");
check(!webIndex.includes('id="btn-settings"') && !webIndex.includes('id="btn-premium"'),
  "Main screen must not restore hard-to-reach top-corner controls.");
check(webIndex.includes('id="swipe-indicator"') && webIndex.includes('id="sheet-settings"')
  && webIndex.includes('id="sheet-premium"'),
  "Thumb-friendly customization, Settings, and Premium controls are required.");

check(digest("www/index.html") === digest("android/app/src/main/assets/public/index.html"),
  "Android web assets are stale. Run npm run sync.");
check(digest("www/index.html") === digest("ios/App/App/public/index.html"),
  "iOS web assets are stale. Run npm run sync.");

check(read("android/capacitor-cordova-android-plugins/build.gradle").includes("billing"),
  "Google Play Billing is not present in the generated Android Cordova plugin project.");
check(read("ios/App/App/config.xml").includes("InAppPurchase"),
  "StoreKit purchase plugin is not present in the generated iOS configuration.");

[
  "site/index.html",
  "site/privacy/index.html",
  "site/terms/index.html",
  "site/support/index.html",
  "ios/App/App/PrivacyInfo.xcprivacy",
  "release/BILLING-SETUP.md",
  "release/STORE-SUBMISSION.md",
  "release/google-play/icon-512.png",
  "release/google-play/feature-graphic.png",
  "release/app-store/screenshots/05-premium.png",
  "release/google-play/screenshots/05-premium.png"
].forEach((file) => check(exists(file), `Missing release file: ${file}`));

const playIcon = pngSize("release/google-play/icon-512.png");
const playFeature = pngSize("release/google-play/feature-graphic.png");
const appStoreShot = pngSize("release/app-store/screenshots/05-premium.png");
const playShot = pngSize("release/google-play/screenshots/05-premium.png");
check(playIcon.width === 512 && playIcon.height === 512, "Google Play icon must be 512x512.");
check(playFeature.width === 1024 && playFeature.height === 500,
  "Google Play feature graphic must be 1024x500.");
check(appStoreShot.width === 1290 && appStoreShot.height === 2796,
  "App Store screenshots must remain 1290x2796.");
check(playShot.width === 1080 && playShot.height === 1920,
  "Google Play screenshots must remain 1080x1920.");

const manifest = read("android/app/src/main/AndroidManifest.xml");
check(manifest.includes('android:allowBackup="false"'), "Android backups must remain disabled.");
check(manifest.includes('android:usesCleartextTraffic="false"'), "Android cleartext traffic must remain disabled.");

if (failures.length) {
  console.error("Release check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Release checks passed.");
