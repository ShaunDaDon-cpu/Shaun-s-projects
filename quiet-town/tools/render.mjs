#!/usr/bin/env node
// Render The Quiet Town. Based on the javascript-animation skill's render.mjs, with parallel workers
// (each a headless Chromium encoding its own frame range) because the film is WebGL at 60 fps.
//
//   node tools/render.mjs stills <dir> <t1,t2,...|shots>   JPEG stills at those seconds (or the middle of every shot)
//   node tools/render.mjs sheet <file.jpg> [shots]           contact sheet, one tile per shot
//   node tools/render.mjs audio <file.wav>                   render the score offline
//   node tools/render.mjs video <file.mp4> [--workers 4] [--from s] [--to s]
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { serve } from './serve.mjs';

const [mode, out, arg] = process.argv.slice(2);
const opt = (n, d) => { const i = process.argv.indexOf(n); return i < 0 ? d : process.argv[i + 1]; };
const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const srv = await serve(root);
const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(srv.url + '/index.html?render');
  try { await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 }); }
  catch (e) { console.error('page did not become ready', errors); throw e; }
  page.errors = errors;
  return page;
}
const grab = (page, f, q = .92) => page.evaluate(([f, q]) => { window.draw(f); return document.getElementById('out').toDataURL('image/jpeg', q).split(',')[1]; }, [f, q]).then(b => Buffer.from(b, 'base64'));

const browser = await chromium.launch({ args: ARGS });
const page = await openPage(browser);
const info = await page.evaluate(() => ({ FRAMES: window.FRAMES, FPS: window.FPS, CUES: window.CUES }));
const starts = [0, ...info.CUES];

if (mode === 'stills') {
  mkdirSync(out, { recursive: true });
  const times = arg === 'shots' || !arg ? starts.map((s, i) => (s + (starts[i + 1] ?? info.FRAMES / info.FPS)) / 2) : arg.split(',').map(Number);
  for (const t of times) { const f = Math.min(info.FRAMES - 1, Math.round(t * info.FPS)); const file = join(out, `t${t.toFixed(2).padStart(6, '0')}.jpg`); writeFileSync(file, await grab(page, f)); console.log(file); }
} else if (mode === 'sheet') {
  const dir = join(dirname(out), '.sheet'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const times = starts.map((s, i) => s + ((starts[i + 1] ?? info.FRAMES / info.FPS) - s) * .6);
  for (const [i, t] of times.entries()) writeFileSync(join(dir, `f${String(i).padStart(3, '0')}.jpg`), await grab(page, Math.round(t * info.FPS), .85));
  const cols = 10, rows = Math.ceil(times.length / cols);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(dir, 'f%03d.jpg'), '-vf', `scale=216:384,tile=${cols}x${rows}:padding=4`, '-frames:v', '1', out]);
  rmSync(dir, { recursive: true }); console.log('sheet ->', out);
} else if (mode === 'audio') {
  await renderAudio(page, out);
} else if (mode === 'remux') {
  // re-render the score and remux it into an existing video: node tools/render.mjs remux out/quiet-town.mp4
  const wav = out.replace(/\.mp4$/, '') + '.wav', tmpv = out.replace(/\.mp4$/, '') + '.prev.mp4';
  await renderAudio(page, wav);
  execFileSync('mv', [out, tmpv]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmpv, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:level=false', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out]);
  rmSync(tmpv); console.log('remuxed ->', out);
} else if (mode === 'video') {
  const W = +opt('--workers', 4), from = Math.round(+opt('--from', 0) * info.FPS), to = Math.min(info.FRAMES, Math.round(+opt('--to', info.FRAMES / info.FPS) * info.FPS));
  const tmp = join(dirname(resolve(out)), '.segments'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const per = Math.ceil((to - from) / W), t0 = Date.now(); let done = 0;
  const jobs = Array.from({ length: W }, (_, w) => ({ w, a: from + w * per, b: Math.min(to, from + (w + 1) * per) })).filter(j => j.a < j.b);
  await Promise.all(jobs.map(async ({ w, a, b }) => {
    const br = w === 0 ? browser : await chromium.launch({ args: ARGS });
    const pg = w === 0 ? page : await openPage(br);
    const seg = join(tmp, `seg${w}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(info.FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(info.FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise(r => ff.on('close', r));
    for (let f = a; f < b; f++) {
      const jpg = await grab(pg, f, .95);
      if (!ff.stdin.write(jpg)) await new Promise(r => ff.stdin.once('drain', r));
      done++; if (done % 120 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${done}/${to - from} frames  ${el.toFixed(0)}s  eta ${(el / done * (to - from - done)).toFixed(0)}s`); }
    }
    ff.stdin.end(); await closed;
    if (pg.errors.length) console.warn(`worker ${w} page errors:`, pg.errors.slice(0, 5));
    if (w !== 0) await br.close();
  }));
  writeFileSync(join(tmp, 'list.txt'), jobs.map(j => `file 'seg${j.w}.mp4'`).join('\n'));
  const silent = join(tmp, 'silent.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'), '-c', 'copy', silent]);
  const wav = out.replace(/\.mp4$/, '') + '.wav';
  if (!existsSync(wav) || process.argv.includes('--reaudio')) await renderAudio(page, wav);
  const ss = String(from / info.FPS), dur = String((to - from) / info.FPS);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-ss', ss, '-t', dur, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:level=false', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out]);
  writeFileSync(out.replace(/\.mp4$/, '') + '.cues.json', JSON.stringify(info.CUES.filter(c => c * info.FPS > from && c * info.FPS < to).map(c => +(c - from / info.FPS).toFixed(3))));
  rmSync(tmp, { recursive: true });
  console.log(`video -> ${out}  (${to - from} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
if (page.errors.length) console.warn('page errors:', page.errors.slice(0, 8));
await browser.close(); srv.close();

async function renderAudio(page, file) {
  const wav64 = await page.evaluate(async secs => {
    const SR = 48000, ac = new OfflineAudioContext(2, Math.ceil(SR * secs), SR);
    window.SCORE(ac);
    const buf = await ac.startRendering(), n = buf.length, L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 1e-9; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const g = .89 / peak, dv = new DataView(new ArrayBuffer(44 + n * 4)), w = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
    dv.setUint32(24, SR, true); dv.setUint32(28, SR * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) { dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * g)) * 32767, true); dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i] * g)) * 32767, true); }
    const bytes = new Uint8Array(dv.buffer); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }, info.FRAMES / info.FPS);
  writeFileSync(file, Buffer.from(wav64, 'base64')); console.log('audio ->', file);
}
