// World building: town, sky, bus crash, cafeteria, classroom, house interior, bedroom, dining room.
import * as THREE from 'three';
import { box, cyl, mat, basic, rng, textTex } from './lib.js';

export const SET = {
  house: new THREE.Vector3(0, 0, 200), bedroom: new THREE.Vector3(80, 0, 200), dining: new THREE.Vector3(140, 0, 200),
  cafe: new THREE.Vector3(200, 0, 0), class: new THREE.Vector3(300, 0, 0), bus: new THREE.Vector3(-200, 0, 0), sky: new THREE.Vector3(0, 300, -600),
};
const HOUSE_COLS = ['#ff8fb1', '#7fc8ff', '#ffd166', '#9be27a', '#c9a0ff', '#ff9f68', '#6fe3d4', '#f78fff'];
const ROOF_COLS = ['#e0475e', '#3b5bdb', '#2f9e44', '#f08c00', '#7048e8', '#c2255c'];

function roofMesh(w, d, color) {
  const g = new THREE.ConeGeometry(Math.max(w, d) * 0.74, 3.2, 4, 1); g.rotateY(Math.PI / 4); g.scale(w / Math.max(w, d), 1, d / Math.max(w, d));
  const m = new THREE.Mesh(g, mat(color)); m.castShadow = true; return m;
}
function tree(x, z, s = 1) {
  const g = new THREE.Group(); const t = cyl(0.35, 0.45, 2.6, '#8a5a35', 8); t.position.y = 1.3; g.add(t);
  const l = box(3.2, 2.8, 3.2, '#3fbf5f', 0, 3.6, 0, 0.6); g.add(l); g.add(box(2.2, 1.8, 2.2, '#58d878', 0, 5.2, 0, 0.5));
  g.position.set(x, 0, z); g.scale.setScalar(s); return g;
}
function bigTree(x, z, s = 1) {
  const g = new THREE.Group(); const t = cyl(0.7, 0.95, 6.5, '#8a5a35', 8); t.position.y = 3.25; g.add(t);
  g.add(box(7.5, 5.5, 7.5, '#2f9e44', 0, 8.2, 0, 1.4), box(6.2, 4.2, 6.2, '#40c057', 0.6, 11.2, -0.3, 1.2), box(4.2, 3.2, 4.2, '#51cf66', -0.3, 13.6, 0.3, 1.0), box(3.6, 3.2, 3.6, '#37b24d', 2.8, 7.6, 1.8, 0.9));
  g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = (x * 7 + z * 3) % 6; return g;
}
function lamp(x, z) { const g = new THREE.Group(); const p = cyl(0.12, 0.15, 6, '#4b4f63', 8); p.position.y = 3; g.add(p); g.add(box(1.1, 0.3, 0.5, '#4b4f63', 0.45, 6, 0)); const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.35), basic('#fff6c7')); b.position.set(0.6, 5.83, 0); g.add(b); g.position.set(x, 0, z); return g; }
function cloud(x, y, z, s) { const g = new THREE.Group(); const m = basic('#ffffff'); [[0, 0, 0, 3], [2.4, -0.4, 0.3, 2.2], [-2.3, -0.5, 0, 2.3], [0.8, 1.2, -0.3, 2]].forEach(([a, b, c, r]) => { const k = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); k.position.set(a, b, c); g.add(k); }); g.position.set(x, y, z); g.scale.setScalar(s); return g; }

