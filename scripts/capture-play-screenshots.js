// Google Play phone screenshots (1080x1920, English UI) for the store listing.
// Serve www/ first, e.g. `python3 -m http.server 8417 --directory www`, then:
//   BASE_URL=http://127.0.0.1:8417/ node scripts/capture-play-screenshots.js
// No Premium/price screen on purpose: prices differ by country and Play
// discourages pricing in listing graphics (see docs/WORKLOG-2026-10-12.md).
const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8417/';
const lang = process.env.SHOT_LANG || 'en';
const outDir = path.join(process.cwd(), 'release', 'google-play', 'screenshots-2026-10');

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function openNoise(page, poster, profileId) {
  await page.evaluate(async (poster, profileId) => {
    document.querySelector('.m3-nav-item[data-nav-target="home"]').click();
    await new Promise((r) => setTimeout(r, 600));
    document.querySelector(`.home-poster-card[data-poster="${poster}"]`).click();
    await new Promise((r) => setTimeout(r, 1400));
    if (profileId) NoisePlayerUI.selectProfile(profileId);
    AudioEngine.stopLoop();
  }, poster, profileId);
  await pause(1600);
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--lang=${lang}`, '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto(`${baseUrl}?lang=${lang}`, { waitUntil: 'networkidle0' });
  await page.evaluate((lang) => {
    localStorage.clear();
    localStorage.setItem('rb_language', lang);
    localStorage.setItem('rb_onboarding', 'true');
  }, lang);
  await page.reload({ waitUntil: 'networkidle0' });
  await pause(1500);
  const shot = (name) => page.screenshot({ path: path.join(outDir, name) });

  await page.evaluate(() => HomeTheme.apply('day'));
  await pause(800);
  await shot('01-home-day.png');

  await page.evaluate(() => HomeTheme.apply('night'));
  await pause(1200);
  await shot('02-home-night.png');
  await page.evaluate(() => HomeTheme.apply('day'));

  await openNoise(page, 'brown-noise', 'brown-ideal-ocean-waves');
  await shot('03-ocean-waves.png');

  await openNoise(page, 'pink-noise', 'pink-soft-noise');
  await shot('04-pink-fog.png');

  await openNoise(page, 'rain', 'brown-thunder-rain');
  await shot('05-thunder-rain.png');

  await openNoise(page, 'people', null);
  await shot('06-people.png');

  await openNoise(page, 'moon', null);
  await shot('07-moon-button.png');

  await page.evaluate(() => {
    document.querySelector('.m3-nav-item[data-nav-target="library"]').click();
  });
  await pause(1200);
  await shot('08-library.png');

  await browser.close();
  console.log(`saved to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
