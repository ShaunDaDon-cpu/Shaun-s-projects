// Original score + sound effects for The Quiet Town, synthesized in Web Audio.
// 150 BPM; every cut sits on a beat, and each section starts on the shot that changes the mood.
import { LINES, BEAT, DURATION } from './script.js';

const s = n => LINES[n - 1].start;        // start time of shot n
const d = n => LINES[n - 1].dur;
const BAR = BEAT * 4;
const N = name => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(name); const i = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * Math.pow(2, (i + (+m[3] + 1) * 12 - 69) / 12); };

export function SCORE(ac, offset = 0) {
  const T0 = ac.currentTime - offset;
  const at = t => T0 + t;
  const ok = t => t - offset > -.01;

  // ---- buses ----
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = .005; comp.release.value = .2; comp.connect(ac.destination);
  const master = ac.createGain(); master.gain.value = .9; master.connect(comp);
  const verb = ac.createConvolver(); { const len = ac.sampleRate * 2.2, b = ac.createBuffer(2, len, ac.sampleRate); for (let c = 0; c < 2; c++) { const ch = b.getChannelData(c); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); } verb.buffer = b; }
  const verbGain = ac.createGain(); verbGain.gain.value = .32; verb.connect(verbGain).connect(master);
  const music = ac.createGain(); music.gain.value = 1; music.connect(master); music.connect(verb);
  const sfx = ac.createGain(); sfx.gain.value = 1; sfx.connect(master);
  const sfxVerb = ac.createGain(); sfxVerb.gain.value = .5; sfxVerb.connect(verb);

  // deterministic noise
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const noiseBuf = (() => { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), c = b.getChannelData(0); for (let i = 0; i < c.length; i++) c[i] = rnd(); return b; })();
  const brownBuf = (() => { const b = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate), c = b.getChannelData(0); let l = 0; for (let i = 0; i < c.length; i++) { l = (l + .02 * rnd()) / 1.02; c[i] = l * 3.5; } return b; })();
  const noise = (t, dur, buf = noiseBuf) => { const n = ac.createBufferSource(); n.buffer = buf; n.loop = true; n.start(at(t), (t * 7.3) % 1.5); n.stop(at(t + dur + .05)); return n; };
  const env = (g, t, a, peak, dec, sus = 0, rel = 0, hold = 0) => { const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(peak, at(t + a)); if (hold) p.setValueAtTime(peak, at(t + a + hold)); p.exponentialRampToValueAtTime(Math.max(sus, .0001), at(t + a + hold + dec)); if (rel) p.exponentialRampToValueAtTime(.0001, at(t + a + hold + dec + rel)); };
  const panner = (v, dest) => { const p = ac.createStereoPanner(); p.pan.value = v; p.connect(dest); return p; };
  const osc = (type, f, t, dur) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, at(t)); o.start(at(t)); o.stop(at(t + dur + .05)); return o; };
  const filt = (type, f, q = 1) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };

  // ---- instruments ----
  function pluck(t, f, vol = .2, pan = 0, dec = .32, dest = music) { if (!ok(t)) return; const g = ac.createGain(); const lp = filt('lowpass', Math.min(f * 6, 7000)); const o = osc('triangle', f, t, dec + .1), o2 = osc('sine', f * 2, t, dec); const g2 = ac.createGain(); g2.gain.value = .25; o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(panner(pan, dest)); env(g, t, .004, vol, dec); }
  function bell(t, f, vol = .12, pan = 0, dec = 1.4, dest = music) { if (!ok(t)) return; for (const [m, v] of [[1, 1], [2.76, .35], [5.4, .12]]) { const g = ac.createGain(); osc('sine', f * m, t, dec).connect(g).connect(panner(pan, dest)); env(g, t, .002, vol * v, dec / m); } }
  function bass(t, f, vol = .35, dec = .28) { if (!ok(t)) return; const g = ac.createGain(); const lp = filt('lowpass', 600); osc('triangle', f, t, dec + .1).connect(lp); osc('sine', f, t, dec + .1).connect(lp); lp.connect(g).connect(music); env(g, t, .006, vol, dec); }
  function pad(t, dur, freqs, vol = .06, cut = 900, dest = music, atk = .6) { if (!ok(t + dur)) return; const g = ac.createGain(); const lp = filt('lowpass', cut, .7); lp.connect(g).connect(dest); for (const f of freqs) for (const det of [-7, 6]) { const o = osc('sawtooth', f, t, dur + 1); o.detune.value = det; o.connect(lp); } const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + atk)); p.setValueAtTime(vol, at(t + dur)); p.linearRampToValueAtTime(0, at(t + dur + .5)); }
  function brass(t, dur, freqs, vol = .09, bright = 2400) { if (!ok(t)) return; const g = ac.createGain(); const lp = filt('lowpass', 400, 2); lp.frequency.setValueAtTime(400, at(t)); lp.frequency.linearRampToValueAtTime(bright, at(t + .06)); lp.frequency.exponentialRampToValueAtTime(bright * .45, at(t + dur)); lp.connect(g).connect(music); for (const f of freqs) for (const det of [-5, 5]) { const o = osc('sawtooth', f, t, dur + .2); o.detune.value = det; o.connect(lp); } env(g, t, .02, vol, dur, .0001, 0); }
  function trumpet(t, f, dur, vol = .08) { if (!ok(t)) return; const g = ac.createGain(); const lp = filt('lowpass', 3000, 1.5); const o = osc('square', f, t, dur + .1); const v = osc('sine', 5.5, t, dur + .1), vg = ac.createGain(); vg.gain.value = 4; v.connect(vg).connect(o.frequency); o.connect(lp).connect(g).connect(music); env(g, t, .015, vol, dur * .9, .0001); }
  function kick(t, vol = .7) { if (!ok(t)) return; const g = ac.createGain(); const o = osc('sine', 150, t, .4); o.frequency.exponentialRampToValueAtTime(42, at(t + .12)); o.connect(g).connect(music); env(g, t, .002, vol, .32); }
  function snare(t, vol = .3) { if (!ok(t)) return; const g = ac.createGain(); const bp = filt('bandpass', 1900, .8); noise(t, .2).connect(bp).connect(g).connect(music); env(g, t, .001, vol, .14); const g2 = ac.createGain(); osc('triangle', 190, t, .12).connect(g2).connect(music); env(g2, t, .001, vol * .6, .07); }
  function hat(t, vol = .08, dec = .035) { if (!ok(t)) return; const g = ac.createGain(); const hp = filt('highpass', 7500); noise(t, .1).connect(hp).connect(g).connect(panner(.25, music)); env(g, t, .001, vol, dec); }
  function shaker(t, vol = .05) { if (!ok(t)) return; const g = ac.createGain(); const bp = filt('bandpass', 6000, 1.2); noise(t, .1).connect(bp).connect(g).connect(panner(-.3, music)); env(g, t, .012, vol, .06); }
  function snap(t, vol = .16) { if (!ok(t)) return; const g = ac.createGain(); const bp = filt('bandpass', 2300, 3); noise(t, .06).connect(bp).connect(g).connect(panner(.15, music)); env(g, t, .001, vol, .045); }
  function tom(t, f = 110, vol = .4) { if (!ok(t)) return; const g = ac.createGain(); const o = osc('sine', f * 1.6, t, .4); o.frequency.exponentialRampToValueAtTime(f, at(t + .08)); o.connect(g).connect(music); env(g, t, .002, vol, .3); }
  function tick(t, vol = .09, f = 1800) { if (!ok(t)) return; const g = ac.createGain(); osc('sine', f, t, .05).connect(g).connect(panner(.2, music)); env(g, t, .001, vol, .03); }
  function crash(t, vol = .25) { if (!ok(t)) return; const g = ac.createGain(); const hp = filt('highpass', 4500); noise(t, 2.2).connect(hp).connect(g).connect(master); hp.connect(verb); env(g, t, .002, vol, 1.8); }
  // ---- sound effects ----
  function boom(t, vol = .9) { if (!ok(t)) return; const g = ac.createGain(); const o = osc('sine', 70, t, 2); o.frequency.exponentialRampToValueAtTime(28, at(t + 1.4)); o.connect(g).connect(sfx); env(g, t, .005, vol, 1.6); const g2 = ac.createGain(); const lp = filt('lowpass', 400); noise(t, 1.8, brownBuf).connect(lp).connect(g2).connect(sfx); env(g2, t, .005, vol * .9, 1.4); }
  function foghorn(t, dur, roots, vol = .32) { if (!ok(t)) return; const g = ac.createGain(); const lp = filt('lowpass', 900, 3); lp.frequency.setValueAtTime(500, at(t)); lp.frequency.linearRampToValueAtTime(1300, at(t + .15)); lp.frequency.linearRampToValueAtTime(700, at(t + dur)); lp.connect(g).connect(sfx); lp.connect(sfxVerb); const vib = osc('sine', 5.2, t, dur + .5), vg = ac.createGain(); vg.gain.value = 7; vib.connect(vg); for (const f of roots) for (const det of [-14, 0, 13]) { const o = osc('sawtooth', f, t, dur + .5); o.detune.value = det; vg.connect(o.detune); o.connect(lp); } const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + .06)); p.setValueAtTime(vol, at(t + dur - .3)); p.exponentialRampToValueAtTime(.0001, at(t + dur + .4)); }
  function rainBed(t, dur, vol = .09) { if (!ok(t + dur)) return; const g = ac.createGain(); const lp = filt('lowpass', 5000), hp = filt('highpass', 500); noise(t, dur + 1).connect(hp).connect(lp).connect(g).connect(sfx); const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + .5)); p.setValueAtTime(vol, at(t + dur)); p.linearRampToValueAtTime(0, at(t + dur + 1)); }
  function setRain(g, t, v) { g.gain.linearRampToValueAtTime(v, at(t)); }
  function thunder(t, vol = .55) { if (!ok(t)) return; const g = ac.createGain(); const lp = filt('lowpass', 260); noise(t, 2.6, brownBuf).connect(lp).connect(g).connect(sfx); lp.connect(sfxVerb); env(g, t, .03, vol, 2.4); const g2 = ac.createGain(); const hp = filt('highpass', 2500); noise(t, .3).connect(hp).connect(g2).connect(sfx); env(g2, t, .001, vol * .4, .25); }
  function rumble(t, dur, vol = .5) { if (!ok(t + dur)) return; const g = ac.createGain(); const lp = filt('lowpass', 140); noise(t, dur + 1, brownBuf).connect(lp).connect(g).connect(sfx); const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + dur * .4)); p.setValueAtTime(vol, at(t + dur * .85)); p.linearRampToValueAtTime(0, at(t + dur + .3)); }
  function roar(t, dur, vol = .3) { if (!ok(t + dur)) return; const g = ac.createGain(); const bp = filt('bandpass', 700, .5); noise(t, dur + 1).connect(bp).connect(g).connect(sfx); bp.frequency.setValueAtTime(400, at(t)); bp.frequency.linearRampToValueAtTime(1100, at(t + dur)); const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + .3)); p.setValueAtTime(vol, at(t + dur)); p.linearRampToValueAtTime(0, at(t + dur + .4)); }
  function water(t, dur, vol = .14) { if (!ok(t + dur)) return; const g = ac.createGain(); const bp = filt('bandpass', 1400, .6); noise(t, dur + .5).connect(bp).connect(g).connect(sfx); const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + .15)); p.setValueAtTime(vol, at(t + dur - .2)); p.linearRampToValueAtTime(0, at(t + dur)); }
  function whoosh(t, dur, f0, f1, vol = .25) { if (!ok(t)) return; const g = ac.createGain(); const bp = filt('bandpass', f0, 1.5); bp.frequency.setValueAtTime(f0, at(t)); bp.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); noise(t, dur + .1).connect(bp).connect(g).connect(sfx); const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + dur * .7)); p.linearRampToValueAtTime(0, at(t + dur)); }
  function thud(t, vol = .6, f = 90) { if (!ok(t)) return; const g = ac.createGain(); const o = osc('sine', f * 1.8, t, .4); o.frequency.exponentialRampToValueAtTime(f * .6, at(t + .15)); o.connect(g).connect(sfx); env(g, t, .002, vol, .25); const g2 = ac.createGain(); const lp = filt('lowpass', 900); noise(t, .2).connect(lp).connect(g2).connect(sfx); env(g2, t, .001, vol * .6, .12); }
  function bonk(t, vol = .4) { if (!ok(t)) return; const g = ac.createGain(); const o = osc('sine', 720, t, .3); o.frequency.exponentialRampToValueAtTime(260, at(t + .18)); o.connect(g).connect(sfx); env(g, t, .001, vol, .22); const g2 = ac.createGain(); const bp = filt('bandpass', 1600, 4); noise(t, .05).connect(bp).connect(g2).connect(sfx); env(g2, t, .001, vol, .03); }
  function slide(t, dur, f0, f1, vol = .12) { if (!ok(t)) return; const g = ac.createGain(); const o = osc('sine', f0, t, dur); o.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); o.connect(g).connect(panner(.1, sfx)); env(g, t, .02, vol, dur, .0001); }
  function boing(t, vol = .25) { if (!ok(t)) return; const g = ac.createGain(); const o = osc('sine', 220, t, .9); const v = osc('sine', 18, t, .9), vg = ac.createGain(); vg.gain.setValueAtTime(70, at(t)); vg.gain.exponentialRampToValueAtTime(1, at(t + .8)); v.connect(vg).connect(o.frequency); o.connect(g).connect(sfx); env(g, t, .003, vol, .8); }
  function tweet(t, vol = .06) { if (!ok(t)) return; for (let i = 0; i < 3; i++) { const g = ac.createGain(); const o = osc('sine', 2600, t + i * .11, .1); o.frequency.exponentialRampToValueAtTime(3900, at(t + i * .11 + .06)); o.connect(g).connect(panner(i % 2 ? .4 : -.4, sfx)); env(g, t + i * .11, .005, vol, .07); } }
  function gasp(t, vol = .14) { if (!ok(t)) return; const g = ac.createGain(); const bp = filt('bandpass', 1300, 1); noise(t, .5).connect(bp).connect(g).connect(sfx); const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + .12)); p.exponentialRampToValueAtTime(.0001, at(t + .45)); }
  function inhale(t, dur, vol = .16) { if (!ok(t)) return; const g = ac.createGain(); const bp = filt('bandpass', 700, 1.2); bp.frequency.setValueAtTime(500, at(t)); bp.frequency.exponentialRampToValueAtTime(2600, at(t + dur)); noise(t, dur).connect(bp).connect(g).connect(sfx); const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + dur * .9)); p.linearRampToValueAtTime(0, at(t + dur)); }
  function riser(t, dur, vol = .12) { if (!ok(t)) return; const g = ac.createGain(); const o = osc('sawtooth', 110, t, dur); o.frequency.exponentialRampToValueAtTime(880, at(t + dur)); const lp = filt('lowpass', 600); lp.frequency.exponentialRampToValueAtTime(5000, at(t + dur)); o.connect(lp).connect(g).connect(music); const p = g.gain; p.setValueAtTime(.0001, at(t)); p.exponentialRampToValueAtTime(vol, at(t + dur * .95)); p.linearRampToValueAtTime(0, at(t + dur)); whoosh(t, dur, 300, 6000, vol * 1.6); }
  function muffled(t, dur, vol = .2) { if (!ok(t)) return; const g = ac.createGain(); const lp = filt('lowpass', 420, 2); const o = osc('sawtooth', 260, t, dur); const v = osc('sine', 9, t, dur), vg = ac.createGain(); vg.gain.value = 30; v.connect(vg).connect(o.frequency); o.connect(lp).connect(g).connect(sfx); const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + .08)); p.setValueAtTime(vol, at(t + dur - .15)); p.linearRampToValueAtTime(0, at(t + dur)); }
  function babyCry(t, dur, vol = .2) { if (!ok(t)) return; const g = ac.createGain(); const bp = filt('bandpass', 1400, 2); const o = osc('sawtooth', 520, t, dur); o.frequency.linearRampToValueAtTime(640, at(t + .15)); o.frequency.linearRampToValueAtTime(560, at(t + dur)); const v = osc('sine', 7, t, dur), vg = ac.createGain(); vg.gain.value = 25; v.connect(vg).connect(o.frequency); o.connect(bp).connect(g).connect(sfx); g.connect(sfxVerb); const p = g.gain; p.setValueAtTime(0, at(t)); p.linearRampToValueAtTime(vol, at(t + .05)); p.setValueAtTime(vol, at(t + dur - .2)); p.linearRampToValueAtTime(0, at(t + dur)); }
  function knock(t, vol = .35) { for (const dt of [0, .11]) { if (!ok(t + dt)) continue; const g = ac.createGain(); const bp = filt('bandpass', 260, 2); noise(t + dt, .08, brownBuf).connect(bp).connect(g).connect(sfx); env(g, t + dt, .001, vol, .07); } }
  function crackSfx(t, vol = .3) { if (!ok(t)) return; for (let i = 0; i < 5; i++) { const g = ac.createGain(); const hp = filt('highpass', 1500); noise(t + i * .05, .05).connect(hp).connect(g).connect(sfx); env(g, t + i * .05, .001, vol * (1 - i * .15), .04); } const g = ac.createGain(); const o = osc('sawtooth', 55, t, .9); const lp = filt('lowpass', 200); o.connect(lp).connect(g).connect(sfx); env(g, t, .05, vol * .5, .8); }
  function scratch(t, vol = .3) { if (!ok(t)) return; const g = ac.createGain(); const bp = filt('bandpass', 1200, 2); bp.frequency.setValueAtTime(2400, at(t)); bp.frequency.exponentialRampToValueAtTime(400, at(t + .25)); noise(t, .3).connect(bp).connect(g).connect(sfx); env(g, t, .005, vol, .25); }
  function sadTrombone(t, vol = .13) { const notes = [N('Bb3'), N('A3'), N('Ab3'), N('G3')]; notes.forEach((f, i) => { const st = t + i * .42, dur = i === 3 ? 1.1 : .38; if (!ok(st)) return; const g = ac.createGain(); const lp = filt('lowpass', 900, 4); const o = osc('sawtooth', f, st, dur); if (i === 3) { const v = osc('sine', 6, st, dur), vg = ac.createGain(); vg.gain.value = 5; v.connect(vg).connect(o.frequency); } o.connect(lp).connect(g).connect(music); lp.frequency.setValueAtTime(400, at(st)); lp.frequency.linearRampToValueAtTime(1100, at(st + .1)); lp.frequency.linearRampToValueAtTime(500, at(st + dur)); env(g, st, .03, vol, dur, .0001); }); }

  // ================= A. the quiet town (shots 1-15): tiptoe pizzicato in F =================
  const A0 = 0, A1 = s(16);
  const chordsA = [['F2', 'C3', 'A2', 'C3'], ['Bb2', 'F3', 'D3', 'F3'], ['C3', 'G3', 'E3', 'G3'], ['F2', 'C3', 'A2', 'C3']];
  // melody, eighth notes per bar (null = rest)
  const melA = [
    ['C5', null, 'A4', null, 'F4', null, 'A4', 'C5'], ['D5', null, 'Bb4', null, 'F4', null, null, null],
    ['E5', null, 'G4', null, 'Bb4', null, 'E5', null], ['F5', null, 'C5', null, 'A4', null, null, null],
    ['C5', 'D5', 'C5', null, 'A4', null, 'F4', null], ['Bb4', null, 'D5', null, 'F5', null, 'D5', null],
    ['E5', 'D5', 'C5', 'Bb4', 'G4', null, 'E4', null], ['F4', null, 'A4', null, 'C5', null, null, null]];
  for (let bar = 0; A0 + bar * BAR < A1 - .01; bar++) {
    const t = A0 + bar * BAR, ch = chordsA[bar % 4], mel = melA[bar % 8];
    for (let b = 0; b < 4; b++) { const tb = t + b * BEAT; if (tb >= A1) break; bass(tb, N(ch[b]), .34, .22); if (b % 2) snap(tb); }
    for (let e = 0; e < 8; e++) { const te = t + e * BEAT / 2; if (te >= A1) break; if (e % 2) shaker(te); if (mel[e]) { pluck(te, N(mel[e]), .13, -.2, .25); if (bar >= 2) bell(te, N(mel[e]) * 2, .028, .3, .8); } }
  }
  pad(A0, A1 - A0, [N('F3'), N('A3'), N('C4')], .018, 700);
  // shot 2: the imagined avalanche: the music sinks under a crack, a rumble and a roar, then snaps back at the cut
  music.gain.setValueAtTime(1, at(s(2) + d(2) * .28)); music.gain.linearRampToValueAtTime(.3, at(s(2) + d(2) * .5)); music.gain.setValueAtTime(.3, at(s(3) - .02)); music.gain.linearRampToValueAtTime(1, at(s(3)));
  crackSfx(s(2) + d(2) * .28, .32); rumble(s(2) + d(2) * .3, d(2) * .68, .6); roar(s(2) + d(2) * .4, d(2) * .58, .32);
  whoosh(s(2) + d(2) * .8, d(2) * .2, 400, 5000, .3);
  babyCry(s(2) + d(2) * .4, d(2) * .31, .1);                                     // the runner's scream
  thud(s(2) + d(2) * .79, .8, 65); bonk(s(2) + d(2) * .79, .3); tweet(s(2) + d(2) * .84, .07); tweet(s(2) + d(2) * .91, .06);   // splat on the lens, dizzy
  sfx.gain.setValueAtTime(1, at(s(3) - .02)); sfx.gain.linearRampToValueAtTime(0, at(s(3) + .01)); sfx.gain.setValueAtTime(0, at(s(3) + .4)); sfx.gain.linearRampToValueAtTime(1, at(s(3) + .45));
  // gags
  bell(s(4) + .05, N('C6'), .05, .4); bell(s(4) + .25, N('E6'), .05, -.4); bell(s(4) + .45, N('G6'), .05, .4);   // jazz-hand sparkle
  bell(s(5) + .05, N('A5'), .05, 0, 2);                                                                         // lullaby ding
  babyCry(s(8) + .25, .95, .22); thud(s(8) + .55, .3, 120);                                                      // born loud
  babyCry(s(9) + .75, .45, .15); slide(s(9) + .95, .8, 1800, 500, .1); bonk(s(9) + 1.75, .45); tweet(s(9) + 2.0); tweet(s(9) + 2.6, .05);
  muffled(s(10), d(10) - .1, .17); muffled(s(11), d(11) * .55, .15); bell(s(11), N('A5'), .07, -.2, .8); bass(s(11), N('F2'), .42, .3); thud(s(11) + d(11) * .55, .35, 70);
  for (let i = 0; i < 4; i++) tick(s(12) + .2 + i * .22, .05, 2600 + i * 200);                                   // giggles
  for (const [i, n] of ['C6', 'A5', 'F5', 'C6', 'Bb5', 'G5'].entries()) bell(s(15) + i * BEAT / 2 + .02, N(n), .045, .2, 1.2);   // grandma's music box

  // ================= B. the storm (shots 16-25): A minor, rain, heartbeat pulse =================
  const B0 = s(16), B1 = s(26);
  const rainG = ac.createGain(); { const lp = filt('lowpass', 5200), hp = filt('highpass', 450); noise(B0, s(35) - B0 + .5).connect(hp).connect(lp).connect(rainG).connect(sfx); rainG.gain.setValueAtTime(0, at(B0)); rainG.gain.linearRampToValueAtTime(.11, at(B0 + .3)); }
  const chordsB = [['A2', 'E3', 'A3', 'C4'], ['F2', 'C3', 'F3', 'A3'], ['D2', 'A2', 'D3', 'F3'], ['E2', 'B2', 'E3', 'G#3']];
  for (let bar = 0; B0 + bar * BAR < B1 - .01; bar++) {
    const t = B0 + bar * BAR, ch = chordsB[Math.floor(bar / 2) % 4];
    const grow = bar / ((B1 - B0) / BAR);
    pad(t, Math.min(BAR, B1 - t), ch.map(N), .03 + grow * .04, 500 + grow * 1500, music, .05);
    for (let b = 0; b < 4; b++) { const tb = t + b * BEAT; if (tb >= B1) break; tick(tb, .05 + grow * .03, 1500); if (b % 2 === 0) kick(tb, .32 + grow * .25); pluck(tb, N(ch[0]) * 2, .1, .25, .3); }
  }
  thunder(s(16) + .25); thunder(s(16) + 1.7, .4); thunder(s(17) + .1, .45); thunder(s(22) + .55, .5); thunder(s(25) + 1.3, .55);
  crackSfx(s(17) + .3); crackSfx(s(17) + 1.2, .25); crackSfx(s(22), .45); thud(s(22), .4, 70);
  water(s(17), d(17), .12); water(s(22), d(22), .16);
  for (let i = 0; i < 6; i++) { const tt = s(18) + i * .21; tick(tt, .03, 600); }
  for (let k = 0; k < 7; k++) { const tk = s(20) + .087 + k * .349; if (tk - s(20) < d(20) * .4 || tk - s(20) > d(20) * .65) knock(tk, .3); }
  inhale(s(24) + .1, d(24), .15); kick(s(24), .8); bass(s(24), N('E2'), .45, .3); pluck(s(24), N('E4'), .14, 0, .3);
  riser(s(25), d(25), .1);
  // ================= C. the break (shot 26) and THE SHOUT (shot 27) =================
  music.gain.setValueAtTime(1, at(s(26) - .01)); music.gain.linearRampToValueAtTime(0, at(s(26) + .03)); music.gain.setValueAtTime(0, at(s(27) - .01)); music.gain.linearRampToValueAtTime(1, at(s(27)));
  verbGain.gain.setValueAtTime(.32, at(s(26) - .01)); verbGain.gain.linearRampToValueAtTime(0, at(s(26) + .05)); verbGain.gain.setValueAtTime(.32, at(s(27) - .01));
  setRain(rainG, s(26), .03); rainG.gain.setValueAtTime(.03, at(s(27) - .02));
  const S27 = s(27);
  foghorn(S27, 1.9, [N('A1'), N('E2'), N('A2')], .34); boom(S27, .95); crash(S27, .3);
  rainG.gain.linearRampToValueAtTime(.12, at(S27 + .3));
  for (let i = 0; i < 10; i++) whoosh(S27 + .3 + i * .07, .25, 2500, 4000, .03);              // birds flapping
  // ================= D. lights + avalanche (shots 28-33): drums, A minor drive =================
  const D0 = s(28), D1 = s(34);
  const chordsD = [['A2', 'E3', 'A3', 'C4'], ['F2', 'C3', 'F3', 'A3'], ['C3', 'G3', 'C4', 'E4'], ['G2', 'D3', 'G3', 'B3']];
  for (let bar = 0; D0 + bar * BAR < D1 - .01; bar++) {
    const t = D0 + bar * BAR, ch = chordsD[bar % 4];
    for (let b = 0; b < 4; b++) {
      const tb = t + b * BEAT; if (tb >= D1) break;
      kick(tb, .6); if (b % 2) snare(tb, .28); hat(tb + BEAT / 2, .06); hat(tb, .05);
      bass(tb, N(ch[0]), .34, .25); bass(tb + BEAT / 2, N(ch[0]), .22, .18);
      if (b === 0) brass(tb, BAR * .9, ch.slice(1).map(N), .07 + Math.min(bar, 3) * .012, 2600);
    }
  }
  for (let i = 0; i < 12; i++) bell(s(28) + i * .12, N(['A4', 'C5', 'E5', 'A5'][i % 4]) * (i > 7 ? 2 : 1), .04, (i % 2) - .5, .6);   // lights popping on
  rumble(s(29), D1 - s(29), .55); roar(s(30), D1 - s(30) - .3, .26);
  tom(s(31) + d(31) - .4, 140, .35); tom(s(31) + d(31) - .2, 100, .4);
  whoosh(s(32), d(32) * .55, 300, 2000, .25);
  boom(s(32) + d(32) * .55, .6);
  thud(s(33), .5, 60); water(s(33), d(33) * .4, .14);
  setRain(rainG, s(33), .07); setRain(rainG, s(34) + d(34), .0);
  // ================= E. calm (shot 34): A major resolution, dawn birds =================
  kick(s(34), .45); bass(s(34), N('A2'), .45, .5); pad(s(34), d(34) + .4, [N('A2'), N('E3'), N('A3'), N('C#4'), N('E4')], .05, 1400, music, .08);
  for (const [i, n] of ['A5', 'C#6', 'E6', 'A6'].entries()) bell(s(34) + i * BEAT, N(n), .05, i % 2 ? .3 : -.3, 1.6);
  tweet(s(34) + .5, .05); tweet(s(34) + 1.2, .04);
  // ================= F. ceremony (shots 35-37): fanfare, then the fine =================
  const F0 = s(35);
  for (const [dt, n, len] of [[0, 'C5', .13], [.15, 'C5', .13], [.3, 'C5', .13], [.45, 'F5', .5], [1.2, 'A5', .3], [1.6, 'G5', .3], [2.0, 'A5', .6]]) trumpet(F0 + dt, N(n), len, .07);
  for (let b = 0; b < 7; b++) { const tb = F0 + b * BEAT; snare(tb, .12); bass(tb, N(['F2', 'C3'][b % 2]), .3, .2); if (b % 2 === 0) kick(tb, .4); }
  brass(F0 + .45, 1.2, [N('F3'), N('A3'), N('C4')], .06);
  pad(F0, d(35), [N('F3'), N('A3'), N('C4')], .03, 1200);
  scratch(s(36), .32);                                    // the fine: music stops dead
  tick(s(36) + BEAT * 2, .04, 1200); tick(s(36) + BEAT * 4, .04, 1200);
  sadTrombone(s(37) + .02);
  // ================= G. the family fights back (shots 38-43): D minor march, layer by layer =================
  const G0 = s(38), G1 = s(43);
  for (let b = 0; G0 + b * BEAT < G1 - .01; b++) {
    const tb = G0 + b * BEAT; const n = LINES.findIndex(l => tb >= l.start && tb < l.end) + 1;
    kick(tb, .45 + (n - 38) * .04); bass(tb, N(['D2', 'D2', 'A2', 'D2'][b % 4]), .32, .22);
    if (n >= 39) { snare(tb + BEAT / 2, .1); if (b % 2) snare(tb, .2); }
    if (n >= 40 && b % 4 === 0) brass(tb, BAR * .8, [N('D3'), N('F3'), N('A3')], .06);
    if (n >= 41) trumpet(tb, N(['D4', 'F4', 'A4', 'D5'][b % 4]), .2, .05);
    if (n === 42) { for (let r = 0; r < 4; r++) snare(tb + r * BEAT / 4, .05 + (tb - s(42)) / d(42) * .2); }
  }
  riser(s(42), d(42), .08);
  for (let n = 38; n <= 42; n++) { tom(s(n), 95, .5); crash(s(n), .08); }
  const S43 = s(43);
  foghorn(S43, 1.6, [N('D1'), N('A1'), N('D2'), N('F2')], .36); boom(S43, .9); crash(S43, .3);   // deliberate stinger: Grandma's shout
  whoosh(S43 + .3, .55, 600, 3000, .3); thud(S43 + .85, .7, 70); gasp(S43 + .25, .12);
  // ================= H. the mountain (44-47) =================
  boom(s(44), .3); rumble(s(44), d(44) + d(45) * .5, .6);
  for (let b = 0; b < LINES[44].beats; b++) tick(s(45) + b * BEAT, .07, 900);          // frozen: a clock in the silence
  gasp(s(45), .09); for (const n of ['B5', 'C6', 'F#6']) bell(s(45), N(n), .06, 0, .9);
  whoosh(s(46) + d(46) * .05, d(46) * .78, 1500, 200, .3); thud(s(46) + d(46) * .85, .6, 55); whoosh(s(46) + d(46) * .85, .5, 800, 300, .15);
  thud(s(47), .45, 80); slide(s(47) + d(47) * .25, d(47) * .3, 1600, 400, .16); boing(s(47) + d(47) * .55, .32); tweet(s(47) + d(47) * .7, .05);
  // ================= I. coda (48-end): the tiptoe theme on a music box =================
  const I0 = s(48);
  for (let bar = 0; I0 + bar * BAR < DURATION - BAR; bar++) {
    const t = I0 + bar * BAR, ch = chordsA[bar % 4], mel = melA[bar % 8];
    for (let b = 0; b < 4; b++) bass(t + b * BEAT, N(ch[b]), .32, .22);
    for (let e = 0; e < 8; e++) if (mel[e]) { bell(t + e * BEAT / 2, N(mel[e]) * 2, .11, e % 2 ? .25 : -.25, 1.1); pluck(t + e * BEAT / 2, N(mel[e]), .09, 0, .25); }
    for (let b = 1; b < 4; b += 2) snap(t + b * BEAT, .1);
  }
  bell(s(49) + d(49) * .55, N('C7'), .07, .3, 1.5);                     // the wink
  const E0 = s(50);
  pad(E0, d(50) - .6, [N('F2'), N('C3'), N('F3'), N('A3'), N('C4')], .08, 1500, music, .1);
  for (const [i, n] of ['F5', 'A5', 'C6', 'F6'].entries()) bell(E0 + i * BEAT, N(n), .06, i % 2 ? .3 : -.3, 2);
  master.gain.setValueAtTime(.9, at(DURATION - .8)); master.gain.linearRampToValueAtTime(0, at(DURATION));
}
