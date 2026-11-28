// Film engine: deterministic renderAt(t) for frame-by-frame capture.
import * as THREE from 'three';
import * as L from './lib.js';
import { buildWorld, SET, glowTex } from './sets.js';
import { makeShots } from './shots.js';

const W_ = 1080, H_ = 1920;
const params = new URLSearchParams(location.search);
const SCALE = parseFloat(params.get('scale') || '1');

await document.fonts.load('700 40px Fredoka'); await document.fonts.load('600 40px Fredoka'); await document.fonts.load('40px "Luckiest Guy"');
const timeline = await (await fetch('../../build/timeline.json')).json();

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W_ * SCALE, H_ * SCALE, false);
canvas.style.width = W_ + 'px'; canvas.style.height = H_ + 'px';
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, W_ / H_, 0.1, 1200);
const hemi = new THREE.HemisphereLight('#ffffff', '#556655', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 200 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const fx = new THREE.PointLight('#ff2a40', 0, 40, 1.2); scene.add(fx);
const fx2 = new THREE.PointLight('#ffffff', 0, 60, 1.0); scene.add(fx2);

const W = buildWorld(scene);
const BG = {
  day: L.gradientTex([[0, '#3fa9ff'], [0.6, '#8fd3ff'], [1, '#d8f3ff']]),
  sky: L.gradientTex([[0, '#2b8cff'], [0.5, '#6cc4ff'], [1, '#c9eeff']]),
  night: L.gradientTex([[0, '#07092a'], [0.6, '#1d1f5c'], [1, '#3b2f78']]),
  inDay: L.gradientTex([[0, '#ffe8cc'], [1, '#ffd8a8']]),
  dark: L.gradientTex([[0, '#0b0b1e'], [1, '#1a1636']]),
  dawn: L.gradientTex([[0, '#ff9f68'], [0.6, '#ffd8a8'], [1, '#fff3bf']]),
};
const sunTarget = new THREE.Vector3();
function light(mode, focus = [0, 0, 0]) {
  const f = new THREE.Vector3(...focus); sunTarget.copy(f);
  sun.target.position.copy(f); sun.visible = true; sun.castShadow = true;
  const M = {
    day: () => { scene.background = BG.day; hemi.color.set('#e8f6ff'); hemi.groundColor.set('#6a9a5a'); hemi.intensity = 1.7; sun.color.set('#fff4e0'); sun.intensity = 2.6; sun.position.copy(f).add(new THREE.Vector3(30, 55, 25)); },
    sky: () => { scene.background = BG.sky; hemi.color.set('#ffffff'); hemi.groundColor.set('#9fd0ff'); hemi.intensity = 2.0; sun.intensity = 2.2; sun.color.set('#fff8e8'); sun.position.copy(f).add(new THREE.Vector3(20, 60, 30)); },
    night: () => { scene.background = BG.night; hemi.color.set('#7b84ff'); hemi.groundColor.set('#1d1640'); hemi.intensity = 0.75; sun.color.set('#8fa6ff'); sun.intensity = 0.9; sun.position.copy(f).add(new THREE.Vector3(-25, 50, 20)); },
    inDay: () => { scene.background = BG.inDay; hemi.color.set('#ffffff'); hemi.groundColor.set('#bfa58a'); hemi.intensity = 1.8; sun.color.set('#fff1dc'); sun.intensity = 1.6; sun.position.copy(f).add(new THREE.Vector3(18, 40, 30)); },
    inNight: () => { scene.background = BG.dark; hemi.color.set('#6d6bff'); hemi.groundColor.set('#2a1b3d'); hemi.intensity = 0.7; sun.color.set('#7f8cff'); sun.intensity = 0.55; sun.position.copy(f).add(new THREE.Vector3(10, 40, 40)); },
    dawn: () => { scene.background = BG.dawn; hemi.color.set('#ffe1c4'); hemi.groundColor.set('#8a5a45'); hemi.intensity = 1.5; sun.color.set('#ffb36b'); sun.intensity = 2.4; sun.position.copy(f).add(new THREE.Vector3(8, 18, 40)); },
  };
  M[mode](); W.clouds.visible = mode === 'day';
}

// ---------- cast ----------
const C = {};
C.hero = new L.Rig({ shirt: '#ff8c1a', pants: '#2f5fd0', hair: 'short', hairColor: '#4a2f1d', name: 'hero' });
C.mom = new L.Rig({ shirt: '#e64980', pants: '#3b2f63', hair: 'long', hairColor: '#7a3e1d', skin: '#f2c29a' });
C.dad = new L.Rig({ shirt: '#1c7ed6', pants: '#3a3a48', hair: 'short', hairColor: '#2b1a10', collar: '#ffffff', scale: 1.08 });
C.sis = new L.Rig({ shirt: '#20c997', pants: '#5f3dc4', hair: 'pony', hairColor: '#5a3418', scale: 0.88 });
C.gma = new L.Rig({ shirt: '#9c36b5', pants: '#5c4b51', hair: 'bun', hairColor: '#d9d9e3', glasses: true, sleeves: true, scale: 0.95 });
C.col = [0, 1, 2].map(() => new L.Rig({ collector: true, shirt: '#14151b', pants: '#14151b', tie: '#0a0a0a', collar: '#f1f3f5', headH: 1.7, headSize: 1.4, sleeves: true, skin: '#14151b', hair: 'none', scale: 1.28 }));
C.col.forEach((c) => { c.screenMode = 'static'; c.screenKey = ''; c.glow.material.map = glowTex(); c.glow.scale.set(4.2, 4.2, 1); c.glow.position.copy(c.face.position).add(new THREE.Vector3(0, 0, 0.35)); c.headG.add(c.glow); });
C.lunch = new L.Rig({ shirt: '#ffffff', pants: '#495057', hair: 'hairnet', apron: '#74c0fc', skin: '#c58c5c', scale: 1.05 });
C.teacher = new L.Rig({ shirt: '#868e96', pants: '#343a40', hair: 'bald', hairColor: '#adb5bd', glasses: true, tie: '#c92a2a', collar: '#fff', sleeves: true });
C.shades = new L.Rig({ shirt: '#f8f9fa', pants: '#f8f9fa', hair: 'spiky', hairColor: '#ffd43b', shades: true, chain: true, skin: '#e0a57a', sleeves: false, scale: 1.1 });
C.old = new L.Rig({ shirt: '#a9e34b', pants: '#6c757d', hair: 'bald', hairColor: '#f1f3f5', glasses: true, sleeves: true, skin: '#f0c8a0' });
C.diver = new L.Rig({ shirt: '#fa5252', pants: '#1864ab', hair: 'cap', hairColor: '#212529', shades: false });
const R = L.rng(3);
const SH = ['#ff6b6b', '#4dabf7', '#ffd43b', '#69db7c', '#b197fc', '#ff922b', '#63e6be', '#f783ac', '#a9e34b', '#e599f7', '#74c0fc', '#ffa8a8'];
const SK = ['#f5c99b', '#e0a57a', '#c58c5c', '#8d5a3b', '#f2d0b0', '#a86b45'];
const HA = ['short', 'long', 'pony', 'cap', 'spiky', 'bun', 'short', 'long'];
const HC = ['#2b1a10', '#4a2f1d', '#ffd43b', '#e8590c', '#1a1a1a', '#7a3e1d', '#d9480f'];
C.ext = Array.from({ length: 16 }, (_, i) => new L.Rig({ shirt: SH[i % SH.length], pants: ['#343a40', '#1864ab', '#5f3dc4', '#495057', '#2b8a3e'][i % 5], skin: SK[Math.floor(R() * SK.length)], hair: HA[i % HA.length], hairColor: HC[Math.floor(R() * HC.length)], scale: 0.85 + R() * 0.25 }));
// Grandma's ghost: translucent, glowing copy of her rig
C.ghost = new L.Rig({ shirt: '#d0bfff', pants: '#b197fc', hair: 'bun', hairColor: '#ffffff', glasses: true, sleeves: true, skin: '#eef4ff', scale: 0.95 });
C.ghostMats = []; C.ghost.root.traverse((o) => { if (!o.isMesh) return; o.castShadow = o.receiveShadow = false;
  if (o === C.ghost.face) { o.material.transparent = true; C.ghostMats.push([o.material, 1.0]); return; }
  o.material = o.material.clone(); o.material.transparent = true; o.material.depthWrite = false; if (o.material.emissive) o.material.emissive.set('#6f7dff'); C.ghostMats.push([o.material, 0.55]); });
C.ghostGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#b8c4ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); C.ghostGlow.scale.set(9, 11, 1); C.ghostGlow.position.set(0, 4.2, 0.4); C.ghost.root.add(C.ghostGlow);
C.setGhost = (a) => { C.ghostMats.forEach(([m, base]) => (m.opacity = base * a)); C.ghostGlow.material.opacity = 0.55 * a; };
// 3D tears for Mom: glossy drops parented to her head, animated per shot
C.tears = Array.from({ length: 4 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshPhongMaterial({ color: '#8fdcff', emissive: '#1f6fb0', specular: '#ffffff', shininess: 120, transparent: true, opacity: 0.88 })); m.visible = false; C.mom.headG.add(m); return m; });
C.animTears = (T) => { const hs = 1.35, fz = hs / 2 + 0.05; C.tears.forEach((m, k) => { const side = k % 2 ? 1 : -1; const ph = (T * 0.42 + Math.floor(k / 2) * 0.5 + (k % 2) * 0.23) % 1; m.visible = true;
  let y = 0.66 - ph * 0.66, z = fz, x = side * 0.25 + Math.sin(ph * 6 + k) * 0.025 * ph;
  if (ph > 0.9) { const f = (ph - 0.9) / 0.1; y -= f * f * 0.9; z += f * 0.3; }
  m.position.set(x, y, z); const sc = 0.6 + 0.4 * Math.min(1, ph * 2.5); m.scale.set(sc, sc * (ph > 0.9 ? 1.7 : 1.3), sc * 0.7); m.material.opacity = ph < 0.06 ? ph / 0.06 * 0.88 : 0.88; }); };
