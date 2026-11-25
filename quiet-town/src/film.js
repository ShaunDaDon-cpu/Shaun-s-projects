// The Quiet Town: scene setup, effects and the 49 shots (+ end card).
import * as THREE from 'three';
import { LINES, FPS, FRAMES, CUES, DURATION, shotAt } from './script.js';
import { Char, buildTown, room, bed, crib, rockingChair, box, mat, rng, flagProp, knitProp, paperProp, medalProp, pillow, signTex } from './world.js';
import { drawCaption, drawEndCard } from './captions.js';
import { VO } from './vo-timing.js';
import { MOUTH } from './vo-mouth.js';

export const W = 1080, H = 1920;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, W / H, .1, 1500);
const hemi = new THREE.HemisphereLight('#ffffff', '#6a8f4a', 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3dd', 2.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
scene.add(sun, sun.target);
scene.fog = new THREE.Fog('#9fd8ff', 300, 1100);

// ---------- world ----------
const T = buildTown(scene);
const R = {
  kid: room(scene, { x: 400, wall: '#a0c4ff', floor: '#b07d56', windowAt: 4 }),
  parents: room(scene, { x: 440, wall: '#ffc8dd', floor: '#b07d56', windowAt: -5 }),
  dining: room(scene, { x: 480, wall: '#fde4cf', floor: '#9c6644', windowAt: -4 }),
  nursery: room(scene, { x: 520, d: 28, wall: '#ffe5ec', floor: '#e9c46a', windowAt: 0 }),
  hosp: room(scene, { x: 560, wall: '#d8f3dc', floor: '#e9ecef', windowAt: 5 }),
};
// kid's bedroom
const kidBed = bed('#ff9f1c'); kidBed.position.set(-5, 0, -4); R.kid.add(kidBed);
const kidPillow = pillow('#ffffff'); kidPillow.position.set(-5, 2.55, -6.3); R.kid.add(kidPillow);
const pillow2 = pillow('#ffd6e0'); R.kid.add(pillow2);
R.kid.add(box(2.4, 2.6, 2.2, '#8d5b4c', 0, 1.3, -7.2), box(.4, 1.4, .4, '#ffd166', 0, 3.3, -7.2), box(1.4, 1, 1.4, '#ffe8a3', 0, 4.4, -7.2));
R.kid.add(box(4, 5, .2, '#ef476f', -9, 7.5, -8.7, { cast: false }), box(5, .1, 4, '#06d6a0', 2, .02, -1, { cast: false }));
// parents' bedroom
const bigBed = bed('#7b2cbf', 8, 8); bigBed.position.set(0, 0, -4); R.parents.add(bigBed);
for (const x of [-1.8, 1.8]) R.parents.add(box(2.6, .7, 1.4, '#ffffff', x, 2.55, -6.9));
// dining / living room
R.dining.add(box(8, .5, 5, '#8d5b4c', 0, 3.2, -3)); for (const [x, z] of [[-3.6, -5.2], [3.6, -5.2], [-3.6, -.8], [3.6, -.8]]) R.dining.add(box(.5, 3, .5, '#6b3e26', x, 1.5, z));
for (const x of [-5.5, 5.5]) { R.dining.add(box(2.2, .4, 2.2, '#bc6c25', x, 1.8, -3), box(.4, 3.4, 2.2, '#bc6c25', x + Math.sign(x) * 1, 3.4, -3)); }
R.dining.add(box(1, .3, 1, '#ffffff', -1.5, 3.5, -3), box(1, .3, 1, '#ffffff', 1.5, 3.5, -3), box(.6, 1, .6, '#e63946', 0, 3.9, -3));
const rocker = rockingChair(); rocker.position.set(7, 0, -6); rocker.rotation.y = -.5; R.dining.add(rocker);
const cal = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.2), new THREE.MeshLambertMaterial({ map: signTex(['1976'], '#ffffff', '#c1121f') })); cal.position.set(9, 7, -8.7); R.dining.add(cal);
R.dining.add(box(3, 2.4, .2, '#ffd166', 3, 8, -8.75, { cast: false }), box(2.6, 2, .25, '#3a86ff', 3, 8, -8.7, { cast: false }));
// nursery
const cribs = [7, 0, -7].map((z, i) => { const c = crib(['#ffffff', '#cdeffd', '#ffd6e0'][i]); c.position.set(0, 0, z); R.nursery.add(c); return c; });
R.nursery.add(box(.1, 4, .1, '#888', 0, 10, 0, { cast: false })); for (let i = 0; i < 5; i++) R.nursery.add(box(.6, .6, .6, ['#ffd166', '#06d6a0', '#ef476f', '#118ab2', '#ff9f1c'][i], Math.cos(i * 1.256) * 1.5, 8, Math.sin(i * 1.256) * 1.5));
// hospital
const bassinet = crib('#ffffff'); bassinet.scale.setScalar(.8); bassinet.position.set(0, 0, -3); R.hosp.add(bassinet);
R.hosp.add(box(.2, 9, 8, '#a8dadc', -8, 4.5, -3), box(3, 6, 1, '#adb5bd', 7, 3, -7));
// stadium
const stadium = new THREE.Group(); stadium.position.set(600, 0, 300); scene.add(stadium);
stadium.add(box(90, .2, 50, '#4caf50', 0, .1, 10, { cast: false }));
for (let i = 0; i < 9; i++) stadium.add(box(90 / 9 * .5, .21, 50, '#5cbf60', -45 + 90 / 9 * (i + .25), .11, 10, { cast: false }));
for (let i = 0; i < 5; i++) stadium.add(box(70, 1.5 * (i + 1), 3, ['#3a86ff', '#ffffff'][i % 2], 0, .75 * (i + 1), -8 - i * 3));
const banner = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.4), new THREE.MeshLambertMaterial({ map: signTex(['GO TEAM!', '(quietly)'], '#ffd166', '#c1121f'), side: THREE.DoubleSide })); banner.position.set(-3, 10.5, -21); stadium.add(banner);
stadium.add(box(70, 14, 1, '#264653', 0, 7, -24));

