// Expressive cartoon faces, drawn into canvas textures that wrap the front of a blocky head.
import * as THREE from 'three';

const W = 560, H = 400;           // texture covers a 150° arc of the head: wider than tall
const cache = new Map();
const INK = '#1b1b1f';

function eye(x, y, ctx, { r = 30, ry = 38, pupil = true, look = 0 } = {}) {
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2); ctx.fill();
  if (pupil) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - r * .3 + look * 8, y - ry * .38, r * .32, r * .34, 0, 0, Math.PI * 2); ctx.fill(); }
}
function line(ctx, pts, w = 14) {
  ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}
function curve(ctx, x0, y0, cx, cy, x1, y1, w = 14) {
  ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
}
function mouthOpen(ctx, x, y, w, h, { teeth = false, tongue = true } = {}) {
  ctx.fillStyle = '#5a1020'; ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2); ctx.fill();
  if (tongue) { ctx.save(); ctx.clip(); ctx.fillStyle = '#e8506a'; ctx.beginPath(); ctx.ellipse(x, y + h * .75, w * .7, h * .5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  if (teeth) { ctx.fillStyle = '#fff'; ctx.fillRect(x - w * .6, y - h + 4, w * 1.2, h * .28); }
  ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2); ctx.stroke();
}
function grinShape(ctx, x, y, w, h) { // D-shaped open smile with top teeth
  ctx.fillStyle = '#5a1020'; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y); ctx.quadraticCurveTo(x + w, y + h * 1.6, x, y + h * 1.6); ctx.quadraticCurveTo(x - w, y + h * 1.6, x - w, y); ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(x - w, y, w * 2, h * .45); ctx.fillStyle = '#e8506a'; ctx.beginPath(); ctx.ellipse(x, y + h * 1.5, w * .55, h * .5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y); ctx.quadraticCurveTo(x + w, y + h * 1.6, x, y + h * 1.6); ctx.quadraticCurveTo(x - w, y + h * 1.6, x - w, y); ctx.stroke();
}
function brows(ctx, cx, ey, kind) {
  const L = cx - 78, R = cx + 78, y = ey - 62;
  if (kind === 'angry') { line(ctx, [[L - 34, y - 14], [L + 30, y + 12]], 15); line(ctx, [[R + 34, y - 14], [R - 30, y + 12]], 15); }
  if (kind === 'sad') { line(ctx, [[L - 32, y + 10], [L + 28, y - 12]], 13); line(ctx, [[R + 32, y + 10], [R - 28, y - 12]], 13); }
  if (kind === 'up') { curve(ctx, L - 30, y - 6, L, y - 30, L + 30, y - 6, 12); curve(ctx, R - 30, y - 6, R, y - 30, R + 30, y - 6, 12); }
  if (kind === 'flat') { line(ctx, [[L - 30, y], [L + 30, y]], 12); line(ctx, [[R - 30, y], [R + 30, y]], 12); }
}

