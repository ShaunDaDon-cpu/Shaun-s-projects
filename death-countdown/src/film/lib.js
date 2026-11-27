// Asset library: R6-style rigs with drawn faces, props, sets.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const easeOutBack = (t) => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const lerpV = (a, b, t) => new THREE.Vector3(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
// deterministic pseudo-random
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
export const noise1 = (t, s = 0) => Math.sin(t * 13.1 + s) * 0.5 + Math.sin(t * 27.7 + s * 2.3) * 0.3 + Math.sin(t * 7.3 + s * 4.1) * 0.2;

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return matCache.get(key);
}
export const basic = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });
const geoCache = new Map();
export function boxG(w, h, d, r = 0) {
  const key = [w, h, d, r].join(',');
  if (!geoCache.has(key)) geoCache.set(key, r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d));
  return geoCache.get(key);
}
export function box(w, h, d, color, x = 0, y = 0, z = 0, r = 0, m) {
  const mesh = new THREE.Mesh(boxG(w, h, d, r), m || mat(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
export function cyl(rt, rb, h, color, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
  m.castShadow = true; m.receiveShadow = true; return m;
}

// ---------------- Faces ----------------
const EXPR = {
  neutral: ['dot', 'none', 'small'], smile: ['dot', 'none', 'smile'], grin: ['happy', 'none', 'grin'],
  laugh: ['happy', 'up', 'laugh'], smug: ['half', 'raise', 'smirk'], worried: ['dot', 'up', 'wavy'],
  scared: ['wide', 'up', 'o'], shock: ['wide', 'up', 'O'], sad: ['dot', 'up', 'frown'], cry: ['dot', 'up', 'frown', 'tears'],
  angry: ['dot', 'down', 'teeth'], determined: ['dot', 'down', 'flat'], sleep: ['sleep', 'none', 'flat'],
  unimpressed: ['half', 'none', 'flat'], kind: ['happy', 'up', 'smile'], peek: ['peek', 'none', 'flat'],
  yell: ['dot', 'down', 'O'], softsad: ['dot', 'up', 'smile', 'tears'],
};

export function drawFace(ctx, expr, { talk = 0, blink = false, skin = '#f5c99b' } = {}) {
  const W = 256; ctx.clearRect(0, 0, W, W);
  let [eyes, brows, mouth, extra] = EXPR[expr] || EXPR.neutral;
  if (blink && ['dot', 'wide', 'half'].includes(eyes)) eyes = 'blink';
  const ink = '#1b1b1f';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const E = [[86, 112], [170, 112]];
  E.forEach(([x, y], i) => {
    const s = i ? 1 : -1;
    ctx.fillStyle = ink; ctx.strokeStyle = ink;
    if (eyes === 'dot' || eyes === 'peek' && i === 1) {
      ctx.beginPath(); ctx.ellipse(x, y, 15, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 5, y - 8, 5.5, 0, Math.PI * 2); ctx.fill();
    } else if (eyes === 'wide') {
      ctx.fillStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x, y, 28, 33, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y + 2, 9, 0, Math.PI * 2); ctx.fill();
    } else if (eyes === 'half') {
      ctx.beginPath(); ctx.ellipse(x, y + 6, 15, 14, 0, 0, Math.PI); ctx.fill();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - 20, y + 4); ctx.lineTo(x + 20, y + 4); ctx.stroke();
    } else if (eyes === 'happy') {
      ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(x, y + 10, 16, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else if (eyes === 'sleep' || eyes === 'peek' || eyes === 'blink') {
      ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y - 4, 16, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    }
    ctx.lineWidth = 10; ctx.strokeStyle = ink;
    if (brows === 'up') { ctx.beginPath(); ctx.moveTo(x - s * 22, y - 38); ctx.lineTo(x + s * 18, y - 52); ctx.stroke(); }
    if (brows === 'down') { ctx.beginPath(); ctx.moveTo(x - s * 22, y - 52); ctx.lineTo(x + s * 18, y - 34); ctx.stroke(); }
    if (brows === 'raise') { ctx.beginPath(); ctx.moveTo(x - 20, y - (i ? 56 : 40)); ctx.lineTo(x + 20, y - (i ? 50 : 40)); ctx.stroke(); }
  });
  ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = 9;
  const mx = 128, my = 182;
  if (talk > 0.05 && mouth !== 'laugh') mouth = 'talk';
  switch (mouth) {
    case 'small': ctx.beginPath(); ctx.arc(mx, my - 14, 20, Math.PI * 0.25, Math.PI * 0.75); ctx.stroke(); break;
    case 'smile': ctx.beginPath(); ctx.arc(mx, my - 26, 36, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); break;
    case 'flat': ctx.beginPath(); ctx.moveTo(mx - 24, my); ctx.lineTo(mx + 24, my); ctx.stroke(); break;
    case 'frown': ctx.beginPath(); ctx.arc(mx, my + 26, 30, Math.PI * 1.22, Math.PI * 1.78); ctx.stroke(); break;
    case 'wavy': ctx.beginPath(); ctx.moveTo(mx - 30, my); for (let k = 0; k <= 6; k++) ctx.lineTo(mx - 30 + k * 10, my + (k % 2 ? -7 : 7)); ctx.stroke(); break;
    case 'smirk': ctx.beginPath(); ctx.moveTo(mx - 28, my + 2); ctx.quadraticCurveTo(mx + 6, my + 12, mx + 32, my - 14); ctx.stroke(); break;
    case 'o': ctx.beginPath(); ctx.ellipse(mx, my, 12, 15, 0, 0, Math.PI * 2); ctx.fill(); break;
    case 'O': ctx.beginPath(); ctx.ellipse(mx, my + 4, 24, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8566c'; ctx.beginPath(); ctx.ellipse(mx, my + 22, 14, 8, 0, 0, Math.PI * 2); ctx.fill(); break;
    case 'grin': case 'laugh': {
      const h = mouth === 'laugh' ? 46 : 30;
      ctx.beginPath(); ctx.moveTo(mx - 42, my - 14); ctx.lineTo(mx + 42, my - 14); ctx.quadraticCurveTo(mx + 40, my - 14 + h * 1.6, mx, my - 14 + h * 1.15); ctx.quadraticCurveTo(mx - 40, my - 14 + h * 1.6, mx - 42, my - 14); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(mx - 36, my - 12, 72, 11);
      if (mouth === 'laugh') { ctx.fillStyle = '#e8566c'; ctx.beginPath(); ctx.ellipse(mx, my + 26, 18, 9, 0, 0, Math.PI * 2); ctx.fill(); }
      break; }
    case 'teeth': ctx.fillStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(mx - 34, my - 12, 68, 26, 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx - 34, my + 1); ctx.lineTo(mx + 34, my + 1); for (let k = -2; k <= 2; k++) { ctx.moveTo(mx + k * 13, my - 12); ctx.lineTo(mx + k * 13, my + 14); } ctx.lineWidth = 4; ctx.stroke(); break;
    case 'talk': { const o = 6 + talk * 26; ctx.beginPath(); ctx.ellipse(mx, my, 24 - talk * 4, o, 0, 0, Math.PI * 2); ctx.fill();
      if (o > 14) { ctx.fillStyle = '#e8566c'; ctx.beginPath(); ctx.ellipse(mx, my + o * 0.55, 12, o * 0.3, 0, 0, Math.PI * 2); ctx.fill(); } break; }
  }
  if (extra === 'tears') {
    ctx.fillStyle = '#5ec8ff';
    [[72, 148], [184, 148]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.quadraticCurveTo(x + 11, y + 6, x, y + 10); ctx.quadraticCurveTo(x - 11, y + 6, x, y - 14); ctx.fill(); });
  }
  if (['laugh', 'grin', 'kind', 'cry', 'softsad'].includes(expr)) {
    ctx.fillStyle = 'rgba(255,110,130,0.35)'; ctx.beginPath(); ctx.ellipse(56, 150, 20, 11, 0, 0, Math.PI * 2); ctx.ellipse(200, 150, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------- Rig ----------------
export class Rig {
  constructor(o = {}) {
    this.o = Object.assign({ skin: '#f5c99b', shirt: '#3a7bd5', pants: '#2b2f45', hair: 'short', hairColor: '#4a2f1d', scale: 1, name: '' }, o);
    const { skin, shirt, pants } = this.o;
    this.root = new THREE.Group();
    this.hips = new THREE.Group(); this.hips.position.y = 2; this.root.add(this.hips);
    const legMat = mat(pants);
    this.legL = new THREE.Group(); this.legL.position.set(-0.5, 0, 0); this.legL.add(box(0.98, 2, 1, null, 0, -1, 0, 0.06, legMat));
    this.legR = new THREE.Group(); this.legR.position.set(0.5, 0, 0); this.legR.add(box(0.98, 2, 1, null, 0, -1, 0, 0.06, legMat));
    this.hips.add(this.legL, this.legR);
    this.upper = new THREE.Group(); this.hips.add(this.upper);
    this.torso = box(2, 2, 1, shirt, 0, 1, 0, 0.08); this.upper.add(this.torso);
    if (o.tie) this.upper.add(box(0.35, 1.5, 0.08, o.tie, 0, 1.15, 0.52));
    if (o.collar) this.upper.add(box(0.9, 0.5, 0.06, o.collar, 0, 1.7, 0.51));
    if (o.chain) { const c = box(1.2, 0.18, 0.08, '#ffd23a', 0, 1.5, 0.52); this.upper.add(c); }
    if (o.apron) this.upper.add(box(1.6, 1.8, 0.06, o.apron, 0, 0.95, 0.52));
    const armMat = mat(o.sleeves ? shirt : skin);
    this.armL = new THREE.Group(); this.armL.position.set(-1.5, 1.8, 0);
    this.armR = new THREE.Group(); this.armR.position.set(1.5, 1.8, 0);
    [this.armL, this.armR].forEach((a) => {
      a.add(box(0.98, 2, 1, null, 0, -0.8, 0, 0.08, armMat));
      if (o.sleeves) a.add(box(1.0, 0.45, 1.02, skin, 0, -1.6, 0, 0.06));
      const hand = new THREE.Object3D(); hand.position.set(0, -1.75, 0); a.add(hand); a.hand = hand;
    });
    this.upper.add(this.armL, this.armR);
    this.headG = new THREE.Group(); this.headG.position.set(0, 2, 0); this.upper.add(this.headG);
    const hs = o.headSize || 1.35;
    this.head = box(hs, o.headH || hs, hs, o.collector ? '#111216' : skin, 0, (o.headH || hs) / 2 + 0.05, 0, 0.2);
    this.headG.add(this.head);
    this.canvas = document.createElement('canvas'); this.canvas.width = this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    const faceW = o.collector ? hs * 0.86 : hs * 0.92, faceH = o.collector ? (o.headH || hs) * 0.8 : hs * 0.92;
    if (o.collector) { this.canvas.height = 320; this.ctx = this.canvas.getContext('2d'); }
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(faceW, faceH), new THREE.MeshBasicMaterial({ map: this.tex, transparent: !o.collector, toneMapped: false }));
    this.face.position.set(0, (o.headH || hs) / 2 + 0.05, hs / 2 + 0.012); this.headG.add(this.face);
    this.addHair(o.hair, o.hairColor, hs);
    if (o.glasses) { const g = new THREE.Group(); const lens = new THREE.MeshBasicMaterial({ color: '#dff1ff', transparent: true, opacity: 0.35 }); [-0.3, 0.3].forEach((x) => { g.add(box(0.44, 0.06, 0.05, '#222', x, 0.16, 0), box(0.44, 0.06, 0.05, '#222', x, -0.16, 0), box(0.06, 0.36, 0.05, '#222', x - 0.2, 0, 0), box(0.06, 0.36, 0.05, '#222', x + 0.2, 0, 0)); const l = new THREE.Mesh(boxG(0.36, 0.28, 0.02), lens); l.position.x = x; g.add(l); }); g.add(box(0.2, 0.05, 0.05, '#222', 0, 0.08, 0)); g.position.set(0, hs * 0.62, hs / 2 + 0.05); this.headG.add(g); }
    if (o.shades) { // sunglasses pushed up on the forehead so the face stays readable
      const g = new THREE.Group(); const lens = mat('#141414'); const shine = new THREE.MeshBasicMaterial({ color: '#7fd8ff' });
      [-0.3, 0.3].forEach((x) => { const l = box(0.5, 0.3, 0.06, null, x, 0, 0, 0.08, lens); g.add(l); const sh = new THREE.Mesh(boxG(0.12, 0.06, 0.01), shine); sh.position.set(x + 0.12, 0.07, 0.035); g.add(sh); });
      g.add(box(0.14, 0.06, 0.06, '#141414', 0, 0.06, 0)); g.position.set(0, hs + 0.02, hs / 2 + 0.06); g.rotation.x = -0.35; this.headG.add(g); }
    this.root.scale.setScalar(this.o.scale);
    this.faceKey = ''; this.expr = 'neutral'; this.talk = 0; this.blinkSeed = Math.random() * 10;
    this.reset();
  }
  addHair(type, c, hs) {
    const h = new THREE.Group(); const top = hs + 0.05;
    if (type === 'short' || type === 'spiky') { h.add(box(hs + 0.08, 0.35, hs + 0.08, c, 0, top, -0.02, 0.1)); h.add(box(hs + 0.08, 0.5, 0.3, c, 0, top - 0.3, -hs / 2 + 0.1, 0.08)); if (type === 'spiky') { for (let i = -1; i <= 1; i++) { const s = box(0.3, 0.45, 0.3, c, i * 0.42, top + 0.3, 0.1, 0.05); s.rotation.z = i * 0.3; h.add(s); } } }
    if (type === 'long') { h.add(box(hs + 0.1, 0.35, hs + 0.1, c, 0, top, 0, 0.1)); h.add(box(hs + 0.16, hs * 1.3, 0.35, c, 0, top - hs * 0.6, -hs / 2 - 0.05, 0.1)); h.add(box(0.2, hs * 0.9, hs * 0.8, c, -hs / 2 - 0.06, top - 0.5, -0.1, 0.06)); h.add(box(0.2, hs * 0.9, hs * 0.8, c, hs / 2 + 0.06, top - 0.5, -0.1, 0.06)); }
    if (type === 'pony') { h.add(box(hs + 0.08, 0.35, hs + 0.08, c, 0, top, -0.02, 0.1)); const p = box(0.4, 1.2, 0.4, c, 0, top - 0.5, -hs / 2 - 0.25, 0.15); h.add(p); }
    if (type === 'bun') { h.add(box(hs + 0.08, 0.3, hs + 0.08, c, 0, top, -0.02, 0.1)); h.add(box(0.7, 0.6, 0.7, c, 0, top + 0.35, -0.15, 0.28)); }
    if (type === 'bald') { h.add(box(0.2, 0.5, hs * 0.7, c, -hs / 2 - 0.04, top - 0.55, -0.1, 0.05)); h.add(box(0.2, 0.5, hs * 0.7, c, hs / 2 + 0.04, top - 0.55, -0.1, 0.05)); }
    if (type === 'cap') { h.add(box(hs + 0.1, 0.4, hs + 0.1, c, 0, top, 0, 0.12)); h.add(box(hs * 0.9, 0.1, 0.7, c, 0, top - 0.1, hs / 2 + 0.3, 0.04)); }
    if (type === 'hairnet') { h.add(box(hs + 0.1, 0.4, hs + 0.1, '#e8e8f0', 0, top, 0, 0.18)); }
    if (type === 'fedora') { h.add(box(hs + 0.6, 0.08, hs + 0.6, c, 0, top + 0.02, 0, 0.03)); h.add(box(hs * 0.85, 0.55, hs * 0.85, c, 0, top + 0.3, 0, 0.08)); }
    this.headG.add(h);
  }
  reset() {
    this.root.visible = false; this.root.rotation.set(0, 0, 0); this.root.position.set(0, 0, 0);
    this.hips.position.set(0, 2, 0); this.hips.rotation.set(0, 0, 0); this.upper.rotation.set(0, 0, 0);
    [this.armL, this.armR, this.legL, this.legR, this.headG].forEach((g) => g.rotation.set(0, 0, 0)); this.headG.position.set(0, 2, 0);
    this.expr = 'neutral'; this.talk = 0; this.noBlink = false; this.headG.visible = this.armR.visible = this.armL.visible = true;
  }
  place(x, y, z, ry = 0) { this.root.visible = true; this.root.position.set(x, y, z); this.root.rotation.y = ry; return this; }
  walk(phase, amt = 0.7) {
    const s = Math.sin(phase); this.legL.rotation.x = s * amt; this.legR.rotation.x = -s * amt;
    this.armL.rotation.x = -s * amt * 0.8; this.armR.rotation.x = s * amt * 0.8; this.hips.position.y = 2 + Math.abs(Math.cos(phase)) * 0.12;
  }
  idle(t) { this.upper.rotation.x = Math.sin(t * 1.7 + this.blinkSeed) * 0.02; this.headG.rotation.y += Math.sin(t * 0.9 + this.blinkSeed) * 0.04; }
  sit() { this.hips.position.y = 1.4; this.legL.rotation.x = this.legR.rotation.x = -Math.PI / 2; }
  updateFace(time) {
    if (this.o.collector) return;
    const blink = !this.noBlink && ((time + this.blinkSeed) % 3.4) < 0.11;
    const talk = Math.round(this.talk * 3) / 3;
    const key = this.expr + '|' + talk + '|' + blink;
    if (key === this.faceKey) return;
    this.faceKey = key; drawFace(this.ctx, this.expr, { talk, blink }); this.tex.needsUpdate = true;
  }
  handWorld(side = 'R') { const v = new THREE.Vector3(); this.root.updateMatrixWorld(true); (side === 'R' ? this.armR : this.armL).hand.getWorldPosition(v); return v; }
  headWorld() { const v = new THREE.Vector3(); this.root.updateMatrixWorld(true); this.face.getWorldPosition(v); return v; }
}

// ---------------- Screens (phones, collectors) ----------------
export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const y = Math.floor(sec / 31536000); let r = sec - y * 31536000; const d = Math.floor(r / 86400); r -= d * 86400;
  const h = Math.floor(r / 3600); r -= h * 3600; const m = Math.floor(r / 60); const s = r - m * 60;
  const p = (n) => String(n).padStart(2, '0');
  return { main: `${y}y ${d}d`, sub: `${p(h)}:${p(m)}:${p(s)}` };
}
export const YEAR = 31536000;

export class Phone {
  constructor(case_ = '#2a2d3a', W = 300, H = 540) {
    this.canvas = document.createElement('canvas'); this.canvas.width = W; this.canvas.height = H; this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.g = new THREE.Group();
    const body = box(0.62, 1.12, 0.1, case_, 0, 0, 0, 0.04); this.g.add(body);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.02), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false }));
    scr.position.z = 0.053; this.g.add(scr);
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), new THREE.MeshBasicMaterial({ color: '#7fe8ff', transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glow.position.z = 0.06; this.g.add(this.glow);
    this.key = '';
  }
  draw(s) {
    const key = JSON.stringify(s); if (key === this.key) return; this.key = key;
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    const col = s.color || '#4dff9a';
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, s.bg || '#101a33'); g.addColorStop(1, s.bg2 || '#05070f');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (s.flash) { c.fillStyle = 'rgba(255,30,50,0.28)'; c.fillRect(0, 0, W, H); }
    c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.55)'; c.font = `600 ${W * 0.075}px Fredoka`; c.fillText(s.top || 'TIME LEFT', W / 2, H * 0.2);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(W * 0.38, H * 0.03, W * 0.24, H * 0.012);
    c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = col;
    let fs = W * 0.2; c.font = `700 ${fs}px Fredoka`;
    while (c.measureText(s.main).width > W * 0.88) { fs *= 0.92; c.font = `700 ${fs}px Fredoka`; }
    c.fillText(s.main, W / 2, H * 0.46);
    if (s.sub) { c.font = `600 ${W * 0.135}px Fredoka`; c.fillText(s.sub, W / 2, H * 0.62); }
    c.shadowBlur = 0;
    if (s.label) { c.fillStyle = s.labelColor || '#ff4057'; c.font = `700 ${W * 0.09}px Fredoka`; c.fillText(s.label, W / 2, H * 0.8); }
    if (s.bar != null) { c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(W * 0.15, H * 0.86, W * 0.7, H * 0.025); c.fillStyle = col; c.fillRect(W * 0.15, H * 0.86, W * 0.7 * s.bar, H * 0.025); }
    this.tex.needsUpdate = true;
  }
  countdown(sec, extra = {}) { const f = fmtTime(sec); this.draw({ main: f.main, sub: f.sub, ...extra }); }
}