// ---------- cast ----------
const kidDay = { shirt: '#2a9d8f', pants: '#3d405b' };
const C = {
  kid: new Char({ name: 'kid', skin: '#f5c542', shirt: '#2a9d8f', shirtFront: 'hoodie', pants: '#3d405b', hair: 'messy', hairColor: '#6b3a1e', features: { freckles: true }, scale: .78 }),
  mom: new Char({ name: 'mom', skin: '#f2c9a0', shirt: '#9d4edd', pants: '#22223b', hair: 'long', hairColor: '#3b2416', features: { lashes: true } }),
  dad: new Char({ name: 'dad', skin: '#e0ac69', shirtPattern: ['plaid'], pants: '#4361ee', hair: 'short', hairColor: '#5a3a1e', features: { mustache: '#5a3a1e' } }),
  grandma: new Char({ name: 'grandma', skin: '#f5d0b0', shirtPattern: ['floral'], pants: '#8d99ae', hair: 'bun', hairColor: '#ececec', features: { glasses: true, lashes: true }, scale: .9 }),
  mayor: new Char({ name: 'mayor', skin: '#ffcfa8', shirt: '#1b1b1f', shirtFront: 'suit', pants: '#1b1b1f', hair: 'short', hairColor: '#b8b8b8', features: { mustache: '#b8b8b8' }, hat: 'top', sash: true, scale: 1.05 }),
  teacher: new Char({ name: 'teacher', skin: '#c68642', shirt: '#ffb703', pants: '#3d405b', hair: 'pony', hairColor: '#2b1b10', features: { lashes: true } }),
  nurseA: new Char({ name: 'nurseA', skin: '#8d5524', shirt: '#ffffff', shirtFront: 'nurse', pants: '#ffffff', hair: 'short', hairColor: '#1b1b1f', hat: 'nurse', features: { lashes: true } }),
  nurseB: new Char({ name: 'nurseB', skin: '#ffdbac', shirt: '#ffffff', shirtFront: 'nurse', pants: '#ffffff', hair: 'fringe', hairColor: '#e9c46a', hat: 'nurse', features: { lashes: true } }),
  baby: new Char({ name: 'baby', skin: '#f5c542', shirt: '#ffffff', pants: '#ffffff', hair: 'baby', hairColor: '#6b3a1e', face: 'baby', scale: .45 }),
  neighA: new Char({ name: 'neighA', skin: '#ffdbac', shirt: '#ef476f', pants: '#264653', hair: 'fringe', hairColor: '#ffd166', features: { lashes: true } }),
  neighB: new Char({ name: 'neighB', skin: '#8d5524', shirt: '#06d6a0', pants: '#3d405b', hair: 'short', hairColor: '#1b1b1f', hat: 'cap' }),
};
const babies = [0, 1, 2].map(i => new Char({ name: 'b' + i, skin: ['#f5c542', '#e0ac69', '#ffdbac'][i], shirt: ['#cdeffd', '#ffd6e0', '#fff3b0'][i], pants: ['#cdeffd', '#ffd6e0', '#fff3b0'][i], hair: 'baby', hairColor: '#3b2416', face: 'sleep', earmuffs: true, scale: .5 }));
const SKINS = ['#f5c542', '#ffdbac', '#e0ac69', '#c68642', '#8d5524', '#f1c27d', '#f5c542'], SHIRTS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#ff9f1c', '#9b5de5', '#f15bb5', '#00bbf9', '#e63946', '#8ac926'];
const HAIRS = ['messy', 'short', 'long', 'pony', 'fringe', 'short'], HAIRC = ['#1b1b1f', '#5a3a1e', '#e9c46a', '#a0522d', '#3b2416', '#ff7b00'];
const rc = rng(2024);
const crowd = Array.from({ length: 30 }, (_, i) => new Char({ name: 'c' + i, skin: SKINS[Math.floor(rc() * SKINS.length)], shirt: SHIRTS[Math.floor(rc() * SHIRTS.length)], pants: ['#264653', '#3d405b', '#6d597a', '#1b1b1f'][i % 4], hair: HAIRS[i % HAIRS.length], hairColor: HAIRC[Math.floor(rc() * HAIRC.length)], features: { lashes: i % 3 === 0, mustache: i % 7 === 3 ? '#3b2416' : undefined }, hat: i % 9 === 4 ? 'cap' : undefined }));
const kids = Array.from({ length: 5 }, (_, i) => new Char({ name: 'k' + i, skin: SKINS[(i * 3) % SKINS.length], shirt: SHIRTS[(i * 4 + 1) % SHIRTS.length], pants: '#3d405b', hair: HAIRS[(i + 2) % HAIRS.length], hairColor: HAIRC[(i * 2) % HAIRC.length], features: { lashes: i % 2 === 0 }, scale: .74 }));
const ALL = [...Object.values(C), ...babies, ...crowd, ...kids];
for (const c of ALL) scene.add(c.group);
// outfits
const pjKid = new THREE.MeshLambertMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#26328a'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#ffd84a'; for (const [a, b] of [[30, 30], [94, 90]]) { x.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 14; x.lineTo(a + Math.cos(an) * r, b + Math.sin(an) * r); } x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })() });
const pjDad = new THREE.MeshLambertMaterial({ color: '#cfe1ff' });
function outfit(ch, shirtM, pantsM) {
  for (const p of [ch.torso, ch.lArm, ch.rArm]) { const m = p.children[0]; m.material = p === ch.torso ? [shirtM, shirtM, shirtM, shirtM, shirtM, shirtM] : shirtM; }
  for (const p of [ch.lLeg, ch.rLeg]) p.children[0].material = pantsM;
}
const kidShirt = C.kid.torso.children[0].material, kidArm = C.kid.lArm.children[0].material, kidPants = C.kid.lLeg.children[0].material;
const dadShirt = C.dad.torso.children[0].material, dadArm = C.dad.lArm.children[0].material, dadPants = C.dad.lLeg.children[0].material;
function dress(ch, night) {
  if (ch === C.kid) { if (night) outfit(C.kid, pjKid, pjKid); else { C.kid.torso.children[0].material = kidShirt; C.kid.lArm.children[0].material = C.kid.rArm.children[0].material = kidArm; C.kid.lLeg.children[0].material = C.kid.rLeg.children[0].material = kidPants; } }
  if (ch === C.dad) { if (night) outfit(C.dad, pjDad, pjDad); else { C.dad.torso.children[0].material = dadShirt; C.dad.lArm.children[0].material = C.dad.rArm.children[0].material = dadArm; C.dad.lLeg.children[0].material = C.dad.rLeg.children[0].material = dadPants; } }
}
// props
const kidFlag = flagProp('#e63946'); kidFlag.scale.setScalar(1.3);
const knit = knitProp();
const fine = paperProp('$500');
const medal = medalProp(); C.kid.torso.add(medal); medal.position.set(0, .2, .62); medal.visible = false;
const stroller = new THREE.Group(); stroller.add(box(2.6, 1.6, 3.2, '#118ab2', 0, 2, 0), box(2.8, .3, 3.4, '#0b6e8f', 0, 1.15, 0), box(2.6, 1.8, .4, '#118ab2', 0, 3.2, -1.4)); for (const [x, z] of [[-1.3, -1.2], [1.3, -1.2], [-1.3, 1.2], [1.3, 1.2]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .3, 14), mat('#1b1b1f')); w.rotation.z = Math.PI / 2; w.position.set(x, .55, z); stroller.add(w); } stroller.add(box(.2, 2.4, .2, '#333', 0, 3.2, 2.2)); scene.add(stroller);
const cone = new THREE.Group(); for (let i = 0; i < 4; i++) cone.add(box(.6 - i * .1, .3, .6 - i * .1, '#8b5a2b', 0, i * .28, 0)); scene.add(cone);
const mound = new THREE.Group(); { const mr = rng(9); mound.add(box(6, 2.6, 4.4, '#f6fbff', 0, 1.3, 0)); for (let i = 0; i < 9; i++) mound.add(box(2 + mr() * 2.2, 1.5 + mr() * 1.6, 2 + mr() * 2, '#ffffff', (mr() - .5) * 5, 1.6 + mr() * 1.4, (mr() - .5) * 3)); } scene.add(mound);
const DYN = [stroller, cone, mound, kidFlag, knit, fine];

// ---------- effects ----------
const PMAX = 1800;
const parts = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#2a3040' }), PMAX);
parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage); parts.frustumCulled = false; parts.castShadow = false; scene.add(parts);
parts.setColorAt(0, new THREE.Color()); let pN = 0;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
function P(x, y, z, s, color, rot = 0, sy) { if (pN >= PMAX) return; _e.set(rot, rot * 1.3, rot * .7); _q.setFromEuler(_e); _s.set(s, sy ?? s, s); _p.set(x, y, z); _m.compose(_p, _q, _s); parts.setMatrixAt(pN, _m); parts.setColorAt(pN, _c.set(color)); pN++; }
const RAIN = 1400;
const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(.05, 1.6, .05), new THREE.MeshBasicMaterial({ color: '#b9d3ff', transparent: true, opacity: .55, fog: false }), RAIN); rain.frustumCulled = false; scene.add(rain);
const rainSeed = Array.from({ length: RAIN }, (_, i) => { const r = rng(i * 7 + 3); return [r(), r(), r()]; });
const rings = Array.from({ length: 4 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 48), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false })); scene.add(m); return m; });
function ring(i, pos, radius, opacity, color = '#ffffff') { const m = rings[i]; m.visible = true; m.position.copy(pos); m.scale.setScalar(radius); m.material.opacity = opacity; m.material.color.set(color); m.lookAt(camera.position); }
function shockwave(pos, t0, t, { speed = 30, count = 3, gap = .12, life = .8, color = '#ffffff' } = {}) {
  for (let k = 0; k < count; k++) { const a = t - t0 - k * gap; if (a < 0 || a > life) continue; ring(k, pos, .5 + a * speed, .85 * (1 - a / life), color); }
}

// sleepy Z's: sprites that always face the camera
const zTex = ['Z', 'z'].map(ch => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.font = '700 110px Fredoka, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = 16; x.strokeStyle = '#2b2d6e'; x.strokeText(ch, 64, 68); x.fillStyle = '#ffffff'; x.fillText(ch, 64, 68); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; });
const zs = Array.from({ length: 15 }, (_, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex[i % 2], transparent: true, depthWrite: false, fog: false })); sp.renderOrder = 10; scene.add(sp); return sp; });
function sleepyZs(t, mouths) {   // three Z's per mouth, each rising, swaying and fading on its own loop
  let i = 0;
  mouths.forEach((m, b) => { for (let k = 0; k < 3; k++) {
    const sp = zs[i++]; if (!sp) return;
    const p = ((t * .85 + k / 3 + b * .29) % 1);
    sp.visible = true;
    sp.position.set(m.x + p * .9 + Math.sin(p * 7 + k) * .25, m.y + .3 + p * 3.4, m.z - p * .8);
    sp.scale.setScalar((.45 + p * .75) * (k % 2 ? .8 : 1));
    sp.material.opacity = p < .15 ? p / .15 : p > .65 ? Math.max(0, 1 - (p - .65) / .35) : 1;
    sp.material.rotation = Math.sin(p * 5 + k) * .3;
  } });
}

