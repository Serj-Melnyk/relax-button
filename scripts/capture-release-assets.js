const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');

const baseUrl = 'http://127.0.0.1:4173/';

async function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureSet(browser, targetDir, viewport) {
  await fs.mkdir(targetDir, { recursive: true });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  await page.screenshot({ path: path.join(targetDir, '01-onboarding.png') });
  await page.evaluate(() => Onboarding.next());
  await pause(350);
  await page.evaluate(() => Onboarding.next());
  await pause(350);
  await page.screenshot({ path: path.join(targetDir, '02-try-it.png') });

  await page.evaluate(() => {
    localStorage.setItem('rb_onboarding', 'true');
    location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(targetDir, '03-main.png') });

  await page.evaluate(() => BottomSheet.open());
  await pause(350);
  await page.screenshot({ path: path.join(targetDir, '04-customize.png') });

  await page.evaluate(() => {
    BottomSheet.close();
    Paywall.open();
  });
  await pause(350);
  await page.screenshot({ path: path.join(targetDir, '05-premium.png') });
  await page.close();
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  await captureSet(
    browser,
    path.join(process.cwd(), 'release', 'app-store', 'screenshots'),
    { width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  );

  await captureSet(
    browser,
    path.join(process.cwd(), 'release', 'google-play', 'screenshots'),
    { width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  );

  const graphic = await browser.newPage();
  await graphic.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
  await graphic.goto(
    `file://${path.join(process.cwd(), 'release', 'google-play', 'feature-graphic.html')}`,
    { waitUntil: 'load' },
  );
  await graphic.screenshot({
    path: path.join(process.cwd(), 'release', 'google-play', 'feature-graphic.png'),
  });

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
