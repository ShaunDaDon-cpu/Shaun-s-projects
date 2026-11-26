// Usage:
//   node render.js stills <outDir> <t1,t2,...>          render stills at given seconds
//   node render.js video <out.mp4> <startFrame> <endFrame>  render a frame range to an H.264 segment
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}

(async () => {
  const [mode, out, a, b] = process.argv.slice(2);
  const srv = await serve();
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.error('PAGE:', m.text()); });
  page.on('pageerror', (e) => console.error('PAGEERR:', e.message));
  await page.goto(`http://localhost:${srv.address().port}/film.html`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  const shotOf = async (f) => page.evaluate((f) => window.renderFrame(f), f);

  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of a.split(',').map(Number)) {
      await shotOf(Math.round(t * 60));
      await page.screenshot({ path: path.join(out, `t${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 85 });
    }
  } else {
    const start = +a, end = +b;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '60', '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '60', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = start; f < end; f++) {
      await shotOf(f);
      const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if ((f - start) % 120 === 0) console.log(`${path.basename(out)} frame ${f}/${end} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
  }
  await browser.close();
  srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