// ---------- helpers ----------
// mouth level (0/1/2) for line n at shot-local time t, from the voiceover envelope
const mouthAt = (n, t) => { const v = VO[n]; if (!v) return 0; return +(MOUTH[n][Math.floor((t - v[0]) * FPS)] ?? 0); };
const talk = (base, lvl) => lvl ? base + 'Talk' + lvl : base;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eOut = x => 1 - Math.pow(1 - clamp(x), 3);
const eIn = x => Math.pow(clamp(x), 2.4);
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (u, a, b) => clamp((u - a) / (b - a));
const lookAt = new THREE.Vector3();
let env;
function cam(p0, l0, p1, l1, u, fov = 45) { const k = u; camera.position.set(lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k), lerp(p0[2], p1[2], k)); lookAt.set(lerp(l0[0], l1[0], k), lerp(l0[1], l1[1], k), lerp(l0[2], l1[2], k)); camera.fov = fov; }
const still = (p, l, fov) => cam(p, l, p, l, 0, fov);
function flashAt(t, times) { let f = 0; for (const s of times) { const d = t - s; if (d >= 0 && d < .35) f = Math.max(f, d < .06 ? 1 : d < .12 ? .3 : d < .18 ? .8 : 1 - d / .35); } return f; }
function seatOn(ch, x, top, z, ry) { ch.at(x, top - .5 * ch.scale, z, ry).sit(); return ch; }
function lieDown(ch, x, y, z, faceDown = false) { ch.at(x, y, z); ch.group.rotation.set(-Math.PI / 2, faceDown ? Math.PI : 0, 0); return ch; }
const towerTop = new THREE.Vector3(-19, 24.6, -76);

// crowd seating for the square (front row = family)
const FAMILY_SEATS = { mom: [-11, -50], dad: [-8, -50], grandma: [-5, -50] };
function seatCrowd(t, { cheer = 0, faceExpr, lookUp = 0, skip = [] } = {}) {
  let i = 0;
  for (const z of [-50, -45, -40]) for (const x of [-13, -11, -8, -5, -2.4, 2.4, 5, 8, 11, 13]) {
    if (z === -50 && x <= -2.4) continue;             // family seats + the kid's seat
    const ch = crowd[i++]; if (!ch || skip.includes(ch)) continue;
    seatOn(ch, x, 1.35, z + .3, Math.PI); ch.idle(t + i);
    if (cheer) ch.jazz(t + i * .13);
    if (faceExpr) ch.face(faceExpr);
    if (lookUp) ch.head.rotation.x = -lookUp;
  }
}
function family(t, poses = {}) {
  for (const k of ['mom', 'dad', 'grandma']) { const [x, z] = FAMILY_SEATS[k]; const ch = C[k]; if (poses[k] === 'skip') continue; seatOn(ch, x, 1.35, z + .3, Math.PI); ch.idle(t); }
}

// ---------- environment presets ----------
const SKY = { day: '#8fd3ff', night: '#121a3a', dawn: '#f6b38a', room: '#000000' };
function applyEnv() {
  const e = env, f = e.flash;
  const bg = new THREE.Color(SKY[e.mode] || SKY.day);
  if (e.mode === 'night') bg.lerp(new THREE.Color('#c9d6ff'), f * .7);
  if (e.dawn) bg.lerp(new THREE.Color(SKY.dawn), e.dawn);
  scene.background = bg; scene.fog.color.copy(bg);
  if (e.mode === 'day') { hemi.color.set('#ffffff'); hemi.groundColor.set('#6a8f4a'); hemi.intensity = 1.35; sun.color.set('#fff3dd'); sun.intensity = 2.5; scene.fog.near = 300; scene.fog.far = 1100; }
  if (e.mode === 'night') { hemi.color.set('#7f93e8'); hemi.groundColor.set('#1d1d38'); hemi.intensity = .8 + f * 2.2 + (e.dawn || 0) * .6; sun.color.set('#a9bcff'); sun.intensity = .9 + f * 2.5 + (e.dawn || 0); scene.fog.near = 160; scene.fog.far = 1000; }
  if (e.mode === 'roomNight') { hemi.color.set('#ffcf8f'); hemi.groundColor.set('#3a2a40'); hemi.intensity = 1.0; sun.color.set('#ffd9a0'); sun.intensity = 1.2; scene.background = new THREE.Color('#1a1a2e'); }
  if (e.mode === 'roomDay') { hemi.color.set('#ffffff'); hemi.groundColor.set('#a08060'); hemi.intensity = 1.5; sun.color.set('#fff6e0'); sun.intensity = 1.8; scene.background = new THREE.Color('#bde0fe'); }
  for (const r of Object.values(R)) if (r.windowMat) r.windowMat.color.set(e.mode === 'roomNight' ? (f > .3 ? '#e0e8ff' : '#1d2b5c') : '#9fd3ff');
  // windows / lamps
  T.houses.forEach((h, i) => { const on = typeof e.windows === 'function' ? e.windows(i, h) : e.windows; h.windows.emissive.set(on ? '#ffc94d' : '#000000'); h.windows.color.set(on ? '#ffe9a8' : e.mode === 'night' ? '#2a3560' : '#cfe8ff'); });
  for (const m of T.lampMats) { m.emissive.set(e.lamps ? '#ffe08a' : '#000000'); }
  // shadows follow the look point
  const span = e.shadowSpan;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -span; sun.shadow.camera.right = sun.shadow.camera.top = span; sun.shadow.camera.near = 1; sun.shadow.camera.far = 400; sun.shadow.camera.updateProjectionMatrix();
  sun.target.position.copy(e.shadowAt || lookAt); sun.position.copy(sun.target.position).add(new THREE.Vector3(40, 80, 50));
  // rain around the camera
  rain.visible = e.rain > 0;
  if (rain.visible) {
    const n = Math.floor(RAIN * e.rain), cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    for (let i = 0; i < RAIN; i++) {
      const [a, b, c] = rainSeed[i];
      const y = ((b * 50 - e.t * 38) % 50 + 50) % 50 - 22;
      _p.set(cx + (a - .5) * 50, cy + y, cz + (c - .5) * 50 - 12);
      _e.set(0, 0, .18); _q.setFromEuler(_e); _s.set(1, i < n ? 1 : 0, 1); _m.compose(_p, _q, _s); rain.setMatrixAt(i, _m);
    }
    rain.instanceMatrix.needsUpdate = true;
  }
  parts.count = pN; parts.instanceMatrix.needsUpdate = true; if (parts.instanceColor) parts.instanceColor.needsUpdate = true;
  // camera shake
  if (e.shake) { const s = e.shake, t = e.t; camera.position.x += (Math.sin(t * 61) + Math.sin(t * 37)) * .5 * s; camera.position.y += (Math.sin(t * 53) + Math.sin(t * 29)) * .5 * s; lookAt.x += Math.sin(t * 47) * .5 * s; lookAt.y += Math.sin(t * 43) * .5 * s; }
  camera.aspect = W / H; camera.lookAt(lookAt); camera.updateProjectionMatrix();
  for (const r of rings) if (r.visible) r.lookAt(camera.position);
}

function resetAll(t) {
  env = { t, mode: 'day', rain: 0, flash: 0, shake: 0, windows: false, lamps: false, shadowSpan: 50, shadowAt: null, dawn: 0 };
  for (const c of ALL) c.reset();
  dress(C.kid, false); dress(C.dad, false);
  for (const d of DYN) { d.visible = false; d.position.set(0, 0, 0); d.rotation.set(0, 0, 0); d.scale.setScalar(1); }
  scene.add(stroller, cone, mound); kidFlag.scale.setScalar(1.3);
  for (const r of rings) r.visible = false;
  for (const z of zs) z.visible = false;
  pN = 0; medal.visible = false;
  T.group.visible = true; stadium.visible = false; for (const r of Object.values(R)) r.visible = false;
  pillow2.visible = false;
  for (const s of T.crackSegs) s.visible = false; T.crack.scale.set(1, 1, 1);
  T.plug.visible = false; T.plug.scale.setScalar(1);
  T.roofSnowFront.position.set(0, 17.31, 4.13); T.roofSnowFront.rotation.set(.811, 0, 0); T.roofSnowFront.visible = true;
  T.cornice.position.set(-20, 105, 70); T.cornice.rotation.set(0, 0, 0);
  T.towerFlag.children[1].rotation.y = 0;
  camera.fov = 45; camera.up.set(0, 1, 0);
}
const inRoom = (r, mode = 'roomNight') => { T.group.visible = false; r.visible = true; env.mode = mode; env.shadowSpan = 16; env.shadowAt = r.position.clone().add(new THREE.Vector3(0, 0, -3)); };

