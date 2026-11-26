// node pfp-render.js out.png  -> renders pfp.html at 1080x1080
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript' };
(async () => {
  const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  pg.on('pageerror', (e) => console.error('PAGEERR', e.message));
  await pg.goto(`http://localhost:${srv.address().port}/pfp.html`); await pg.waitForFunction(() => window.READY, null, { timeout: 60000 });
  await pg.screenshot({ path: process.argv[2] || 'pfp.png' }); await b.close(); srv.close();
})();