export function buildWorld(scene) {
  const W = { glows: [], porch: [], houses: [] };
  // ---------- TOWN ----------
  const town = new THREE.Group(); scene.add(town);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat('#6fd16a')); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; town.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 260), mat('#4a4e5e')); road.rotation.x = -Math.PI / 2; road.position.y = 0.02; road.receiveShadow = true; town.add(road);
  for (let z = -125; z < 130; z += 7) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3.2), basic('#ffd84a')); s.rotation.x = -Math.PI / 2; s.position.set(0, 0.04, z); town.add(s); }
  [-7.5, 7.5].forEach((x) => { const sw = box(5, 0.3, 260, '#d9d6e3', x, 0.15, 0); sw.castShadow = false; town.add(sw); });
  const R = rng(9);
  // big two-storey houses (people are ~6.5 units tall; houses ~16-19, trees ~12-17)
  for (let i = 0; i < 14; i++) {
    for (const side of [-1, 1]) {
      const z = -112 + i * 18; const w = 13 + R() * 3, d = 12, h = 11 + R() * 3; const x = side * (15.5 + d / 2);
      const hg = new THREE.Group(); hg.position.set(x, 0, z); hg.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      const col = HOUSE_COLS[(i * 2 + (side > 0 ? 1 : 0)) % HOUSE_COLS.length]; const rcol = ROOF_COLS[(i + (side > 0 ? 3 : 0)) % ROOF_COLS.length];
      hg.add(box(w, h, d, col, 0, h / 2, 0)); hg.add(box(w + 0.3, 0.5, d + 0.3, '#ffffff', 0, h * 0.5, 0));
      const rf = roofMesh(w + 1.6, d + 1.6, rcol); rf.scale.y = 1.8; rf.position.y = h + 2.8; hg.add(rf);
      hg.add(box(1.4, 4, 1.4, '#9c4a3a', w * 0.28, h + 3.2, -1.5));
      const winMat = new THREE.MeshBasicMaterial({ color: '#2b3550' });
      const win = (wx, wy) => { const wm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 0.15), winMat); wm.position.set(wx, wy, d / 2 + 0.05); hg.add(wm);
        hg.add(box(2.6, 0.25, 0.35, '#ffffff', wx, wy - 1.3, d / 2 + 0.12), box(2.6, 0.25, 0.25, '#ffffff', wx, wy + 1.3, d / 2 + 0.1), box(0.2, 2.4, 0.25, '#ffffff', wx, wy, d / 2 + 0.1));
        [-1.5, 1.5].forEach((sx) => hg.add(box(0.7, 2.6, 0.2, rcol, wx + sx, wy, d / 2 + 0.1))); };
      [-w / 3, w / 3].forEach((wx) => { win(wx, h * 0.27 + 0.4); win(wx, h * 0.75); }); win(0, h * 0.75);
      hg.add(box(2.4, 4.6, 0.25, '#6b3f22', 0, 2.3, d / 2 + 0.08), box(3.0, 0.35, 0.4, '#ffffff', 0, 4.75, d / 2 + 0.15), box(0.25, 0.25, 0.4, '#ffd43b', 0.8, 2.3, d / 2 + 0.25));
      hg.add(box(4.8, 0.3, 2.2, '#ffffff', 0, 5.4, d / 2 + 1.1), box(0.3, 5.2, 0.3, '#ffffff', -2.2, 2.6, d / 2 + 2.0), box(0.3, 5.2, 0.3, '#ffffff', 2.2, 2.6, d / 2 + 2.0));
      hg.add(box(4.4, 0.4, 2.2, '#c8b89a', 0, 0.2, d / 2 + 1.1), box(2.6, 0.12, 4.4, '#c8b89a', 0, 0.06, d / 2 + 4.4));
      const plMat = new THREE.MeshBasicMaterial({ color: '#3a3a30' }); const pl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), plMat); pl.position.set(1.8, 4.2, d / 2 + 0.3); hg.add(pl);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffcf6b', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(7, 7, 1); glow.position.set(1.8, 4.2, d / 2 + 0.7); hg.add(glow);
      [-1, 1].forEach((sx) => { for (let b = 0; b < 3; b++) hg.add(box(1.8 + R() * 0.6, 1.4 + R() * 0.6, 1.6, ['#2f9e44', '#37b24d', '#40c057'][b], sx * (2.8 + b * 1.9), 0.75, d / 2 + 0.9, 0.55)); });
      if (R() < 0.6) { hg.add(box(0.15, 1.6, 0.15, '#495057', 1.9, 0.8, d / 2 + 6.3), box(0.8, 0.6, 1.0, ['#e03131', '#1c7ed6', '#2f9e44'][i % 3], 1.9, 1.8, d / 2 + 6.3, 0.15)); }
      for (let f = -w / 2; f <= w / 2; f += 1.3) { if (Math.abs(f) < 1.8) continue; hg.add(box(0.25, 1.4, 0.2, '#ffffff', f, 0.7, d / 2 + 6.9)); }
      hg.add(box(w / 2 - 1.6, 0.2, 0.15, '#ffffff', -w / 4 - 0.9, 1.1, d / 2 + 6.9), box(w / 2 - 1.6, 0.2, 0.15, '#ffffff', w / 4 + 0.9, 1.1, d / 2 + 6.9));
      town.add(hg); W.houses.push({ g: hg, winMat, plMat, glow, x, z, side });
      if (i % 2 === 0) town.add(bigTree(side * 13.6, z + 9, 0.8 + R() * 0.2));
      town.add(bigTree(side * (31 + R() * 6), z + (R() - 0.5) * 10, 1.0 + R() * 0.5));
      if (i % 2 === 1) { const l = lamp(side * 10.3, z + 9); l.scale.setScalar(1.45); if (side > 0) l.rotation.y = Math.PI; town.add(l); }
    }
  }
  // background woods beyond the back yards
  for (let k = 0; k < 90; k++) { const sd = k % 2 ? 1 : -1; town.add(bigTree(sd * (42 + R() * 60), -140 + R() * 280, 1.1 + R() * 0.7)); }
  // birds (V flocks) + more clouds, animated in W.animTown
  W.birds = [];
  const birdMat = basic('#2b2d42');
  const flock = (n, path) => { for (let k = 0; k < n; k++) { const b = new THREE.Group(); b.add(box(0.5, 0.35, 1.1, null, 0, 0, 0, 0.1, birdMat));
      const wl = new THREE.Group(), wr = new THREE.Group(); wl.add(box(1.8, 0.1, 0.7, null, -0.9, 0, 0, 0, birdMat)); wr.add(box(1.8, 0.1, 0.7, null, 0.9, 0, 0, 0, birdMat)); b.add(wl, wr);
      b.scale.setScalar(2.0); town.add(b); W.birds.push({ b, wl, wr, k, path }); } };
  flock(5, { o: [126, 27, -50], v: [7, 0, 0] }); flock(4, { o: [55, 38, 120], v: [0, 0, -6.5] }); flock(5, { o: [-72, 22, 6], v: [-6, 0, 0] }); flock(3, { o: [-30, 34, -40], v: [5, 0, 3] });
  W.animTown = (T) => {
    W.birds.forEach(({ b, wl, wr, k, path }) => { const o = path.o, v = path.v; const sp = Math.hypot(v[0], v[2]); const dx = v[0] / sp, dz = v[2] / sp;
      const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2); const along = -Math.abs(off) * 2.6, side = off * 2.4;
      const t = ((T * sp) % 280 + 280) % 280 - 140; b.position.set(o[0] + dx * (t + along) - dz * side, o[1] + Math.sin(T * 2 + k) * 0.6, o[2] + dz * (t + along) + dx * side);
      b.rotation.y = Math.atan2(dx, dz); const fl = Math.sin(T * 9 + k * 1.3) * 0.6; wl.rotation.z = fl; wr.rotation.z = -fl; });
    W.clouds.children.forEach((c, i) => { if (!c.userData.b) c.userData.b = c.position.clone(); const b = c.userData.b; c.position.x = ((b.x + T * (2.5 + (i % 3) * 0.8) + 200) % 400) - 200; });
  };
  // bus stop
  const stop = new THREE.Group(); stop.position.set(8.5, 0.3, -8);
  stop.add(box(0.2, 4, 0.2, '#4b4f63', -2, 2, -1), box(0.2, 4, 0.2, '#4b4f63', 2, 2, -1), box(4.8, 0.2, 2.4, '#3b5bdb', 0, 4.1, -0.2), box(4.4, 3.4, 0.1, '#bfe6ff', 0, 2.1, -1.2), box(3.6, 0.3, 1, '#8a5a35', 0, 1.2, -0.6));
  const sign = box(0.9, 0.9, 0.1, '#ffd84a', 2.8, 3.5, 0); stop.add(sign); const sp = cyl(0.08, 0.08, 3.5, '#4b4f63'); sp.position.set(2.8, 1.75, -0.05); stop.add(sp);
  stop.rotation.y = -Math.PI / 2; town.add(stop);
  // crater lawn (front yard of house at x=-19, z=-6)
  const crater = new THREE.Group(); crater.position.set(-12.5, 0, 18);
  const cd = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), mat('#6b4a2e')); cd.rotation.x = -Math.PI / 2; cd.position.y = 0.05; crater.add(cd);
  const cd2 = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), mat('#4a3020')); cd2.rotation.x = -Math.PI / 2; cd2.position.y = 0.07; crater.add(cd2);
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; const b = box(1 + (k % 3) * 0.3, 0.6 + (k % 2) * 0.4, 0.9, '#7d5836', Math.cos(a) * 3.4, 0.3, Math.sin(a) * 3.4, 0.15); b.rotation.y = a; b.rotation.z = 0.3; crater.add(b); }
  town.add(crater); W.crater = crater;
  W.clouds = new THREE.Group(); [[-60, 60, -150, 3], [40, 70, -170, 4], [90, 50, -120, 2.5], [-110, 55, -60, 3], [0, 80, -220, 5], [70, 65, 60, 3], [-150, 62, 20, 3.5], [150, 58, -40, 3], [20, 72, 90, 3.2], [-80, 66, -110, 2.6], [120, 75, 60, 4], [-30, 58, -60, 2.2], [60, 64, -60, 2.8], [-120, 70, 100, 3.6], [110, 52, -200, 3.8], [-20, 66, 30, 2.4]].forEach((c) => W.clouds.add(cloud(...c))); town.add(W.clouds);

  // ---------- SKY (skydive) ----------
  const sky = new THREE.Group(); sky.position.copy(SET.sky); scene.add(sky); W.skyG = sky;
  const R2 = rng(77); W.skyClouds = [];
  for (let i = 0; i < 26; i++) { const c = cloud((R2() - 0.5) * 70, R2() * 260 - 200, -18 - R2() * 40, 1 + R2() * 1.8); sky.add(c); W.skyClouds.push(c); }
  const plane = new THREE.Group(); plane.add(box(14, 3, 3, '#f1f3f5', 0, 0, 0, 0.8), box(4, 0.4, 16, '#e03131', 1, 0, 0), box(2, 3, 0.3, '#e03131', -6.5, 2, 0), box(1.6, 1.4, 3.05, '#5c7cfa', 6, 0.4, 0, 0.3));
  for (let k = 0; k < 4; k++) plane.add(box(0.9, 0.9, 3.1, '#5c7cfa', 3 - k * 2.2, 0.5, 0, 0.2));
  sky.add(plane); W.plane = plane;
  // ---------- BUS CRASH ----------
  const bus = new THREE.Group(); bus.position.copy(SET.bus); scene.add(bus);
  const br = new THREE.Mesh(new THREE.PlaneGeometry(14, 160), mat('#5a5e6b')); br.rotation.x = -Math.PI / 2; br.position.y = 0.02; br.receiveShadow = true; bus.add(br);
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat('#3f9a4f')); bg.rotation.x = -Math.PI / 2; bg.position.y = 0.012; bg.receiveShadow = true; bus.add(bg);
  // wrecked bus (local +z = front): crushed nose, shattered windows, dents, hanging door, missing wheel
  const bb = new THREE.Group(); const Y = '#ffc61a', Yd = '#d9a40f';
  bb.add(box(4.4, 4.2, 10.5, Y, 0, 2.6, -1.6, 0.3));
  const nose = new THREE.Group(); nose.add(box(4.3, 3.6, 3.2, Yd, 0, 0, 0, 0.25)); nose.add(box(4.0, 1.2, 2.2, '#8a6a10', 0, -1.2, 1.0)); nose.position.set(0.3, 2.3, 5.0); nose.rotation.set(0.25, 0.35, -0.12); nose.scale.set(1, 0.85, 0.7); bb.add(nose);
  bb.add(box(4.6, 0.5, 1.2, '#3a3a3a', 0.4, 1.0, 6.4).rotateZ(0.3).rotateY(0.4));
  const R4 = rng(31);
  for (let k = 0; k < 6; k++) { const z = -6 + k * 1.9; const broken = k % 2 === 1 || k === 4;
    bb.add(box(4.52, 1.2, 1.6, broken ? '#0a0b10' : '#2a3040', 0, 3.4, z));
    if (broken) for (let q = 0; q < 4; q++) { const sh = box(0.05, 0.35 + R4() * 0.5, 0.25 + R4() * 0.3, '#d7e6f2', 2.27, 3.0 + R4() * 0.8, z - 0.6 + R4() * 1.2); sh.rotation.x = R4() * 2; bb.add(sh); } }
  for (let k = 0; k < 7; k++) { const d = box(0.3, 0.8 + R4(), 1.2 + R4() * 1.5, '#9c7a12', 2.12 + R4() * 0.1, 1.6 + R4() * 2, -6 + R4() * 10, 0.2); d.rotation.set(R4() * 0.5, 0, R4() * 0.5); bb.add(d); }
  bb.add(box(4.5, 0.3, 14.1, '#222', 0, 1.6, -0.5));
  for (let k = 0; k < 9; k++) { const sc = box(0.25 + R4() * 0.5, 0.1, 1.5 + R4() * 3, ['#5c4308', '#2b2b2b', '#7a5c0c'][k % 3], (R4() - 0.5) * 3.4, 4.72, -6.5 + R4() * 10); sc.rotation.y = (R4() - 0.5) * 0.8; bb.add(sc); }
  [[-0.6, -3.5, 2.2], [0.8, 0.5, 1.6], [-0.9, 2.6, 1.3]].forEach(([x, z, r]) => { const dn = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 6), mat('#a8820e')); dn.scale.set(1, 0.18, 1.3); dn.position.set(x, 4.62, z); bb.add(dn); });
  bb.add(box(4.6, 0.4, 0.3, '#5c4308', 0, 4.6, -1.0).rotateX(0.15));
  [[-4.5, -2.1], [-4.5, 2.1], [4.5, -2.1]].forEach(([zz, xx]) => { const w = cyl(1, 1, 0.6, '#1a1a1a', 14); w.rotation.z = Math.PI / 2; w.position.set(xx, 0.9, zz); bb.add(w); });
  const door = box(0.15, 3.0, 1.4, Yd, -2.5, 2.0, 3.3); door.rotation.set(0.5, 0.9, 0.3); bb.add(door);
  bb.rotation.z = 1.35; bb.rotation.y = 0.5; bb.position.set(2.5, 0.6, 0); bus.add(bb);
  const wheel = cyl(1, 1, 0.6, '#1a1a1a', 14); wheel.position.set(-4.5, 0.32, 6.5); bus.add(wheel);
  W.fire = new THREE.PointLight('#ff8a2a', 0, 18, 1.4); W.fire.position.set(5, 2.5, 5.5); bus.add(W.fire);
  W.fireGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffb05a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); W.fireGlow.scale.set(5, 5, 1); W.fireGlow.position.set(5, 2.4, 5.2); bus.add(W.fireGlow);
  // torn-up road: skid marks, cracks, potholes, broken centre line, debris, glass, smashed guardrail
  for (let z = -78; z < 80; z += 6) { if (Math.abs(z + 2) < 14) continue; const dsh = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3), basic('#c9b458')); dsh.rotation.x = -Math.PI / 2; dsh.position.set(0, 0.03, z); bus.add(dsh); }
  for (let side of [-1.1, 1.1]) for (let k = 0; k < 26; k++) { const t = k / 25; const x = -1.5 + side + Math.sin(t * 2.2) * 4.2 * t, z = 38 - t * 34; const sk = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.6), basic('#0b0b0d')); sk.rotation.x = -Math.PI / 2; sk.rotation.z = -Math.cos(t * 2.2) * 0.9 * t; sk.position.set(x, 0.035, z); bus.add(sk); }
  for (let k = 0; k < 22; k++) { const cr = box(0.12, 0.04, 1.5 + R4() * 3.5, '#0e0f13', (R4() - 0.5) * 12, 0.04, -14 + R4() * 34); cr.rotation.y = R4() * 3; cr.castShadow = false; bus.add(cr); }
  [[-3.5, 12, 1.4], [4.8, -6, 1.1], [-1.5, 22, 0.9], [2.5, 15, 0.7], [-4.5, -3, 1.0]].forEach(([x, z, r]) => { const ph = new THREE.Mesh(new THREE.CircleGeometry(r, 10), basic('#08080a')); ph.rotation.x = -Math.PI / 2; ph.position.set(x, 0.04, z); bus.add(ph); });
  const oil = new THREE.Mesh(new THREE.CircleGeometry(2.4, 18), new THREE.MeshPhongMaterial({ color: '#050507', shininess: 120, specular: '#888' })); oil.rotation.x = -Math.PI / 2; oil.position.set(-0.5, 0.045, 5.5); oil.scale.set(1.4, 0.8, 1); bus.add(oil);
  for (let k = 0; k < 34; k++) { const db = box(0.3 + R4() * 0.9, 0.2 + R4() * 0.4, 0.3 + R4() * 0.9, ['#ffc61a', '#3a3a3a', '#d9a40f', '#6b6b6b'][k % 4], (R4() - 0.5) * 14, 0.15, -6 + R4() * 26); db.rotation.set(R4() * 3, R4() * 3, R4() * 3); bus.add(db); }
  for (let k = 0; k < 60; k++) { const gl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.12), basic('#e8f4ff')); gl.position.set((R4() - 0.5) * 12, 0.06, -2 + R4() * 16); gl.rotation.y = R4() * 3; bus.add(gl); }
  for (let z = -60; z < 60; z += 4) { const broken = z > -4 && z < 12; const px = 7.6; if (!broken) { bus.add(box(0.3, 1.6, 0.3, '#9aa0a8', px, 0.8, z)); bus.add(box(0.2, 0.5, 4.05, '#c4c9d0', px - 0.2, 1.35, z + 2)); } }
  const rail = box(0.2, 0.5, 6, '#c4c9d0', 9.5, 1.1, 5); rail.rotation.set(0.4, 0.8, 0.5); bus.add(rail); const rail2 = box(0.2, 0.5, 5, '#c4c9d0', 8.6, 0.5, -1); rail2.rotation.set(-0.3, -0.5, 1.2); bus.add(rail2);
  // pine forest on both sides of the road
  { const Rf = rng(123); const pts = [];
    const segD = (x, z) => { const ax = -20, az = 30, bx = 3, bz = 2; const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2))); return Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az)); };
    while (pts.length < 280) { const x = (Rf() - 0.5) * 150, z = -95 + Rf() * 140; if (Math.abs(x) < 10.5) continue; if (segD(x, z) < 9 || Math.hypot(x + 18, z - 28) < 14) continue; pts.push([x, z, 0.8 + Rf() * 0.9]); }
    const trunkG = new THREE.CylinderGeometry(0.35, 0.5, 3, 7), tiers = [[3.4, 4.2, 4.2], [2.7, 3.6, 6.4], [1.9, 3.0, 8.4]].map(([r, h, y]) => ({ g: new THREE.ConeGeometry(r, h, 8), y }));
    const tI = new THREE.InstancedMesh(trunkG, mat('#5a3d27'), pts.length); tI.castShadow = true;
    const cI = tiers.map((t, i) => { const m = new THREE.InstancedMesh(t.g, mat(['#1f6b3a', '#26804a', '#2f9457'][i]), pts.length); m.castShadow = true; m.receiveShadow = true; return m; });
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), P = new THREE.Vector3();
    pts.forEach(([x, z, sc], i) => { Q.setFromEuler(new THREE.Euler(0, Rf() * 6, 0)); Sv.set(sc, sc * (0.9 + Rf() * 0.4), sc); P.set(x, 1.5 * Sv.y, z); M.compose(P, Q, Sv); tI.setMatrixAt(i, M); cI.forEach((m, k) => { P.set(x, tiers[k].y * Sv.y, z); M.compose(P, Q, Sv); m.setMatrixAt(i, M); }); });
    bus.add(tI, ...cI); }
  // smoke
  W.smoke = makeParticles(scene, 70, '#9a9a9a', 3.2); W.smoke.material.blending = THREE.NormalBlending;
  const cop = new THREE.Group(); cop.add(box(3.6, 1.6, 7, '#f8f9fa', 0, 1.2, 0, 0.3), box(3.4, 1.3, 3.6, '#1c1f2b', 0, 2.5, -0.3, 0.3)); W.siren = [box(0.9, 0.35, 0.6, '#ff2a40', -0.6, 3.3, -0.3), box(0.9, 0.35, 0.6, '#2a6bff', 0.6, 3.3, -0.3)]; W.siren.forEach((s) => { s.material = basic(s.material.color.getStyle()); cop.add(s); });
  cop.position.set(9, 0, 8); cop.rotation.y = -0.9; bus.add(cop);
  W.copLights = [new THREE.PointLight('#ff2a40', 0, 40, 1.5), new THREE.PointLight('#2a6bff', 0, 40, 1.5)]; W.copLights.forEach((l, i) => { l.position.set(9 + (i ? 1 : -1), 4.5, 6.5); bus.add(l); });
  for (let k = 0; k < 4; k++) { const c = box(0.6, 1.2, 0.6, '#ff7a1a', -2 + k * 2.6, 0.6, 9 + (k % 2)); c.geometry = new THREE.ConeGeometry(0.5, 1.3, 8); bus.add(c); }
  // rain
  const N = 2400; const rp = new Float32Array(N * 6); const R3 = rng(5); W.rainBase = [];
  for (let i = 0; i < N; i++) { W.rainBase.push([R3() * 60 - 30, R3() * 40, R3() * 60 - 30]); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  W.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#b8d4ff', transparent: true, opacity: 0.55 })); W.rain.frustumCulled = false; scene.add(W.rain); W.rain.visible = false;

  // ---------- CAFETERIA ----------
  const cafe = new THREE.Group(); cafe.position.copy(SET.cafe); scene.add(cafe);
  room(cafe, 36, 28, 9, '#f4e9d8', '#ffd9a8', '#cfe8ff');
  const ctr = box(16, 2.6, 2.4, '#b8c4d6', -4, 1.3, -9.5); cafe.add(ctr); cafe.add(box(16.4, 0.3, 2.8, '#e6ebf2', -4, 2.7, -9.5));
  for (let k = 0; k < 5; k++) cafe.add(box(2, 0.6, 1.4, ['#ff6b6b', '#ffd43b', '#69db7c', '#ff922b', '#74c0fc'][k], -10 + k * 3, 3.1, -9.6, 0.2));
  cafe.add(box(14, 4, 0.2, '#ff8fb1', -4, 6, -13.8)); cafe.add(new THREE.Mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshBasicMaterial({ map: textTex(512, 128, (c, w, h) => { c.fillStyle = '#fff'; c.font = '700 70px Fredoka'; c.textAlign = 'center'; c.fillText('TODAY: PIZZA', w / 2, 90); }), transparent: true })).translateX(-4).translateY(6).translateZ(-13.6));
  W.cafeTables = [];
  [[-8, 0], [6, 0], [-8, 8], [6, 8]].forEach(([x, z]) => { const t = new THREE.Group(); t.add(box(10, 0.4, 3, '#f8f9fa', 0, 2.5, 0), box(0.4, 2.4, 0.4, '#868e96', -4, 1.2, 0), box(0.4, 2.4, 0.4, '#868e96', 4, 1.2, 0), box(10, 0.3, 1, '#4dabf7', 0, 1.4, -2.2), box(10, 0.3, 1, '#4dabf7', 0, 1.4, 2.2)); t.position.set(x, 0, z); cafe.add(t); W.cafeTables.push(t); });
  W.tray = tray(); cafe.add(W.tray);
  // --- cafeteria dressing ---
  { const fl = textTex(512, 512, (c, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#e9f2ff' : '#7fb2e5'; c.fillRect(x * 64, y * 64, 64, 64); } });
    fl.wrapS = fl.wrapT = THREE.RepeatWrapping; fl.repeat.set(4.5, 3.5); const fm = new THREE.Mesh(new THREE.PlaneGeometry(36, 28), new THREE.MeshLambertMaterial({ map: fl })); fm.rotation.x = -Math.PI / 2; fm.position.y = 0.012; fm.receiveShadow = true; cafe.add(fm);
    const poster = (w, h, x, y, z, ry, draw) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: textTex(Math.round(w * 64), Math.round(h * 64), draw) })); m.position.set(x, y, z); m.rotation.y = ry; cafe.add(m); };
    const title = (c, w, t, y, col, size) => { c.fillStyle = col; c.font = `700 ${size}px Fredoka`; c.textAlign = 'center'; c.fillText(t, w / 2, y); };
    poster(4.4, 5.6, 7.5, 5.2, -13.75, 0, (c, w, h) => { c.fillStyle = '#fff3bf'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f08c00'; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14); title(c, w, 'EAT YOUR', 60, '#2b8a3e', 40); title(c, w, 'VEGGIES!', 104, '#2b8a3e', 46);
      c.fillStyle = '#ff922b'; c.beginPath(); c.moveTo(w / 2 - 40, 150); c.lineTo(w / 2 + 40, 150); c.lineTo(w / 2, 320); c.fill(); c.fillStyle = '#40c057'; c.fillRect(w / 2 - 30, 120, 18, 34); c.fillRect(w / 2 - 6, 110, 14, 44); c.fillRect(w / 2 + 14, 122, 16, 32);
      c.fillStyle = '#212529'; c.beginPath(); c.arc(w / 2 - 14, 200, 6, 0, 7); c.arc(w / 2 + 14, 200, 6, 0, 7); c.fill(); c.lineWidth = 5; c.strokeStyle = '#212529'; c.beginPath(); c.arc(w / 2, 222, 14, 0.2, 2.9); c.stroke(); });
    poster(4.0, 5.0, 13.2, 5.0, -13.75, 0, (c, w, h) => { c.fillStyle = '#d0ebff'; c.fillRect(0, 0, w, h); title(c, w, 'GOT', 70, '#1864ab', 54); title(c, w, 'MILK?', 125, '#1864ab', 54);
      c.fillStyle = '#fff'; c.fillRect(w / 2 - 45, 160, 90, 130); c.fillStyle = '#4dabf7'; c.fillRect(w / 2 - 45, 200, 90, 40); c.beginPath(); c.moveTo(w / 2 - 45, 160); c.lineTo(w / 2, 125); c.lineTo(w / 2 + 45, 160); c.fill(); });
    poster(6.4, 4.4, -13.5, 5.6, -13.75, 0, (c, w, h) => { c.fillStyle = '#212529'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c08457'; c.lineWidth = 16; c.strokeRect(8, 8, w - 16, h - 16); title(c, w, 'LUNCH MENU', 62, '#ffd43b', 46);
      c.font = '600 30px Fredoka'; c.textAlign = 'left'; c.fillStyle = '#f1f3f5'; ['MON  Tacos', 'TUE  Spaghetti', 'WED  Pizza  ★', 'THU  Chicken Nuggets', 'FRI  Mystery Meat'].forEach((t, i) => c.fillText(t, 40, 112 + i * 34)); });
    poster(8, 1.6, -4, 8.2, -13.75, 0, (c, w, h) => { c.fillStyle = '#7048e8'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w - 40, h / 2); c.lineTo(w, h); c.lineTo(0, h); c.lineTo(40, h / 2); c.fill(); title(c, w, 'GO TIGERS!', 70, '#ffd43b', 62); });
    poster(4.2, 5.2, -17.75, 5.2, 6, Math.PI / 2, (c, w, h) => { c.fillStyle = '#e6fcf5'; c.fillRect(0, 0, w, h); title(c, w, 'WASH', 70, '#0ca678', 56); title(c, w, 'YOUR', 125, '#0ca678', 56); title(c, w, 'HANDS!', 180, '#0ca678', 56);
      c.fillStyle = '#74c0fc'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(60 + (i * 37) % (w - 100), 230 + (i % 3) * 30, 12, 0, 7); c.fill(); } });
    poster(4.2, 4.4, -17.75, 5.2, -4, Math.PI / 2, (c, w, h) => { c.fillStyle = '#fff5f5'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e03131'; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14); title(c, w, 'NO', 80, '#e03131', 60); title(c, w, 'RUNNING!', 150, '#e03131', 50); title(c, w, '🏃', 230, '#e03131', 60); });
    poster(3.6, 4.4, 17.75, 5.4, -4, -Math.PI / 2, (c, w, h) => { c.fillStyle = '#fff9db'; c.fillRect(0, 0, w, h); title(c, w, 'SCIENCE', 70, '#5f3dc4', 40); title(c, w, 'FAIR', 115, '#5f3dc4', 44); title(c, w, 'FRIDAY!', 160, '#e8590c', 40); c.fillStyle = '#5f3dc4'; c.beginPath(); c.arc(w / 2, 215, 26, 0, 7); c.fill(); });
    // clock
    const ck = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 24), new THREE.MeshLambertMaterial({ map: textTex(128, 128, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#212529'; c.lineWidth = 8; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.stroke(); c.lineWidth = 6; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 24); c.moveTo(64, 64); c.lineTo(92, 70); c.stroke(); }) }));
    ck.rotation.x = Math.PI / 2; ck.position.set(2, 7.6, -13.7); cafe.add(ck);
    // exit doors on right wall
    cafe.add(box(0.3, 6.2, 6.2, '#495057', 17.8, 3.1, 8)); cafe.add(box(0.35, 5.6, 2.7, '#a5d8ff', 17.7, 2.9, 6.6)); cafe.add(box(0.35, 5.6, 2.7, '#a5d8ff', 17.7, 2.9, 9.4));
    const ex = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: textTex(160, 60, (c, w, h) => { c.fillStyle = '#2b8a3e'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '700 44px Fredoka'; c.textAlign = 'center'; c.fillText('EXIT', w / 2, 46); }) })); ex.position.set(17.6, 6.9, 8); ex.rotation.y = -Math.PI / 2; cafe.add(ex);
    // windows on left wall
    [10, -10].forEach((z) => { const wd = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.6), basic('#bfe6ff')); wd.position.set(-17.75, 5.4, z); wd.rotation.y = Math.PI / 2; cafe.add(wd); cafe.add(box(0.3, 0.3, 5.4, '#fff', -17.7, 3.5, z), box(0.3, 3.8, 0.25, '#fff', -17.7, 5.4, z)); });
    // vending machine, milk cooler, trash + recycling, tray stack, sneeze guard
    cafe.add(box(3, 6.5, 2, '#e03131', 15.4, 3.25, -11.8, 0.15), box(2.2, 4.2, 0.1, '#1c1f2b', 15.1, 4.0, -10.75));
    for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) cafe.add(box(0.5, 0.7, 0.08, ['#ffd43b', '#69db7c', '#4dabf7', '#ff922b'][r], 14.5 + q * 0.6, 5.4 - r * 0.95, -10.7));
    cafe.add(box(3.4, 3.2, 2, '#f8f9fa', 9.5, 1.6, -12.4, 0.1), box(3, 1.8, 0.08, '#d0ebff', 9.5, 2.0, -11.38)); for (let q = 0; q < 5; q++) cafe.add(box(0.45, 0.7, 0.45, q % 2 ? '#ffd43b' : '#ffffff', 8.4 + q * 0.55, 1.5, -11.6, 0.08));
    const bin = (x, z, col, lid) => { const b = cyl(0.9, 0.75, 2.6, col, 14); b.position.set(x, 1.3, z); cafe.add(b); const l = cyl(0.95, 0.95, 0.2, lid, 14); l.position.set(x, 2.65, z); cafe.add(l); };
    bin(16.2, 2.2, '#495057', '#343a40'); bin(16.2, 4.4, '#1c7ed6', '#1864ab');
    for (let q = 0; q < 8; q++) cafe.add(box(2.4, 0.15, 1.6, '#ff922b', 5.3, 2.9 + q * 0.17, -9.5, 0.05));
    const glass = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 1.4), new THREE.MeshLambertMaterial({ color: '#d0ebff', transparent: true, opacity: 0.45 })); glass.position.set(-4, 4.6, -9.2); cafe.add(glass);
    cafe.add(box(0.15, 1.8, 0.15, '#adb5bd', -11.5, 3.7, -8.6), box(0.15, 1.8, 0.15, '#adb5bd', 3.5, 3.7, -8.6));
    // pendant lights
    for (let x = -10; x <= 10; x += 10) for (let z = -6; z <= -6; z += 12) { cafe.add(box(0.1, 2.5, 0.1, '#495057', x, 8.4, z)); const sh = cyl(0.3, 1.2, 0.8, '#ffd43b', 16); sh.position.set(x, 6.9, z); cafe.add(sh); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), basic('#fff9db')); bl.position.set(x, 6.5, z); cafe.add(bl); }
    // table props: napkin dispensers, ketchup + mustard, trays at seats
    [[-8, 0], [6, 0], [-8, 8], [6, 8]].forEach(([x, z]) => { cafe.add(box(0.7, 0.8, 0.5, '#adb5bd', x - 1.5, 3.1, z, 0.08)); cafe.add(box(0.3, 0.8, 0.3, '#e03131', x - 0.6, 3.1, z, 0.1)); cafe.add(box(0.3, 0.8, 0.3, '#fab005', x - 0.1, 3.1, z, 0.1)); });
    [[-11, -0.9], [-6, -0.9], [-9, 0.9], [-10.5, 7.1], [-6.5, 7.1], [-5, 8.9]].forEach(([x, z]) => { const t = tray(); t.scale.setScalar(0.85); t.position.set(x, 2.78, z); cafe.add(t); });
  }
  // ---------- CLASSROOM ----------
  const cls = new THREE.Group(); cls.position.copy(SET.class); scene.add(cls);
  room(cls, 32, 26, 9, '#e9f7ef', '#a8e6cf', '#fff3bf');
  W.boardCanvas = document.createElement('canvas'); W.boardCanvas.width = 1024; W.boardCanvas.height = 400; W.boardTex = new THREE.CanvasTexture(W.boardCanvas); W.boardTex.colorSpace = THREE.SRGBColorSpace; W.boardTex.anisotropy = 8;
  W.drawBoard = (step, arrow) => { const key = step + '|' + Math.round(arrow * 20); if (W.boardKey === key) return; W.boardKey = key; const c = W.boardCanvas.getContext('2d'), w = 1024, h = 400;
    c.fillStyle = '#1f5137'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < 40; k++) c.fillRect((k * 173) % w, (k * 97) % h, 60, 6);
    c.fillStyle = '#f1f3f5'; c.font = '700 64px Fredoka'; c.textAlign = 'center'; c.fillText('ATTENDANCE', 640, 70); c.fillRect(640 - 210, 82, 420, 5);
    const names = [['Ava', 330, 160], ['Ben', 330, 250], ['Cleo', 330, 340], ['Mason', 680, 160], ['Dev', 680, 250], ['Ella', 680, 340]]; const order = [0, 1, 2, 4, 5];
    c.textAlign = 'left'; c.font = '700 72px Fredoka';
    names.forEach(([n, x, y], i) => { c.fillStyle = i === 3 ? '#ffec99' : '#f1f3f5'; c.fillText(n, x, y); });
    order.forEach((ni, k) => { if (k < step) { const [, x, y] = names[ni]; c.strokeStyle = '#8ce99a'; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 200, y - 30); c.lineTo(x + 222, y - 5); c.lineTo(x + 262, y - 60); c.stroke(); } });
    if (arrow > 0) { c.strokeStyle = '#ff8787'; c.lineWidth = 9; c.lineCap = 'round'; c.setLineDash([18, 14]); c.beginPath(); const sx = 500, sy = 318, ex = 670, ey = 228; const n = Math.max(2, Math.floor(arrow * 40));
      for (let q = 0; q <= n; q++) { const t = q / 40; const x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * 640 + t * t * ex, y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * 20 + t * t * ey; q ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.setLineDash([]);
      if (arrow >= 1) { c.fillStyle = '#ff8787'; c.beginPath(); c.moveTo(ex + 10, ey + 6); c.lineTo(ex - 22, ey - 22); c.lineTo(ex - 26, ey + 16); c.fill(); c.font = '700 40px Fredoka'; c.textAlign = 'left'; c.fillText('skipped?', 545, 122); } }
    W.boardTex.needsUpdate = true; };
  W.drawBoard(0, 0);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.5), new THREE.MeshLambertMaterial({ map: W.boardTex }));
  board.position.set(0, 4.8, -12.6); cls.add(board); cls.add(box(14.6, 6.1, 0.15, '#8a5a35', 0, 4.8, -12.72));
  cls.add(box(5, 2.4, 2.2, '#8a5a35', -7, 1.2, -9));
  W.desks = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const d = new THREE.Group();
    d.add(box(2.8, 0.25, 1.9, '#ffd8a8', 0, 2.45, 0), box(2.6, 1.0, 1.7, '#e9b97a', 0, 1.85, 0.0), box(0.18, 2.3, 0.18, '#868e96', -1.2, 1.15, -0.8), box(0.18, 2.3, 0.18, '#868e96', 1.2, 1.15, -0.8));
    d.add(box(0.9, 0.12, 1.2, ['#ff6b6b', '#4dabf7', '#ffd43b', '#69db7c'][(r + c) % 4], -0.5, 2.62, 0.1), box(0.08, 0.08, 1.0, '#ffd43b', 0.6, 2.62, 0.1));
    const ch = new THREE.Group(); ch.add(box(2.0, 0.25, 1.7, '#4dabf7', 0, 1.5, 0), box(2.0, 2.2, 0.25, '#4dabf7', 0, 2.7, 0.85), box(0.15, 1.5, 0.15, '#495057', -0.85, 0.75, -0.7), box(0.15, 1.5, 0.15, '#495057', 0.85, 0.75, -0.7), box(0.15, 1.5, 0.15, '#495057', -0.85, 0.75, 0.7), box(0.15, 1.5, 0.15, '#495057', 0.85, 0.75, 0.7));
    ch.position.set(0, 0, 1.75); d.add(ch); d.position.set(-9 + c * 6, 0, -3 + r * 5); cls.add(d); W.desks.push(d); }
  // classroom dressing
  { cls.add(box(32, 7, 0.4, '#e9f7ef', 0, 12.5, -13), box(0.4, 7, 26, '#a8e6cf', -16, 12.5, 0), box(0.4, 7, 26, '#a8e6cf', 16, 12.5, 0));
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 1.9), new THREE.MeshLambertMaterial({ map: textTex(1280, 166, (c, w, h) => { c.fillStyle = '#ffd43b'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f08c00'; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14);
      const t = 'WELCOME TO 5TH GRADE!'; c.font = '700 104px Fredoka'; c.textAlign = 'center'; let x = w / 2 - c.measureText(t).width / 2; c.textAlign = 'left'; for (const ch of t) { c.fillStyle = ['#e03131', '#1c7ed6', '#2f9e44', '#7048e8', '#e8590c'][(x | 0) % 5]; c.fillText(ch, x, 122); x += c.measureText(ch).width; } }) }));
    ban.position.set(0, 11.2, -12.75); cls.add(ban);
    for (let k = 0; k < 26; k++) { const tri = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.0, 3), mat(['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#b197fc'][k % 5])); tri.rotation.x = Math.PI; const x = -15 + k * 1.2; tri.position.set(x, 14.0 - 0.6 * Math.sin((k / 25) * Math.PI), -12.6); cls.add(tri); }
    const poster = (w, h, x, y, z, ry, draw) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: textTex(Math.round(w * 64), Math.round(h * 64), draw) })); m.position.set(x, y, z); m.rotation.y = ry; cls.add(m); };
    const t2 = (c, w, t, y, col, size) => { c.fillStyle = col; c.font = `700 ${size}px Fredoka`; c.textAlign = 'center'; c.fillText(t, w / 2, y); };
    poster(30, 1.1, 0, 8.3, -12.75, 0, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); const L = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz'; for (let i = 0; i < 26; i++) { c.fillStyle = ['#e03131', '#1c7ed6', '#2f9e44', '#f08c00', '#7048e8'][i % 5]; c.font = '700 44px Fredoka'; c.textAlign = 'center'; c.fillText(L.substr(i * 2, 2), (i + 0.5) * w / 26, 54); } });
    poster(4.2, 5, 10.8, 4.8, -12.75, 0, (c, w, h) => { c.fillStyle = '#e7f5ff'; c.fillRect(0, 0, w, h); t2(c, w, 'MATH', 64, '#1864ab', 50); t2(c, w, 'IS FUN!', 116, '#1864ab', 46); c.font = '700 54px Fredoka'; ['2+2=4', '5×3=15', '9−4=5'].forEach((q, i) => { c.fillStyle = ['#e03131', '#2f9e44', '#f08c00'][i]; c.fillText(q, w / 2, 180 + i * 50); }); });
    poster(4.2, 5, -10.8, 4.8, -12.75, 0, (c, w, h) => { c.fillStyle = '#0b1640'; c.fillRect(0, 0, w, h); t2(c, w, 'SOLAR SYSTEM', 50, '#ffd43b', 30); const cols = ['#ffd43b', '#adb5bd', '#ffa94d', '#4dabf7', '#ff6b6b', '#e599f7', '#ffe066', '#99e9f2']; cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(40 + i * 28, 170 + Math.sin(i) * 40, i ? 8 + (i % 4) * 3 : 26, 0, 7); c.fill(); }); });
    poster(5, 3.6, -15.75, 5.2, -4, Math.PI / 2, (c, w, h) => { c.fillStyle = '#74c0fc'; c.fillRect(0, 0, w, h); c.fillStyle = '#69db7c'; [[60, 60, 70, 50], [150, 50, 60, 70], [230, 120, 50, 40], [90, 150, 40, 60]].forEach(([x, y, a, b]) => { c.beginPath(); c.ellipse(x, y, a / 2, b / 2, 0.3, 0, 7); c.fill(); }); t2(c, w, 'WORLD MAP', 220, '#fff', 30); });
    poster(4, 4.6, -15.75, 5.2, 4, Math.PI / 2, (c, w, h) => { c.fillStyle = '#fff3bf'; c.fillRect(0, 0, w, h); t2(c, w, 'READING', 70, '#e8590c', 40); t2(c, w, 'IS A', 115, '#e8590c', 36); t2(c, w, 'SUPERPOWER!', 160, '#e8590c', 30); c.fillStyle = '#7048e8'; c.fillRect(w / 2 - 50, 190, 100, 60); c.fillStyle = '#fff'; c.fillRect(w / 2 - 3, 190, 6, 60); });
    [-6, 6].forEach((z) => { const wd = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.8), basic('#bfe6ff')); wd.position.set(15.75, 5.2, z); wd.rotation.y = -Math.PI / 2; cls.add(wd); cls.add(box(0.3, 0.3, 5.4, '#fff', 15.7, 3.2, z), box(0.3, 3.9, 0.25, '#fff', 15.7, 5.2, z)); });
    const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 24), new THREE.MeshLambertMaterial({ map: textTex(128, 128, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#212529'; c.lineWidth = 8; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.stroke(); c.lineWidth = 6; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 26); c.moveTo(64, 64); c.lineTo(86, 80); c.stroke(); }) }));
    ck.rotation.x = Math.PI / 2; ck.position.set(9.6, 8.1 - 0.6, -12.7); cls.add(ck);
    const ap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), mat('#e03131')); ap.position.set(-8.2, 2.85, -9); cls.add(ap); cls.add(box(0.08, 0.3, 0.08, '#5c3d2e', -8.2, 3.35, -9));
    const gb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), mat('#4dabf7')); gb.position.set(-5.4, 3.45, -9.3); cls.add(gb); cls.add(box(0.5, 0.3, 0.5, '#5c3d2e', -5.4, 2.55, -9.3));
    cls.add(box(1.4, 0.4, 1.0, '#7048e8', -6.8, 2.6, -8.8), box(1.3, 0.35, 0.95, '#ffd43b', -6.8, 2.95, -8.8));
    cls.add(box(5, 6, 1.6, '#a9744f', 12.8, 3, -11.6)); for (let r = 0; r < 4; r++) { cls.add(box(4.6, 0.2, 1.5, '#8a5a35', 12.8, 0.8 + r * 1.5, -11.5)); for (let b = 0; b < 8; b++) cls.add(box(0.45, 1.0 + (b % 3) * 0.12, 1.1, ['#e03131', '#1c7ed6', '#2f9e44', '#f08c00', '#7048e8'][(b + r) % 5], 10.9 + b * 0.52, 1.4 + r * 1.5, -11.45)); }
    cls.add(box(14, 0.25, 0.5, '#8a5a35', 0, 1.95, -12.45), box(1.0, 0.15, 0.2, '#fff', -4, 2.15, -12.4), box(1.0, 0.25, 0.4, '#343a40', 3, 2.2, -12.4));
  }

  // ---------- HOUSE INTERIOR ----------
  const H = new THREE.Group(); H.position.copy(SET.house); scene.add(H); W.houseG = H;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), mat('#c08457')); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.012; fl.receiveShadow = true; H.add(fl);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), mat('#d94f70')); rug.rotation.x = -Math.PI / 2; rug.position.set(-4, 0.03, 4); H.add(rug);
  H.add(box(30, 10, 0.4, '#9fd3ff', 0, 5, -12)); H.add(box(0.4, 10, 24, '#ffd6a5', -15, 5, 0)); H.add(box(0.4, 10, 24, '#ffd6a5', 15, 5, 0));
  // front wall with door opening (door at x=0, width 3.2, height 6.6)
  H.add(box(13.4, 10, 0.4, '#ffd6a5', -8.3, 5, 12)); H.add(box(13.4, 10, 0.4, '#ffd6a5', 8.3, 5, 12)); H.add(box(3.2, 3.4, 0.4, '#ffd6a5', 0, 8.3, 12));
  H.add(box(3.8, 0.3, 0.5, '#fff', 0, 6.7, 12)); H.add(box(0.3, 6.8, 0.5, '#fff', -1.75, 3.4, 12)); H.add(box(0.3, 6.8, 0.5, '#fff', 1.75, 3.4, 12));
  // exterior siding for porch view
  H.add(box(30, 10, 0.2, '#7fc8ff', 0, 5, 12.35).translateX(0)); H.children[H.children.length - 1].position.set(0, 5, 12.3); H.children[H.children.length - 1].visible = false;
  W.door = new THREE.Group(); const dp = box(3.1, 6.5, 0.3, '#7a4a2a', 1.55, 3.25, 0); W.door.add(dp); W.door.add(box(0.25, 0.25, 0.5, '#ffd43b', 2.6, 3.2, 0.1)); W.door.add(box(2.2, 2, 0.35, '#8f5a35', 1.55, 4.6, 0)); W.door.add(box(2.2, 2, 0.35, '#8f5a35', 1.55, 1.9, 0));
  W.door.position.set(-1.55, 0, 12); H.add(W.door);
  // porch
  const porch = box(12, 0.4, 7, '#a0785a', 0, 0.2, 15.7); H.add(porch); H.add(box(2, 0.25, 1, '#bf9a7a', 0, 0.12, 19.6));
  const pfront = new THREE.Mesh(new THREE.PlaneGeometry(40, 18), mat('#7fc8ff')); pfront.position.set(0, 8, 12.22); H.add(pfront);
  const pground = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), mat('#2f6b3a')); pground.rotation.x = -Math.PI / 2; pground.position.set(0, 0.01, 160); H.add(pground);
  // night street seen from the porch: road, sidewalks, houses with lit windows, street lamps, trees
  { const Rs = rng(77);
    const rd = new THREE.Mesh(new THREE.PlaneGeometry(400, 11), mat('#3c404c')); rd.rotation.x = -Math.PI / 2; rd.position.set(0, 0.03, 40); H.add(rd);
    for (let x = -190; x < 190; x += 7) { const dl = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.4), basic('#d8b93a')); dl.rotation.x = -Math.PI / 2; dl.position.set(x, 0.05, 40); H.add(dl); }
    [33.2, 46.8].forEach((z) => H.add(box(400, 0.3, 3, '#b9b6c6', 0, 0.15, z)));
    H.add(box(3, 0.2, 10, '#c8b89a', 0, 0.1, 25.8));
    const winOn = basic('#ffd27a'), winOff = basic('#232a45');
    const housesAt = (z, flip, n0, n1, step) => { for (let i = n0; i <= n1; i++) { const x = i * step + (Rs() - 0.5) * 2; const w = 9 + Rs() * 3, h = 5 + Rs() * 2.5, d = 8; const g = new THREE.Group(); g.position.set(x, 0, z); if (flip) g.rotation.y = Math.PI;
      g.add(box(w, h, d, HOUSE_COLS[(i + 40) % HOUSE_COLS.length], 0, h / 2, 0)); const rf = roofMesh(w + 1, d + 1, ROOF_COLS[(i + 42) % ROOF_COLS.length]); rf.position.y = h + 1.6; g.add(rf);
      g.add(box(1.6, 3, 0.2, '#6b3f22', 0, 1.5, d / 2 + 0.05));
      [-w / 3, w / 3].forEach((wx) => { const wm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 0.15), Rs() < 0.7 ? winOn : winOff); wm.position.set(wx, h * 0.55, d / 2 + 0.06); g.add(wm); });
      if (Rs() < 0.6) { const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffcf6b', transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.set(5, 5, 1); gl.position.set(1.4, 3.3, d / 2 + 0.6); g.add(gl); }
      H.add(g); } };
    housesAt(58, true, -9, 9, 14); housesAt(92, true, -11, 11, 15); housesAt(-200, false, 0, -1, 1);
    for (let x = -84; x <= 84; x += 21) { const lp = new THREE.Group(); const p = cyl(0.14, 0.18, 7, '#4b4f63', 8); p.position.y = 3.5; lp.add(p); lp.add(box(1.2, 0.3, 0.5, '#4b4f63', 0, 7, -0.4));
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 0.4), basic('#fff6c7')); b.position.set(0, 6.83, -0.5); lp.add(b);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffe7a3', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.set(7, 7, 1); gl.position.set(0, 6.6, -0.5); lp.add(gl);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(4.5, 20), new THREE.MeshBasicMaterial({ color: '#ffe0a0', transparent: true, opacity: 0.16, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.06, -1.8); lp.add(pool);
      lp.position.set(x + 8, 0, 34); H.add(lp); }
    for (let k = 0; k < 26; k++) { const x = (Rs() - 0.5) * 180; if (Math.abs(x) < 9) continue; H.add(tree(x, 24 + Rs() * 6, 0.9 + Rs() * 0.4)); }
    for (let k = 0; k < 30; k++) H.add(tree((Rs() - 0.5) * 300, 70 + Rs() * 50, 1 + Rs() * 0.6));
    const parked = new THREE.Group(); parked.add(box(3.4, 1.4, 6.5, '#e03131', 0, 1.0, 0, 0.3), box(3.0, 1.1, 3.4, '#1c1f2b', 0, 2.1, -0.4, 0.3)); parked.position.set(-14, 0, 44.5); parked.rotation.y = Math.PI / 2; H.add(parked); }
  W.porchLamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.5), basic('#ffe9a8')); W.porchLamp.position.set(2.6, 9.6, 12.6); H.add(W.porchLamp);
  W.porchLight = new THREE.PointLight('#ffd58a', 0, 30, 1.2); W.porchLight.position.set(2.6, 10.2, 14); H.add(W.porchLight);
  [-5.5, 5.5].forEach((x) => H.add(box(0.5, 11.6, 0.5, '#fff', x, 5.8, 18.8)));
  H.add(box(12.6, 0.5, 7.4, '#5b3a29', 0, 11.8, 15.7));
  // couch
  W.couch = new THREE.Group(); W.couchL = new THREE.Group(); W.couchR = new THREE.Group();
  [W.couchL, W.couchR].forEach((g, i) => { const s = i ? 1 : -1; g.add(box(3.6, 1.4, 3.2, '#6c63ff', s * 1.8, 0.9, 0, 0.2), box(3.6, 2.4, 0.9, '#5a52e0', s * 1.8, 2, -1.3, 0.25), box(0.8, 2, 3.2, '#5a52e0', s * 3.6, 1.2, 0, 0.25)); W.couch.add(g); });
  W.couch.position.set(-4, 0, 2); H.add(W.couch);
  // TV + stand
  H.add(box(5, 1.2, 1.4, '#3d3d4e', -4, 0.6, -10.8)); W.tv = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 0.25), basic('#1a1d2b')); W.tv.position.set(-4, 3, -11.2); H.add(W.tv);
  // stairs
  for (let k = 0; k < 10; k++) H.add(box(4, 0.8 * (k + 1), 1.6, '#a0785a', 12.8, 0.4 * (k + 1), 9 - k * 1.6));
  H.add(box(0.25, 3, 16, '#fff', 10.7, 5.5, 1.8).rotateX(-0.47));
  H.add(box(5, 0.5, 6, '#a0785a', 12.5, 8.2, -8.5));
  // kitchen counter
  H.add(box(9, 2.8, 3, '#e9ecef', -9.5, 1.4, -9.8)); H.add(box(9.4, 0.3, 3.3, '#495057', -9.5, 2.95, -9.8));
  H.add(box(0.8, 1.2, 0.8, '#ff6b6b', -12, 3.7, -9.8, 0.2)); H.add(box(0.5, 0.8, 0.5, '#ffd43b', -7, 3.5, -9.8, 0.1));
  // lamp + armchair
  const fl1 = cyl(0.12, 0.12, 5, '#495057'); fl1.position.set(-13.5, 2.5, -2); H.add(fl1); H.add(box(1.6, 1.2, 1.6, '#fff3bf', -13.5, 5.4, -2, 0.2));
  W.lampLight = new THREE.PointLight('#ffcf8a', 0, 40, 1.2); W.lampLight.position.set(-12.5, 5.5, -1); H.add(W.lampLight);
  W.armchair = new THREE.Group(); W.armchair.add(box(3.4, 1.4, 3, '#2f9e44', 0, 0.9, 0, 0.25), box(3.4, 2.8, 0.8, '#2b8a3e', 0, 2.2, -1.2, 0.25), box(0.7, 2, 3, '#2b8a3e', -1.7, 1.3, 0, 0.2), box(0.7, 2, 3, '#2b8a3e', 1.7, 1.3, 0, 0.2));
  W.armchair.position.set(6.5, 0, 0); W.armchair.rotation.y = -0.5; H.add(W.armchair);
  // pictures
  [[-8, 6], [-3, 6.5], [3, 6]].forEach(([x, y], i) => H.add(box(2.2, 2.6, 0.15, ['#ffd43b', '#74c0fc', '#ff8787'][i], x, y, -11.75)));
  // remote, pan
  W.remote = box(0.35, 0.15, 1, '#212529'); scene.add(W.remote);
  W.pan = new THREE.Group(); const pn = cyl(0.9, 0.75, 0.25, '#343a40', 20); W.pan.add(pn); W.pan.add(box(0.25, 0.15, 1.8, '#5c3d2e', 0, 0, 1.6)); scene.add(W.pan);
  W.doorDebris = [];

  // ---------- BEDROOM ----------
  const B = new THREE.Group(); B.position.copy(SET.bedroom); scene.add(B);
  room(B, 22, 18, 9, '#3b3f8f', '#5b4aa0', '#4c3f7a', true);
  const bed = new THREE.Group(); bed.add(box(5, 1.4, 9, '#8a5a35', 0, 0.7, 0), box(4.8, 0.6, 8.8, '#f1f3f5', 0, 1.7, 0), box(4.9, 0.4, 5.6, '#4dabf7', 0, 2.1, 1.5), box(3, 0.6, 1.6, '#fff', 0, 2.2, -3.4, 0.25), box(5.2, 3.4, 0.5, '#8a5a35', 0, 1.7, -4.6));
  bed.position.set(0, 0, -2); B.add(bed); W.bed = bed;
  // ---- gamer boy's room dressing ----
  { const P = (w, h, x, y, z, ry, draw, glow = 0.55) => { const t = textTex(Math.round(w * 64), Math.round(h * 64), draw); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: t, emissive: new THREE.Color(glow, glow, glow), emissiveMap: t })); m.position.set(x, y, z); m.rotation.y = ry; B.add(m); return m; };
    const T = (c, w, t, y, col, size, stroke) => { c.font = `700 ${size}px Fredoka`; c.textAlign = 'center'; if (stroke) { c.lineWidth = size / 5; c.strokeStyle = stroke; c.strokeText(t, w / 2, y); } c.fillStyle = col; c.fillText(t, w / 2, y); };
    // posters: original game titles
    P(3.6, 5, -6.6, 5.4, -8.75, 0, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#4dabf7'); g.addColorStop(1, '#d0ebff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2f9e44'; c.beginPath(); c.moveTo(0, h * 0.75); c.lineTo(w * 0.3, h * 0.45); c.lineTo(w * 0.55, h * 0.7); c.lineTo(w * 0.8, h * 0.4); c.lineTo(w, h * 0.65); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.fillStyle = '#ffd43b'; c.fillRect(w / 2 - 22, h * 0.42, 44, 44); c.fillStyle = '#f5c99b'; c.fillRect(w / 2 - 18, h * 0.35, 36, 30); c.fillStyle = '#212529'; c.fillRect(w / 2 - 10, h * 0.38, 6, 6); c.fillRect(w / 2 + 4, h * 0.38, 6, 6); c.fillStyle = '#ced4da'; c.fillRect(w / 2 + 24, h * 0.3, 8, 60);
      T(c, w, 'BLOCK', 58, '#fff', 54, '#1864ab'); T(c, w, 'QUEST', 112, '#ffd43b', 54, '#1864ab'); });
    P(2.8, 3.9, 2.6, 5.9, -8.75, 0, (c, w, h) => { c.fillStyle = '#0b0f2e'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; for (let i = 0; i < 60; i++) c.fillRect((i * 67) % w, (i * 41) % h, 2, 2);
      c.fillStyle = '#ff6b6b'; c.beginPath(); c.moveTo(w * 0.2, h * 0.7); c.lineTo(w * 0.75, h * 0.55); c.lineTo(w * 0.8, h * 0.65); c.lineTo(w * 0.25, h * 0.8); c.fill(); c.fillStyle = '#ffd43b'; c.beginPath(); c.moveTo(w * 0.2, h * 0.7); c.lineTo(w * 0.05, h * 0.78); c.lineTo(w * 0.25, h * 0.8); c.fill();
      T(c, w, 'SPACE', 60, '#74c0fc', 50, '#000'); T(c, w, 'RACER 3', 112, '#ff6b6b', 46, '#000'); });
    P(4.2, 3.4, 10.75, 5.6, -3.5, -Math.PI / 2, (c, w, h) => { c.fillStyle = '#5f3dc4'; c.fillRect(0, 0, w, h); const px = 16; const helm = ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XX.XX.XX', 'XXXXXXXX', '.XX..XX.']; helm.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') { c.fillStyle = '#ced4da'; c.fillRect(w / 2 - 64 + x * px, 70 + y * px, px, px); } }));
      T(c, w, 'PIXEL KNIGHTS', 200, '#ffd43b', 34, '#000'); });
    P(3.6, 3.0, 10.75, 5.8, 7.2, -Math.PI / 2, (c, w, h) => { c.fillStyle = '#212529'; c.fillRect(0, 0, w, h); c.fillStyle = '#adb5bd'; c.fillRect(w / 2 - 60, 40, 120, 100); c.fillStyle = '#ff2a3a'; c.fillRect(w / 2 - 40, 70, 24, 18); c.fillRect(w / 2 + 16, 70, 24, 18); c.fillStyle = '#495057'; c.fillRect(w / 2 - 35, 110, 70, 12);
      T(c, w, 'ROBO RUMBLE', 190, '#69db7c', 36, '#000'); });
    P(1.6, 3.2, -10.75, 6.4, 5.5, Math.PI / 2, (c, w, h) => { c.fillStyle = '#e8590c'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h / 2); c.lineTo(0, h); c.fill(); c.save(); c.translate(30, h / 2); c.rotate(Math.PI / 2); c.fillStyle = '#fff'; c.font = '700 30px Fredoka'; c.textAlign = 'center'; c.fillText('TIGERS', 0, 10); c.restore(); });
    // gaming desk + monitor + chair (right wall)
    B.add(box(6, 0.3, 2.6, '#212529', 7.2, 3.1, -7.6), box(0.3, 2.6, 2.2, '#343a40', 4.5, 1.5, -7.8), box(0.3, 2.6, 2.2, '#343a40', 9.9, 1.5, -7.8));
    const scrT = textTex(320, 180, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5c7cfa'); g.addColorStop(1, '#a5d8ff'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#2f9e44'; c.fillRect(0, 140, w, 40); c.fillStyle = '#8a5a35'; c.fillRect(0, 150, w, 30);
      [[60, 110], [150, 90], [230, 115]].forEach(([x, y]) => { c.fillStyle = '#c08457'; c.fillRect(x, y, 48, 14); }); c.fillStyle = '#ffd43b'; [[80, 92], [170, 72], [250, 97]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); });
      c.fillStyle = '#ff6b6b'; c.fillRect(150, 112, 18, 28); c.fillStyle = '#f5c99b'; c.fillRect(151, 98, 16, 14); c.fillStyle = '#fff'; c.font = '700 18px Fredoka'; c.fillText('LVL 7   ★ 230', 10, 22); });
    const mon = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.9), new THREE.MeshBasicMaterial({ map: scrT })); mon.position.set(7.2, 4.75, -8.2); B.add(mon);
    B.add(box(3.6, 2.1, 0.2, '#111', 7.2, 4.75, -8.32), box(0.2, 0.9, 0.2, '#111', 7.2, 3.6, -8.4), box(2.2, 0.1, 0.8, '#343a40', 7.2, 3.3, -7.0), box(0.4, 0.12, 0.6, '#343a40', 8.9, 3.3, -7.0));
    for (let k = 0; k < 7; k++) B.add(box(0.25, 0.05, 0.06, ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'][k % 5], 6.3 + k * 0.3, 3.38, -6.7));
    const mg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#74c0fc', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); mg.scale.set(7, 5, 1); mg.position.set(7.2, 4.7, -7.9); B.add(mg);
    const hs = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.1, 8, 16, Math.PI), mat('#212529')); hs.position.set(5.3, 3.7, -7.6); B.add(hs);
    const chair = new THREE.Group(); chair.add(box(2.2, 0.5, 2.2, '#e03131', 0, 2.0, 0, 0.2), box(2.2, 3.4, 0.5, '#e03131', 0, 3.6, 1.0, 0.25), box(1.2, 1.6, 0.52, '#212529', 0, 3.9, 1.02, 0.15), box(0.3, 1.5, 0.3, '#495057', 0, 1.0, 0), box(1.8, 0.2, 0.3, '#495057', 0, 0.2, 0), box(0.3, 0.2, 1.8, '#495057', 0, 0.2, 0));
    chair.position.set(7.0, 0, -5.2); chair.rotation.y = 0.35; B.add(chair);
    // TV dresser + console (back wall, left)
    B.add(box(2, 2.6, 4.6, '#a9744f', 9.8, 1.3, 2.2)); for (let k = 0; k < 2; k++) B.add(box(0.1, 0.1, 4.2, '#5c3d2e', 8.78, 0.9 + k * 1.0, 2.2));
    const tvT = textTex(256, 150, (c, w, h) => { c.fillStyle = '#0b0f2e'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff6b6b'; c.font = '700 26px Fredoka'; c.textAlign = 'center'; c.fillText('ROBO RUMBLE', w / 2, 60); c.fillStyle = '#fff'; c.font = '600 18px Fredoka'; c.fillText('PRESS START', w / 2, 100); });
    const tv = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.3), new THREE.MeshBasicMaterial({ map: tvT })); tv.position.set(10.45, 4.2, 2.2); tv.rotation.y = -Math.PI / 2; B.add(tv); B.add(box(0.2, 2.6, 4.3, '#111', 10.6, 4.2, 2.2));
    B.add(box(1.0, 0.35, 1.4, '#f8f9fa', 9.9, 2.78, 0.6, 0.08), box(0.45, 0.25, 0.7, '#343a40', 9.3, 2.72, 3.2, 0.1), box(0.45, 0.25, 0.7, '#1c7ed6', 9.5, 2.72, 4.0, 0.1));
    // shelf with trophies + toy robot (back wall right, above nightstand)
    B.add(box(4, 0.25, 1, '#a9744f', 7.4, 7.0, -8.4)); [[6.0, '#ffd43b'], [6.8, '#ced4da'], [7.5, '#e8a95c']].forEach(([x, col]) => { const cup = cyl(0.25, 0.12, 0.5, col, 10); cup.position.set(x, 7.6, -8.4); B.add(cup); B.add(box(0.4, 0.2, 0.4, '#343a40', x, 7.22, -8.4)); });
    const rb = new THREE.Group(); rb.add(box(0.6, 0.7, 0.5, '#adb5bd', 0, 0.35, 0), box(0.5, 0.45, 0.45, '#ced4da', 0, 0.95, 0), box(0.1, 0.1, 0.05, '#ff2a3a', -0.12, 1.0, 0.24), box(0.1, 0.1, 0.05, '#ff2a3a', 0.12, 1.0, 0.24)); rb.position.set(8.7, 7.13, -8.4); B.add(rb);
    // LED strips along the ceiling line
    [['#b197fc', [0, 8.7, -8.75], [22, 0.18, 0.1]], ['#22d3ee', [10.75, 8.7, 0], [0.1, 0.18, 18]], ['#b197fc', [-10.75, 8.7, 0], [0.1, 0.18, 18]]].forEach(([col, p, sz]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...sz), basic(col)); m.position.set(...p); B.add(m);
      for (let k = -4; k <= 4; k++) { const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: col, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })); g.scale.set(4, 2.4, 1); g.position.set(p[0] + (sz[0] > 1 ? k * 2.4 : 0), p[1] - 0.3, p[2] + (sz[2] > 1 ? k * 2.0 : 0)); B.add(g); } });
    // string lights above the bed
    for (let k = 0; k < 11; k++) { const x = -4 + k * 0.8, y = 7.3 - 0.45 * Math.sin((k / 10) * Math.PI); const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), basic(['#ffd43b', '#ff8787', '#74c0fc', '#69db7c'][k % 4])); b.position.set(x, y, -8.7); B.add(b);
      const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffe8a3', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })); g.scale.set(0.9, 0.9, 1); g.position.set(x, y, -8.6); B.add(g); }
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), mat('#2b2660')); ceil.rotation.x = Math.PI / 2; ceil.position.y = 9.05; B.add(ceil);
    // floor: round rug, beanbag, balls, skateboard, sneakers, laundry
    const rug = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), mat('#4dabf7')); rug.rotation.x = -Math.PI / 2; rug.position.set(-5, 0.03, 3.5); B.add(rug); const rug2 = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 32), mat('#ffd43b')); rug2.rotation.x = -Math.PI / 2; rug2.position.set(-5, 0.04, 3.5); B.add(rug2);
    const bb = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), mat('#40c057')); bb.scale.set(1.1, 0.7, 1.1); bb.position.set(-7.5, 1.0, 5.5); B.add(bb);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), mat('#f76707')); ball.position.set(-3.2, 0.55, 6.5); B.add(ball);
    const sb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), mat('#f8f9fa')); sb.position.set(4.2, 0.5, 6.8); B.add(sb);
    const sk = new THREE.Group(); sk.add(box(0.9, 0.12, 3.0, '#7048e8', 0, 0, 0, 0.05)); [-1.1, 1.1].forEach((z) => sk.add(box(0.9, 0.2, 0.2, '#ffd43b', 0, -0.16, z))); sk.position.set(10.4, 1.6, 7.2); sk.rotation.x = -1.2; sk.rotation.z = 0.15; B.add(sk);
    [[3.2, 2.6], [3.9, 2.9]].forEach(([x, z]) => B.add(box(0.6, 0.35, 1.1, '#e03131', x, 0.18, z, 0.12), box(0.62, 0.1, 1.12, '#fff', x, 0.05, z)));
    [['#228be6', -8.6, -6.4], ['#fa5252', -8.0, -6.0], ['#fab005', -8.4, -5.6]].forEach(([col, x, z], i) => { const l = box(1.6, 0.35, 1.2, col, x, 0.2 + i * 0.25, z, 0.15); l.rotation.y = i * 0.7; B.add(l); });
  }
  B.add(box(1.8, 2, 1.8, '#8a5a35', 3.8, 1, -5.4));
  W.clock = new THREE.Group(); const cb = box(1.4, 0.8, 0.6, '#212529', 0, 0.4, 0, 0.1); W.clock.add(cb);
  W.clockCanvas = document.createElement('canvas'); W.clockCanvas.width = 512; W.clockCanvas.height = 256; W.clockTex = new THREE.CanvasTexture(W.clockCanvas);
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.62), new THREE.MeshBasicMaterial({ map: W.clockTex, toneMapped: false })); cs.position.set(0, 0.4, 0.31); W.clock.add(cs);
  W.clock.position.set(3.4, 2, -5.2); W.clock.rotation.y = -0.3; B.add(W.clock);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), new THREE.MeshBasicMaterial({ map: textTex(256, 200, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1240'); g.addColorStop(1, '#283a8a'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#fff8d6'; c.beginPath(); c.arc(170, 60, 28, 0, 7); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 30; i++) c.fillRect((i * 97) % w, (i * 53) % 120, 2, 2); c.strokeStyle = '#d0bfff'; c.lineWidth = 8; c.strokeRect(0, 0, w, h); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke(); }) }));
  win.position.set(-10.75, 5, -2); win.rotation.y = Math.PI / 2; B.add(win);
  W.moon = new THREE.DirectionalLight('#9fb4ff', 0); W.moon.position.set(-30, 25, 0); W.moon.target.position.copy(SET.bedroom); scene.add(W.moon, W.moon.target);
  W.nightLamp = new THREE.PointLight('#ffb86b', 0, 25, 1.4); W.nightLamp.position.set(3.8, 4, -4); B.add(W.nightLamp);

  // ---------- DINING ----------
  const D = new THREE.Group(); D.position.copy(SET.dining); scene.add(D);
  room(D, 24, 20, 9, '#fff0f6', '#ffd8a8', '#ffe8cc');
  D.add(box(10, 0.4, 5, '#a9744f', 0, 2.8, 0), box(0.4, 2.6, 0.4, '#7a4a2a', -4.4, 1.3, -2), box(0.4, 2.6, 0.4, '#7a4a2a', 4.4, 1.3, -2), box(0.4, 2.6, 0.4, '#7a4a2a', -4.4, 1.3, 2), box(0.4, 2.6, 0.4, '#7a4a2a', 4.4, 1.3, 2));
  W.chairs = []; [[-3, -3.6, 0], [0.5, -3.6, 0], [-3, 3.6, Math.PI], [0.5, 3.6, Math.PI], [6.2, 0, -Math.PI / 2]].forEach(([x, z, r]) => { const c = new THREE.Group(); c.add(box(2, 0.3, 2, '#c77d4a', 0, 1.8, 0), box(2, 3, 0.3, '#c77d4a', 0, 3.2, -0.9), box(0.25, 1.8, 0.25, '#7a4a2a', -0.8, 0.9, 0.8), box(0.25, 1.8, 0.25, '#7a4a2a', 0.8, 0.9, 0.8), box(0.25, 1.8, 0.25, '#7a4a2a', -0.8, 0.9, -0.8), box(0.25, 1.8, 0.25, '#7a4a2a', 0.8, 0.9, -0.8)); c.position.set(x, 0, z); c.rotation.y = r; D.add(c); W.chairs.push(c); });
  const cane = new THREE.Group(); const cs2 = cyl(0.1, 0.1, 3.6, '#5c3d2e', 8); cs2.position.y = 1.8; cane.add(cs2); const hk = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 8, 16, Math.PI), mat('#5c3d2e')); hk.position.set(0.4, 3.6, 0); cane.add(hk);
  W.diningCane = cane.clone(); W.diningCane.position.set(7.3, 0.2, 0.2); W.diningCane.rotation.z = 0.28; W.diningCane.rotation.y = Math.PI / 2; D.add(W.diningCane);
  W.cane = cane; scene.add(cane);
  D.add(box(1.4, 0.15, 1.4, '#fff', -3, 3.08, -1.2, 0.05), box(1.4, 0.15, 1.4, '#fff', 0.5, 3.08, -1.2, 0.05), box(1.4, 0.15, 1.4, '#fff', -3, 3.08, 1.2, 0.05), box(1.4, 0.15, 1.4, '#fff', 0.5, 3.08, 1.2, 0.05), box(1.4, 0.15, 1.4, '#fff', 4, 3.08, 0, 0.05));
  D.add(box(2.4, 1.2, 2.4, '#ffa94d', -1.2, 3.6, 0, 0.5));
  W.glasses = new THREE.Group(); W.glasses.add(box(0.4, 0.28, 0.05, '#222', -0.3, 0, 0), box(0.4, 0.28, 0.05, '#222', 0.3, 0, 0)); W.glasses.position.set(4, 3.25, 0); W.glasses.rotation.x = -1.3; D.add(W.glasses);
  const dwin = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), basic('#ffe3a3')); dwin.position.set(0, 5, -9.75); D.add(dwin);

  // generic particles
  W.dust = makeParticles(scene, 120, '#d8c3a5', 0.5);
  W.orbs = makeParticles(scene, 90, '#5dff9c', 0.45, true);
  W.sparks = makeParticles(scene, 60, '#9ff3ff', 0.25, true);
  return W;
}

