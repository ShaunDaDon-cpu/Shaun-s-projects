// Headless frame renderer.
//   node src/render.mjs stills <outDir> <t1> <t2> ...        -> PNG stills at given times
//   node src/render.mjs segment <startFrame> <endFrame> <out.mp4>  -> encodes frames [start,end) at 60fps
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const [mode, ...args] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
await page.goto(`http://localhost:${port}/src/film/index.html${process.env.SCALE ? '?scale=' + process.env.SCALE : ''}`);
try { await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 }); }
catch (e) { console.error('not ready', errors.join('\n')); process.exit(1); }

const clip = { x: 0, y: 0, width: 1080, height: 1920 };
if (mode === 'stills') {
  const [out, ...times] = args; fs.mkdirSync(out, { recursive: true });
  for (const t of times) {
    const t0 = Date.now(); const shot = await page.evaluate((t) => window.renderAt(t), parseFloat(t));
    await page.screenshot({ path: path.join(out, `t${String(t).padStart(6, '0')}.png`), clip });
    console.log(`t=${t} shot=${shot} ${Date.now() - t0}ms`);
  }
} else if (mode === 'segment') {
  const [s, e, out] = args; const start = +s, end = +e;
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '60', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '60', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const tStart = Date.now();
  for (let f = start; f < end; f++) {
    await page.evaluate((t) => window.renderAt(t), f / 60);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93, clip });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - start) % 60 === 0) console.log(`[${start}-${end}] frame ${f} ${((Date.now() - tStart) / (f - start + 1)).toFixed(0)}ms/f`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
}
if (errors.length) console.log('CONSOLE:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
await browser.close(); server.close();