// water jets from the visible part of the crack
function jets(t, visibleSegs, power = 1) {
  const dam = T.dam.position;
  for (let k = 0; k < visibleSegs; k += 2) {
    const s = T.crackSegs[k]; const sx = dam.x + s.position.x, sy = s.position.y, sz = dam.z + 2.8;
    for (let j = 0; j < 22; j++) { const tau = ((t * 1.6 + j / 22 + k * .37) % 1); const v = 9 * power; P(sx + Math.sin(j * 7) * .4 * tau * 3, sy - 6 * tau * tau * 3 + 1.5 * tau, sz + v * tau * 1.6, .22 + tau * .38, j % 3 ? '#9fd0ff' : '#ffffff', j + t); }
  }
}
// avalanche flow from the cornice down to the river at the dam
const AV0 = new THREE.Vector3(-20, 128, -224), AV1 = new THREE.Vector3(-62, 52, -160), AV2 = new THREE.Vector3(-62, 4, -114);
function avPoint(s, out) { const a = 1 - s; return out.set(a * a * AV0.x + 2 * a * s * AV1.x + s * s * AV2.x, a * a * AV0.y + 2 * a * s * AV1.y + s * s * AV2.y, a * a * AV0.z + 2 * a * s * AV1.z + s * s * AV2.z); }
const avTmp = new THREE.Vector3();
function avalanche(front, n = 700, width = 1) {   // front: 0..1+ how far the snow has travelled
  for (let i = 0; i < n; i++) {
    const r = rng(i * 13 + 1); const lag = r() * .35, s = front - lag; if (s < 0 || s > 1) continue;
    avPoint(s, avTmp); const spread = (8 + s * 10) * width;
    P(avTmp.x + (r() - .5) * spread, avTmp.y + r() * 6 + 1, avTmp.z + (r() - .5) * spread * .6, (1.2 + r() * 2.6) * (.7 + s * .5), r() < .2 ? '#e3ecff' : '#ffffff', r() * 6 + s * 4);
  }
}
function birds(t, t0, origin, n = 60) { const a = t - t0; if (a < 0) return; for (let i = 0; i < n; i++) { const r = rng(i * 31 + 7); const dir = new THREE.Vector3(r() - .5, .4 + r() * .6, r() - .5).normalize(); const d = a * (14 + r() * 10); const flap = Math.sin(t * 30 + i) * .35; P(origin.x + (r() - .5) * 60 + dir.x * d, origin.y + r() * 4 + dir.y * d, origin.z + (r() - .5) * 60 + dir.z * d, .6, '#22223b', flap, .25); } }
function snowPuff(t, pos, n = 40, size = 1, color = '#ffffff') { for (let i = 0; i < n; i++) { const r = rng(i * 17 + 5); const a = clamp(t * 1.5); P(pos.x + (r() - .5) * 10 * a * size, pos.y + r() * 6 * a * size, pos.z + (r() - .5) * 10 * a * size, (1 + r() * 2) * size * (1 - a * .4), color, r() * 6); } }

