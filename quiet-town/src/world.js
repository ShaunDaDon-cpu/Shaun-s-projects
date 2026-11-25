// World builders: blocky R6-style characters, the town under the mountain, the dam, and interior sets.
import * as THREE from 'three';
import { faceTexture, FACE_ARC } from './faces.js';

// ---------- deterministic random ----------
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), (s >>> 0) % 100000) / 100000); }

// ---------- materials ----------
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return matCache.get(key);
}
function canvasTex(w, h, paint, repeat = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; return t;
}
function star(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.fill(); }
const patterns = {
  stars: (base = '#26328a') => canvasTex(128, 128, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd84a'; star(x, 30, 30, 14); star(x, 94, 90, 14); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(96, 26, 5, 0, 7); x.arc(28, 98, 5, 0, 7); x.fill(); }),
  stripes: (base = '#f4f4f4', s = '#4d7fd6') => canvasTex(64, 64, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); x.fillStyle = s; x.fillRect(8, 0, 12, h); x.fillRect(40, 0, 12, h); }),
  plaid: (a = '#c8262c', b = '#1d1d1d') => canvasTex(64, 64, (x, w, h) => { x.fillStyle = a; x.fillRect(0, 0, w, h); x.fillStyle = b; x.globalAlpha = .55; x.fillRect(0, 22, w, 20); x.fillRect(22, 0, 20, h); x.globalAlpha = .9; x.fillRect(30, 0, 4, h); x.fillRect(0, 30, w, 4); }),
  floral: (base = '#f6a6c1') => canvasTex(128, 128, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (const [cx, cy, c] of [[30, 30, '#fff4f8'], [94, 50, '#ffe066'], [50, 100, '#fff4f8'], [110, 112, '#ff7aa2']]) { x.fillStyle = c; for (let i = 0; i < 5; i++) { const a = i * 1.2566; x.beginPath(); x.arc(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, 8, 0, 7); x.fill(); } x.fillStyle = '#e9a13b'; x.beginPath(); x.arc(cx, cy, 6, 0, 7); x.fill(); } }),
  dots: (base = '#7ad1c2', d = '#ffffff') => canvasTex(64, 64, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); x.fillStyle = d; for (const [a, b] of [[16, 16], [48, 48]]) { x.beginPath(); x.arc(a, b, 7, 0, 7); x.fill(); } }),
};
function frontTex(kind, color) {
  return canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    if (kind === 'suit') { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(44, 0); x.lineTo(64, 70); x.lineTo(84, 0); x.fill(); x.fillStyle = '#c1121f'; x.beginPath(); x.moveTo(58, 8); x.lineTo(70, 8); x.lineTo(68, 60); x.lineTo(64, 70); x.lineTo(60, 60); x.fill(); x.fillStyle = '#c99a2e'; x.fillRect(40, 90, 6, 6); x.fillRect(40, 108, 6, 6); }
    if (kind === 'hoodie') { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(30, 80, 68, 32); x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.moveTo(52, 0); x.lineTo(50, 40); x.moveTo(76, 0); x.lineTo(78, 40); x.stroke(); }
    if (kind === 'nurse') { x.fillStyle = '#e63946'; x.fillRect(56, 30, 16, 44); x.fillRect(42, 44, 44, 16); }
    if (kind === 'apron') { x.fillStyle = '#fff'; x.fillRect(30, 40, 68, 88); }
    if (kind === 'vest') { x.fillStyle = '#ff9f1c'; x.fillRect(0, 0, 36, h); x.fillRect(92, 0, 36, h); }
  });
}

// ---------- shared geometry ----------
const G = {
  limb: new THREE.BoxGeometry(1, 2, 1),
  torso: new THREE.BoxGeometry(2, 2, 1),
  head: new THREE.CylinderGeometry(.62, .62, 1.2, 28),
  face: new THREE.CylinderGeometry(.632, .632, 1.2, 28, 1, true, -FACE_ARC / 2, FACE_ARC),
  box: new THREE.BoxGeometry(1, 1, 1),
};
export function box(w, h, d, color, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(G.box, typeof color === 'object' ? color : mat(color));
  m.scale.set(w, h, d); m.position.set(x, y, z);
  m.castShadow = opts.cast ?? true; m.receiveShadow = opts.receive ?? true;
  return m;
}

