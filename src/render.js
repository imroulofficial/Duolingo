// Renders dist/index.html frame-by-frame with headless Chromium and pipes the
// frames into FFmpeg (H.264, yuv420p, 30 fps).
//   node src/render.js <out.mp4> [--stills t1,t2,...]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const tl = JSON.parse(fs.readFileSync(path.join(__dirname, 'timeline.json'), 'utf8'));

(async () => {
  const out = process.argv[2] || path.join(ROOT, 'dist', 'video_silent.mp4');
  const stillsArg = process.argv.indexOf('--stills');
  const stills = stillsArg > -1 ? process.argv[stillsArg + 1].split(',').map(Number) : null;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: tl.width, height: tl.height }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(ROOT, 'dist', 'index.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  if (stills) {
    for (const t of stills) {
      await page.evaluate((t) => window.seek(t), t);
      await page.screenshot({ path: path.join(ROOT, 'dist', `still_${t.toFixed(2)}.png`) });
    }
    await browser.close();
    return;
  }

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(tl.fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

  const total = Math.round(tl.duration * tl.fps);
  for (let f = 0; f < total; f++) {
    await page.evaluate((t) => window.seek(t), f / tl.fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`frame ${f}/${total}\n`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log('wrote', out);
})();