const allRigs = [C.ghost, C.hero, C.mom, C.dad, C.sis, C.gma, ...C.col, C.lunch, C.teacher, C.shades, C.old, C.diver, ...C.ext];
allRigs.forEach((r) => scene.add(r.root));
// phones
C.phones = Array.from({ length: 10 }, (_, i) => { const p = new L.Phone(['#2a2d3a', '#e64980', '#1c7ed6', '#20c997', '#9c36b5', '#343a40', '#ffd43b'][i % 7]); scene.add(p.g); return p; });
// extra props
C.clip = L.box(1.1, 1.5, 0.12, '#c08457'); scene.add(C.clip);
C.blanket = L.box(5, 0.35, 6.8, '#4dabf7', 0, 0, 0, 0.12); scene.add(C.blanket);
C.armA = L.box(1, 6, 1, '#9c36b5', 0, 0, 0, 0.08); C.armB = L.box(1, 6, 1, '#ff8c1a', 0, 0, 0, 0.08); scene.add(C.armA, C.armB);
C.handA = L.box(1.02, 0.9, 1.02, '#f0c8a0', 0, 0, 0, 0.08); C.handB = L.box(1.02, 0.9, 1.02, '#f5c99b', 0, 0, 0, 0.08); scene.add(C.handA, C.handB);
C.flashlights = Array.from({ length: 8 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#fff1b8', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(3, 3, 1); scene.add(s); return s; });
C.redGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ff2240', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); scene.add(C.redGlow);
const doorHome = { p: W.door.position.clone(), r: W.door.rotation.clone() };

// ---------- overlay ----------
const ov = document.getElementById('ov'), capEl = document.getElementById('cap'), tagEl = document.getElementById('tag'), flashEl = document.getElementById('flash'), vigEl = document.getElementById('vig');
let ovHTML = [];
const UI = {
  add(html, css = '') { ovHTML.push(`<div class="o" style="${css}">${html}</div>`); },
  flash(a, color = '#fff') { flashEl.style.opacity = L.clamp(a); flashEl.style.background = color; },
  filter(f) { canvas.style.filter = f; },
  vignette(a) { vigEl.style.opacity = a; },
};
const WHO = { N: ['#ffe14d', ''], MOM: ['#ff8fd0', 'MOM'], DAD: ['#7fd8ff', 'DAD'], SIS: ['#7cffb2', 'SISTER'], GMA: ['#d6a8ff', 'GRANDMA'] };
const words = timeline.lines.flatMap((l) => l.words.map((w) => ({ ...w, who: l.who, li: l.i })));
function caption(T) {
  let cur = null;
  for (let i = 0; i < words.length; i++) { const w = words[i]; const nx = words[i + 1]; const endT = nx && nx.li === w.li ? nx.s : w.e + 0.25; if (T >= w.s && T < endT) { cur = w; break; } }
  if (!cur) { capEl.style.opacity = 0; tagEl.style.opacity = 0; return; }
  const [col, tag] = WHO[cur.who];
  const k = L.clamp((T - cur.s) / 0.09); const sc = 1.28 - 0.28 * L.easeOut(k);
  capEl.textContent = cur.w.replace(/[.,]/g, ''); capEl.style.color = col; capEl.style.opacity = 1; capEl.style.transform = `translate(-50%,-50%) scale(${sc})`;
  if (tag) { tagEl.textContent = tag; tagEl.style.opacity = 1; tagEl.style.background = col; } else tagEl.style.opacity = 0;
}
function talkLevel(T, who) {
  for (const w of words) { if (w.who !== who) continue; if (T >= w.s && T < w.e) { const ph = (T - w.s) / (w.e - w.s); return Math.sin(ph * Math.PI) * (0.65 + 0.35 * Math.abs(Math.sin(T * 23))); } }
  return 0;
}

// ---------- shots ----------
const lines = timeline.lines;
const ctx = { THREE, L, scene, camera, W, C, SET, UI, light, fx, fx2, hemi, sun, lines, talkLevel, renderer, doorHome };
const shots = makeShots(ctx);
const starts = shots.map((s, i) => (i === 0 ? 0 : lines[s.line].start - 0.12));
const DURATION = timeline.duration;

function resetAll() {
  allRigs.forEach((r) => r.reset());
  C.tears.forEach((m) => (m.visible = false));
  C.phones.forEach((p) => { p.g.visible = false; p.glow.material.opacity = 0; p.glow.material.color.set('#7fe8ff'); }); W.dust.material.color.set('#d8c3a5'); W.sparks.material.color.set('#9ff3ff'); W.orbs.material.color.set('#5dff9c');
  C.blanket.scale.set(1, 1, 1); [C.clip, C.blanket, C.armA, C.armB, C.handA, C.handB, W.remote, W.cane, ...C.flashlights].forEach((o) => (o.visible = false));
  C.redGlow.material.opacity = 0;
  scene.add(W.pan); W.pan.visible = false; W.pan.rotation.set(0, 0, 0); W.pan.position.set(0, -50, 0);
  scene.add(W.cane); W.cane.rotation.set(0, 0, 0); scene.add(C.armB, C.handB); C.armB.material = L.mat('#ff8c1a'); C.handB.material = L.mat('#f5c99b'); C.armB.rotation.set(0, 0, 0);
  W.rain.visible = false; W.smoke.visible = false; W.fire.intensity = 0; W.fireGlow.material.opacity = 0; W.skyG.visible = false; W.crater.visible = false; W.door.visible = true; W.dust.visible = false; W.orbs.visible = false; W.sparks.visible = false;
  W.door.position.copy(doorHome.p); W.door.rotation.copy(doorHome.r); W.doorCrack.material.opacity = 0; W.doorBits.forEach((b) => (b.m.visible = false));
  W.couchL.position.set(0, 0, 0); W.couchL.rotation.set(0, 0, 0); W.couchR.position.set(0, 0, 0); W.couchR.rotation.set(0, 0, 0);
  W.houses.forEach((h) => { h.winMat.color.set('#2b3550'); h.plMat.color.set('#3a3a30'); h.glow.material.opacity = 0; });
  W.porchLight.intensity = 0; W.lampLight.intensity = 0; W.moon.intensity = 0; W.nightLamp.intensity = 0; W.copLights.forEach((l) => (l.intensity = 0));
  fx.intensity = 0; fx2.intensity = 0; camera.up.set(0, 1, 0); camera.fov = 45; camera.zoom = 1;
  scene.fog = null;
  ovHTML = []; UI.flash(0); UI.filter('none'); UI.vignette(0.35);
}

window.DURATION = DURATION; window.FPS = 60;
window.renderAt = (T) => {
  resetAll();
  let i = 0; while (i + 1 < shots.length && T >= starts[i + 1]) i++;
  const s = shots[i]; const t0 = starts[i]; const t1 = i + 1 < shots.length ? starts[i + 1] : DURATION;
  s.update(T - t0, t1 - t0, T);
  // speaking characters lip sync
  C.mom.talk = Math.max(C.mom.talk, talkLevel(T, 'MOM')); C.dad.talk = Math.max(C.dad.talk, talkLevel(T, 'DAD'));
  C.sis.talk = Math.max(C.sis.talk, talkLevel(T, 'SIS')); C.gma.talk = Math.max(C.gma.talk, talkLevel(T, 'GMA'));
  if (W.clouds.visible) W.animTown(T);
  allRigs.forEach((r) => r.root.visible && r.updateFace(T));
  C.col.forEach((c, i) => { if (!c.root.visible) return;
    c.upper.rotation.x += 0.13; const tw = Math.floor(T * 1.7 + i * 0.37); const tr = L.rng(tw * 13 + i * 101)(); const ph = T * 1.7 + i * 0.37 - tw;
    if (tr < 0.55 && ph < 0.18) { const r2 = L.rng(tw * 7 + i)(); c.headG.rotation.z += (r2 - 0.5) * 0.7 * Math.sin(ph / 0.18 * Math.PI); c.headG.rotation.x += 0.12 * Math.sin(ph / 0.18 * Math.PI); }
    c.glow.material.color.set(c.screenMode === 'settled' ? '#4dff9a' : c.screenMode === 'static' ? '#c8d0ff' : '#ff2240'); c.glow.material.opacity = c.screenMode === 'static' ? 0.22 : 0.42 + 0.12 * Math.sin(T * 9 + i);
  });
  C.col.forEach((c) => { if (!c.root.visible) return; const key = c.screenMode + (c.screenMode !== 'settled' ? Math.floor(T * 30) : ''); if (key !== c.screenKey) { c.screenKey = key; L.drawCollector(c.ctx, c.screenMode, T, heroFaceCanvas); c.tex.needsUpdate = true; } });
  camera.aspect = W_ / H_; camera.updateProjectionMatrix();
  caption(T);
  ov.innerHTML = ovHTML.join('');
  // fade in/out
  const fin = L.clamp(T / 0.25), fout = L.clamp((DURATION - T) / 0.4);
  if (fin < 1) UI.flash(1 - fin, '#000');
  renderer.render(scene, camera);
  return i;
};
// hero face snapshot for collector screens
const heroFaceCanvas = document.createElement('canvas'); heroFaceCanvas.width = heroFaceCanvas.height = 256;
L.drawFace(heroFaceCanvas.getContext('2d'), 'scared', {});
window.SHOT_STARTS = starts; window.__C = C; window.__R = () => renderer.render(scene, camera);
window.READY = true;