// ---------- characters ----------
export class Char {
  constructor({ name, skin = '#f5c542', shirt = '#3a86ff', shirtPattern, shirtFront, pants = '#264653', pantsPattern, hair = 'messy', hairColor = '#5a3a1e', face = 'smile', features = {}, hat, scale = 1, earmuffs = false, sash = false }) {
    this.name = name; this.baseFace = face; this.features = features; this.scale = scale;
    const g = this.group = new THREE.Group(); g.name = name;
    this.body = new THREE.Group(); g.add(this.body);           // body bob / lean lives here
    const skinM = mat(skin);
    const shirtM = shirtPattern ? new THREE.MeshLambertMaterial({ map: patterns[shirtPattern[0]](...shirtPattern.slice(1)) }) : mat(shirt);
    const pantsM = pantsPattern ? new THREE.MeshLambertMaterial({ map: patterns[pantsPattern[0]](...pantsPattern.slice(1)) }) : mat(pants);
    const frontM = shirtFront ? new THREE.MeshLambertMaterial({ map: frontTex(shirtFront, shirt) }) : shirtM;
    this.shirtM = shirtM;
    const part = (geo, m, px, py, pz, ox, oy, oz) => { const p = new THREE.Group(); p.position.set(px, py, pz); const mesh = new THREE.Mesh(geo, m); mesh.position.set(ox, oy, oz); mesh.castShadow = true; mesh.receiveShadow = true; p.add(mesh); this.body.add(p); return p; };
    this.lLeg = part(G.limb, pantsM, -.5, 2, 0, 0, -1, 0);
    this.rLeg = part(G.limb, pantsM, .5, 2, 0, 0, -1, 0);
    this.torso = part(G.torso, [shirtM, shirtM, shirtM, shirtM, frontM, shirtM], 0, 3, 0, 0, 0, 0);
    this.lArm = part(G.limb, shirtM, -1.5, 3.75, 0, 0, -.75, 0);
    this.rArm = part(G.limb, shirtM, 1.5, 3.75, 0, 0, -.75, 0);
    // hands: skin cap at the end of each arm
    for (const a of [this.lArm, this.rArm]) { const h = new THREE.Mesh(G.box, skinM); h.scale.set(1.02, .5, 1.02); h.position.y = -1.55; a.add(h); a.hand = new THREE.Group(); a.hand.position.y = -1.8; a.add(a.hand); }
    if (sash) { const s = box(.25, 2.9, 1.08, '#c1121f', 0, 0, 0, { cast: false }); s.rotation.z = .78; this.torso.add(s); const b = box(.5, .5, .2, '#ffd166', .3, .2, .58); this.torso.add(b); }
    this.head = new THREE.Group(); this.head.position.set(0, 4, 0); this.body.add(this.head);
    const hm = new THREE.Mesh(G.head, skinM); hm.position.y = .6; hm.castShadow = true; this.head.add(hm);
    this.faceMat = new THREE.MeshLambertMaterial({ transparent: true, map: faceTexture(face, features), depthWrite: false });
    this.faceMesh = new THREE.Mesh(G.face, this.faceMat); this.faceMesh.position.y = .6; this.head.add(this.faceMesh);
    this.hairGroup = new THREE.Group(); this.head.add(this.hairGroup); this.buildHair(hair, mat(hairColor));
    if (hat === 'top') { this.hat = new THREE.Group(); this.hat.add(box(1.7, .12, 1.7, '#151515', 0, 0, 0), box(1.2, 1.3, 1.2, '#151515', 0, .7, 0), box(1.22, .25, 1.22, '#8d0801', 0, .25, 0)); this.hat.position.y = 1.25; this.head.add(this.hat); }
    if (hat === 'cap') { this.hat = new THREE.Group(); this.hat.add(box(1.35, .45, 1.35, '#e63946', 0, 0, 0), box(1.2, .1, .7, '#e63946', 0, -.18, .9)); this.hat.position.y = 1.3; this.head.add(this.hat); }
    if (hat === 'nurse') { this.hat = new THREE.Group(); this.hat.add(box(1.1, .45, .5, '#ffffff', 0, 0, .2), box(.3, .25, .05, '#e63946', 0, 0, .46)); this.hat.position.y = 1.3; this.head.add(this.hat); }
    if (earmuffs) { const band = box(1.5, .14, .3, '#ff70a6', 0, 1.32, 0); const l = box(.32, .7, .7, '#ff70a6', -.72, .62, 0), r = box(.32, .7, .7, '#ff70a6', .72, .62, 0); this.head.add(band, l, r); }
    g.scale.setScalar(scale);
    this.props = [];
    this.reset();
  }
  buildHair(kind, m) {
    const H = this.hairGroup, add = (...a) => { const b = box(...a); b.material = m; H.add(b); return b; };
    if (kind === 'messy') { add(1.36, .35, 1.36, 0, 0, 1.28, 0); for (const [x, z, h, r] of [[-.45, .45, .5, .3], [.1, .55, .6, -.2], [.5, .2, .45, .4], [-.3, -.3, .55, -.3], [.4, -.45, .5, .2]]) { const b = add(.45, h, .45, 0, x, 1.45, z); b.rotation.set(r, r, r * .5); } add(1.38, .7, .4, 0, 0, .95, -.55); add(.35, .55, .9, 0, -.62, .95, 0); add(.35, .55, .9, 0, .62, .95, 0); }
    if (kind === 'short') { add(1.36, .3, 1.36, 0, 0, 1.27, 0); add(1.38, .2, .3, 0, 0, 1.15, .58); add(1.38, .7, .35, 0, 0, .95, -.55); add(.3, .4, 1.0, 0, -.62, 1.0, -.1); add(.3, .4, 1.0, 0, .62, 1.0, -.1); }
    if (kind === 'long') { add(1.4, .35, 1.4, 0, 0, 1.28, 0); add(1.45, 1.9, .45, 0, 0, .45, -.55); add(.38, 1.5, 1.1, 0, -.66, .65, -.1); add(.38, 1.5, 1.1, 0, .66, .65, -.1); add(1.3, .28, .3, 0, 0, 1.12, .58); }
    if (kind === 'bun') { add(1.36, .3, 1.36, 0, 0, 1.25, 0); add(1.36, .6, .35, 0, 0, .95, -.55); const b = add(.75, .6, .75, 0, 0, 1.65, -.1); b.rotation.y = .78; }
    if (kind === 'pony') { add(1.36, .32, 1.36, 0, 0, 1.27, 0); add(1.38, .6, .35, 0, 0, .95, -.55); const p = add(.45, 1.1, .45, 0, 0, .7, -.85); p.rotation.x = .3; }
    if (kind === 'fringe') { add(1.38, .4, 1.38, 0, 0, 1.25, 0); add(1.4, .38, .3, 0, 0, 1.0, .58); add(1.38, .8, .35, 0, 0, .9, -.55); }
    if (kind === 'baby') { const b = add(.3, .35, .3, 0, 0, 1.38, .2); b.rotation.z = .4; }
  }
  reset() {
    this.group.visible = false; this.group.position.set(0, 0, 0); this.group.rotation.set(0, 0, 0); this.group.scale.setScalar(this.scale);
    this.body.position.set(0, 0, 0); this.body.rotation.set(0, 0, 0); this.torso.scale.set(1, 1, 1);
    for (const p of [this.lArm, this.rArm, this.lLeg, this.rLeg, this.head]) p.rotation.set(0, 0, 0);
    this.head.position.set(0, 4, 0); this.head.scale.set(1, 1, 1);
    if (this.hat) { this.hat.position.set(0, 1.25 + (this.hatLift || 0), 0); this.hat.rotation.set(0, 0, 0); this.hat.visible = true; if (this.hatParent) { this.head.add(this.hat); this.hatParent = null; } }
    for (const p of this.props) p.visible = false;
    this.face(this.baseFace);
  }
  at(x, y, z, ry = 0) { this.group.visible = true; this.group.position.set(x, y, z); this.group.rotation.y = ry; return this; }
  face(expr) { const t = faceTexture(expr, this.features); if (this.faceMat.map !== t) { this.faceMat.map = t; this.faceMat.needsUpdate = true; } return this; }
  // poses (angles in radians; arm x < 0 swings forward/up)
  walk(phase, amp = .7) { const s = Math.sin(phase) * amp; this.lLeg.rotation.x = s; this.rLeg.rotation.x = -s; this.lArm.rotation.x = -s; this.rArm.rotation.x = s; this.body.position.y = Math.abs(Math.cos(phase)) * .15; return this; }
  idle(t, k = 1) { this.body.position.y = Math.sin(t * 3.1 + this.group.position.x) * .04 * k; this.head.rotation.z = Math.sin(t * 1.7 + this.group.position.z) * .04 * k; this.lArm.rotation.z = -.05; this.rArm.rotation.z = .05; return this; }
  jazz(t) { this.lArm.rotation.z = -2.55 + Math.sin(t * 18) * .15; this.rArm.rotation.z = 2.55 + Math.sin(t * 18 + 1) * .15; this.lArm.rotation.y = Math.sin(t * 22) * .5; this.rArm.rotation.y = Math.sin(t * 22 + 2) * .5; this.body.position.y = Math.abs(Math.sin(t * 9)) * .25; return this; }
  cup(side = 'r') { const a = side === 'r' ? this.rArm : this.lArm, s = side === 'r' ? 1 : -1; a.rotation.x = -2.3; a.rotation.z = s * .55; return this; }
  shush() { this.rArm.rotation.x = -2.5; this.rArm.rotation.z = .62; return this; }
  point(side = 'r', up = 0) { const a = side === 'r' ? this.rArm : this.lArm; a.rotation.x = -1.6 - up; return this; }
  crossArms() { this.lArm.rotation.set(-1.25, 0, .85); this.rArm.rotation.set(-1.1, 0, -.85); return this; }
  armsUp(k = 1) { this.lArm.rotation.z = -2.8 * k; this.rArm.rotation.z = 2.8 * k; return this; }
  armsOut(k = 1) { this.lArm.rotation.z = -1.4 * k; this.rArm.rotation.z = 1.4 * k; return this; }
  forward(k = 1) { this.lArm.rotation.x = -1.4 * k; this.rArm.rotation.x = -1.4 * k; return this; }
  sit(h = 0) { this.lLeg.rotation.x = -1.57; this.rLeg.rotation.x = -1.57; this.body.position.y = -1 + h; return this; }
  lie() { this.group.rotation.x = -Math.PI / 2; return this; }
  shake(t, k = 1) { this.body.position.x = Math.sin(t * 70) * .08 * k; this.head.rotation.z = Math.sin(t * 55) * .06 * k; return this; }
  hold(obj, side = 'r') { (side === 'r' ? this.rArm : this.lArm).hand.add(obj); if (!this.props.includes(obj)) this.props.push(obj); obj.visible = true; return this; }
}

