// Shot list for "Death Countdown". Each shot: update(localTime, duration, absoluteTime).
export function makeShots(X) {
  const { THREE, L, camera, W, C, SET, UI, light, fx, fx2, hemi, lines } = X;
  const { clamp, lerp, smooth, easeOut, easeIn, seg, YEAR } = L;
  const PI = Math.PI;
  const v = (a) => (a.isVector3 ? a.clone() : new THREE.Vector3(a[0], a[1], a[2]));
  const at = (S) => (x, y, z) => new THREE.Vector3(S.x + x, S.y + y, S.z + z);
  const H = at(SET.house), B = at(SET.bedroom), D = at(SET.dining), CF = at(SET.cafe), CL = at(SET.class), BS = at(SET.bus), SK = at(SET.sky);
  const T0 = (v) => new THREE.Vector3(v[0], v[1], v[2]);
  const word = (li, w) => { const ws = lines[li].words; const k = typeof w === 'number' ? w : ws.findIndex((x) => x.w.toLowerCase().replace(/[^a-z]/g, '') === w); return ws[Math.max(0, k)].s; };
  const imp = (T, t0, dur, amp) => (T >= t0 && T < t0 + dur ? amp * (1 - (T - t0) / dur) : 0);

  function cam(p, t, fov = 45, o = {}) {
    const P = v(p), Tg = v(t);
    if (o.shake) { const k = o.T * 1.0; P.x += L.noise1(k * 2.1, 1) * o.shake; P.y += L.noise1(k * 2.3, 5) * o.shake; Tg.x += L.noise1(k * 1.9, 9) * o.shake * 0.7; Tg.y += L.noise1(k * 1.7, 3) * o.shake * 0.7; }
    camera.position.copy(P); camera.up.set(0, 1, 0); if (o.up) camera.up.copy(o.up);
    camera.lookAt(Tg); if (o.roll) camera.rotateZ(o.roll);
    camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  }
  function hold(rig, ph, target, side = 'R', push = 0.35, scale = 1) {
    const h = rig.handWorld(side); const tv = v(target); const dir = tv.clone().sub(h).normalize();
    ph.g.visible = true; ph.g.scale.setScalar(rig.o.scale * scale); ph.g.position.copy(h).addScaledVector(dir, push * rig.o.scale); ph.g.lookAt(tv); return ph;
  }
  function phoneClose(F, P, e, side, fovA = 40, fovB = 50) {
    const n = P.clone().sub(F).normalize(); const up = new THREE.Vector3(0, 1, 0);
    const a = F.clone().addScaledVector(n, -1.1).addScaledVector(up, 1.0).addScaledVector(side, 1.4);
    const b = P.clone().addScaledVector(n, -1.05).addScaledVector(up, 0.06);
    const tg = P.clone().lerp(F, 0.25 * (1 - e));
    cam(a.lerp(b, e), tg, lerp(fovA, fovB, e));
  }
  // POV insert: camera at the holder's eyes, phone held up in front with a blocky hand/arm from below
  function povPhone(rig, ph, k, o = {}) {
    const F = rig.headWorld(); const ry = rig.root.rotation.y; const fw = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));
    rig.headG.visible = false; rig.armR.visible = false; rig.armL.visible = false;
    const cp = F.clone().addScaledVector(fw, 0.35).add(new THREE.Vector3(0, 0.1, 0));
    const look = F.clone().addScaledVector(fw, 2.2).add(new THREE.Vector3(0, -1.15, 0));
    const dir = look.clone().sub(cp).normalize();
    const dist = lerp(o.d0 ?? 1.9, o.d1 ?? 1.3, k);
    const pp = cp.clone().addScaledVector(dir, dist);
    ph.g.visible = true; ph.g.scale.setScalar(1); ph.g.position.copy(pp); ph.g.lookAt(cp); ph.g.rotateZ(o.roll ?? -0.06);
    ph.g.add(C.armB, C.handB); C.armB.visible = C.handB.visible = true;
    C.armB.material = L.mat(rig.o.sleeves ? rig.o.shirt : rig.o.skin); C.handB.material = L.mat(rig.o.skin);
    C.handB.scale.set(0.62, 0.55, 0.5); C.handB.position.set(0.05, -0.5, -0.2); C.handB.rotation.set(0, 0, 0);
    C.armB.scale.set(0.62, 1, 0.62); C.armB.position.set(0.35, -3.3, -0.9); C.armB.rotation.set(-0.3, 0, -0.12);
    cam(cp, pp.clone().add(new THREE.Vector3(0, -0.42, 0)), o.fov ?? 46, o.T != null ? { shake: o.shake || 0, T: o.T } : {});
  }
  function phonePose(r, k = 1) { r.armR.rotation.x = -1.25 * k; r.armR.rotation.z = -0.32 * k; r.headG.rotation.x = 0.28 * k; }
  function toScreen(p) { const q = v(p).project(camera); return { x: (q.x + 1) / 2 * 1080, y: (1 - q.y) / 2 * 1920, z: q.z }; }
  function sitAt(r, x, y, z, ry, seatTop) { r.place(x, seatTop + 0.5 - 2 + (y || 0), z, ry); r.legL.rotation.x = r.legR.rotation.x = -PI / 2; }
  function burst(P, origin, tau, o = {}) {
    if (tau < 0 || tau > (o.life || 1.2)) return;
    P.visible = true; const a = P.geometry.attributes.position; const r = L.rng(o.seed || 11); const life = o.life || 1.2;
    for (let i = 0; i < P.n; i++) {
      const th = r() * PI * 2, el = (o.flat ? 0.1 : 0.2) + r() * (o.up || 0.8), sp = (o.speed || 6) * (0.4 + r() * 0.8);
      const dx = Math.cos(th) * Math.cos(el), dy = Math.sin(el), dz = Math.sin(th) * Math.cos(el);
      const dirb = o.dir ? new THREE.Vector3(...o.dir) : null;
      let x = dx * sp * tau, y = dy * sp * tau - (o.g ?? 6) * tau * tau, z = dz * sp * tau;
      if (dirb) { x += dirb.x * tau; y += dirb.y * tau; z += dirb.z * tau; }
      a.setXYZ(i, origin.x + x, Math.max(origin.y + y, 0.05), origin.z + z);
    }
    a.needsUpdate = true; P.material.opacity = 1 - tau / life; P.material.size = o.size || 0.6;
  }
  function stream(P, from, to, T, o = {}) {
    P.visible = true; const a = P.geometry.attributes.position; const r = L.rng(o.seed || 3); const n = o.n || P.n;
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, o.arc ?? 1.2, 0));
    for (let i = 0; i < P.n; i++) {
      if (i >= n) { a.setXYZ(i, 0, -999, 0); continue; }
      const ph = ((T * (o.speed || 1.1)) + i / n + r() * 0.1) % 1; const u = 1 - ph;
      const x = u * u * from.x + 2 * u * ph * mid.x + ph * ph * to.x, y = u * u * from.y + 2 * u * ph * mid.y + ph * ph * to.y, z = u * u * from.z + 2 * u * ph * mid.z + ph * ph * to.z;
      const j = o.jit ?? 0.25; a.setXYZ(i, x + (r() - 0.5) * j, y + (r() - 0.5) * j, z + (r() - 0.5) * j);
    }
    a.needsUpdate = true; P.material.opacity = o.op ?? 1; P.material.size = o.size || 0.4;
  }
  // town crowd walking on sidewalks; phones from slot 3..9
  function crowd(T, ids, opts = {}) {
    let slot = 3;
    ids.forEach((k, j) => {
      const e = C.ext[k]; const side = j % 2 ? 1 : -1; const dir = j % 4 < 2 ? 1 : -1; const x = side * (6.1 + (j % 3) * 0.95);
      const span = opts.span || 90; const z = (opts.zc || 0) + ((((j * 23.7 + dir * T * 3.1) % span) + span) % span) - span / 2;
      e.place(x, 0.3, z, dir > 0 ? 0 : PI); e.walk(T * 6.5 + j * 1.3, 0.5);
      if (opts.phones !== false && j % 3 !== 2 && slot < 10) {
        phonePose(e); const ph = C.phones[slot++]; hold(e, ph, e.headWorld(), 'R', 0.3);
        ph.countdown(((j * 9 + 5) % 70 + 1) * YEAR + j * 86400 * 37 + 3600 * j - T, { color: ['#4dff9a', '#5ec8ff', '#ffd43b'][j % 3] });
        e.expr = 'neutral';
      } else e.expr = j % 2 ? 'smile' : 'neutral';
    });
  }
  function rain(T, center) {
    W.rain.visible = true; const a = W.rain.geometry.attributes.position;
    W.rainBase.forEach((b, i) => { const y = ((b[1] - T * 38) % 40 + 40) % 40; const x = center.x + b[0], z = center.z + b[2]; a.setXYZ(i * 2, x, y, z); a.setXYZ(i * 2 + 1, x + 0.12, y + 1.3, z); });
    a.needsUpdate = true;
  }
  function sfx(text, x, y, size, k, color = '#fff', rot = -6) {
    if (k <= 0 || k >= 1) return; const s = k < 0.15 ? L.easeOutBack(k / 0.15) : 1; const op = k > 0.75 ? (1 - k) / 0.25 : 1;
    UI.add(text, `left:${x}px;top:${y}px;font-size:${size}px;color:${color};transform:translate(-50%,-50%) rotate(${rot}deg) scale(${s});opacity:${op}`);
  }
  function camHUD(T, label) {
    UI.add('', 'inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,0.05) 0 2px,rgba(0,0,0,0) 2px 6px)');
    const blink = Math.floor(T * 2) % 2 === 0;
    UI.add(`<span style="color:#ff3040">${blink ? '●' : '&nbsp;'}</span> REC`, 'left:60px;top:120px;font-size:46px'); UI.add(label, 'right:60px;top:120px;font-size:42px');
    const s = 14 + Math.floor(T - 33.6); UI.add(`03:00:${String(s).padStart(2, '0')} AM`, 'left:60px;bottom:120px;font-size:46px');
    [['left:40px;top:90px', 'border-left:6px solid #fff;border-top:6px solid #fff'], ['right:40px;top:90px', 'border-right:6px solid #fff;border-top:6px solid #fff'], ['left:40px;bottom:90px', 'border-left:6px solid #fff;border-bottom:6px solid #fff'], ['right:40px;bottom:90px', 'border-right:6px solid #fff;border-bottom:6px solid #fff']].forEach(([p, b]) => UI.add('', `${p};width:90px;height:90px;${b}`));
  }
  // patch UI.add to apply mono class to HUD items by default
  const _add = UI.add; UI.add = (html, css = '', cls) => { _add(`<div class="${cls ?? (css.includes('font-size') && !css.includes('rotate') ? 'mono' : 'sfx')}">${html}</div>`, css); };
  function clockDraw(txt) {
    if (W.clockTxt === txt) return; W.clockTxt = txt; const c = W.clockCanvas.getContext('2d');
    c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, 512, 256); c.fillStyle = '#ff2a2a'; c.shadowColor = '#ff2a2a'; c.shadowBlur = 30; c.font = '700 170px Fredoka'; c.textAlign = 'center'; c.fillText(txt, 230, 190);
    c.font = '700 54px Fredoka'; c.fillText('AM', 450, 110); c.shadowBlur = 0; W.clockTex.needsUpdate = true;
  }
  const heroPhone = (extra = {}) => ({ main: '0y 0d', sub: '00:00:00', color: '#f1f3f5', ...extra });
  function houseNight() { light('inNight', H(0, 0, 4)); W.lampLight.intensity = 55; W.porchLight.intensity = 25; }

  const S = [];
  // 0 — establishing
  S.push({ line: 0, update(lt, d, T) {
    light('day', [0, 0, -5]); crowd(T + 3, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], { span: 70 });
    const e = smooth(lt / d); cam(L.lerpV([24, 34, 52], [9, 7.5, 22], e), L.lerpV([0, 0, -12], [0, 3.2, -2], e), 46);
  } });
  // 1 — phone countdown close
  S.push({ line: 1, update(lt, d, T) {
    light('day', [7, 0, 2]); crowd(T + 3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { span: 60, zc: 0 });
    const p = C.ext[0]; p.place(7.4, 0.3, 2, -PI / 2); phonePose(p); p.expr = 'neutral';
    const ph = C.phones[2];
    ph.countdown(61 * YEAR + 4 * 86400 + 3 * 3600 + 12 * 60 + 9 - T, { color: '#4dff9a' });
    povPhone(p, ph, easeOut(lt / d), { d0: 2.3, d1: 1.35 });
  } });
  // 2 — 80 years flex
  S.push({ line: 2, update(lt, d, T) {
    light('day', [7, 0, -2]); crowd(T + 3, [6, 7, 8, 9, 10, 11], { span: 50, zc: -70 });
    const g = C.shades; g.place(7.6, 0.3 + Math.abs(Math.sin(T * 5)) * 0.35, -2, -PI / 2); g.expr = 'smug';
    g.armL.rotation.z = -2.45 + Math.sin(T * 9) * 0.15; g.armR.rotation.z = 2.45 - Math.sin(T * 9) * 0.15; g.headG.rotation.z = Math.sin(T * 4.5) * 0.12;
    [[1, 5.6, 0.3, -6.2, 'shock'], [2, 5.4, 0.3, 2.4, 'grin'], [3, 4.3, 0.02, -5.0, 'shock']].forEach(([k, x, y, z, ex]) => { const e = C.ext[k]; e.place(x, y, z, PI / 2 + (z + 2) * 0.12); e.expr = ex; e.armL.rotation.x = -0.4; e.armR.rotation.x = -0.4; });
    const a = lerp(-0.3, 0.2, smooth(lt / d)); const cp = [7.6 - Math.cos(a) * 11, 1.6, -2 + Math.sin(a) * 11];
    cam(cp, [7.6, 5.0, -2], 52);
    const ph = hold(g, C.phones[2], camera.position, 'R', 0.3, 2.2); ph.draw({ main: '80y 0d', sub: L.fmtTime(80 * YEAR - T).sub, color: '#ffd43b', top: 'TIME LEFT' });
    stream(W.sparks, g.headWorld().add(new THREE.Vector3(0, -1, 0)), g.headWorld().add(new THREE.Vector3(0, 3, 0)), T, { arc: 0, jit: 4, size: 0.35, speed: 0.6 }); W.sparks.material.color.set('#ffe066');
  } });
  // 3 — 12 seconds left
  S.push({ line: 3, update(lt, d, T) {
    light('day', [7, 0, -8]); crowd(T + 3, [6, 7, 8, 9, 10, 11, 12], { span: 60, zc: -50, phones: true });
    const o = C.old; o.place(6.4, 0.3, -9, -PI / 2 + 0.5); o.expr = Math.floor(T * 3) % 2 ? 'grin' : 'laugh';
    o.armR.rotation.z = 2.7 + Math.sin(T * 18) * 0.35; o.armL.rotation.x = -1.0; o.armL.rotation.z = 0.25; o.hips.position.y = 2 + Math.abs(Math.sin(T * 9)) * 0.15;
    const e = C.ext[13]; const ez = lerp(-1, -16, lt / d); e.place(9.6, 0.3, ez - 4, PI); e.walk(T * 7, 0.5); e.expr = 'worried'; e.armL.rotation.z = -2.5 + Math.sin(T * 12) * 0.3;
    cam([-1.6, 4.6, -2.2], [6.2, 4.0, -9.2], 44, { shake: 0.12, T });
    const ph = hold(o, C.phones[0], camera.position, 'L', 0.3, 1.25); const sec = 12 - (T - word(3, 'twelve') + 0.25);
    ph.countdown(Math.min(12, Math.max(sec, 9)), { color: '#ff4057', label: 'SAY BYE!' });
  } });
  // 4 — skydive
  S.push({ line: 4, update(lt, d, T) {
    light('sky', [SET.sky.x, SET.sky.y, SET.sky.z]); W.skyG.visible = true;
    const dv = C.diver; const P = SK(0, 0, 0); dv.place(P.x, P.y, P.z, 0); dv.root.rotation.x = PI / 2; dv.root.rotation.z = Math.sin(T * 2) * 0.15; dv.expr = 'grin'; dv.noBlink = true;
    dv.armL.rotation.z = -1.35 + Math.sin(T * 7) * 0.1; dv.armR.rotation.z = 1.35 - Math.sin(T * 7) * 0.1; dv.legL.rotation.z = -0.3; dv.legR.rotation.z = 0.3; dv.headG.rotation.x = -0.25;
    W.skyClouds.forEach((c, i) => { if (!c.userData.b) c.userData.b = c.position.clone(); const b = c.userData.b; const y = ((b.y + 200 + lt * 42) % 300) - 150; c.position.set(b.x * 0.9, y, b.z + 26); });
    W.plane.position.set(-30 + lt * 14, 22 + lt * 26, -12); W.plane.rotation.z = 0.15;
    const camP = P.clone().add(new THREE.Vector3(Math.sin(T * 1.3) * 0.8, -13.5, 0.6));
    cam(camP, P.clone().add(new THREE.Vector3(0, 0, 0.6)), 44, { up: new THREE.Vector3(0, 0, 1) });
    const ph = hold(dv, C.phones[2], camera.position, 'R', 0.2, 1.5); ph.draw({ main: '40y 0d', sub: L.fmtTime(40 * YEAR - T).sub, color: '#4dff9a' });
    stream(W.sparks, P.clone().add(new THREE.Vector3(0, -14, 0)), P.clone().add(new THREE.Vector3(0, 12, 0)), T * 3, { arc: 0, jit: 9, size: 0.28, speed: 1 }); W.sparks.material.color.set('#ffffff');
  } });
  // 5 — crater, thumbs up
  S.push({ line: 5, update(lt, d, T) {
    light('day', [0, 0, 22]); W.crater.visible = true; W.crater.position.set(0, 0, 22);
    const dv = C.diver; dv.place(0, 0.55, 21.5, 0); dv.root.rotation.x = PI / 2; dv.expr = 'grin';
    const k = seg(lt, 0.7, 1.15); dv.armR.rotation.x = lerp(0, PI / 2, L.easeOutBack(k)) + Math.sin(T * 10) * 0.05 * k; dv.armL.rotation.z = -0.3; dv.legL.rotation.x = Math.sin(T * 9) * 0.12; dv.headG.rotation.x = -0.4;
    burst(W.dust, new THREE.Vector3(0, 0.3, 22), lt, { speed: 9, life: 1.3, size: 1.3, seed: 4 });
    [[6, -5.5, 19, 'unimpressed'], [7, 5.2, 18.5, 'unimpressed'], [8, -5.2, 24.2, 'unimpressed'], [9, 5.0, 23.8, 'smile']].forEach(([k2, x, z, ex]) => { const e = C.ext[k2]; e.place(x, 0.02, z, Math.atan2(-x, 22 - z)); e.expr = ex; e.armL.rotation.x = -1.15; e.armL.rotation.z = 0.7; e.armR.rotation.x = -1.15; e.armR.rotation.z = -0.7; });
    const e = smooth(lt / d); cam([lerp(3.5, 2.5, e), lerp(11, 9.5, e), lerp(34, 31, e)], [0, 1.2, 21.5], 44, { shake: imp(lt, 0, 0.5, 0.6), T });
    UI.flash(imp(lt, 0, 0.18, 0.7));
  } });
  // 6 — my phone says zero
  S.push({ line: 6, update(lt, d, T) {
    light('day', [7, 0, 10]); crowd(T + 3, [1, 2, 3, 4, 5, 6], { span: 70, zc: 10, phones: false }); UI.filter('saturate(0.45) brightness(0.95)');
    const h = C.hero; h.place(7.4, 0.3, 10, -PI / 2); phonePose(h); h.expr = 'worried';
    const cutT = d * 0.38; const ph = C.phones[0]; ph.draw(heroPhone());
    if (lt < cutT) { const F = h.headWorld(); hold(h, ph, F, 'R', 0.32); cam(F.clone().add(new THREE.Vector3(-lerp(4.2, 3.6, lt / cutT), -0.9, 0.3)), F.clone().add(new THREE.Vector3(0, -0.5, 0)), 40); }
    else povPhone(h, ph, smooth(seg(lt, cutT, d)), { d0: 2.0, d1: 1.3 });
  } });
  // 7 — flashback bus crash
  S.push({ line: 7, update(lt, d, T) {
    light('night', [SET.bus.x, 0, SET.bus.z]); rain(T, SET.bus); hemi.intensity = 1.3;
    W.copLights[0].intensity = Math.sin(T * 14) > 0 ? 260 : 0; W.copLights[1].intensity = Math.sin(T * 14) > 0 ? 0 : 260;
    W.siren[0].material.color.set(Math.sin(T * 14) > 0 ? '#ff2a40' : '#4a0a10'); W.siren[1].material.color.set(Math.sin(T * 14) > 0 ? '#0a1640' : '#2a6bff');
    const e = smooth(lt / d); cam(BS(lerp(-20, -16, e), lerp(11, 8.5, e), lerp(30, 25, e)), BS(3, 1.5, 2), 40);
    UI.filter('grayscale(0.8) contrast(1.15) brightness(1.25)'); UI.vignette(0.95);
    UI.add('3 YEARS AGO', 'left:50%;top:200px;transform:translateX(-50%);font-size:64px;letter-spacing:10px;opacity:0.9');
  } });
  // 8 — cafeteria tray
  S.push({ line: 8, update(lt, d, T) {
    light('inDay', [SET.cafe.x + 4, 0, 2]);
    const ll = C.lunch; const k = seg(lt, 0, 0.8); ll.place(CF(lerp(11.3, 11.3, k), 0, 0).x + (lt > 1.1 ? (lt - 1.1) * 1.5 : 0), 0, 0, -PI / 2); ll.expr = lt < 1.2 ? 'smile' : 'worried';
    ll.armL.rotation.x = ll.armR.rotation.x = lt < 1.0 ? -1.0 : -0.2; ll.upper.rotation.x = lt < 1.0 ? 0.3 : 0;
    W.tray.position.copy(CF(lerp(9.8, 8.2, smooth(k)), lerp(3.6, 2.8, smooth(k)), 0.4));
    const h = C.hero; const wk = seg(lt, 0.7, 2.0); h.place(CF(lerp(-1, 4.3, wk), 0, lerp(12, 5.2, wk)).x, 0, CF(0, 0, lerp(12, 5.2, wk)).z, lerp(2.6, 2.3, wk)); if (wk < 1) h.walk(T * 7, 0.6); h.expr = wk < 1 ? 'neutral' : 'worried'; h.headG.rotation.y = wk >= 1 ? 0.3 : 0;
    [[0, -11, -2.2, 0], [1, -6, -2.2, 0], [2, -9, 2.2, PI], [3, 3.5, 10.2, PI], [4, 8, 5.8, 0], [5, -5, 10.2, PI]].forEach(([k2, x, z, ry]) => { const e = C.ext[k2]; sitAt(e, CF(x, 0, z).x, 0, CF(0, 0, z).z, ry, 1.55); e.expr = 'neutral'; e.headG.rotation.y = lt > 1.4 ? (k2 % 2 ? 0.6 : -0.6) : 0; });
    const e = smooth(lt / d); cam(CF(lerp(9, 8, e), lerp(9, 8.2, e), lerp(19, 17, e)), CF(9.5, 2.4, 0.5), 50);
  } });
  // 9 — teacher skips attendance
  S.push({ line: 9, update(lt, d, T) {
    light('inDay', [SET.class.x, 0, 0]);
    const t = C.teacher; t.place(CL(-6, 0, -8.5).x, 0, CL(0, 0, -8.5).z, 0.4); t.armL.rotation.x = -1.2; t.armL.rotation.z = 0.35; t.expr = 'neutral'; t.talk = Math.abs(Math.sin(T * 9)) * (Math.sin(T * 1.7) > -0.3 ? 1 : 0);
    t.headG.rotation.y = Math.sin(T * 1.6) * 0.5;
    C.clip.visible = true; C.clip.position.copy(t.handWorld('L')).add(new THREE.Vector3(0.1, 0.4, 0.4)); C.clip.rotation.set(-0.8, 0.4, 0);
    let k = 0; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = -9 + c * 6, z = -3 + r * 5 + 1.4; if (c === 1 && r === 1) continue; if (k > 9) continue;
      const e = C.ext[k++]; sitAt(e, CL(x, 0, z).x, 0, CL(0, 0, z).z, PI, 0.1 + 1.45); e.expr = 'neutral';
    }
    const h = C.hero; sitAt(h, CL(-3, 0, 3.4).x, 0, CL(0, 0, 3.4).z, PI, 1.55); h.expr = lt > 0.6 ? 'sad' : 'neutral'; h.armR.rotation.z = lt > 0.3 ? 2.9 + Math.sin(T * 10) * 0.12 : 0;
    const e = smooth(lt / d); cam(CL(lerp(13, 12, e), 7.5, lerp(7, 6, e)), CL(-4, 3.2, -2.5), 50);
  } });
  // 10 — mom checks pulse
  S.push({ line: 10, update(lt, d, T) {
    light('inNight', [SET.bedroom.x, 0, SET.bedroom.z]); W.moon.intensity = 1.8; W.nightLamp.intensity = 40; hemi.intensity = 0.85;
    heroInBed(lt / d > 0.62 ? 'peek' : 'sleep'); C.hero.armR.rotation.x = -0.35;
    const m = C.mom; m.place(B(3.5, 0, -2.6).x, 0, B(0, 0, -2.6).z, -PI / 2); m.upper.rotation.x = 0.5; m.armL.rotation.x = -1.0; m.armR.rotation.x = -0.9; m.expr = 'cry';
    const e = smooth(lt / d); cam(B(lerp(-7, -6, e), lerp(6.8, 6, e), lerp(-0.5, -1.5, e)), B(1.8, 3, -3.4), 44);
  } });
  function heroInBed(expr) {
    const h = C.hero; h.place(B(0, 0, 0).x, 2.5, B(0, 0, -0.7).z, 0); h.root.rotation.x = -PI / 2; h.expr = expr; h.noBlink = true;
    C.blanket.visible = true; C.blanket.position.copy(B(0, 3.05, 0.4));
    C.phones[1].g.visible = true; C.phones[1].g.scale.setScalar(1); C.phones[1].g.position.copy(B(3.8, 2.07, -5.0)); C.phones[1].g.rotation.set(-PI / 2, 0, 0.3); C.phones[1].draw(heroPhone()); C.phones[1].glow.material.opacity = 0.25;
  }
  // 11 — I'm a ghost (top-down)
  S.push({ line: 11, update(lt, d, T) {
    light('inNight', [SET.bedroom.x, 0, SET.bedroom.z]); W.moon.intensity = 1.5; W.nightLamp.intensity = 30; hemi.intensity = 0.55;
    heroInBed(T > word(11, 'ghost') - 0.05 ? 'shock' : 'worried'); C.hero.noBlink = false;
    const a = lerp(-0.25, 0.25, lt / d); const hgt = lerp(15, 12.5, smooth(lt / d)) - imp(T, word(11, 'ghost'), 0.4, 1.5);
    cam(B(0.2, hgt, -3.6), B(0.2, 2.5, -3.6), 40, { up: new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)) });
  } });
  // 12 — 3 AM, knock
  S.push({ line: 12, update(lt, d, T) {
    light('inNight', [SET.bedroom.x, 0, SET.bedroom.z]); W.moon.intensity = 0.9; hemi.intensity = 0.35;
    const three = word(12, 'three'); clockDraw(T < three ? '2:59' : '3:00');
    const cw = new THREE.Vector3(); W.clock.getWorldPosition(cw); cw.y += 0.4;
    const f = new THREE.Vector3(Math.sin(-0.3), 0, Math.cos(-0.3));
    fx.color.set('#ff2a2a'); fx.intensity = 6; fx.position.copy(cw).addScaledVector(f, 0.8);
    const kn = word(12, 'knocked'); const ks = [kn + 0.02, kn + 0.3, kn + 0.58]; let sh = 0;
    ks.forEach((k, i) => { sh += imp(T, k, 0.22, 0.18); sfx('KNOCK', [300, 760, 520][i], [520, 700, 900][i], 150, (T - k) / 0.9, '#fff', [-8, 6, -3][i]); });
    const e = easeOut(lt / d); cam(cw.clone().addScaledVector(f, lerp(4.4, 3.2, e)).add(new THREE.Vector3(0, 0.25, 0)), cw, 34, { shake: sh, T });
  } });
  // 13 — doorbell cam
  S.push({ line: 13, update(lt, d, T) {
    light('night', [SET.house.x, 0, SET.house.z + 16]); W.porchLight.intensity = 45; hemi.intensity = 0.6;
    C.col.forEach((c, i) => { c.place(H([-3.3, 0, 3.3][i], 0, 0).x, 0.4, H(0, 0, [17.6, 18.4, 17.6][i]).z, PI + [0.25, 0, -0.25][i]); c.screenMode = 'static'; c.headG.rotation.z = Math.sin(T * 0.8 + i) * 0.06; c.headG.rotation.x = 0.12; });
    cam(H(0, 6.9, 12.9), H(0, 3.4, 18.5), 96);
    UI.filter('saturate(0.3) contrast(1.3) brightness(1.15) hue-rotate(60deg)'); UI.vignette(0.9); camHUD(T, 'FRONT DOOR');
  } });
  // 14 — screens show my face
  S.push({ line: 14, update(lt, d, T) {
    light('night', [SET.house.x, 0, SET.house.z + 16]); W.porchLight.intensity = 30; hemi.intensity = 0.5;
    const xs = [-3.3, 0, 3.3]; const fw = word(14, 'face'), ov = word(14, 'overdue');
    C.col.forEach((c, i) => { c.place(H(xs[i], 0, 0).x, 0.4, H(0, 0, [17.6, 18.4, 17.6][i]).z, PI + [0.25, 0, -0.25][i]); c.headG.rotation.x = 0.12; c.screenMode = T > fw - 0.35 + i * 0.18 ? 'face' : 'static'; });
    const head = (i) => { const p = new THREE.Vector3(); C.col[i].face.getWorldPosition(p); return p; };
    const red = clamp((T - fw) / 0.6); fx.color.set('#ff2240'); fx.intensity = 40 * red; fx.position.copy(H(0, 6.5, 14.5));
    if (T < ov - 0.15) { const u = smooth(seg(lt, 0, ov - 0.15 - (T - lt))); const tgt = u < 0.5 ? head(0).lerp(head(1), u * 2) : head(1).lerp(head(2), u * 2 - 1); cam(tgt.clone().add(new THREE.Vector3(0, -0.1, -4.4)), tgt, 40); }
    else { const k = easeOut(seg(T, ov - 0.15, ov + 0.6)); const hp = head(1); cam(hp.clone().add(new THREE.Vector3(0, -0.1, lerp(-5.3, -3.8, k))), hp, 40, { shake: imp(T, ov - 0.1, 0.4, 0.15), T }); UI.flash(imp(T, ov - 0.12, 0.25, 0.5), '#ff2240'); }
  } });
  // 15 — Dad: Nobody opens that door!
  S.push({ line: 15, update(lt, d, T) {
    houseNight(); const slam = 0.32;
    W.door.rotation.y = lerp(1.2, 0, easeIn(seg(lt, 0, slam)));
    C.col.forEach((c, i) => { c.place(H([-1.8, 0.6, 2.8][i], 0, 0).x, 0.4, H(0, 0, [16.4, 17.5, 16.8][i]).z, PI); c.screenMode = 'face'; });
    const dd = C.dad; if (lt < slam + 0.05) { dd.place(H(1.6, 0, 10.4).x, 0, H(0, 0, 10.4).z, 0.3); dd.armL.rotation.x = dd.armR.rotation.x = -1.5; dd.upper.rotation.x = 0.25; dd.expr = 'determined'; }
    else { dd.place(H(0, 0, 11.0).x, 0, H(0, 0, 11.0).z, PI); dd.armL.rotation.z = -1.35; dd.armR.rotation.z = 1.35; dd.expr = 'yell'; dd.headG.rotation.x = -0.08; }
    cam(H(0.6, 1.5, 3.8), H(0, 4.6, 11), 50, { shake: imp(lt, slam, 0.5, 0.35), T });
    sfx('SLAM!', 560, 420, 170, (lt - slam) / 0.8, '#fff', -8);
  } });
  // 16 — I wasn't a ghost (dolly zoom)
  S.push({ line: 16, update(lt, d, T) {
    houseNight();
    const h = C.hero; h.place(H(12.8, 0, 2.6).x, 4.0, H(0, 0, 2.6).z, 0); h.expr = T > word(16, 'mistake') - 0.1 ? 'sad' : 'shock'; h.noBlink = true;
    const e = smooth(lt / d); const z = lerp(11.4, 6.2, e); const dist = z - 2.6; const fov = 2 * Math.atan(2.4 / dist) * 180 / PI;
    cam(H(12.8, 8.6, z), H(12.8, 8.4, 2.6), fov);
  } });
  // 17 — Mom kneels
  S.push({ line: 17, update(lt, d, T) {
    houseNight();
    const h = C.hero; h.place(H(5, 0, 6).x, 0, H(0, 0, 6).z, -PI / 2); h.expr = 'shock';
    const m = C.mom; m.place(H(2.5, 0, 6).x, 0, H(0, 0, 6).z, PI / 2); m.hips.position.y = 1.15; m.legL.rotation.x = m.legR.rotation.x = 1.45;
    m.armL.rotation.x = m.armR.rotation.x = -1.25; m.armL.rotation.z = 0.12; m.armR.rotation.z = -0.12; m.expr = 'cry'; m.headG.rotation.x = -0.28;
    const e = smooth(lt / d); cam(H(lerp(6.4, 5.8, e), 4.8, lerp(1.0, 1.6, e)), H(2.5, 3.8, 5.8), 42);
  } });
  // 18 — the whole town is hiding you (street porch lights)
  S.push({ line: 18, update(lt, d, T) {
    light('night', [0, 0, 20]); hemi.intensity = 0.65;
    let n = 0;
    W.houses.forEach((hs) => {
      if (hs.z > 44) return; const on = lt > 0.15 + (44 - hs.z) * 0.014;
      if (on) { hs.plMat.color.set('#fff3c4'); hs.glow.material.opacity = 0.9; hs.winMat.color.set('#ffd27a'); }
      if (on && n < 12 && hs.z > -40) { const e = C.ext[n]; const px = hs.side * 13.2; e.place(px, 0.15, hs.z + 1.4, hs.side > 0 ? -PI / 2 : PI / 2); e.expr = 'determined'; e.armR.rotation.x = -1.3; const fl = C.flashlights[n % 8]; if (n < 8) { fl.visible = true; fl.position.copy(e.handWorld('R')).add(new THREE.Vector3(-hs.side * 0.6, 0, 0)); } n++; }
    });
    const e = smooth(lt / d); cam([0, lerp(3.2, 15, e), lerp(46, 50, e)], [0, lerp(3, 1, e), -30], 46);
  } });
  // 19 — door off its hinges
  S.push({ line: 19, update(lt, d, T) {
    houseNight(); W.lampLight.intensity = 30; const b = 0.1;
    const k = easeOut(seg(lt, b, 1.25));
    W.door.position.copy(H(-1.55 + k * 1.2, lerp(0, 2.2, Math.sin(k * PI)) + k * 0.2, lerp(12, 3.6, k))); W.door.rotation.set(-k * 1.45, k * 0.5, k * 0.25);
    W.porchLight.intensity = lt > b ? 160 : 25; fx2.color.set('#cfe0ff'); fx2.intensity = lt > b ? 110 : 0; fx2.position.copy(H(0, 6, 15.5));
    C.col.forEach((c, i) => { c.place(H([0, -2.4, 2.4][i], 0, 0).x, 0.4, H(0, 0, [13.6, 15.2, 15.2][i]).z, PI); c.screenMode = 'face'; });
    const dd = C.dad; const kd = easeOut(seg(lt, b, 0.9)); dd.place(H(lerp(0.5, -5.5, kd), 0, lerp(10.6, 8.5, kd)).x, lerp(0, 0.5, kd), H(0, 0, lerp(10.6, 8.5, kd)).z, PI); dd.root.rotation.z = kd * 1.4; dd.expr = 'shock';
    burst(W.dust, H(0, 1, 11.8), lt - b, { speed: 10, life: 1.4, size: 1.1, dir: [0, 0, -5], seed: 8 });
    cam(H(1.4, 1.3, 1.2), H(0, 4.4, 11), 48, { shake: imp(lt, b, 0.7, 0.45), T }); UI.flash(imp(lt, b, 0.22, 0.85));
  } });
  // 20 — Mom frying pan
  S.push({ line: 20, update(lt, d, T) {
    houseNight(); W.door.visible = true; W.door.position.copy(H(-0.3, 0.2, 3.6)); W.door.rotation.set(-1.45, 0.5, 0.25);
    const ti = word(20, 'hit') - (T - lt) + 0.05; const m = C.mom; const c = C.col[0];
    const k = lt < ti ? seg(lt, 0, ti) : 1; const pre = lt < ti;
    m.place(H(-1, 0, 5.7).x, pre ? 0 : Math.max(0, 0.55 - (lt - ti) * 1.5), H(0, 0, 5.7).z, 0); m.expr = 'angry';
    m.armR.rotation.x = pre ? lerp(-2.6, -3.4, easeOut(seg(lt, 0, ti * 0.6))) + (lt > ti * 0.6 ? lerp(0, 1.25, easeIn(seg(lt, ti * 0.6, ti))) : 0) : lerp(-2.15, -1.6, seg(lt, ti, ti + 0.5));
    m.upper.rotation.x = pre ? -0.15 : 0.15; m.armL.rotation.x = -0.6;
    m.armR.hand.add(W.pan); W.pan.visible = true; W.pan.position.set(0, -2.0, 0); W.pan.rotation.set(-PI / 2, 0, 0);
    const hit = !pre; c.place(H(-1, 0, 0).x, 0, H(0, 0, 8.5 + (hit ? easeOut(seg(lt, ti, ti + 0.6)) * 1.4 : 0)).z, PI); c.screenMode = hit ? 'crack' : 'face';
    if (hit) { const kk = seg(lt, ti, ti + 0.7); c.headG.rotation.x = -0.6 * (1 - kk) - 0.15; c.hips.rotation.x = -0.25; c.headG.rotation.z = 0.3 * Math.sin(kk * 9) * (1 - kk); c.upper.rotation.z = 0.2; }
    if (lt < ti + 0.55) cam(H(6.8, 4.9, 7.1), H(-1, 4.8, 7.1), 46, { shake: imp(lt, ti, 0.5, 0.5), T });
    else { const hp = new THREE.Vector3(); c.face.getWorldPosition(hp); const kk = easeOut(seg(lt, ti + 0.55, d)); cam(hp.clone().add(new THREE.Vector3(lerp(2.6, 1.6, kk), -0.2, -lerp(3.2, 2.3, kk))), hp, 40, { shake: 0.04, T }); }
    UI.flash(imp(lt, ti, 0.15, 0.8)); sfx('BONK!', 620, 520, 190, (lt - ti) / 0.9, '#ffe14d', -10);
  } });
  // 21 — Dad tackles through the couch
  S.push({ line: 21, update(lt, d, T) {
    houseNight(); W.door.position.copy(H(-0.3, 0.2, 3.6)); W.door.rotation.set(-1.45, 0.5, 0.25); W.door.visible = false;
    const ti = word(21, 'tackled') - (T - lt) + 0.25; const ic = ti + 0.3; const dd = C.dad; const c = C.col[1];
    const run = seg(lt, 0, ti - 0.25); let dz = lerp(11.5, 8.3, run), dy = 0;
    dd.expr = 'angry';
    if (lt < ti - 0.25) { dd.walk(T * 12, 0.9); dd.upper.rotation.x = 0.3; }
    else { const fly = seg(lt, ti - 0.25, ic + 0.5); dz = lerp(8.3, 0.2, easeOut(fly)); dy = Math.sin(fly * PI) * 0.9 - fly * 1.4; dd.hips.rotation.x = 1.4; dd.armL.rotation.x = dd.armR.rotation.x = -PI; dd.expr = 'yell'; }
    dd.place(H(-4, 0, dz).x, Math.max(dy, -1.4), H(0, 0, dz).z, PI);
    const pushed = lt > ti; const pz = pushed ? lerp(5.6, -0.6, easeOut(seg(lt, ti, ic + 0.5))) : 5.6;
    c.place(H(-4, 0, pz).x, pushed ? -easeIn(seg(lt, ti, ic + 0.5)) * 1.9 : 0, H(0, 0, pz).z, 0); c.screenMode = 'face'; if (pushed) { c.hips.rotation.x = -1.4 * easeOut(seg(lt, ti, ti + 0.35)); c.armL.rotation.z = -1.8; c.armR.rotation.z = 1.8; }
    if (lt > ic) { const kc = easeOut(seg(lt, ic, ic + 0.7)); W.couchL.position.set(-2.8 * kc, Math.sin(kc * PI) * 1.6, -0.6 * kc); W.couchL.rotation.z = 0.7 * kc; W.couchR.position.set(2.8 * kc, Math.sin(kc * PI) * 1.6, -0.6 * kc); W.couchR.rotation.z = -0.7 * kc; }
    burst(W.dust, H(-4, 1.2, 2), lt - ic, { speed: 9, life: 1.3, size: 1.2, seed: 21 });
    cam(H(lerp(5, 4.4, lt / d), 7, 11.3), H(-4, 2.4, 4.4), 56, { shake: imp(lt, ic, 0.6, 0.5), T }); UI.flash(imp(lt, ic, 0.12, 0.5));
    sfx('CRASH!', 540, 560, 190, (lt - ic) / 0.9, '#ff8a3d', 7);
  } });
  // 22 — Sister on the counter
  S.push({ line: 22, update(lt, d, T) {
    houseNight(); W.door.visible = false;
    const s = C.sis; const th = word(22, 'over') - (T - lt); s.place(H(-9.5, 0, -9.6).x, 3.1 + Math.abs(Math.sin(T * 7)) * 0.25, H(0, 0, -9.6).z, 0.35); s.expr = 'yell';
    s.armL.rotation.z = -2.6 + Math.sin(T * 14) * 0.35;
    if (lt < th) s.armR.rotation.z = 2.6 - Math.sin(T * 14) * 0.35; else { const k = seg(lt, th, th + 0.25); s.armR.rotation.x = lerp(-3.2, -1.2, easeOut(k)); }
    if (lt > th + 0.18) { const k = lt - th - 0.18; W.remote.visible = true; W.remote.position.copy(H(-8.6 + k * 6, 6.2 + k * 3 - k * k * 5, -9 + k * 9)); W.remote.rotation.set(k * 14, k * 9, 0); }
    cam(H(-6.4, 1.6, -1.6), H(-9.3, 6.0, -9.6), 50, { shake: 0.05, T });
  } });
  // 23 — third Collector grabs; phone beeps
  S.push({ line: 23, update(lt, d, T) {
    houseNight(); hemi.intensity = 0.5; W.door.visible = false;
    const pulse = (Math.sin(T * 12.5) + 1) / 2; fx.color.set('#ff1a35'); fx.intensity = 30 + pulse * 70; fx.position.copy(H(3, 5, 4.5));
    const h = C.hero; h.place(H(3, 0, 2.6).x, 0, H(0, 0, 2.6).z, 0.15); phonePose(h); h.armL.rotation.x = -0.95; h.armL.rotation.z = 0.25; h.expr = 'scared'; h.upper.rotation.x = 0.08;
    const c = C.col[2]; c.place(H(3, 0, 6.2).x, 0, H(0, 0, 6.2).z, PI + 0.15); c.armR.rotation.x = -1.35; c.armR.rotation.z = 0.32; c.screenMode = 'face'; c.upper.rotation.x = 0.2;
    const F = h.headWorld(); const ph = hold(h, C.phones[0], F, 'R', 0.32); const bt = word(23, 'beeping') - 0.6;
    const flash = T > bt && Math.floor(T * 5) % 4 === 0; ph.draw(heroPhone({ color: '#ff4057', label: T > bt ? 'COLLECTING…' : '', bar: T > bt ? clamp((T - bt) / 2.2) : null, flash }));
    ph.glow.material.color.set('#ff2040'); ph.glow.material.opacity = flash ? 0.5 : 0.1;
    const sw = word(23, 6) - (T - lt) - 0.15;
    if (lt < sw) cam(H(lerp(11.5, 10.5, lt / sw), 5.2, 4.6), H(3, 4.3, 4.4), 46);
    else { povPhone(h, ph, easeOut(seg(lt, sw, d)), { d0: 1.8, d1: 1.25, shake: 0.03 + (flash ? 0.03 : 0), T }); }
  } });
  // 24 — Grandma walks in
  S.push({ line: 24, update(lt, d, T) {
    houseNight(); W.lampLight.intensity = 25; W.porchLight.intensity = 200; fx2.color.set('#ffe2a8'); fx2.intensity = 140; fx2.position.copy(H(0, 6, 16)); hemi.intensity = 0.45; W.door.visible = false;
    const g = C.gma; const z = lerp(15, 10.6, easeOut(lt / d)); g.place(H(0, 0, z).x, z > 12.2 ? 0.4 : 0, H(0, 0, z).z, PI); g.walk(lt * 5, 0.35); g.expr = 'determined'; g.armL.rotation.x = -0.25;
    const hp = g.handWorld('L'); W.cane.visible = true; W.cane.scale.setScalar(0.6); W.cane.position.set(hp.x, g.root.position.y, hp.z + 0.25);
    stream(W.dust, H(-3, 0.5, 14), H(3, 8, 6), T * 0.08, { arc: 3, jit: 6, size: 0.25, op: 0.7 }); W.dust.material.color.set('#fff1c4');
    const e = smooth(lt / d); cam(H(0.9, lerp(0.9, 1.3, e), lerp(3.4, 4.6, e)), H(0, 4.4, 11), 40);
  } });
  // 25 — "Overdue? Put it on my tab."
  S.push({ line: 25, update(lt, d, T) {
    houseNight(); W.door.visible = false;
    const c = C.col[2]; const turn = easeOut(seg(lt, 0, 0.4)); c.place(H(0.9, 0, 6.7).x, 0, H(0, 0, 6.7).z, lerp(PI + 0.15, 0.6, turn)); c.screenMode = 'face'; c.upper.rotation.x = 0.35 * turn;
    const g = C.gma; g.place(H(3, 0, 9.1).x, 0, H(0, 0, 9.1).z, PI); g.expr = 'smug';
    const slap = word(25, 'tab') - (T - lt) + 0.1; g.armR.rotation.x = lerp(-0.4, -2.5, easeOut(seg(lt, slap - 0.4, slap))); g.armL.rotation.x = -0.25;
    const hp = g.handWorld('L'); W.cane.visible = true; W.cane.scale.setScalar(0.6); W.cane.position.set(hp.x, 0, hp.z + 0.25);
    const cf = new THREE.Vector3(); c.face.getWorldPosition(cf);
    const ph = hold(g, C.phones[1], cf, 'R', 0.3, 1.3); ph.countdown(31 * YEAR + 30, { color: '#d6a8ff' });
    cam(H(5.2, 5.2, 5.0), H(2.2, 5.0, 8.3), 46, { shake: imp(lt, slap, 0.35, 0.18), T });
    sfx('SLAP!', 640, 560, 140, (lt - slap) / 0.7, '#d6a8ff', 8);
  } });
  // 26 — numbers transfer
  S.push({ line: 26, update(lt, d, T) {
    houseNight(); W.door.visible = false;
    const cp = H(0, 5, 1.3), tgt = H(0, 5, -4); cam(cp, tgt, 42);
    const pA = H(0, 5.98, -2.6), pB = H(0, 4.02, -2.6);
    [[C.phones[1], pA], [C.phones[0], pB]].forEach(([ph, p]) => { ph.g.visible = true; ph.g.position.copy(p); ph.g.lookAt(cp); ph.g.scale.setScalar(0.85); ph.glow.material.color.set('#5dff9c'); ph.glow.material.opacity = 0.12; });
    const e = smooth(seg(lt, 0.2, d - 0.35)); C.phones[1].countdown(lerp(31 * YEAR + 30, 30, e), { color: '#d6a8ff', top: 'GRANDMA' }); C.phones[0].countdown(lerp(0, 31 * YEAR, e), { color: e > 0.02 ? '#4dff9a' : '#f1f3f5', top: 'ME' });
    if (e > 0 && e < 1) stream(W.orbs, pA.clone().add(new THREE.Vector3(0, -0.3, 0.2)), pB.clone().add(new THREE.Vector3(0, 0.3, 0.2)), T, { arc: 0, n: 60, size: 0.2, jit: 0.35, speed: 1.4 });
    const sa = toScreen(pA.clone().add(new THREE.Vector3(0, 0.62, 0))), sb = toScreen(pB.clone().add(new THREE.Vector3(0, -0.62, 0)));
    UI.add('GRANDMA', `left:${sa.x}px;top:${sa.y - 40}px;transform:translate(-50%,-50%);font-size:56px;color:#d6a8ff;letter-spacing:6px`);
    UI.add('ME', `left:${sb.x}px;top:${sb.y + 40}px;transform:translate(-50%,-50%);font-size:56px;color:#4dff9a;letter-spacing:6px`);
  } });
  // 27 — account settled, walks away
  S.push({ line: 27, update(lt, d, T) {
    houseNight(); W.door.visible = false; W.porchLight.intensity = 60;
    const c = C.col[2]; c.screenMode = 'settled'; const wk = seg(lt, 0.9, d);
    const x = lerp(3, 0.3, smooth(wk)), z = lerp(6.3, 16, wk); c.place(H(x, 0, 0).x, z > 12.2 ? 0.4 : 0, H(0, 0, z).z, lt < 0.9 ? 0 : -0.25 * (1 - wk)); if (wk > 0) c.walk(T * 6, 0.45);
    if (lt < 0.9) { c.armR.rotation.x = -1.0; c.armR.rotation.z = -0.65; c.headG.rotation.z = 0.12; }
    const c0 = C.col[0]; const z0 = lerp(10, 19, seg(lt, 0, d)); c0.place(H(-0.5, 0, 0).x, z0 > 12.2 ? 0.4 : 0, H(0, 0, z0).z, 0.1); c0.screenMode = 'crack'; c0.walk(T * 5, 0.5); c0.root.rotation.z = Math.sin(T * 5) * 0.12;
    const c1 = C.col[1]; const z1 = lerp(4.5, 13.5, seg(lt, 0.4, d)); c1.place(H(lerp(-4, -0.8, seg(lt, 0.4, d)), 0, 0).x, z1 > 12.2 ? 0.4 : 0, H(0, 0, z1).z, 0.3); c1.screenMode = 'crack'; c1.walk(T * 6, 0.5); c1.upper.rotation.x = 0.6;
    const fam = [[C.mom, -3, 4, 'shock'], [C.dad, -5.5, 2.6, 'shock'], [C.sis, -1.6, 3, 'shock'], [C.hero, 1.2, 2.2, 'shock'], [C.gma, 6.2, 1.5, 'smug']];
    fam.forEach(([r, x, z, ex]) => { r.place(H(x, 0, z).x, 0, H(0, 0, z).z, 0.2); r.expr = lt > d * 0.55 && ex === 'shock' ? 'grin' : ex; });
    const e = smooth(lt / d); if (lt < 1.0) { const hp = new THREE.Vector3(); c.face.getWorldPosition(hp); cam(hp.clone().add(new THREE.Vector3(0.6, -0.2, lerp(3.8, 3.2, lt))), hp, 40); } else cam(H(lerp(-1.5, -0.5, e), 7, -4), H(0.5, 4, 11), 50);
  } });
  // 28 — family raises phones
  S.push({ line: 28, update(lt, d, T) {
    houseNight(); W.door.visible = false;
    const h = C.hero; h.place(H(0, 0, 2).x, 0, H(0, 0, 2).z, 0); h.expr = 'shock';
    const raise = easeOut(seg(lt, 0.3, 1.3)); const hh = h.headWorld();
    [[C.mom, -2.5, 6.6, 1, 'kind'], [C.dad, 0, 7.2, 2, 'determined'], [C.sis, 2.4, 6.5, 3, 'grin']].forEach(([r, x, z, pi, ex], i) => { r.place(H(x, 0, z).x, 0, H(0, 0, z).z, PI - x * 0.06); r.expr = ex; r.armR.rotation.x = lerp(0, -1.65, raise); const ph = hold(r, C.phones[pi], hh, 'R', 0.3, 1.2); ph.countdown([47, 52, 71][i] * YEAR + [112, 9, 300][i] * 86400 - T, { color: ['#ff8fd0', '#7fd8ff', '#7cffb2'][i] }); });
    const g = C.gma; sitAt(g, H(6.5, 0, 0).x, 0, H(0, 0, 0).z, -0.5, 1.6); g.expr = 'kind';
    const a = smooth(lt / d); cam(H(lerp(1.4, 6.8, a), lerp(6, 5.6, a), lerp(-3, 2.8, a)), H(0, 4.3, lerp(6.8, 5.6, a)), 46);
  } });
  // 29 — "Take ten years each"
  S.push({ line: 29, update(lt, d, T) {
    houseNight(); W.door.visible = false;
    const cp = H(0, 4.9, 2.3);
    const e = smooth(seg(lt, 0.4, d - 0.2)); const hb = cp.clone().add(new THREE.Vector3(-1.05, -1.1, 1.0));
    [[C.mom, -2.5, 6.6, 1, 'kind'], [C.dad, 0, 7.2, 2, 'kind'], [C.sis, 2.4, 6.5, 3, 'grin']].forEach(([r, x, z, pi, ex], i) => { r.place(H(x, 0, z).x, 0, H(0, 0, z).z, PI - x * 0.06); r.expr = ex; r.armR.rotation.x = -1.65; const ph = hold(r, C.phones[pi], cp, 'R', 0.3, 1.2); ph.countdown([47, 52, 71][i] * YEAR + [112, 9, 300][i] * 86400 - lerp(0, 10 * YEAR, e), { color: ['#ff8fd0', '#7fd8ff', '#7cffb2'][i] }); if (e > 0 && e < 1) stream(i === 0 ? W.orbs : i === 1 ? W.sparks : W.dust, ph.g.position.clone(), hb, T + i * 0.3, { arc: 0.6, n: 40, size: 0.25, jit: 0.15, speed: 1.2 }); });
    W.sparks.material.color.set('#5dff9c'); W.dust.material.color.set('#5dff9c');
    cam(cp, H(0, 4.4, 7), 46);
    const ph = C.phones[0]; ph.g.visible = true; ph.g.position.copy(hb); ph.g.lookAt(cp); ph.g.scale.setScalar(1); ph.countdown(lerp(31 * YEAR, 61 * YEAR, e), { color: '#4dff9a', top: 'ME' });
    C.armB.visible = C.handB.visible = true; C.armB.scale.set(0.55, 1, 0.55); C.armB.position.copy(hb).add(new THREE.Vector3(0, -3.6, -0.15)); C.handB.scale.set(0.55, 0.6, 0.55); C.handB.position.copy(hb).add(new THREE.Vector3(0, -0.55, -0.12));
  } });
  // 30 — Grandma laughing, Dad stuck in couch (dawn)
  S.push({ line: 30, update(lt, d, T) {
    light('dawn', [SET.house.x, 0, SET.house.z + 4]); W.lampLight.intensity = 10; W.porchLight.intensity = 0; W.door.visible = false; fx2.color.set('#ffb36b'); fx2.intensity = 120; fx2.position.copy(H(0, 6, 15));
    W.couchL.rotation.z = 0.18; W.couchR.rotation.z = -0.18; W.couchL.position.x = -0.2; W.couchR.position.x = 0.2;
    const dd = C.dad; dd.place(H(-4, 0, 2).x, 3.5, H(0, 0, 2).z, 0); dd.root.rotation.x = PI; dd.legL.rotation.x = Math.sin(T * 13) * 0.55; dd.legR.rotation.x = -Math.sin(T * 13) * 0.55;
    const g = C.gma; sitAt(g, H(6.5, 0, 0).x, 0, H(0, 0, 0).z, -0.5, 1.6); g.expr = 'laugh'; g.upper.rotation.x = -0.12 + Math.sin(T * 16) * 0.06; g.headG.rotation.x = -0.15; g.armR.rotation.x = -0.9; g.armL.rotation.x = -0.4; g.armL.rotation.z = 0.5;
    const ph = hold(g, C.phones[1], camera.position.clone(), 'R', 0.25, 1.1);
    [[C.mom, 0.5, 6.4, -2.6, 'laugh'], [C.sis, -1.4, 7, -2.8, 'laugh'], [C.hero, 2.6, 4.6, -2.2, 'grin']].forEach(([r, x, z, ry, ex]) => { r.place(H(x, 0, z).x, 0, H(0, 0, z).z, ry); r.expr = ex; r.upper.rotation.x = Math.sin(T * 14 + x) * 0.05; });
    const sw = d * 0.42;
    if (lt < sw) cam(H(lerp(10, 9.4, lt / sw), 6.2, lerp(13, 12.4, lt / sw)), H(1, 2.4, 2), 48);
    else { const hp = g.headWorld(); const f = new THREE.Vector3(Math.sin(-0.5), 0, Math.cos(-0.5)); const k = smooth(seg(lt, sw, d)); cam(hp.clone().addScaledVector(f, lerp(6.2, 4.3, k)).add(new THREE.Vector3(-0.8, 0.2, 0)), hp.clone().add(new THREE.Vector3(0, -0.6, 0)), 42); }
    hold(g, C.phones[1], camera.position.clone(), 'R', 0.25, 1.1); ph.countdown(30 - (T - lines[30].start) * 0.9, { color: '#d6a8ff' });
  } });
  // 31 — 61 years now (porch at sunrise, callback to shot 6)
  S.push({ line: 31, update(lt, d, T) {
    light('dawn', [SET.house.x, 0, SET.house.z + 18]); W.door.visible = false;
    const h = C.hero; h.place(H(0.8, 0, 17.2).x, 0.4, H(0, 0, 17.2).z, 0); phonePose(h); h.expr = 'softsad';
    const ph = C.phones[0]; ph.countdown(61 * YEAR + 5 * 3600 + 12 * 60 + 47 - T, { color: '#4dff9a' }); const cutT = d * 0.38;
    if (lt < cutT) { const F = h.headWorld(); hold(h, ph, F, 'R', 0.32); cam(F.clone().add(new THREE.Vector3(-0.3, -0.9, lerp(4.2, 3.6, lt / cutT))), F.clone().add(new THREE.Vector3(0, -0.5, 0)), 40); }
    else povPhone(h, ph, smooth(seg(lt, cutT, d)), { d0: 2.0, d1: 1.3 });
  } });
  // 32 — empty chair
  S.push({ line: 32, update(lt, d, T) {
    light('inDay', [SET.dining.x, 0, SET.dining.z]); hemi.color.set('#ffe8cc');
    sitAt(C.hero, D(0.5, 0, -3.6).x, 0, D(0, 0, -3.6).z, 0, 1.95); C.hero.expr = 'softsad'; C.hero.headG.rotation.y = 0.9;
    sitAt(C.mom, D(-3, 0, -3.6).x, 0, D(0, 0, -3.6).z, 0, 1.95); C.mom.expr = 'smile'; C.mom.headG.rotation.y = 0.5;
    sitAt(C.dad, D(-3, 0, 3.6).x, 0, D(0, 0, 3.6).z, PI, 1.95); C.dad.expr = 'smile'; C.dad.armR.rotation.x = -1.2 + Math.sin(T * 3) * 0.2;
    sitAt(C.sis, D(0.5, 0, 3.6).x, 0, D(0, 0, 3.6).z, PI, 1.95); C.sis.expr = 'smile'; C.sis.headG.rotation.y = -0.7;
    const e = smooth(lt / d); cam(D(lerp(-10, -5.5, e), lerp(9, 7.4, e), lerp(1.2, 0.4, e)), D(5.6, 3.2, 0), 42);
    const end = lines[32].end; const fo = clamp((T - end - 0.5) / 0.8); UI.flash(fo, '#000');
    const ti = clamp((T - end - 1.0) / 0.5); if (ti > 0) UI.add('DEATH<br>COUNTDOWN', `left:50%;top:46%;font-size:150px;line-height:1.05;text-align:center;color:#ff4057;opacity:${ti};transform:translate(-50%,-50%) scale(${lerp(1.1, 1, ti)})`, 'sfx');
  } });
  return S;
}
