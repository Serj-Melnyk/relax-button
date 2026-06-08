const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
    });

    const targetDir = '/Users/serhii/Desktop/Button/screenshots';
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
    }

    // Go to local server
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });

    // Clear localStorage to reset onboarding state
    await page.evaluate(() => {
        localStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });

    console.log('Taking screenshot of Onboarding Slide 1 (Switch your brain off)...');
    await page.screenshot({ path: path.join(targetDir, '01_onboarding_slide1.png') });

    // Slide 2
    console.log('Moving to Onboarding Slide 2...');
    await page.evaluate(() => Onboarding.next());
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(targetDir, '02_onboarding_slide2.png') });

    // Slide 3
    console.log('Moving to Onboarding Slide 3 (Demo)...');
    await page.evaluate(() => Onboarding.next());
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(targetDir, '03_onboarding_slide3.png') });

    // Tap Demo Button -> instantly transitions to Main Screen
    console.log('Tapping demo button to finish onboarding...');
    await page.evaluate(() => {
        const btn = document.getElementById('ob-demo-btn');
        btn.dispatchEvent(new Event('pointerdown'));
    });
    await new Promise(r => setTimeout(r, 800)); // wait for fade-out and navigation
    await page.screenshot({ path: path.join(targetDir, '04_main_screen.png') });

    // Open Bottom Sheet (should be default bottom button layout)
    console.log('Opening bottom sheet...');
    await page.evaluate(() => BottomSheet.open());
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(targetDir, '05_bottom_sheet.png') });

    // Trigger Paywall by tapping a premium theme
    console.log('Tapping premium theme (Arctic) to open Paywall...');
    await page.evaluate(() => ThemeManager.apply('arctic'));
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(targetDir, '06_paywall.png') });

    await browser.close();
    console.log('Updated screenshots successfully generated!');
})();