// ---------- shots ----------
// each shot: (t = seconds into the shot, u = 0..1 through it, L = line)
const S = {};
S[1] = (t, u) => { // town sign with the rule
  env.mode = 'day';
  // the sign is the subject: whole and centred-left, the snowcapped peak towering over the street behind it
  cam([6.6, 2.4, 70], [17, 20.1, -30.5], [6.4, 2.6, 68], [17, 20.3, -30.5], ease(u), 55);
  C.neighB.at(-3, 0, 38, Math.PI).walk(t * 6, .4);   // townsfolk tiptoeing
  C.neighA.at(3, 0, 30, Math.PI).walk(t * 6 + 1, .4);
  env.shadowAt = new THREE.Vector3(5, 0, 40);
};
S[2] = (t, u) => { // tilt up to the snow wall on the mountain
  cam([4, 4, 26], [0, 12, -60], [4, 4, 26], [-14, 118, -230], ease(u), 50);
  for (let i = 0; i < 30; i++) { const r = rng(i + 90); const a = ((t * .5 + r()) % 1); P(-20 + (r() - .5) * 120, 124 - a * 30, -220 + r() * 4, 1.2 + r(), '#ffffff', i); }
  env.shadowAt = new THREE.Vector3(0, 0, 0);
};
S[3] = (t, u) => { // neighbours whispering over the fence
  C.neighA.at(-11.6, 0, 22, Math.PI / 2).cup('r'); C.neighA.face('whisper'); C.neighA.body.rotation.z = -.15; C.neighA.head.rotation.z = -.12;
  C.neighB.at(-8.6, 0, 22.4, -Math.PI / 2 + .75).face(t > .7 ? 'gasp' : 'open'); C.neighB.idle(t); C.neighB.head.rotation.y = -.4;
  cam([-1.5, 5.4, 34], [-10.2, 4.2, 22], [-2.8, 5.3, 32.4], [-10.2, 4.2, 22], ease(u), 42);
  env.shadowAt = new THREE.Vector3(-10, 0, 22); env.shadowSpan = 20;
};
S[4] = (t, u) => { // stadium: silent jazz-hands cheering
  T.group.visible = false; stadium.visible = true; env.mode = 'day';
  let i = 0;
  for (let row = 0; row < 4; row++) for (let k = 0; k < 7; k++) { const ch = crowd[i++]; seatOn(ch, 600 - 15 + k * 5 + (row % 2) * 2.5, 1.5 * (row + 1), 300 - 8 - row * 3 + .4, 0); ch.jazz(t + i * .17); ch.face(i % 3 ? 'grin' : 'happy'); }
  cam([588, 5, 318], [596, 6.5, 290], [598, 5.2, 318], [604, 6.5, 290], ease(u), 46);
  env.shadowAt = new THREE.Vector3(600, 0, 294); env.shadowSpan = 30;
};
S[5] = (t, u) => { // nursery: babies in earmuffs
  inRoom(R.nursery, 'roomDay');
  babies.forEach((b, i) => { lieDown(b, 520, 2.75, [7, 0, -7][i] + 1.3); b.head.rotation.z = Math.sin(t * 2 + i) * .1; });
  sleepyZs(t, [7, 0, -7].map(z => new THREE.Vector3(520, 3.2, z + .3)));
  cam([523, 17, 12], [520, 2.5, -1], [522, 15, 9.5], [520, 2.5, -1], ease(u), 44);
};
S[6] = (t, u) => { // school bell is a flag
  C.teacher.at(39.5, 0, -46, -Math.PI / 2).face('grin'); C.teacher.hold(kidFlag, 'r'); C.teacher.rArm.rotation.z = 2.6 + Math.sin(t * 9) * .45; kidFlag.rotation.set(0, Math.PI / 2, Math.PI);
  kidFlag.position.set(0, -.3, 0);
  kids.forEach((k, i) => { const p = clamp(t * .55 + i * .12); k.at(lerp(26, 36, p) - i * 1.6, 0, -43 - (i % 3) * 2.2, Math.PI / 2).walk(t * 9 + i, .6); k.face('smile'); });
  cam([21, 6.5, -27], [36, 5.5, -46], [22.5, 6.3, -29], [36, 5.5, -46], ease(u), 46);
  env.shadowAt = new THREE.Vector3(34, 0, -45); env.shadowSpan = 25;
};
S[7] = (t, u) => { // and then there's me
  C.kid.at(0, 0, 12, 0).idle(t).face(t > .35 ? 'grin' : 'smile'); C.kid.rArm.rotation.z = 2.4 + Math.sin(t * 14) * .3;
  cam([0, 4.1, 18.2], [0, 3.4, 12], [0, 4.0, 16.6], [0, 3.4, 12], ease(u), 40);
  env.shadowAt = new THREE.Vector3(0, 0, 12); env.shadowSpan = 14;
};
S[8] = (t, u) => { // born loud: baby screams, nurses fly
  inRoom(R.hosp, 'roomDay');
  lieDown(C.baby, 560, 2.3, -1.9).face(t > .25 ? 'shout' : 'baby'); C.baby.shake(t, t > .25 ? 1.5 : 0);
  const blow = eOut((t - .3) / .5);
  C.nurseA.at(557.5 - blow * 2.5, blow * 1.2, -2.5, Math.PI / 2).face(t > .3 ? 'gasp' : 'smile'); C.nurseA.group.rotation.z = blow * .9; C.nurseA.armsUp(blow);
  C.nurseB.at(562.5 + blow * 2.5, blow * 1.2, -2.5, -Math.PI / 2).face(t > .3 ? 'gasp' : 'smile'); C.nurseB.group.rotation.z = -blow * .9; C.nurseB.armsUp(blow);
  shockwave(new THREE.Vector3(560, 3, -3.5), .25, t, { speed: 14, life: .7 });
  env.shake = t > .25 ? .35 * (1 - u) : 0;
  still([560, 11, 6.5], [560, 2.6, -2.6], 50);
};
S[9] = (t, u) => { // first word knocks a pine cone onto dad
  stroller.visible = true; stroller.position.set(-19.8, 0, 46.4); stroller.rotation.y = .5;
  C.baby.at(-19.8, 1.75, 46.6, .5).sit(); C.baby.face(t > .7 && t < 1.4 ? 'open' : 'happy');
  C.dad.at(-23, 0, 45.6, .7); C.dad.rArm.rotation.x = -.9; C.dad.idle(t);
  const hit = 1.75, fall = clamp((t - .95) / (hit - .95));
  cone.visible = true; cone.position.set(lerp(-23.4, -23, fall), lerp(9.4, 6.4, fall * fall), lerp(46.3, 45.6, fall)); cone.rotation.set(fall * 6, fall * 3, 0);
  if (t > hit) { cone.position.set(-22.2 + (t - hit) * 2, 6.4 + Math.sin((t - hit) * 6) * 1.2 - (t - hit) * 3, 46.6); cone.visible = t < hit + 1; C.dad.face('dizzy'); C.dad.head.rotation.z = Math.sin(t * 9) * .15; C.dad.body.rotation.z = Math.sin(t * 6) * .05; }
  else C.dad.face(t > 1.1 ? 'worried' : 'smile');
  if (t > hit && t < hit + .15) P(-23, 6.2, 45.6, .7, '#ffd166', t * 30);
  shockwave(new THREE.Vector3(-19.8, 3.2, 47), .75, t, { speed: 10, count: 2, life: .6 });
  cam([-10.5, 7.2, 60], [-22, 5.6, 46], [-11.5, 7, 58.5], [-22, 5.8, 46], ease(u), 46);
  env.shadowAt = new THREE.Vector3(-22, 0, 46); env.shadowSpan = 18;
};
S[10] = (t, u) => { // screams into pillow at night
  inRoom(R.kid); dress(C.kid, true);
  lieDown(C.kid, 395, 2.75, -1.6, true).face('shout');
  C.kid.lLeg.rotation.x = Math.sin(t * 16) * .5; C.kid.rLeg.rotation.x = -Math.sin(t * 16) * .5; C.kid.lArm.rotation.z = -.4 + Math.sin(t * 13) * .2; C.kid.rArm.rotation.z = .4 - Math.sin(t * 13) * .2;
  const puff = 1 + Math.max(0, Math.sin(t * 22)) * .25; kidPillow.scale.set(2.6 * puff, .7 * puff, 1.6);
  for (let i = 0; i < 8; i++) { const a = ((t * 2 + i / 8) % 1); P(395 + Math.sin(i * 3) * 2 * a, 3.2 + a * 3, -6.3 + Math.cos(i * 3) * a, .25 * (1 - a), '#ffffff', i); }
  cam([401, 8.4, 1], [395, 2.6, -4.4], [400.4, 8, 0], [395, 2.6, -4.6], ease(u), 46);
};
S[11] = (t, u) => { // mom adds a second pillow
  inRoom(R.kid); dress(C.kid, true);
  lieDown(C.kid, 395, 2.75, -1.6, true).face('shout'); C.kid.lLeg.rotation.x = Math.sin(t * 16) * .4 * (1 - u); C.kid.rLeg.rotation.x = -Math.sin(t * 16) * .4 * (1 - u);
  kidPillow.scale.set(2.6, .7, 1.6);
  C.mom.at(398.6, 0, -5.4, -Math.PI / 2).face('deadpan').forward(1 - seg(u, .6, 1) * .3);
  const d = ease(seg(u, .1, .55)); pillow2.visible = true; pillow2.position.set(lerp(396.6, 395, d), lerp(4.6, 3.75, d), -5.4); pillow2.rotation.y = Math.PI / 2 * (1 - d) * 0;
  if (u > .55) { pillow2.scale.y = 1 + Math.max(0, Math.sin(t * 20)) * .08 * (1 - u); }
  cam([403, 6.8, 2.5], [396, 3.6, -5], [402.2, 6.4, 1.5], [396, 3.6, -5], ease(u), 42);
};
S[12] = (t, u) => { // they call me Foghorn
  C.kid.at(30, 0, -40.5, 0).face(talk('sad', mouthAt(12, t))); C.kid.head.rotation.x = .15;
  kids.slice(0, 4).forEach((k, i) => { k.at(27.2 + i * 1.9, 0, -45 - (i % 2), 0).face(i % 2 ? 'happy' : 'smug'); k.point('r', .1); if (i % 2) k.cup('l'); k.body.position.y = Math.abs(Math.sin(t * 12 + i)) * .12; k.body.rotation.z = Math.sin(t * 10 + i) * .05; });
  cam([30.6, 3.9, -34.6], [30.1, 3.4, -41], [30.4, 3.7, -35.6], [30.1, 3.3, -41], ease(u), 42);
  env.shadowAt = new THREE.Vector3(30, 0, -42); env.shadowSpan = 14;
};
S[13] = (t, u) => { // MOM: use your inside voice
  inRoom(R.dining);
  // whispering: hand cupped at the side of her mouth, mouth lip-synced to the voice
  seatOn(C.mom, 474.5, 2.0, -3, Math.PI / 2).face('whisper' + mouthAt(13, t));
  C.mom.rArm.rotation.set(-1.76, 0, -.48);                       // right hand cupped at the side of her mouth
  C.mom.head.rotation.z = -.1; C.mom.head.rotation.y = -.12; C.mom.body.rotation.z = .04 + Math.sin(t * 3) * .015;
  seatOn(C.kid, 485.5, 2.0, -3, -Math.PI / 2).face('pout');
  cam([481.6, 5.5, -1.2], [474.6, 4.2, -3.1], [481, 5.4, -1.45], [474.6, 4.2, -3.1], ease(u), 38);
};
S[14] = (t, u) => { // I don't have an inside voice
  inRoom(R.dining);
  seatOn(C.kid, 485.5, 2.0, -3, -Math.PI / 2).face(talk('pout', mouthAt(14, t))).crossArms(); C.kid.head.rotation.y = .25;
  seatOn(C.mom, 474.5, 2.0, -3, Math.PI / 2).face('deadpan');
  cam([481.5, 4.2, -.2], [485.5, 3.7, -3], [482.2, 4.1, -.8], [485.5, 3.7, -3], ease(u), 38);
};
S[15] = (t, u) => { // grandma, silent since 1976
  inRoom(R.dining);
  const rock = Math.sin(t * 2.6) * .12;
  seatOn(C.grandma, 487, 2.25, -6, -.5).face('deadpan'); C.grandma.group.rotation.x = rock; C.grandma.hold(knit, 'r'); C.grandma.forward(.75); C.grandma.lArm.rotation.x += Math.sin(t * 12) * .08; C.grandma.rArm.rotation.x -= Math.sin(t * 12) * .08;
  knit.position.set(-.9, -.1, 0);
  rocker.rotation.set(rock, -.5, 0);
  cam([482.5, 5.8, 2], [486.6, 3.8, -5.6], [484.4, 4.8, -1.2], [486.8, 3.7, -5.8], ease(u), 40);
};
S[16] = (t, u) => { // the storm
  env.mode = 'night'; env.rain = 1; env.flash = flashAt(t, [.25, 1.7]);
  cam([16, 24, 74], [0, 8, -40], [11, 21, 64], [0, 8, -40], ease(u), 50);
  env.shadowAt = new THREE.Vector3(0, 0, 0); env.shadowSpan = 70;
};
S[17] = (t, u) => { // the dam cracks
  env.mode = 'night'; env.rain = 1; env.flash = flashAt(t, [.1]);
  const n = Math.floor(lerp(2, T.crackSegs.length, ease(u * 1.1))); T.crackSegs.forEach((s, i) => s.visible = i < n);
  jets(t, n, .6 + u * .5);
  cam([-57, 8, -92], [-62, 13, -122], [-58.5, 9, -97], [-62, 13, -122], ease(u), 46);
  env.shadowAt = new THREE.Vector3(-62, 0, -115); env.shadowSpan = 30; env.shake = .06;
};
S[18] = (t, u) => { // shake Dad awake
  inRoom(R.parents); dress(C.kid, true); dress(C.dad, true);
  lieDown(C.dad, 438.2, 2.75, -1.2).face('sleep'); C.dad.body.position.x = Math.sin(t * 30) * .15;
  lieDown(C.mom, 441.8, 2.75, -1.2).face('sleep');
  C.kid.at(435.6, 0, -4.2, Math.PI / 2).face('worried').forward(1.05); C.kid.lArm.rotation.x += Math.sin(t * 30) * .18; C.kid.rArm.rotation.x -= Math.sin(t * 30) * .18; C.kid.body.rotation.y = Math.sin(t * 30) * .05;
  cam([430.5, 8, 6.5], [437.6, 3, -4], [431.5, 7.6, 5.5], [437.6, 3, -4], ease(u), 46);
};
S[19] = (t, u) => { // DAD: whisper, Foghorn. go back to bed
  inRoom(R.parents); dress(C.dad, true);
  const roll = ease(seg(u, .55, .95)) * 1.5;
  lieDown(C.dad, 438.2, 2.75, -1.2).face(u < .55 ? 'halfsleep' : 'sleep'); C.dad.group.rotation.y = roll;
  lieDown(C.mom, 441.8, 2.75, -1.2).face('sleep');
  cam([437, 8.2, -2.4], [438.2, 2.9, -5.9], [437.3, 7.6, -3.2], [438.2, 2.9, -5.9], ease(u), 40);
};
S[20] = (t, u) => { // whispering at every door
  env.mode = 'night'; env.rain = 1;
  const z = lerp(34, 20, ease(seg(u, .4, .65)));
  C.kid.at(11.3, 0, z, Math.PI / 2 - (u < .4 || u > .65 ? .75 : 0)).face('whisper'); dress(C.kid, true);
  if (u < .4 || u > .65) { C.kid.rArm.rotation.x = -1.7 + Math.max(0, Math.sin(t * 18)) * .45; C.kid.cup('l'); } else C.kid.walk(t * 10, .7);
  cam([5, 4.4, z + 8], [11.3, 3.3, z], [5, 4.4, z + 8], [11.3, 3.3, z], 0, 46);
  env.shadowAt = new THREE.Vector3(12, 0, z); env.shadowSpan = 20;
};
S[21] = (t, u) => { // nobody woke up
  env.mode = 'night'; env.rain = 1;
  cam([-3, 7, 46], [12, 5, 14], [-2, 6.6, 43], [12, 5, 14], ease(u), 46);
  env.shadowAt = new THREE.Vector3(10, 0, 20); env.shadowSpan = 40;
};
S[22] = (t, u) => { // the crack widens
  env.mode = 'night'; env.rain = 1; env.flash = flashAt(t, [.55]);
  T.crackSegs.forEach(s => s.visible = true); T.crack.scale.set(1 + u * .6, 1, 1);
  jets(t, T.crackSegs.length, 1.2 + u * .4);
  cam([-59.5, 13.5, -104], [-62, 12, -122], [-60.5, 13, -107], [-62, 12, -122], ease(u), 46);
  env.shadowAt = new THREE.Vector3(-62, 0, -118); env.shadowSpan = 25; env.shake = .1;
};
S[23] = (t, u) => { // climbing the church tower
  env.mode = 'night'; env.rain = 1; dress(C.kid, true);
  const y = lerp(7, 17, u);
  C.kid.at(-21.5, y, -71.2, Math.PI).face('determined');
  const c = Math.sin(t * 10); C.kid.lArm.rotation.x = -2.6 - c * .35; C.kid.rArm.rotation.x = -2.6 + c * .35; C.kid.lLeg.rotation.x = -.4 + c * .4; C.kid.rLeg.rotation.x = -.4 - c * .4;
  cam([-15, 9, -60], [-21.5, 12, -72], [-15.5, 13, -61], [-21.5, 17, -72], ease(u), 48);
  env.shadowAt = new THREE.Vector3(-20, 10, -72); env.shadowSpan = 30;
};
S[24] = (t, u) => { // filled my lungs
  env.mode = 'night'; env.rain = 1; dress(C.kid, true);
  C.kid.at(towerTop.x, towerTop.y, towerTop.z + .8, 0).face('puff');
  const b = ease(u); C.kid.torso.scale.set(1 + b * .18, 1 + b * .1, 1 + b * .55); C.kid.armsOut(.15 + b * .25); C.kid.body.position.y = b * .2; C.kid.head.rotation.x = -b * .15;
  cam([-19, 28.7, -65.6], [-19, 27.2, -75.2], [-19, 28.6, -66.6], [-19, 27.2, -75.2], ease(u), 42);
  env.shadowAt = towerTop; env.shadowSpan = 12;
};
S[25] = (t, u) => { // and for the first time in my life
  env.mode = 'night'; env.rain = 1; env.flash = flashAt(t, [1.3]); dress(C.kid, true);
  C.kid.at(towerTop.x, towerTop.y, towerTop.z + .8, 0).face('determined'); C.kid.torso.scale.set(1.18, 1.1, 1.55); C.kid.armsOut(.4); C.kid.body.position.y = .2; C.kid.head.rotation.x = -.1;
  cam([-19, 28.4, -66.6], [-19, 28.1, -75.2], [-19, 28.2, -71.2], [-19, 28.1, -75.2], ease(u), 40);
  env.shadowAt = towerTop; env.shadowSpan = 12;
};
S[26] = (t, u) => { // I didn't hold back
  env.mode = 'night'; env.rain = 1; dress(C.kid, true);
  C.kid.at(towerTop.x, towerTop.y, towerTop.z + .8, 0).face(u < .45 ? 'determined' : 'open'); C.kid.torso.scale.set(1.18, 1.1, 1.55); C.kid.armsOut(.4 + u * .4); C.kid.body.position.y = .2; C.kid.head.rotation.x = -.1 - ease(seg(u, .45, 1)) * .25;
  cam([-19, 28.25, -72.4], [-19, 28.2, -75.2], [-19, 28.3, -72.9], [-19, 28.3, -75.2], ease(u), 36);
  env.shadowAt = towerTop; env.shadowSpan = 12;
};
S[27] = (t, u) => { // THE DAM IS BREAKING!
  env.mode = 'night'; env.rain = 1; dress(C.kid, true);
  C.kid.at(towerTop.x, towerTop.y, towerTop.z + .8, 0).face('shout'); C.kid.armsOut(1.3); C.kid.lArm.rotation.x = C.kid.rArm.rotation.x = .5; C.kid.body.rotation.x = .2; C.kid.head.rotation.x = .1; C.kid.shake(t, 1);
  const mouth = new THREE.Vector3(towerTop.x, towerTop.y + 3.6, towerTop.z + 1.6);
  shockwave(mouth, 0, t, { speed: 55, count: 4, gap: .16, life: 1.3 });
  birds(t, .25, new THREE.Vector3(0, 12, -10));
  T.towerFlag.children[1].rotation.y = Math.sin(t * 40) * .6;
  const k = eOut(u * 1.25);
  cam([-19, 28.6, -70], [-19, 28.4, -75.5], [24, 46, -10], [-17, 26, -72], k, 46);
  env.shake = .55 * (1 - u * .6); env.shadowAt = new THREE.Vector3(-10, 0, -50); env.shadowSpan = 60;
};
S[28] = (t, u) => { // every light in town came on
  env.mode = 'night'; env.rain = 1;
  env.windows = (i, h) => { const d = h.position.distanceTo(new THREE.Vector3(-19, 0, -76)); return u * 1.4 > d / 140; };
  env.lamps = u > .5;
  cam([24, 30, 44], [-4, 4, -30], [22, 28, 40], [-4, 4, -30], ease(u), 48);
  env.shadowAt = new THREE.Vector3(0, 0, -10); env.shadowSpan = 70;
};
S[29] = (t, u) => { // the mountain answered
  env.mode = 'night'; env.rain = .7; env.windows = true; env.lamps = true;
  T.cornice.rotation.x = eIn(u) * .25; T.cornice.position.set(-20, 130 - eIn(u) * 10, 69 + eIn(u) * 8);
  snowPuff(t, new THREE.Vector3(-20, 122, -222), 60, 2.2);
  cam([2, 7, -30], [-16, 112, -228], [2, 7, -32], [-16, 110, -228], ease(u), 46);
  env.shake = .25 + u * .25; env.shadowAt = new THREE.Vector3(0, 0, -40); env.shadowSpan = 50;
};
S[30] = (t, u) => { // the snow came down
  env.mode = 'night'; env.rain = .6; env.windows = true; env.lamps = true;
  T.cornice.visible = false; avalanche(lerp(.12, .55, u), 900);
  cam([50, 60, -20], [-40, 60, -175], [46, 58, -26], [-46, 48, -165], ease(u), 50);
  env.shake = .45; env.shadowAt = new THREE.Vector3(-40, 0, -120); env.shadowSpan = 60;
};
S[31] = (t, u) => { // right past our houses
  env.mode = 'night'; env.rain = .6; env.windows = true; env.lamps = true;
  avalanche(lerp(.5, .82, u), 900, 1.2);
  cam([-2, 7, 30], [-40, 18, -110], [-3, 7, 26], [-44, 14, -110], ease(u), 46);
  env.shake = .5; env.shadowAt = new THREE.Vector3(-10, 0, 0); env.shadowSpan = 50;
};
S[32] = (t, u) => { // and straight into the river
  env.mode = 'night'; env.rain = .6; env.windows = true;
  T.crackSegs.forEach(s => s.visible = true); T.crack.scale.set(1.6, 1, 1);
  const front = lerp(.78, 1.05, ease(u)); avalanche(front, 520, 1.1);
  if (u < .7) jets(t, T.crackSegs.length, 1.6);
  if (u > .55) { const a = (u - .55) / .45; for (let i = 0; i < 140; i++) { const r = rng(i * 3 + 1); const ang = r() * 6.28, sp = 8 + r() * 14; P(-62 + Math.cos(ang) * sp * a, 2 + (r() * 22) * a - 14 * a * a, -112 + Math.sin(ang) * sp * a * .6, .8 + r() * 1.6, r() < .5 ? '#ffffff' : '#9fd0ff', r() * 9); } }
  cam([-56, 14, -72], [-62, 10, -118], [-56.5, 14, -76], [-62, 9, -118], ease(u), 50);
  env.shake = .5; env.shadowAt = new THREE.Vector3(-62, 0, -110); env.shadowSpan = 40;
};
S[33] = (t, u) => { // jammed like a giant cork
  env.mode = 'night'; env.rain = .5; env.windows = true;
  T.crackSegs.forEach(s => s.visible = true); T.crack.scale.set(1.6, 1, 1);
  T.plug.visible = true; T.plug.scale.setScalar(.4 + eOut(seg(u, 0, .35)) * .6);
  const pw = 1 - seg(u, 0, .4); if (pw > 0) jets(t, T.crackSegs.length, 1.6 * pw);
  for (let i = 0; i < 40; i++) { const r = rng(i + 400); P(-62 + (r() - .5) * 20, 1 + r() * 2, -114 + r() * 6, 1.5 + r() * 2, '#ffffff', r() * 5); }
  cam([-44, 24, -74], [-62, 11, -122], [-46, 22, -78], [-62, 11, -122], ease(u), 50);
  env.shadowAt = new THREE.Vector3(-62, 0, -115); env.shadowSpan = 30;
};
S[34] = (t, u) => { // two disasters cancelled each other out
  env.mode = 'night'; env.rain = .35 * (1 - u); env.windows = true; env.lamps = true; env.dawn = ease(u) * .55; dress(C.kid, true);
  T.cornice.visible = false; T.plug.visible = true;
  C.kid.at(towerTop.x, towerTop.y, towerTop.z + .8, .3).face('happy').armsUp(.9); C.kid.lArm.rotation.z += Math.sin(t * 8) * .1; C.kid.rArm.rotation.z -= Math.sin(t * 8) * .1;
  cam([18, 38, -30], [-19, 24, -76], [14, 36, -34], [-19, 25, -76], ease(u), 46);
  env.shadowAt = new THREE.Vector3(-15, 0, -60); env.shadowSpan = 50;
};
// ----- the ceremony (day) -----
function ceremonyBase(t) { env.mode = 'day'; T.cornice.visible = false; T.plug.visible = true; env.shadowAt = new THREE.Vector3(0, 0, -52); env.shadowSpan = 30; }
S[35] = (t, u) => { // the mayor gives me a medal
  ceremonyBase(t);
  C.kid.at(-2, 1.2, -59.5, .2).face(u > .55 ? 'happy' : 'grin');
  C.mayor.at(1.6, 1.2, -60.2, -1.1).face('smile').idle(t); const give = ease(seg(u, .25, .6)); C.mayor.rArm.rotation.x = -1.4 * give * (1 - seg(u, .7, 1)); C.mayor.lArm.rotation.x = -1.2 * give * (1 - seg(u, .7, 1));
  medal.visible = u > .55;
  seatCrowd(t, { cheer: u > .55 ? 1 : 0, faceExpr: u > .55 ? 'happy' : undefined }); family(t);
  if (u > .55) for (const k of ['mom', 'dad']) C[k].jazz(t + (k === 'mom' ? .3 : 0)).face('happy');
  cam([-.4, 6.2, -50.6], [-.2, 4, -60], [-.4, 6, -51.6], [-.2, 4, -60], ease(u), 50);
};
S[36] = (t, u) => { // MAYOR: and a fine. for shouting.
  ceremonyBase(t);
  C.kid.at(-2, 1.2, -59.5, .2).face('happy'); medal.visible = true;
  C.mayor.at(1.6, 1.2, -60.2, -.85).face(u < .5 ? 'whisper' : 'smug').idle(t); C.mayor.hold(fine, 'r'); C.mayor.rArm.rotation.x = -1.35; fine.position.set(0, -.3, .4); fine.rotation.set(Math.PI / 2, 0, 0);
  C.mayor.lArm.rotation.x = -2.3; C.mayor.lArm.rotation.z = -.5;   // hand to mouth, whispering
  cam([4.8, 6.6, -52.8], [.8, 5.4, -60.2], [4.4, 6.5, -53.6], [.8, 5.4, -60.2], ease(u), 40);
};
S[37] = (t, u) => { // five hundred dollars
  ceremonyBase(t);
  C.kid.at(-2, 1.2, -59.5, 0).face('cry'); medal.visible = true; C.kid.hold(fine, 'r'); C.kid.rArm.rotation.x = -1.2; C.kid.lArm.rotation.x = -1.2; C.kid.lArm.rotation.z = .5; fine.position.set(-.6, .2, .3); fine.rotation.set(-.2, 0, 0); fine.scale.setScalar(1.25);
  C.kid.head.rotation.x = .12 + Math.sin(t * 3) * .03;
  cam([-2.2, 4.9, -54.6], [-2, 4.1, -59.5], [-2.1, 4.7, -55.6], [-2, 4.1, -59.5], ease(u), 40);
};
function blownAway(t) { const k = eOut((t - .3) / .55); return k; }
S[38] = (t, u) => { // then Dad stood up
  ceremonyBase(t);
  seatCrowd(t, { faceExpr: 'worried' }); family(t, { dad: 'skip' });
  const up = ease(seg(u, .15, .6));
  C.dad.at(-8, lerp(1.35 - .5, 0, up), lerp(-49.7, -51.2, up), Math.PI).face('determined'); C.dad.lLeg.rotation.x = C.dad.rLeg.rotation.x = -1.57 * (1 - up); C.dad.body.position.y = -1 * (1 - up);
  cam([-4.5, 4.6, -57], [-8, 3.6, -50], [-4.8, 4.6, -56.3], [-8, 3.8, -50], ease(u), 46);
};
S[39] = (t, u) => { // DAD: he saved this town
  ceremonyBase(t);
  seatCrowd(t, { faceExpr: 'gasp' }); family(t, { dad: 'skip' });
  C.dad.at(-8, 0, -51.2, Math.PI + .15).face('angry').point('r', .3); C.dad.rArm.rotation.x += Math.sin(t * 9) * .08;
  cam([-7.2, 4.9, -55.8], [-8, 3.8, -50.8], [-7.4, 4.9, -55.1], [-8, 3.8, -50.8], ease(u), 42);
};
S[40] = (t, u) => { // then Mom
  ceremonyBase(t);
  seatCrowd(t, { faceExpr: 'gasp' }); family(t, { dad: 'skip', mom: 'skip' });
  C.dad.at(-8, 0, -51.2, Math.PI).face('determined').crossArms();
  const up = ease(seg(u, .1, .55));
  C.mom.at(-11, lerp(.85, 0, up), lerp(-49.7, -51.2, up), Math.PI).face('determined'); C.mom.lLeg.rotation.x = C.mom.rLeg.rotation.x = -1.57 * (1 - up); C.mom.body.position.y = -1 * (1 - up);
  cam([-6, 4.6, -57], [-10, 3.8, -50], [-6.4, 4.6, -56.4], [-10, 3.9, -50], ease(u), 46);
};
S[41] = (t, u) => { // MOM: then fine all of us
  ceremonyBase(t);
  seatCrowd(t, { faceExpr: 'gasp' }); family(t, { dad: 'skip', mom: 'skip' });
  C.dad.at(-8, 0, -51.2, Math.PI).face('determined').crossArms();
  C.mom.at(-11, 0, -51.2, Math.PI - .15).face('angry').crossArms(); C.mom.head.rotation.z = Math.sin(t * 6) * .05;
  cam([-10.2, 4.9, -55.6], [-10.8, 3.8, -50.8], [-10.4, 4.9, -55], [-10.8, 3.8, -50.8], ease(u), 42);
};
S[42] = (t, u) => { // grandma puts down her knitting
  ceremonyBase(t);
  seatCrowd(t, { faceExpr: 'worried' }); family(t, { dad: 'skip', mom: 'skip', grandma: 'skip' });
  C.dad.at(-8, 0, -51.2, Math.PI).face('determined').crossArms(); C.mom.at(-11, 0, -51.2, Math.PI).face('determined').crossArms();
  seatOn(C.grandma, -5, 1.35, -49.7, Math.PI).face(u > .7 ? 'angry' : 'deadpan');
  const down = ease(seg(u, .15, .75));
  C.grandma.hold(knit, 'r'); knit.position.set(-.9, -.1, 0); C.grandma.forward(.75 * (1 - down) + .05); C.grandma.rArm.rotation.z = down * .25;
  C.grandma.head.rotation.x = -seg(u, .7, 1) * .1;
  cam([-4.2, 4.5, -55], [-5, 3.9, -50], [-4.5, 4.4, -54.2], [-5, 3.9, -50], ease(u), 40);
};
S[43] = (t, u) => { // GRANDMA: PAY IT YOURSELF, GERALD!  (whip-pan from her yell to the mayor flying)
  ceremonyBase(t);
  seatCrowd(t, { faceExpr: 'gasp' }); family(t, { dad: 'skip', mom: 'skip', grandma: 'skip' });
  C.dad.at(-8, 0, -51.2, Math.PI).face('gasp'); C.mom.at(-11, 0, -51.2, Math.PI).face('gasp');
  const up = ease(seg(t, 0, .2));
  C.grandma.at(-5, lerp(.9, 0, up), lerp(-49.7, -51.4, up), Math.PI).face('yell'); C.grandma.lLeg.rotation.x = C.grandma.rLeg.rotation.x = -1.57 * (1 - up); C.grandma.body.position.y = -1 * (1 - up);
  C.grandma.armsOut(.9); C.grandma.body.rotation.x = .15; C.grandma.shake(t, 1);
  const k = eOut((t - .45) / .55);
  C.mayor.at(1.6, lerp(1.2, 0, k) + Math.sin(k * Math.PI) * 3, lerp(-60.2, -68, k), 0).face(t > .45 ? 'gasp' : 'smug');
  C.mayor.group.rotation.x = -Math.sin(k * Math.PI) * .9 - k * .1; C.mayor.armsUp(k > 0 && k < 1 ? 1 : 0); if (k >= 1) C.mayor.sit();
  C.mayor.hat.position.set(0, 1.25 + k * 12, -k * 6); C.mayor.hat.rotation.set(k * 9, k * 4, 0); C.mayor.hat.visible = k < .95;
  shockwave(new THREE.Vector3(-5, 4.5, -52.4), .2, t, { speed: 22, count: 4, gap: .14, life: 1.1 });
  const w = ease(seg(t, .38, .62));
  cam([-3.2, 4.8, -56.6], [-5, 3.4, -51.4], [-3.2, 4.8, -56.6], [1.4, 7, -67], w, 52);
  env.shake = t > .2 ? .35 * (1 - u * .5) : 0;
};
S[44] = (t, u) => { // the mountain rumbled
  ceremonyBase(t);
  snowPuff(t, new THREE.Vector3(-20, 122, -222), 50, 2);
  cam([0, 3, -38], [-10, 95, -300], [0, 3.2, -38.5], [-10, 99, -300], ease(u), 46);
  env.shake = .35;
};
S[45] = (t, u) => { // everybody froze
  ceremonyBase(t);
  seatCrowd(t, { faceExpr: 'worried', lookUp: .55 }); family(t, { dad: 'skip', mom: 'skip', grandma: 'skip' });
  for (const [k, x] of [['dad', -8], ['mom', -11], ['grandma', -5]]) { C[k].at(x, 0, -51.2, Math.PI).face('worried'); C[k].head.rotation.x = -.55; }
  cam([-10, 7.6, -60], [-8, 3.8, -46], [7, 7.6, -60], [5, 3.8, -46], ease(u), 50);
};
S[46] = (t, u) => { // a little snow slid off the church roof
  ceremonyBase(t);
  C.mayor.at(1.6, 0, -68, 0).sit(); C.mayor.face(u < .45 ? 'dizzy' : 'gasp'); C.mayor.hat.visible = false; C.mayor.head.rotation.x = u > .45 ? -.5 : 0;
  const slide = eIn(seg(u, .05, .55)), fall = eIn(seg(u, .55, .85));
  const sn = T.roofSnowFront; sn.position.set(0, 17.31 - slide * 4.4 - fall * 13, 4.13 + slide * 4.2 + fall * 3.6); sn.rotation.x = .811 + fall * .7; sn.visible = u < .86;
  if (u > .85) { mound.visible = true; mound.position.set(1.6, 0, -67.9); mound.scale.set(1, eOut(seg(u, .85, .95)), 1); snowPuff(t - u * 0 - .85 * L46, new THREE.Vector3(1.6, 1, -67), 50, 1); }
  cam([9, 3.5, -54.5], [1.6, 10, -68], [8.6, 3.4, -55], [1.6, 9, -68], ease(u), 56);
  env.shake = u > .85 ? .25 : 0;
};
const L46 = LINES[45].dur;
S[47] = (t, u) => { // right onto the mayor
  ceremonyBase(t);
  mound.visible = true; mound.position.set(1.6, 0, -67.9);
  C.mayor.at(1.6, -.2, -68, 0).sit(); C.mayor.face('dizzy'); C.mayor.head.rotation.z = Math.sin(t * 5) * .12;
  const drop = eIn(seg(u, .25, .55)); C.mayor.hat.visible = u > .15; C.mayor.hat.position.set(0, lerp(14, 1.25, drop), 0); C.mayor.hat.rotation.set(0, (1 - drop) * 6, 0);
  if (u > .55) { const sq = Math.max(0, Math.sin((u - .55) * 30) * (1 - (u - .55) * 2.5)); C.mayor.head.scale.set(1 + sq * .15, 1 - sq * .2, 1 + sq * .15); }
  cam([1.8, 5.4, -61], [1.6, 3.8, -68], [1.8, 5.2, -62], [1.6, 3.9, -68], ease(u), 40);
  env.shadowAt = new THREE.Vector3(1.6, 0, -66); env.shadowSpan = 12;
};
S[48] = (t, u) => { // grandma picked her knitting back up
  ceremonyBase(t);
  seatCrowd(t, { faceExpr: 'happy' }); family(t, { grandma: 'skip' });
  seatOn(C.grandma, -5, 1.35, -49.7, Math.PI).face(u > .5 ? 'smile' : 'deadpan');
  const up = ease(seg(u, .1, .6)); C.grandma.hold(knit, 'r'); knit.position.set(-.9, -.1, 0); C.grandma.forward(.05 + .7 * up); C.grandma.lArm.rotation.x += Math.sin(t * 12) * .08 * up; C.grandma.rArm.rotation.x -= Math.sin(t * 12) * .08 * up;
  seatOn(C.kid, -2.6, 1.35, -49.7, Math.PI).face('grin'); medal.visible = true; C.kid.head.rotation.y = -.4;
  cam([-3.4, 4.2, -55.6], [-4.2, 3.1, -50], [-3.6, 4.1, -55], [-4.2, 3.1, -50], ease(u), 44);
};
S[49] = (t, u) => { // GRANDMA: runs in the family
  ceremonyBase(t);
  seatCrowd(t, { faceExpr: 'happy' }); family(t, { grandma: 'skip' });
  // Grandma and the boy turn to look at each other; she whispers the line (lip-synced) and winks on "family"
  const turn = ease(seg(t, 0, .25)), lvl = mouthAt(49, t);
  seatOn(C.grandma, -5, 1.35, -49.7, Math.PI - .2 - turn * .3).face(t > 1.0 ? 'winkTalk' + lvl : lvl ? 'smileTalk' + lvl : 'smile');
  C.grandma.hold(knit, 'r'); knit.position.set(-.9, -.1, 0); C.grandma.forward(.7); C.grandma.head.rotation.y = -turn * .35; C.grandma.head.rotation.z = -.06;
  C.grandma.body.rotation.z = -.04; C.grandma.head.rotation.x = .05 * Math.sin(t * 6) * (lvl ? 1 : 0);
  seatOn(C.kid, -2.6, 1.35, -49.7, Math.PI + .2 + turn * .3).face(t > 1.15 ? 'happy' : 'grin'); medal.visible = true; C.kid.head.rotation.y = turn * .35; C.kid.head.rotation.x = -.12;
  cam([-3.8, 4.3, -58.4], [-3.8, 3.2, -50], [-3.8, 4.2, -57.6], [-3.8, 3.2, -50], ease(u), 44);
};
S[50] = (t, u) => { // end card: the town by day, rising
  env.mode = 'day'; T.cornice.visible = false; T.plug.visible = true;
  cam([0, 22, 80], [0, 26, -100], [0, 34, 72], [0, 40, -100], ease(u), 50);
  env.shadowAt = new THREE.Vector3(0, 0, 0); env.shadowSpan = 80;
};

// ---------- frame ----------
const out = document.getElementById('out');
const ctx = out.getContext('2d');
export function draw(frame) {
  const t = frame / FPS, L = shotAt(t), lt = t - L.start, u = clamp(lt / L.dur);
  resetAll(t);
  S[L.n](lt, u, L);
  applyEnv();
  renderer.render(scene, camera);
  ctx.drawImage(renderer.domElement, 0, 0, W, H);
  if (L.endCard) drawEndCard(ctx, lt, L.dur, W, H); else drawCaption(ctx, L, lt, W, H);
}
export { FRAMES, FPS, CUES, DURATION };