// ---------- props ----------
export function flagProp(color = '#e63946') { const g = new THREE.Group(); g.add(box(.15, 3.4, .15, '#5c4033', 0, 1.2, 0)); const f = box(1.6, 1.1, .06, color, .85, 2.3, 0); g.add(f); g.flag = f; return g; }
export function knitProp() { const g = new THREE.Group(); const n1 = box(.08, 1.4, .08, '#d9d9d9', -.2, .3, .3); n1.rotation.z = .6; const n2 = box(.08, 1.4, .08, '#d9d9d9', .2, .3, .3); n2.rotation.z = -.6; const y = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 10), mat('#e85d75')); y.position.set(0, -.1, .4); const scarf = box(.9, .5, .12, '#e85d75', 0, -.5, .3); g.add(n1, n2, y, scarf); return g; }
export function paperProp(text = '$500') {
  const t = canvasTex(256, 320, (x, w, h) => { x.fillStyle = '#fffdf2'; x.fillRect(0, 0, w, h); x.fillStyle = '#c1121f'; x.font = '700 40px Fredoka, sans-serif'; x.textAlign = 'center'; x.fillText('FINE', w / 2, 60); x.fillStyle = '#222'; x.font = '700 82px Fredoka, sans-serif'; x.fillText(text, w / 2, 170); x.font = '600 26px Fredoka, sans-serif'; x.fillText('for: SHOUTING', w / 2, 230); x.strokeStyle = '#c1121f'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20); });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.6), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); return m;
}
export function medalProp() { const g = new THREE.Group(); g.add(box(.18, .9, .05, '#3a86ff', -.25, .4, 0), box(.18, .9, .05, '#3a86ff', .25, .4, 0)); const c = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .1, 20), new THREE.MeshLambertMaterial({ color: '#ffc300', emissive: '#553300' })); c.rotation.x = Math.PI / 2; c.position.y = -.25; g.add(c); return g; }
export function pillow(color = '#ffffff') { return box(2.6, .7, 1.6, color); }
export function signTex(lines, bg = '#ffd166', fg = '#1b1b1f') {
  const t = canvasTex(512, 320, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineWidth = 16; x.strokeRect(14, 14, w - 28, h - 28); x.fillStyle = fg; x.textAlign = 'center'; x.font = '700 92px Fredoka, sans-serif'; lines.forEach((l, i) => x.fillText(l, w / 2, 140 + i * 100)); });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); return t;
}
function noShoutTex() {
  const t = canvasTex(512, 640, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1b1b1f'; x.lineWidth = 14; x.strokeRect(10, 10, w - 20, h - 20);
    // mouth shouting, crossed out
    x.fillStyle = '#f5c542'; x.beginPath(); x.arc(256, 220, 140, 0, 7); x.fill();
    x.fillStyle = '#1b1b1f'; x.beginPath(); x.ellipse(206, 180, 18, 24, 0, 0, 7); x.ellipse(306, 180, 18, 24, 0, 0, 7); x.fill();
    x.fillStyle = '#5a1020'; x.beginPath(); x.ellipse(256, 270, 50, 44, 0, 0, 7); x.fill();
    x.strokeStyle = '#e63946'; x.lineWidth = 30; x.beginPath(); x.arc(256, 220, 170, 0, 7); x.stroke(); x.beginPath(); x.moveTo(136, 100); x.lineTo(376, 340); x.stroke();
    x.fillStyle = '#e63946'; x.textAlign = 'center'; x.font = '700 76px Fredoka, sans-serif'; x.fillText('NO', 256, 500); x.fillText('SHOUTING', 256, 580);
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); return t;
}