function room(g, w, d, h, wall, wall2, floor, dark) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(floor)); f.rotation.x = -Math.PI / 2; f.position.y = 0.015; f.receiveShadow = true; g.add(f);
  g.add(box(w, h, 0.4, wall, 0, h / 2, -d / 2)); g.add(box(0.4, h, d, wall2, -w / 2, h / 2, 0)); g.add(box(0.4, h, d, wall2, w / 2, h / 2, 0));
  g.add(box(w, 0.6, 0.5, '#ffffff', 0, 0.3, -d / 2 + 0.2));
}
function tray() { const t = new THREE.Group(); t.add(box(2.4, 0.15, 1.6, '#ff922b', 0, 0, 0, 0.05), box(0.8, 0.3, 0.8, '#ffd43b', -0.6, 0.18, 0, 0.1), box(0.6, 0.4, 0.6, '#ff6b6b', 0.5, 0.2, -0.2, 0.2), box(0.35, 0.6, 0.35, '#e7f5ff', 0.7, 0.3, 0.45, 0.1)); return t; }
let _glow;
export function glowTex() {
  if (_glow) return _glow;
  _glow = textTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
  return _glow;
}
function makeParticles(scene, n, color, size, additive) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.PointsMaterial({ color, size, map: glowTex(), transparent: true, depthWrite: false, opacity: 1, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.visible = false; scene.add(p); p.n = n; return p;
}
