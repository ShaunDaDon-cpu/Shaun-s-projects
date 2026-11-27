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
  for (let i = 0; i < 18; i++) {
    for (const side of [-1, 1]) {
      const z = -110 + i * 13; const x = side * 19; const w = 9 + R() * 2, d = 8, h = 5 + R() * 1.5;
      const hg = new THREE.Group(); hg.position.set(x, 0, z); hg.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      const col = HOUSE_COLS[(i * 2 + (side > 0 ? 1 : 0)) % HOUSE_COLS.length];
      hg.add(box(w, h, d, col, 0, h / 2, 0)); const rf = roofMesh(w + 1, d + 1, ROOF_COLS[(i + (side > 0 ? 3 : 0)) % ROOF_COLS.length]); rf.position.y = h + 1.6; hg.add(rf);
      hg.add(box(1.6, 3, 0.2, '#6b3f22', 0, 1.5, d / 2 + 0.05));
      const winMat = new THREE.MeshBasicMaterial({ color: '#2b3550' });
      [-w / 3, w / 3].forEach((wx) => { const wm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 0.15), winMat); wm.position.set(wx, h * 0.55, d / 2 + 0.05); hg.add(wm); hg.add(box(2.1, 0.2, 0.3, '#ffffff', wx, h * 0.55 - 0.9, d / 2 + 0.1)); });
      const plMat = new THREE.MeshBasicMaterial({ color: '#3a3a30' }); const pl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), plMat); pl.position.set(1.4, 3.3, d / 2 + 0.25); hg.add(pl);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffcf6b', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(6, 6, 1); glow.position.set(1.4, 3.3, d / 2 + 0.6); hg.add(glow);
      hg.add(box(4, 0.15, 3, '#c8b89a', 0, 0.08, d / 2 + 1.5));
      town.add(hg); W.houses.push({ g: hg, winMat, plMat, glow, x, z, side });
      if (i % 2 === 0) town.add(tree(side * 11.5, z + 6, 0.9 + R() * 0.3));
      if (i % 3 === 1) { const l = lamp(side * 10.3, z); if (side > 0) l.rotation.y = Math.PI; town.add(l); }
    }
  }
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
  W.clouds = new THREE.Group(); [[-60, 60, -150, 3], [40, 70, -170, 4], [90, 50, -120, 2.5], [-110, 55, -60, 3], [0, 80, -220, 5], [70, 65, 60, 3]].forEach((c) => W.clouds.add(cloud(...c))); town.add(W.clouds);

  // ---------- SKY (skydive) ----------
  const sky = new THREE.Group(); sky.position.copy(SET.sky); scene.add(sky); W.skyG = sky;
  const R2 = rng(77); W.skyClouds = [];
  for (let i = 0; i < 26; i++) { const c = cloud((R2() - 0.5) * 70, R2() * 260 - 200, -18 - R2() * 40, 1 + R2() * 1.8); sky.add(c); W.skyClouds.push(c); }
  const plane = new THREE.Group(); plane.add(box(14, 3, 3, '#f1f3f5', 0, 0, 0, 0.8), box(4, 0.4, 16, '#e03131', 1, 0, 0), box(2, 3, 0.3, '#e03131', -6.5, 2, 0), box(1.6, 1.4, 3.05, '#5c7cfa', 6, 0.4, 0, 0.3));
  for (let k = 0; k < 4; k++) plane.add(box(0.9, 0.9, 3.1, '#5c7cfa', 3 - k * 2.2, 0.5, 0, 0.2));
  sky.add(plane); W.plane = plane;
  // ---------- BUS CRASH ----------
  const bus = new THREE.Group(); bus.position.copy(SET.bus); scene.add(bus);
  const br = new THREE.Mesh(new THREE.PlaneGeometry(14, 160), mat('#2b2e38')); br.rotation.x = -Math.PI / 2; br.position.y = 0.02; br.receiveShadow = true; bus.add(br);
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat('#2e5a3a')); bg.rotation.x = -Math.PI / 2; bus.add(bg);
  const bb = new THREE.Group(); bb.add(box(4.4, 4.2, 14, '#ffc61a', 0, 2.6, 0, 0.3)); bb.add(box(4.5, 1.2, 12, '#20232e', 0, 3.4, -0.5)); bb.add(box(4.5, 0.3, 14.1, '#222', 0, 1.6, 0));
  [-4.5, 4.5].forEach((zz) => [-2.1, 2.1].forEach((xx) => { const w = cyl(1, 1, 0.6, '#1a1a1a', 14); w.rotation.z = Math.PI / 2; w.position.set(xx, 0.9, zz); bb.add(w); }));
  bb.rotation.z = 1.35; bb.rotation.y = 0.5; bb.position.set(2.5, 0.6, 0); bus.add(bb);
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
  // ---------- CLASSROOM ----------
  const cls = new THREE.Group(); cls.position.copy(SET.class); scene.add(cls);
  room(cls, 32, 26, 9, '#e9f7ef', '#a8e6cf', '#fff3bf');
  const board = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.5), new THREE.MeshLambertMaterial({ map: textTex(1024, 400, (c, w, h) => {
    c.fillStyle = '#1f5137'; c.fillRect(0, 0, w, h); c.fillStyle = '#f1f3f5'; c.font = '700 64px Fredoka'; c.fillText('ATTENDANCE', 40, 80);
    c.font = '600 42px Fredoka'; ['Ava ✓', 'Ben ✓', 'Cleo ✓', 'Dev ✓', 'Ella ✓'].forEach((n, i) => c.fillText(n, 60 + (i > 2 ? 420 : 0), 150 + (i % 3) * 70));
    c.fillStyle = 'rgba(241,243,245,0.5)'; c.fillText('Mason ...', 480, 290);
  }) }));
  board.position.set(0, 4.8, -12.9); cls.add(board); cls.add(box(14.6, 6.1, 0.2, '#8a5a35', 0, 4.8, -13.05));
  cls.add(box(5, 2.4, 2.2, '#8a5a35', -7, 1.2, -9));
  W.desks = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const d = new THREE.Group(); d.add(box(2.6, 0.25, 1.8, '#ffd8a8', 0, 2.4, 0), box(0.2, 2.3, 0.2, '#868e96', 0, 1.15, 0)); d.position.set(-9 + c * 6, 0, -3 + r * 5); cls.add(d); W.desks.push(d); }

  // ---------- HOUSE INTERIOR ----------
  const H = new THREE.Group(); H.position.copy(SET.house); scene.add(H); W.houseG = H;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), mat('#c08457')); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; H.add(fl);
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
  const pfront = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), mat('#7fc8ff')); pfront.position.set(0, 5, 12.22); H.add(pfront);
  const pground = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), mat('#2f6b3a')); pground.rotation.x = -Math.PI / 2; pground.position.set(0, 0.01, 32); H.add(pground);
  W.porchLamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.5), basic('#ffe9a8')); W.porchLamp.position.set(2.6, 5, 12.6); H.add(W.porchLamp);
  W.porchLight = new THREE.PointLight('#ffd58a', 0, 30, 1.2); W.porchLight.position.set(2.6, 5.5, 14); H.add(W.porchLight);
  [-5.5, 5.5].forEach((x) => H.add(box(0.5, 7, 0.5, '#fff', x, 3.5, 18.8)));
  H.add(box(12.6, 0.5, 7.4, '#5b3a29', 0, 7.2, 15.7));
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
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(floor)); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; g.add(f);
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