// ---------- town ----------
const WALLS = ['#f4d35e', '#8ecae6', '#f28482', '#b8e0a6', '#fefae0', '#cdb4db', '#ffb703', '#90be6d'];
const ROOFS = ['#c8553d', '#3d5a80', '#6d597a', '#2a9d8f', '#bc4749'];
function prismRoof(w, h, d, color) {
  const shape = new THREE.Shape(); shape.moveTo(-w / 2 - .6, 0); shape.lineTo(0, h); shape.lineTo(w / 2 + .6, 0); shape.lineTo(-w / 2 - .6, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d + 1.2, bevelEnabled: false }); geo.translate(0, 0, -(d + 1.2) / 2);
  const m = new THREE.Mesh(geo, mat(color)); m.castShadow = true; m.receiveShadow = true; return m;
}
export function house({ w = 10, d = 9, h = 8, wall, roof, seed = 1 }) {
  const g = new THREE.Group(), r = rng(seed);
  wall ||= WALLS[Math.floor(r() * WALLS.length)]; roof ||= ROOFS[Math.floor(r() * ROOFS.length)];
  g.add(box(w, h, d, wall, 0, h / 2, 0));
  const rf = prismRoof(w, h * .55, d, roof); rf.position.y = h; g.add(rf);
  const chim = box(1.2, 3, 1.2, '#8d5b4c', w * .25, h + 2, -d * .2); g.add(chim);
  g.add(box(2, 3.6, .2, '#6b3e26', 0, 1.8, d / 2 + .05)); // door
  g.add(box(2.6, .3, 1.4, '#ddd', 0, .15, d / 2 + .7, { cast: false }));
  // windows (own material so each house can light up separately)
  const winM = new THREE.MeshLambertMaterial({ color: '#cfe8ff', emissive: '#000000' });
  g.windows = winM;
  for (const [x, y] of [[-w * .3, h * .3], [w * .3, h * .3], [-w * .3, h * .72], [w * .3, h * .72]]) {
    const fr = box(2.3, 2.3, .15, '#ffffff', x, y, d / 2 + .05, { cast: false }); g.add(fr);
    const pane = new THREE.Mesh(G.box, winM); pane.scale.set(1.8, 1.8, .2); pane.position.set(x, y, d / 2 + .08); g.add(pane);
    g.add(box(.15, 1.8, .25, '#ffffff', x, y, d / 2 + .12, { cast: false }));
  }
  return g;
}
function tree(x, z, s = 1, kind = 'round', seed = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
  g.add(box(1, 4, 1, '#7a4a26', 0, 2, 0));
  if (kind === 'pine') { for (let i = 0; i < 3; i++) { const b = box(5 - i * 1.4, 2.2, 5 - i * 1.4, '#1f7a3f', 0, 4.2 + i * 1.9, 0); b.rotation.y = i * .4; g.add(b); } }
  else { const r = rng(seed); g.add(box(4.6, 3.6, 4.6, '#2d9e48', 0, 5.4, 0)); g.add(box(3.4, 2, 3.4, '#3cb85a', r() - .5, 7.6, r() - .5)); }
  return g;
}
function fence(x, z, len, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
  g.add(box(len, .25, .15, '#ffffff', 0, 1.1, 0, { cast: false }), box(len, .25, .15, '#ffffff', 0, .55, 0, { cast: false }));
  for (let i = 0; i <= len; i += 1) g.add(box(.3, 1.6, .2, '#ffffff', -len / 2 + i, .8, 0, { cast: false }));
  return g;
}
function lamp(x, z, lampMats) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  g.add(box(.35, 7, .35, '#2b2d42', 0, 3.5, 0));
  const m = new THREE.MeshLambertMaterial({ color: '#fff3b0', emissive: '#000000' }); lampMats.push(m);
  const l = new THREE.Mesh(G.box, m); l.scale.set(1, 1.1, 1); l.position.y = 7.4; g.add(l); g.add(box(1.3, .3, 1.3, '#2b2d42', 0, 8.1, 0));
  return g;
}