export function drawCollector(ctx, mode, t, heroFace) {
  const W = 256, H = 320; const c = ctx;
  c.fillStyle = '#05060a'; c.fillRect(0, 0, W, H);
  if (mode === 'static') {
    const r = rng(Math.floor(t * 30) + 7);
    for (let i = 0; i < 900; i++) { const v = Math.floor(r() * 200); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(r() * W, r() * H, 6, 3); }
    c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < H; y += 6) c.fillRect(0, y, W, 2);
    return;
  }
  if (mode === 'face' || mode === 'crack') {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a0710'); g.addColorStop(1, '#12020a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.translate(48, 26); c.fillStyle = '#f5c99b'; c.beginPath(); c.roundRect(0, 0, 160, 160, 26); c.fill();
    c.fillStyle = '#4a2f1d'; c.beginPath(); c.roundRect(-4, -4, 168, 40, 18); c.fill();
    c.scale(160 / 256, 160 / 256); heroFace && c.drawImage(heroFace, 0, 0); c.restore();
    c.fillStyle = '#ff2240'; c.fillRect(0, 214, W, 64);
    c.fillStyle = '#fff'; c.font = '700 46px Fredoka'; c.textAlign = 'center'; c.fillText('OVERDUE', W / 2, 262);
    c.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = 0; y < H; y += 5) c.fillRect(0, y, W, 2);
    if (mode === 'crack') {
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3;
      const cx = 150, cy = 120; const r = rng(42);
      for (let k = 0; k < 11; k++) { const a = k / 11 * Math.PI * 2 + r() * 0.4; let x = cx, y = cy; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += Math.cos(a + (r() - 0.5) * 0.8) * (25 + r() * 30); y += Math.sin(a + (r() - 0.5) * 0.8) * (25 + r() * 30); c.lineTo(x, y); } c.stroke(); }
      c.beginPath(); c.arc(cx, cy, 18, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(cx, cy, 40, 0, Math.PI * 2); c.stroke();
      const r2 = rng(Math.floor(t * 24)); c.fillStyle = 'rgba(0,255,200,0.4)'; c.fillRect(0, r2() * H, W, 8); c.fillStyle = 'rgba(255,0,120,0.4)'; c.fillRect(0, r2() * H, W, 5);
    }
    return;
  }
  if (mode === 'settled') {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#063a1c'); g.addColorStop(1, '#021208'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#4dff9a'; c.lineWidth = 18; c.shadowColor = '#4dff9a'; c.shadowBlur = 20;
    c.beginPath(); c.moveTo(70, 120); c.lineTo(112, 162); c.lineTo(190, 78); c.stroke(); c.shadowBlur = 0;
    c.fillStyle = '#4dff9a'; c.font = '700 34px Fredoka'; c.textAlign = 'center'; c.fillText('ACCOUNT', W / 2, 230); c.fillText('SETTLED', W / 2, 270);
    c.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = 0; y < H; y += 5) c.fillRect(0, y, W, 2);
  }
}

// ---------------- Sky gradient ----------------
export function gradientTex(stops) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512); stops.forEach(([p, col]) => g.addColorStop(p, col)); x.fillStyle = g; x.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function textTex(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
