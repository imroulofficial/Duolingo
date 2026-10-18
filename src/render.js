// Deterministic frame renderer: headless Chromium seeks src/ad.html to every
// frame time and pipes PNG-quality JPEG frames into FFmpeg (H.264).
//
//   node src/render.js video  <out.mp4>          full render, parallel workers
//   node src/render.js stills <dir> t1,t2,...    single PNG frames (QA / poster)
//
// The page is laid out at 360x640 CSS px and captured at deviceScaleFactor 3,
// i.e. a native 1080x1920 frame.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CUES = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist', 'cues.json'), 'utf8'));
const FPS = Number(process.env.FPS || CUES.fps);
const WORKERS = Number(process.env.WORKERS || 4);
const SCALE = CUES.scale;

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: CUES.width / SCALE, height: CUES.height / SCALE }, deviceScaleFactor: SCALE });
  await page.goto('file://' + path.join(ROOT, 'src', 'ad.html'));
  await page.evaluate(async () => { await document.fonts.ready; });
  const missing = await page.evaluate(() => ['Nunito', 'Baloo Da 2'].filter((f) => !document.fonts.check(`800 20px "${f}"`, f === 'Nunito' ? 'A' : 'অ')));
  if (missing.length) throw new Error('fonts not loaded: ' + missing);
  return page;
}

function ffmpeg(out) {
  return spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '10', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-g', String(FPS),
    '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
}

async function renderChunk(browser, f0, f1, out) {
  const page = await openPage(browser);
  const ff = ffmpeg(out);
  for (let f = f0; f < f1; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 97 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
}

(async () => {
  const [mode, out, list] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    const page = await openPage(browser);
    for (const t of list.split(',').map(Number)) {
      await page.evaluate((t) => window.seek(t), t);
      await page.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`) });
    }
  } else {
    const total = Math.round(CUES.duration * FPS);
    const per = Math.ceil(total / WORKERS);
    const tmp = path.join(ROOT, 'dist', 'chunks');
    fs.mkdirSync(tmp, { recursive: true });
    const parts = [];
    const t0 = Date.now();
    await Promise.all([...Array(WORKERS)].map((_, w) => {
      const a = w * per, b = Math.min(total, a + per);
      const p = path.join(tmp, `part${w}.mp4`);
      parts.push(p);
      return a < b ? renderChunk(browser, a, b, p) : null;
    }));
    const listFile = path.join(tmp, 'list.txt');
    fs.writeFileSync(listFile, parts.filter(fs.existsSync).map((p) => `file '${p}'`).join('\n'));
    await new Promise((r, j) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', out], { stdio: 'inherit' })
      .on('close', (c) => (c ? j(new Error('concat failed')) : r())));
    console.log(`rendered ${total} frames @${FPS}fps in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out}`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