export function buildTown(scene) {
  const T = { group: new THREE.Group(), houses: [], lampMats: [] };
  const g = T.group; scene.add(g);
  g.add(box(1400, 1, 1400, '#6cc04a', 0, -.5, 0, { cast: false }));
  g.add(box(10, .1, 140, '#7a7f87', 0, .05, -5, { cast: false }));           // main street
  g.add(box(80, .1, 10, '#7a7f87', 0, .06, -30, { cast: false }));           // cross street
  for (const x of [-7, 7]) g.add(box(3, .25, 120, '#d9d4c7', x, .12, 0, { cast: false }));
  for (let z = 60; z > -26; z -= 6) g.add(box(.3, .02, 2.4, '#ffd166', 0, .11, z, { cast: false }));
  // houses both sides of the main street
  let seed = 3;
  for (const side of [-1, 1]) for (const z of [34, 20, 6, -8]) {
    const hh = house({ seed: seed++, h: 7 + (seed % 3), wall: side === -1 && z === 6 ? '#8ecae6' : undefined, roof: side === -1 && z === 6 ? '#c8553d' : undefined });
    hh.position.set(side * 17, 0, z); hh.rotation.y = -side * Math.PI / 2; g.add(hh); T.houses.push(hh);
    g.add(fence(side * 10.2, z, 10, Math.PI / 2));
  }
  T.home = T.houses[2];                                   // kid's house: left side, z = 6
  // second row of houses behind, for a fuller town
  for (const side of [-1, 1]) for (const z of [28, 12, -4]) { const hh = house({ seed: seed++, h: 8 }); hh.position.set(side * 33, 0, z); hh.rotation.y = -side * Math.PI / 2; g.add(hh); T.houses.push(hh); }
  T.lampObjs = [];
  for (let z = 44; z > -24; z -= 14) for (const x of [-8.6, 8.6]) { const l = lamp(x, z, T.lampMats); l.userData.at = [x, z]; T.lampObjs.push(l); g.add(l); }
  // town square + church with bell tower
  g.add(box(50, .2, 36, '#d6ccc2', 0, .1, -52, { cast: false }));
  const church = new THREE.Group(); church.position.set(0, 0, -76); g.add(church); T.church = church;
  church.add(box(30, 13, 14, '#f1ede4', 0, 6.5, 0));                                   // hall, front face at world z = -69
  const croof = prismRoof(14, 8, 30, '#8d3b3b'); croof.rotation.y = Math.PI / 2; croof.position.y = 13; church.add(croof);
  // snow on the front and back roof slopes; the front slab slides off in shot 46
  T.roofSnowFront = box(31, .9, 11.4, '#f6fbff', 0, 17.31, 4.13); T.roofSnowFront.rotation.x = .811; church.add(T.roofSnowFront);
  const back = box(31, .9, 11.4, '#f6fbff', 0, 17.31, -4.13); back.rotation.x = -.811; church.add(back);
  church.add(box(4, 6, .3, '#6b3e26', 0, 3, 7.1));
  for (const x of [-11, -6, 6, 11]) church.add(box(2.4, 5, .3, '#7fb7e6', x, 7, 7.1, { cast: false }));
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .3, 20), mat('#f7b267')); rose.rotation.x = Math.PI / 2; rose.position.set(0, 10.2, 7.1); church.add(rose);
  // bell tower at the left end of the church; its top platform is where the kid shouts from
  const tw = new THREE.Group(); tw.position.set(-19, 0, 0); church.add(tw); T.tower = tw;
  tw.add(box(8, 24, 8, '#ece4d4', 0, 12, 0));
  for (const [x, z] of [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]]) tw.add(box(1, 6, 1, '#ece4d4', x, 27, z));
  tw.add(box(8.6, .8, 8.6, '#cfc4ae', 0, 24.2, 0)); tw.add(box(9, .8, 9, '#cfc4ae', 0, 30.4, 0));
  for (const [x, z, w, d] of [[0, -3.8, 8, .5], [3.8, 0, .5, 8], [-3.8, 0, .5, 8]]) tw.add(box(w, 1.6, d, '#ece4d4', x, 25.4, z));
  tw.add(box(2.5, 1.6, .5, '#ece4d4', -2.75, 25.4, 3.8), box(2.5, 1.6, .5, '#ece4d4', 2.75, 25.4, 3.8));   // front parapet with a gap
  const spire = new THREE.Mesh(new THREE.ConeGeometry(6.3, 9, 4), mat('#8d3b3b')); spire.rotation.y = Math.PI / 4; spire.position.y = 35.3; spire.castShadow = true; tw.add(spire);
  T.towerFlag = flagProp('#ffd166'); T.towerFlag.scale.setScalar(1.6); T.towerFlag.position.set(0, 38, 0); tw.add(T.towerFlag);
  // ladder up the tower front (world x = -21.5, z = -71.85)
  const lad = new THREE.Group(); lad.position.set(-2.5, 0, 4.15); tw.add(lad);
  lad.add(box(.25, 24.5, .25, '#6b4226', -1, 12.25, 0), box(.25, 24.5, .25, '#6b4226', 1, 12.25, 0));
  for (let y = 1; y < 24.5; y += 1.2) lad.add(box(2, .2, .2, '#6b4226', 0, y, 0, { cast: false }));
  T.ladder = lad;
  // stage + benches in the square (ceremony)
  T.stage = new THREE.Group(); T.stage.position.set(0, 0, -60); g.add(T.stage);
  T.stage.add(box(16, 1.2, 7, '#a0522d', 0, .6, 0));
  T.stage.add(box(2.4, 3, 1.6, '#6b3e26', 4, 2.7, 1.5));
  const bunting = new THREE.Group(); T.stage.add(bunting); for (let i = 0; i < 12; i++) bunting.add(box(1, 1, .1, ['#e63946', '#ffd166', '#3a86ff', '#06d6a0'][i % 4], -7.5 + i * 1.36, 8.5 - Math.sin(i / 11 * Math.PI) * 1.2, -2.8));
  bunting.add(box(.3, 9, .3, '#5c4033', -8, 4.5, -2.8), box(.3, 9, .3, '#5c4033', 8, 4.5, -2.8));
  T.benches = new THREE.Group(); g.add(T.benches);
  for (const z of [-50, -45, -40]) for (const x of [-8, 8]) T.benches.add(box(12, .9, 1.8, '#8d5b4c', x, .9, z));
  // school with yard and flagpole
  const school = new THREE.Group(); school.position.set(48, 0, -46); school.rotation.y = -Math.PI / 2; g.add(school); T.school = school;
  school.add(box(26, 11, 12, '#e76f51', 0, 5.5, 0));
  school.add(box(28, 1, 14, '#f4a261', 0, 11.5, 0));
  const ss = signTex(['SCHOOL'], '#fefae0', '#264653'); const sm = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.4), new THREE.MeshBasicMaterial({ map: ss })); sm.position.set(0, 9.3, 6.06); school.add(sm);
  school.add(box(4, 5, .2, '#264653', 0, 2.5, 6.05));
  for (const x of [-9, -5, 5, 9]) school.add(box(2.6, 2.6, .2, '#cfe8ff', x, 6.6, 6.05, { cast: false }));
  g.add(box(20, .15, 22, '#c9b79c', 32, .08, -46, { cast: false }));
  // town sign with the rule
  const sign = new THREE.Group(); sign.position.set(9, 0, 52); sign.rotation.y = -.146; g.add(sign); T.sign = sign;
  sign.add(box(.4, 5, .4, '#5c4033', -2, 2.5, 0), box(.4, 5, .4, '#5c4033', 2, 2.5, 0));
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(5, 6.25), new THREE.MeshLambertMaterial({ map: noShoutTex() })); sp.position.set(0, 6.6, .25); sign.add(sp); sign.add(box(5.3, 6.5, .4, '#5c4033', 0, 6.6, 0));
  // trees
  const r = rng(77);
  for (let i = 0; i < 40; i++) { const x = (r() < .5 ? -1 : 1) * (42 + r() * 40), z = 60 - r() * 160; if (Math.abs(x + 62) < 12) continue; g.add(tree(x, z, .9 + r() * .7, r() < .5 ? 'pine' : 'round', i)); }
  for (const [x, z] of [[-36, 38], [24, 44], [-24, -18], [24, -18], [-20, -64], [20, -64]]) g.add(tree(x, z, 1.1, 'round', x * z));
  T.pine = new THREE.Group(); T.pine.position.set(-26, 0, 49); g.add(T.pine); T.pine.add(box(1.4, 9, 1.4, '#7a4a26', 0, 4.5, 0)); for (let i = 0; i < 4; i++) { const b = box(9 - i * 2, 2.4, 9 - i * 2, '#1f7a3f', 0, 9 + i * 2.2, 0); b.rotation.y = i * .4; T.pine.add(b); }
  // river from the dam, valley walls and the dam
  g.add(box(14, 1.1, 600, '#3a86ff', -62, -.35, 200, { cast: false }));
  T.river = g.children.at(-1);
  for (const x of [-70, -54]) g.add(box(2, .6, 600, '#a98467', x, .1, 200, { cast: false }));
  const damG = new THREE.Group(); damG.position.set(-62, 0, -122); g.add(damG); T.dam = damG;
  damG.add(box(30, 22, 5, '#b5b2a8', 0, 11, 0));
  damG.add(box(31, 1.2, 6, '#8d8a80', 0, 22.6, 0));
  for (const x of [-10, 0, 10]) damG.add(box(.4, 22, .2, '#9a978d', x, 11, 2.55, { cast: false }));
  damG.add(box(60, 21, 120, '#3f7fd9', 0, 10.5, -64, { cast: false }));   // reservoir water
  for (const s of [-1, 1]) damG.add(box(60, 30, 120, '#5f9e3f', s * 45, 15, -40));
  // crack decal on the dam (grows in shots 17/22)
  T.crack = new THREE.Group(); T.crack.position.set(0, 0, 2.6); damG.add(T.crack);
  const cr = rng(11); let cx = 0, cy = 20; T.crackSegs = [];
  for (let i = 0; i < 14; i++) { const nx = cx + (cr() - .5) * 4, ny = cy - 1.4; const len = Math.hypot(nx - cx, ny - cy); const s = box(.45, len + .3, .1, '#2b2b2b', (cx + nx) / 2, (cy + ny) / 2, 0, { cast: false }); s.rotation.z = Math.atan2(nx - cx, cy - ny); T.crack.add(s); T.crackSegs.push(s); cx = nx; cy = ny; }
  T.crackEnd = { x: cx, y: cy };
  // snow plug that jams the crack (shot 33)
  T.plug = new THREE.Group(); T.plug.position.set(0, 0, 4); damG.add(T.plug);
  const pr = rng(5), plugM = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#5a6680' }); for (let i = 0; i < 26; i++) { const b = box(3 + pr() * 4, 3 + pr() * 4, 3 + pr() * 3, plugM, (pr() - .5) * 12, 2 + pr() * 18, pr() * 3); T.plug.add(b); }
  // mountain: low-poly peaks with snow caps (flat shaded, slightly craggy)
  T.mountain = new THREE.Group(); g.add(T.mountain); T.mountain.position.set(0, 0, -300);
  const peak = (x, z, R, H, seed, snowFrom = .42) => {
    const pr = rng(seed);
    const geo = new THREE.ConeGeometry(R, H, 9, 5); const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > H / 2 - 1) continue; const k = .1 * (1 - (y + H / 2) / H * .5); pos.setX(i, pos.getX(i) * (1 + (pr() - .5) * k * 2)); pos.setZ(i, pos.getZ(i) * (1 + (pr() - .5) * k * 2)); pos.setY(i, y + (pr() - .5) * H * .03); }
    geo.computeVertexNormals();
    const rock = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#5f6b84', flatShading: true })); rock.position.set(x, H / 2, z); T.mountain.add(rock);
    const capH = H * (1 - snowFrom), cap = new THREE.Mesh(new THREE.ConeGeometry(R * (1 - snowFrom) * 1.06, capH * 1.02, 9, 2), new THREE.MeshLambertMaterial({ color: '#f4f8ff', flatShading: true }));
    cap.position.set(x, H - capH / 2 + .5, z); cap.rotation.y = pr() * .3; T.mountain.add(cap);
    // snow streaks running down the flanks
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + pr(), y0 = H * (snowFrom - .12 - pr() * .1), r = R * (1 - y0 / H); const st = new THREE.Mesh(G.box, mat('#e9f0ff')); st.scale.set(R * .08, H * .16, 2); st.position.set(x + Math.sin(a) * r * .97, y0 + H * .06, z + Math.cos(a) * r * .97); st.rotation.y = a; T.mountain.add(st); }
  };
  peak(0, 0, 160, 230, 1); peak(-170, 40, 120, 160, 2); peak(180, 30, 130, 175, 3); peak(-320, 90, 110, 120, 4, .5); peak(330, 80, 120, 130, 5, .5);
  // the overhanging wall of snow (cornice) on the front face, right above town
  T.cornice = new THREE.Group(); T.cornice.position.set(-20, 130, 69); T.mountain.add(T.cornice);
  for (let i = 0; i < 9; i++) { const c = box(14, 9 + (i % 3) * 2, 16, '#ffffff', -56 + i * 14, Math.sin(i * 1.7) * 2.5, 4 + Math.cos(i * 2) * 2, { cast: false }); c.rotation.x = -.25; T.cornice.add(c); }
  return T;
}

