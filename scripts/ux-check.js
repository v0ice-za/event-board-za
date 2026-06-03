const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8083';
const OUT = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  page.on('console', msg => { if (msg.type() === 'error') console.error('[PAGE ERROR]', msg.text()); });

  // ── 1. Initial feed load ──────────────────────────────────────────
  console.log('1. Initial feed...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/01-feed-initial.png` });
  console.log('   → 01-feed-initial.png');

  // ── 2. Scroll down inside the feed ScrollView ─────────────────────
  console.log('2. Scrolling feed...');
  // React Native Web renders ScrollView as the last scrollable div
  await page.evaluate(() => {
    const scrollables = Array.from(document.querySelectorAll('div')).filter(el => {
      const s = window.getComputedStyle(el);
      return (s.overflowY === 'scroll' || s.overflowY === 'auto') && el.scrollHeight > el.clientHeight;
    });
    if (scrollables.length) scrollables[scrollables.length - 1].scrollTop = 600;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/02-feed-scrolled.png` });
  console.log('   → 02-feed-scrolled.png');

  // ── 3. Scroll to bottom ───────────────────────────────────────────
  console.log('3. Feed bottom...');
  await page.evaluate(() => {
    const scrollables = Array.from(document.querySelectorAll('div')).filter(el => {
      const s = window.getComputedStyle(el);
      return (s.overflowY === 'scroll' || s.overflowY === 'auto') && el.scrollHeight > el.clientHeight;
    });
    if (scrollables.length) {
      const el = scrollables[scrollables.length - 1];
      el.scrollTop = el.scrollHeight;
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/03-feed-bottom.png` });
  console.log('   → 03-feed-bottom.png');

  // ── 4. Filter by Music ────────────────────────────────────────────
  console.log('4. Filter: Music...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // Chips now include emoji, so use partial text match
  await page.getByText(/Music/).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/04-filter-music.png` });
  console.log('   → 04-filter-music.png');

  // ── 5. Filter by Nightlife ────────────────────────────────────────
  console.log('5. Filter: Nightlife...');
  await page.getByText(/Nightlife/).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/05-filter-nightlife.png` });
  console.log('   → 05-filter-nightlife.png');

  // ── 6. Filter by Sport ───────────────────────────────────────────
  console.log('6. Filter: Sport...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.getByText(/Sport/).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/06-filter-sport.png` });
  console.log('   → 06-filter-sport.png');

  // ── 7. Tap save on hero card ──────────────────────────────────────
  console.log('7. Save button interaction...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.getByText('🤍').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/07-saved.png` });
  console.log('   → 07-saved.png');

  await browser.close();
  console.log('\nAll done → scripts/screenshots/');
})();
