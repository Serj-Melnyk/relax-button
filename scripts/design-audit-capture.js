const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');

const baseUrl = 'http://127.0.0.1:4173/';
const outDir = path.join(process.cwd(), 'design-audit-2026-06-09', 'screenshots');

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shot(page, name) {
  const filePath = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: filePath });
  return filePath;
}

async function clickByText(page, text) {
  const escaped = JSON.stringify(text);
  await page.evaluate((target) => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent.trim() === target);
    if (button) button.click();
  }, text);
}

async function main() {
  await ensureDir();

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 430, height: 932, isMobile: true, hasTouch: true },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const saved = [];

  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#onboarding');
  saved.push(await shot(page, '01-onboarding-step-1'));

  await clickByText(page, 'Next →');
  await pause(250);
  saved.push(await shot(page, '02-onboarding-step-2'));

  await clickByText(page, 'Next →');
  await pause(250);
  saved.push(await shot(page, '03-onboarding-step-3'));

  await page.goto(`${baseUrl}?demo=1`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('rb_onboarding', 'true');
    location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  saved.push(await shot(page, '04-main-screen'));

  await page.click('#btn-settings');
  await pause(300);
  saved.push(await shot(page, '05-settings-sheet-top'));

  await page.evaluate(() => {
    const sheet = document.querySelector('.sheet-content');
    if (sheet) sheet.scrollTop = sheet.scrollHeight;
  });
  await pause(250);
  saved.push(await shot(page, '06-settings-sheet-options'));

  await page.click('#settings .close-btn, #bottom-sheet .close-btn').catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
  await pause(250);

  await page.evaluate(() => {
    if (window.Paywall && typeof window.Paywall.open === 'function') {
      window.Paywall.open();
    }
  });
  await pause(300);
  saved.push(await shot(page, '07-paywall'));

  console.log(JSON.stringify(saved, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