// ---------- interior rooms ----------
export function room(scene, { x = 400, z = 0, w = 22, d = 18, h = 12, wall = '#ffd6a5', floor = '#c08552', windowAt = 0, trim = '#ffffff' }) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  g.add(box(w, .5, d, floor, 0, -.25, 0, { cast: false }));
  g.add(box(w, h, .5, wall, 0, h / 2, -d / 2, { cast: false }));
  g.add(box(.5, h, d, wall, -w / 2, h / 2, 0, { cast: false }));
  g.add(box(.5, h, d, wall, w / 2, h / 2, 0, { cast: false }));
  g.add(box(w, .6, .6, trim, 0, .3, -d / 2 + .3, { cast: false }));
  if (windowAt !== null) {
    const winM = new THREE.MeshBasicMaterial({ color: '#9fd3ff' }); g.windowMat = winM;
    const wf = box(6.4, 5.4, .3, trim, windowAt, 7, -d / 2 + .2, { cast: false }); g.add(wf);
    const pane = new THREE.Mesh(G.box, winM); pane.scale.set(5.6, 4.6, .3); pane.position.set(windowAt, 7, -d / 2 + .3); g.add(pane);
    g.add(box(.25, 4.6, .4, trim, windowAt, 7, -d / 2 + .35, { cast: false }), box(5.6, .25, .4, trim, windowAt, 7, -d / 2 + .35, { cast: false }));
  }
  return g;
}
export function bed(color = '#4d96ff', w = 5, l = 8) {
  const g = new THREE.Group();
  g.add(box(w + .6, 3, .6, '#8d5b4c', 0, 1.5, -l / 2));
  g.add(box(w, 1.4, l, '#8d5b4c', 0, .7, 0));
  g.add(box(w - .2, .8, l - .4, '#ffffff', 0, 1.8, 0));
  const blanket = box(w + .1, .5, l * .62, color, 0, 2.3, l * .17); g.add(blanket); g.blanket = blanket;
  return g;
}
export function crib(color = '#ffffff') {
  const g = new THREE.Group();
  g.add(box(4, .4, 6, color, 0, 2, 0), box(3.8, .4, 5.8, '#ffe5ec', 0, 2.3, 0));
  for (let i = -2; i <= 2; i += .5) { g.add(box(.15, 2.4, .15, color, i, 3.2, 3), box(.15, 2.4, .15, color, i, 3.2, -3)); }
  for (const z of [-3, 3]) g.add(box(4.2, .3, .3, color, 0, 4.4, z));
  for (const [x, z] of [[-2, -3], [2, -3], [-2, 3], [2, 3]]) g.add(box(.35, 4.6, .35, color, x, 2.3, z));
  return g;
}
export function rockingChair() {
  const g = new THREE.Group(); g.add(box(3, .4, 3, '#8d5b4c', 0, 2, 0), box(3, 4, .4, '#8d5b4c', 0, 4, -1.4));
  for (const x of [-1.4, 1.4]) { const rk = box(.3, .3, 4.2, '#6b3e26', x, .3, 0); g.add(rk); g.add(box(.3, 1.8, .3, '#6b3e26', x, 1.1, 1.2), box(.3, 1.8, .3, '#6b3e26', x, 1.1, -1.2)); }
  return g;
}
