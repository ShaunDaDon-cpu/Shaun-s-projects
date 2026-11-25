// Timed captions: words pop in one at a time, the current word highlighted.
// Side characters get a name tag (with how the line is said); shouted lines are big, hot and shaking.
import { VO } from './vo-timing.js';
const FONT = 'Fredoka, sans-serif';
const TAGS = { MOM: '#c77dff', DAD: '#4cc9f0', MAYOR: '#adb5bd', GRANDMA: '#ff8fab' };
const HOW = { 13: 'whispering', 19: 'whispering', 36: 'whispering', 39: 'out loud', 41: 'out loud', 43: 'shouting', 49: 'whispering' };
const Y = 1190;                     // caption centre: ~62% down, clear of the TikTok/Reels UI at the bottom

function wrap(ctx, words, maxW) {
  const lines = [[]]; let w = 0; const space = ctx.measureText(' ').width + 14;
  for (const word of words) { const ww = ctx.measureText(word).width; if (lines.at(-1).length && w + space + ww > maxW) { lines.push([]); w = 0; } w += (lines.at(-1).length ? space : 0) + ww; lines.at(-1).push(word); }
  return lines;
}
// word onsets follow the voiceover: spread over the spoken length, weighted by syllables, with pauses at punctuation
const syl = w => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g) || []).length);
function wordTimes(words, dur, fast, n) {
  const [off, len] = VO[n] || [0, Math.min(dur * .8, words.length * (fast ? .1 : .3))];
  const weights = words.map((w, i) => syl(w) + (i && /[,.!?]$/.test(words[i - 1]) ? 1.2 : 0)), sum = weights.reduce((a, b) => a + b);
  let acc = 0; return weights.map(wt => { acc += wt; return off + (acc - wt) / sum * len * .92; });
}

export function drawCaption(ctx, L, t, W, H) {
  if (!L.text) return;
  const shout = L.style === 'shout', side = L.style === 'side';
  const words = L.text.split(' ');
  const times = wordTimes(words, L.dur, shout, L.n);
  const size = shout ? 118 : 80;
  ctx.save();
  ctx.font = `700 ${size}px ${FONT}`; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const lines = wrap(ctx, words, shout ? 960 : 900);
  const lh = size * 1.12, space = ctx.measureText(' ').width + (shout ? 22 : 17) * .8;
  let idx = 0;
  const top = Y - (lines.length - 1) * lh / 2;
  const shakeX = shout ? Math.sin(t * 63) * 6 + Math.sin(t * 41) * 4 : 0, shakeY = shout ? Math.sin(t * 57) * 5 : 0;
  // speaker tag
  if ((side || shout) && TAGS[L.who]) {
    const how = HOW[L.n]; const label = L.who + (how ? '  ·  ' + how : '');
    ctx.font = `700 40px ${FONT}`; const tw = ctx.measureText(label).width + 56, th = 64, tx = W / 2 - tw / 2, ty = top - lh / 2 - th - 18;
    ctx.fillStyle = TAGS[L.who]; ctx.strokeStyle = '#111'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 32); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.fillText(label, W / 2, ty + th / 2 + 2);
    ctx.font = `700 ${size}px ${FONT}`;
  }
  ctx.textAlign = 'left';
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const widths = line.map(w => ctx.measureText(w).width);
    const lw = widths.reduce((a, b) => a + b) + space * (line.length - 1);
    let x = W / 2 - lw / 2 + shakeX; const y = top + li * lh + shakeY;
    for (let k = 0; k < line.length; k++, idx++) {
      const appear = times[idx];
      if (t < appear) { x += widths[k] + space; continue; }
      const age = t - appear, next = times[idx + 1] ?? Infinity, current = t < next;
      const pop = age < .14 ? 1 + .22 * (1 - age / .14) : 1;
      const s = shout ? pop * (1 + Math.sin(t * 20 + k) * .03) : pop;
      ctx.save(); ctx.translate(x + widths[k] / 2, y); ctx.scale(s, s);
      ctx.lineWidth = shout ? 22 : 17; ctx.strokeStyle = '#111'; ctx.strokeText(line[k], -widths[k] / 2, 0);
      if (shout) { const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, '#ffe14d'); g.addColorStop(1, '#ff3b30'); ctx.fillStyle = g; }
      else ctx.fillStyle = current ? '#ffd84a' : '#ffffff';
      ctx.fillText(line[k], -widths[k] / 2, 0);
      ctx.restore();
      x += widths[k] + space;
    }
  }
  ctx.restore();
}

export function drawEndCard(ctx, t, dur, W, H) {
  const a = Math.min(1, t / .5);
  ctx.save();
  ctx.fillStyle = `rgba(10,14,40,${.55 * a})`; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = `700 132px ${FONT}`; ctx.lineWidth = 22; ctx.strokeStyle = '#111';
  for (const [txt, y] of [['THE QUIET', 820], ['TOWN', 960]]) { ctx.strokeText(txt, W / 2, y); ctx.fillStyle = '#ffffff'; ctx.fillText(txt, W / 2, y); }
  ctx.font = `700 64px ${FONT}`; ctx.lineWidth = 14; ctx.strokeText('shhh.', W / 2, 1100); ctx.fillStyle = '#ffd84a'; ctx.fillText('shhh.', W / 2, 1100);
  ctx.restore();
  const fade = Math.max(0, (t - (dur - .6)) / .6);
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
}
