// Renders the 1:1 product-listing images from src/listing.html at 1080x1080.
//   node src/render_listing.js            -> out/thumbnail_1x1.png, out/gallery_1x1_1.png, out/gallery_1x1_2.png
const { chromium } = require('playwright');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES = [['thumb', 'thumbnail_1x1.png'], ['g1', 'gallery_1x1_1.png'], ['g2', 'gallery_1x1_2.png']];

(async () => {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: 360, height: 360 }, deviceScaleFactor: 3 });
  await page.goto('file://' + path.join(ROOT, 'src', 'listing.html'));
  await page.evaluate(async () => { await document.fonts.ready; });
  for (const [id, file] of IMAGES) {
    await page.evaluate((id) => window.show(id), id);
    await page.screenshot({ path: path.join(ROOT, 'out', file) });
    console.log('wrote out/' + file);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