function draw(ctx, expr, f) {
  const cx = W / 2, ey = 165, my = 285, L = cx - 78, R = cx + 78;
  ctx.clearRect(0, 0, W, H);
  if (f.blush || ['puff', 'happy', 'wink'].includes(expr)) { ctx.fillStyle = 'rgba(255,110,120,.45)'; for (const x of [L - 40, R + 40]) { ctx.beginPath(); ctx.ellipse(x, ey + 72, 34, 20, 0, 0, Math.PI * 2); ctx.fill(); } }
  if (f.freckles) { ctx.fillStyle = 'rgba(150,80,30,.7)'; for (const [dx, dy] of [[-58, 70], [-80, 84], [-40, 88], [58, 70], [80, 84], [40, 88]]) { ctx.beginPath(); ctx.arc(cx + dx * 1.7 + (dx > 0 ? -40 : 40), ey + dy, 6, 0, 7); ctx.fill(); } }
  const E = (o = {}) => { eye(L, ey, ctx, o); eye(R, ey, ctx, o); };
  const lash = () => { if (!f.lashes) return; for (const [x, s] of [[L, -1], [R, 1]]) line(ctx, [[x + s * 26, ey - 26], [x + s * 44, ey - 40]], 8); };
  switch (expr) {
    case 'smile': E(); lash(); curve(ctx, cx - 70, my - 10, cx, my + 46, cx + 70, my - 10); break;
    case 'grin': E(); lash(); brows(ctx, cx, ey, 'up'); grinShape(ctx, cx, my - 22, 82, 42); break;
    case 'happy': line(ctx, [[L - 30, ey + 10], [L, ey - 18], [L + 30, ey + 10]], 15); line(ctx, [[R - 30, ey + 10], [R, ey - 18], [R + 30, ey + 10]], 15); grinShape(ctx, cx, my - 22, 78, 40); break;
    case 'shout': line(ctx, [[L - 34, ey - 26], [L + 24, ey], [L - 34, ey + 26]], 16); line(ctx, [[R + 34, ey - 26], [R - 24, ey], [R + 34, ey + 26]], 16); mouthOpen(ctx, cx, my + 10, 92, 88, { teeth: true }); break;
    case 'yell': E({ r: 26, ry: 30 }); brows(ctx, cx, ey, 'angry'); mouthOpen(ctx, cx, my + 6, 84, 74, { teeth: true }); break;
    case 'gasp': E({ r: 34, ry: 44 }); lash(); brows(ctx, cx, ey, 'up'); mouthOpen(ctx, cx, my + 10, 36, 44, { tongue: false }); break;
    case 'open': E(); lash(); mouthOpen(ctx, cx, my + 6, 56, 50); break;
    case 'sad': E(); lash(); brows(ctx, cx, ey, 'sad'); curve(ctx, cx - 64, my + 30, cx, my - 26, cx + 64, my + 30); break;
    case 'cry': E(); brows(ctx, cx, ey, 'sad'); curve(ctx, cx - 64, my + 30, cx, my - 26, cx + 64, my + 30); ctx.fillStyle = '#5ab4ff'; for (const x of [L, R]) { ctx.beginPath(); ctx.ellipse(x + 10, ey + 70, 12, 22, 0, 0, 7); ctx.fill(); } break;
    case 'angry': E({ r: 28, ry: 32 }); brows(ctx, cx, ey, 'angry'); line(ctx, [[cx - 60, my + 14], [cx - 20, my + 2], [cx + 20, my + 2], [cx + 60, my + 14]]); break;
    case 'determined': E({ r: 28, ry: 34 }); brows(ctx, cx, ey, 'angry'); line(ctx, [[cx - 50, my + 6], [cx + 50, my + 6]]); break;
    case 'sleep': curve(ctx, L - 32, ey, L, ey + 26, L + 32, ey, 14); curve(ctx, R - 32, ey, R, ey + 26, R + 32, ey, 14); mouthOpen(ctx, cx, my + 6, 22, 18, { tongue: false }); break;
    case 'halfsleep': line(ctx, [[L - 32, ey], [L + 32, ey]], 14); line(ctx, [[R - 32, ey], [R + 32, ey]], 14); ctx.fillStyle = INK; ctx.fillRect(L - 26, ey, 52, 18); ctx.fillRect(R - 26, ey, 52, 18); mouthOpen(ctx, cx + 10, my + 6, 26, 14, { tongue: false }); break;
    case 'whisper': E(); lash(); brows(ctx, cx, ey, 'up'); mouthOpen(ctx, cx, my + 4, 20, 22, { tongue: false }); break;
    case 'smug': line(ctx, [[L - 32, ey - 4], [L + 32, ey - 4]], 14); line(ctx, [[R - 32, ey - 4], [R + 32, ey - 4]], 14); ctx.fillStyle = INK; ctx.fillRect(L - 26, ey - 4, 52, 22); ctx.fillRect(R - 26, ey - 4, 52, 22); curve(ctx, cx - 50, my + 10, cx + 20, my + 30, cx + 70, my - 14); break;
    case 'worried': E({ r: 30, ry: 40 }); lash(); brows(ctx, cx, ey, 'sad'); line(ctx, [[cx - 60, my + 10], [cx - 30, my - 4], [cx, my + 10], [cx + 30, my - 4], [cx + 60, my + 10]], 12); break;
    case 'deadpan': line(ctx, [[L - 32, ey], [L + 32, ey]], 14); line(ctx, [[R - 32, ey], [R + 32, ey]], 14); ctx.fillStyle = INK; ctx.fillRect(L - 26, ey, 52, 20); ctx.fillRect(R - 26, ey, 52, 20); lash(); line(ctx, [[cx - 46, my + 8], [cx + 46, my + 8]]); break;
    case 'wink': eye(L, ey, ctx); curve(ctx, R - 32, ey + 4, R, ey - 22, R + 32, ey + 4, 15); lash(); curve(ctx, cx - 70, my - 10, cx + 10, my + 50, cx + 80, my - 20); break;
    case 'puff': line(ctx, [[L - 30, ey - 14], [L + 24, ey], [L - 30, ey + 14]], 15); line(ctx, [[R + 30, ey - 14], [R - 24, ey], [R + 30, ey + 14]], 15); ctx.fillStyle = 'rgba(255,90,100,.6)'; for (const x of [L - 46, R + 46]) { ctx.beginPath(); ctx.ellipse(x, ey + 78, 46, 34, 0, 0, 7); ctx.fill(); } line(ctx, [[cx - 22, my], [cx + 22, my]], 12); break;
    case 'pout': E(); brows(ctx, cx, ey, 'angry'); curve(ctx, cx - 40, my + 18, cx, my - 6, cx + 40, my + 18, 13); break;
    case 'dizzy': for (const x of [L, R]) { ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); for (let a = 0; a < 14; a += .2) { const r = a * 2.6; ctx.lineTo(x + Math.cos(a) * r, ey + Math.sin(a) * r); } ctx.stroke(); } line(ctx, [[cx - 60, my + 10], [cx - 30, my - 4], [cx, my + 10], [cx + 30, my - 4], [cx + 60, my + 10]], 12); break;
    case 'baby': E({ r: 26, ry: 30 }); curve(ctx, cx - 30, my - 6, cx, my + 22, cx + 30, my - 6, 12); break;
    default: E(); curve(ctx, cx - 70, my - 10, cx, my + 46, cx + 70, my - 10);
  }
  if (f.mustache) { ctx.fillStyle = f.mustache; ctx.beginPath(); ctx.moveTo(cx, my - 46); ctx.quadraticCurveTo(cx - 60, my - 70, cx - 104, my - 20); ctx.quadraticCurveTo(cx - 60, my - 38, cx, my - 26); ctx.quadraticCurveTo(cx + 60, my - 38, cx + 104, my - 20); ctx.quadraticCurveTo(cx + 60, my - 70, cx, my - 46); ctx.fill(); }
  if (f.glasses) { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 9; for (const x of [L, R]) { ctx.beginPath(); ctx.ellipse(x, ey, 54, 48, 0, 0, 7); ctx.stroke(); } line(ctx, [[L + 54, ey - 6], [R - 54, ey - 6]], 8); }
}

export function faceTexture(expr = 'smile', features = {}) {
  const key = expr + JSON.stringify(features);
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  draw(c.getContext('2d'), expr, features);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  cache.set(key, t);
  return t;
}
export const FACE_ARC = Math.PI * 150 / 180;
