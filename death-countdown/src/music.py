# Original score + sound design for "Death Countdown", synthesized from scratch and timed to the voice timeline.
# usage: python3 music.py <timeline.json> <voice_dir> <out.wav>
import json, sys, numpy as np
from scipy.signal import lfilter, butter, fftconvolve
from scipy.io import wavfile

SR = 48000
TL = json.load(open(sys.argv[1])); VO = sys.argv[2]; OUT = sys.argv[3]
L = TL['lines']; DUR = TL['duration']; N = int((DUR + 1.0) * SR)
st = [0.0] + [l['start'] - 0.12 for l in L[1:]] + [DUR]
def word(li, w):
    ws = L[li]['words']
    if isinstance(w, int): return ws[w]['s']
    for x in ws:
        if ''.join(c for c in x['w'].lower() if c.isalpha()) == w: return x['s']
    raise KeyError(w)
rng = np.random.default_rng(7)
music = np.zeros((N, 2)); sfx = np.zeros((N, 2))
def tt(d): return np.arange(int(d * SR)) / SR
def add(buf, t, sig, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), len(buf) - i)
    lg, rg = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    buf[i:i + n, 0] += sig[:n] * g * lg; buf[i:i + n, 1] += sig[:n] * g * rg
def m2f(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na = max(1, min(n // 2, int(a * SR))); nr = max(1, min(n // 2, int(r * SR)))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
def lp(x, fc, order=2): b, a = butter(order, min(fc / (SR / 2), 0.99)); return lfilter(b, a, x)
def hp(x, fc, order=2): b, a = butter(order, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), min(hi / (SR / 2), 0.99)], 'band'); return lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(d * SR))

# ---------- instruments ----------
def pluck(f, d=0.6, bright=0.6, decay=0.996):
    n = int(d * SR); P = max(2, int(SR / f)); x = np.zeros(n); x[:P] = lp(rng.uniform(-1, 1, P), 1000 + 7000 * bright)
    a = np.zeros(P + 2); a[0] = 1; a[P] = -decay / 2; a[P + 1] = -decay / 2
    y = lfilter([1], a, x); return y / (np.abs(y).max() + 1e-9) * env(n, 0.001, 0.05)
def bell(f, d=1.4, g=1.0):
    t = tt(d); y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * k) for r, a, k in [(1, 1, 2.2), (2.0, .35, 3.5), (3.01, .18, 5), (4.2, .1, 7)])
    return y * env(len(t), 0.002, 0.2) * g
def mbox(f, d=1.6): t = tt(d); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 9)) * np.exp(-t * 2.6) * env(len(t), 0.001, 0.2)
def pad(fs, d, a=0.6, r=0.8, bright=0.35):
    t = tt(d); y = np.zeros(len(t))
    for f in fs:
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            for h in range(1, 6): y += np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6)) * (bright ** (h - 1)) / h
    return y / (len(fs) * 3) * env(len(t), a, r)
def bass(f, d, drive=1.6):
    t = tt(d); y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t); return np.tanh(drive * y) / 1.2 * env(len(t), 0.004, 0.06)
def strings(f, d, a=0.02):
    t = tt(d); vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t); y = sum(np.sin(2 * np.pi * f * h * np.cumsum(vib) / SR) / h for h in range(1, 10))
    return lp(y, 3200) * 0.35 * env(len(t), a, 0.06)
def brass(fs, d):
    t = tt(d); y = np.zeros(len(t))
    for f in fs: y += sum(np.sin(2 * np.pi * f * h * t) * (0.7 ** h) for h in range(1, 8))
    sweep = np.clip(t / 0.15, 0, 1); return lp(y * (0.4 + 0.6 * sweep), 2600) / len(fs) * env(len(t), 0.04, 0.5)
def choir(fs, d):
    t = tt(d); y = np.zeros(len(t))
    for f in fs:
        for det in (-0.08, 0.08):
            src = sum(np.sin(2 * np.pi * f * 2 ** (det / 12) * h * t * (1 + 0.003 * np.sin(2 * np.pi * 5 * t))) / h for h in range(1, 14))
            y += bp(src, 500, 1300) + 0.6 * bp(src, 2300, 3200)
    return y / len(fs) * env(len(t), 0.35, 0.8) * 0.6
def kick(g=1.0): t = tt(0.4); f = 45 + 90 * np.exp(-t * 28); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * g
def snare(): t = tt(0.22); return (hp(noise(0.22), 1500) * 0.5 + np.sin(2 * np.pi * 190 * t) * 0.5) * np.exp(-t * 20)
def clap(): n = noise(0.2); e = np.zeros(len(n)); [e.__setitem__(slice(int(k * SR), None), e[int(k * SR):] + np.exp(-np.arange(len(n) - int(k * SR)) / SR * 40)) for k in (0, .012, .024)]; return bp(n, 900, 3500) * e * 0.5
def hat(o=False): d = 0.25 if o else 0.05; t = tt(d); return hp(noise(d), 7000) * np.exp(-t * (12 if o else 70)) * 0.35
def tom(f=110): t = tt(0.5); return np.sin(2 * np.pi * np.cumsum(f * (1 + np.exp(-t * 18))) / SR) * np.exp(-t * 7)
def timp(f=73): t = tt(1.4); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 1.5 * t)) * np.exp(-t * 3) + lp(noise(1.4), 400) * np.exp(-t * 25) * 0.3
def boom(d=2.2, f0=70): t = tt(d); return (np.sin(2 * np.pi * np.cumsum(f0 * np.exp(-t * 1.2) + 25) / SR) * np.exp(-t * 2.2) + lp(noise(d), 300) * np.exp(-t * 4) * 0.6)
def whoosh(d=0.6, up=True):
    n = noise(d); t = tt(d); out = np.zeros(len(n)); seg = 1024
    for i in range(0, len(n), seg):
        k = i / len(n); fc = 300 + (k if up else 1 - k) ** 1.5 * 5000; out[i:i + seg] = lp(n[i:i + seg], fc, 1)
    return out * np.sin(np.pi * t / d) ** 2 * 0.9
def riser(d): t = tt(d); return (whoosh(d, True) * 0.7 + np.sin(2 * np.pi * np.cumsum(200 + 1400 * (t / d) ** 2) / SR) * 0.12 * (t / d)) * env(len(t), 0.1, 0.05)

# ---------- score ----------
# A: bouncy town theme, C major, 120 bpm
def sectionA(t0, t1, bpm=120, gain=1.0, sparse=False):
    b = 60 / bpm; prog = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])]
    mel = [76, 79, 81, 79, 76, 74, 72, 74, 76, 79, 84, 83, 81, 79, 76, None, 77, 76, 74, 72, 74, 76, 74, 71, 72, None, 76, None, 79, None, 72, None]
    t = t0; k = 0
    while t < t1 - 0.05:
        bar = int(k // 8); root, ch = prog[bar % 4]; beat = k % 8
        if beat % 2 == 0: add(music, t, bass(m2f(root - 12 + (7 if beat == 4 else 0)), b * 0.9), 0.30 * gain)
        for j, nn in enumerate(ch):  # ukulele strum on 8ths
            if not sparse or beat % 2 == 0: add(music, t + j * 0.012, pluck(m2f(nn + 12), 0.5, 0.5), (0.09 if beat % 2 else 0.12) * gain, pan=-0.3 + j * 0.3)
        mn = mel[k % len(mel)]
        if mn and not sparse: add(music, t, bell(m2f(mn), 0.9), 0.10 * gain, pan=0.2)
        if beat in (0, 4): add(music, t, kick(), 0.35 * gain)
        if beat in (2, 6): add(music, t, clap(), 0.22 * gain)
        add(music, t, hat(), 0.12 * gain, pan=0.4)
        t += b / 2; k += 1
# B: sad music box, A minor, 76 bpm
def sectionB(t0, t1, gain=1.0):
    b = 60 / 76; chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]]
    arp = [0, 1, 2, 1]; t = t0; k = 0
    while t < t1 - 0.1:
        ch = chords[(k // 8) % 4]
        if k % 8 == 0: add(music, t, pad([m2f(n) for n in ch], b * 4.2, 0.8, 1.2, 0.3), 0.20 * gain)
        add(music, t, mbox(m2f(ch[arp[k % 4]] + 24), 1.4), 0.10 * gain, pan=0.25 * np.sin(k))
        if k % 8 == 0: add(music, t, bass(m2f(ch[0] - 12), b * 3.8, 1.0), 0.16 * gain)
        t += b / 2; k += 1
# C: tension drone + heartbeat
def sectionC(t0, t1):
    d = t1 - t0; tv = tt(d)
    drone = (np.sin(2 * np.pi * 36.7 * tv) + 0.5 * np.sin(2 * np.pi * 55 * tv * (1 + 0.002 * np.sin(tv)))) * 0.5 + lp(noise(d), 200) * 0.25
    add(music, t0, drone * env(len(tv), 1.0, 0.4), 0.30)
    for x in np.arange(t0 + 0.3, t1 - 0.3, 0.9): add(music, x, kick(0.6), 0.22); add(music, x + 0.22, kick(0.4), 0.16)
# D: suspense ostinato, D minor 140 bpm
def sectionD(t0, t1, gain=1.0):
    b = 60 / 140; pat = [50, 50, 53, 50, 57, 50, 53, 55]; t = t0; k = 0
    while t < t1 - 0.05:
        add(music, t, strings(m2f(pat[k % 8]), b * 0.45), 0.15 * gain, pan=-0.2)
        if k % 8 == 0: add(music, t, timp(73.4), 0.22 * gain)
        if k % 16 == 0: add(music, t, pad([m2f(n) for n in (50, 53, 57)], b * 8.2, 0.4, 0.6, 0.2), 0.16 * gain)
        t += b / 2; k += 1
# E: action, 140 bpm
def sectionE(t0, t1):
    b = 60 / 140; t = t0; k = 0; riff = [38, 38, 41, 38, 43, 38, 41, 36]
    while t < t1 - 0.05:
        add(music, t, bass(m2f(riff[k % 8]), b * 0.42, 2.2), 0.26)
        if k % 4 == 0: add(music, t, kick(), 0.45)
        if k % 4 == 2: add(music, t, snare(), 0.32)
        if k % 16 == 15: add(music, t, tom(130), 0.25); add(music, t + b / 4, tom(100), 0.25)
        add(music, t, hat(k % 4 == 3), 0.12, pan=0.35)
        if k % 8 == 0: add(music, t, brass([m2f(n) for n in (62, 65, 69)], b * 1.6), 0.10)
        add(music, t, strings(m2f(riff[k % 8] + 24), b * 0.4), 0.06, pan=-0.3)
        t += b / 2; k += 1
# F: heroic grandma, D major
def sectionF(t0, t1):
    d = t1 - t0
    add(music, t0, brass([m2f(n) for n in (50, 57, 62, 66)], 2.2), 0.28); add(music, t0, timp(73.4), 0.4); add(music, t0, boom(2.0, 60), 0.35)
    add(music, t0 + 0.1, choir([m2f(n) for n in (62, 66, 69)], d + 0.4), 0.30)
    add(music, t0, pad([m2f(n) for n in (50, 57, 62, 66)], d + 0.5, 0.2, 1.0, 0.4), 0.18)
    b = 60 / 100
    for i, x in enumerate(np.arange(t0 + 2.4, t1, b)): add(music, x, timp(73.4 if i % 2 == 0 else 55), 0.18)
# G: warm resolution (theme reprise as music box + pad)
def sectionG(t0, t1):
    b = 60 / 92; prog = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])]
    mel = [76, 79, 81, 79, 76, 74, 72, 74, 76, 79, 84, 83, 81, 79, 76, None]
    t = t0; k = 0
    while t < t1 - 1.0:
        root, ch = prog[(k // 4) % 4]
        if k % 4 == 0: add(music, t, pad([m2f(n) for n in ch], b * 4.2, 0.5, 1.0, 0.3), 0.18); add(music, t, bass(m2f(root - 12), b * 3.6, 0.9), 0.15)
        mn = mel[k % len(mel)]
        if mn and k >= 4: add(music, t, mbox(m2f(mn), 1.6), 0.10, pan=0.15)
        add(music, t, pluck(m2f(ch[k % 3] + 12), 0.8, 0.3), 0.06, pan=-0.25)
        t += b; k += 1
    add(music, t1 - 3.6, pad([m2f(n) for n in (48, 55, 60, 64, 67)], 4.2, 0.6, 2.0, 0.3), 0.22)
    add(music, t1 - 3.6, mbox(m2f(72), 3.0), 0.12); add(music, t1 - 3.4, mbox(m2f(79), 3.0), 0.09)

sectionA(0.0, st[6])
add(music, st[6], bell(m2f(45), 3.0) + bell(m2f(57), 3.0) * 0.5, 0.35)  # the drop: "My phone says zero"
sectionB(st[6] + 0.9, st[12])
sectionC(st[12], st[15])
sectionD(st[15], st[19], gain=0.9)
sectionE(st[19], st[24])
sectionF(st[24], st[27])
sectionG(st[27], DUR + 0.6)

# ---------- sound effects ----------
for k in range(6): add(sfx, 0.0, np.zeros(1))
# skydive wind + crater impact
d4 = st[5] - st[4]; w = lp(noise(d4), 900) * (0.5 + 0.5 * np.sin(np.pi * tt(d4) / d4)); add(sfx, st[4], w, 0.25)
add(sfx, st[4] + 0.05, whoosh(1.0, False), 0.25)
add(sfx, st[5], boom(1.8, 80), 0.75); add(sfx, st[5], lp(noise(0.8), 1500) * np.exp(-tt(0.8) * 6), 0.4)
add(sfx, st[5] + 0.75, whoosh(0.25, True), 0.12)
# old man / zero phone ticks
for x in np.arange(st[3] + 0.2, st[4], 1.0): add(sfx, x, bell(2000, 0.1), 0.05)
# flashback: rain, thunder, siren
d7 = st[8] - st[7]; rain = hp(noise(d7), 2000) * 0.2 + lp(noise(d7), 600) * 0.15; add(sfx, st[7], rain * env(len(rain), 0.3, 0.4), 0.5)
add(sfx, st[7] + 0.25, boom(2.4, 45), 0.4)
ts = tt(d7); siren = np.sin(2 * np.pi * np.cumsum(700 + 220 * np.sin(2 * np.pi * 0.9 * ts)) / SR); add(sfx, st[7], lp(siren, 2500) * env(len(ts), 0.4, 0.5), 0.05, pan=0.5)
add(sfx, st[7], whoosh(0.5, False), 0.2)
add(sfx, st[8] - 0.2, whoosh(0.4, True), 0.15)
# ghost sting
add(sfx, word(11, 'ghost'), bell(m2f(81), 1.5) + bell(m2f(87), 1.5), 0.12)
add(sfx, word(11, 'ghost') - 0.05, whoosh(0.4, False), 0.15)
# clock ticks + knocks
for x in np.arange(st[12], st[13], 0.5): add(sfx, x, hp(noise(0.02), 3000) * np.exp(-tt(0.02) * 200), 0.25)
def knock(): t = tt(0.18); return (np.sin(2 * np.pi * 95 * t) * np.exp(-t * 30) + lp(noise(0.18), 900) * np.exp(-t * 45) * 0.8)
kn = word(12, 'knocked')
for i, k in enumerate((0.02, 0.3, 0.58)): add(sfx, kn + k, knock(), 0.9, pan=(-0.2, 0.1, 0.0)[i])
def thud(g=1): t = tt(0.5); return (np.sin(2 * np.pi * np.cumsum(60 + 80 * np.exp(-t * 25)) / SR) * np.exp(-t * 8) + lp(noise(0.5), 1200) * np.exp(-t * 18) * 0.7) * g
# doorbell cam static + glitches
d13 = st[14] - st[13]; add(sfx, st[13], hp(noise(d13), 3000) * 0.08 + np.sin(2 * np.pi * 60 * tt(d13)) * 0.05, 0.5)
add(sfx, st[13], bell(1400, 0.15), 0.12)
# creepy head tilt: creaks on each stutter step, bone crack on the twitch
def creak(f=180): t = tt(0.09); return bp(np.sign(np.sin(2 * np.pi * f * t)) * (1 + 0.5 * noise(0.09)), 300, 2500) * np.exp(-t * 30)
for j in range(1, 10): x = 0.35 + 1.35 * (np.arccos(1 - 2 * j / 9) / np.pi); add(sfx, st[13] + x, creak(140 + j * 12), 0.22, pan=-0.1)
add(sfx, st[13] + 1.95, hp(noise(0.05), 1800) * np.exp(-tt(0.05) * 90), 0.7); add(sfx, st[13] + 1.97, hp(noise(0.04), 2500) * np.exp(-tt(0.04) * 110), 0.5); add(sfx, st[13] + 1.95, thud(0.4), 0.25)
fw = word(14, 'face'); ov = word(14, 'overdue')
for i in range(3): add(sfx, fw - 0.35 + i * 0.18, hp(noise(0.12), 1500) * np.sign(np.sin(2 * np.pi * 40 * tt(0.12))), 0.12)
add(sfx, ov - 0.12, boom(1.6, 55), 0.55); add(sfx, ov - 0.12, brass([m2f(n) for n in (38, 44, 50)], 1.2), 0.3)
# slam
for x in np.arange(st[15] + 0.02, st[15] + 0.5, 0.11): add(sfx, x, knock() * 0.5, 0.3)  # Dad's running footsteps
for b in (0.2, 0.58, 0.95, 1.3): add(sfx, st[15] + b, thud(), 0.75); add(sfx, st[15] + b + 0.01, hp(noise(0.12), 2500) * np.exp(-tt(0.12) * 30), 0.25)  # monsters banging, wood cracking
add(sfx, st[16], riser(st[17] - st[16]), 0.18)
for b in np.arange(st[16] + 0.3, st[19] - 0.25, 0.85): add(sfx, b, thud(), 0.55); add(sfx, b + 0.01, hp(noise(0.1), 2500) * np.exp(-tt(0.1) * 30), 0.18)  # monsters keep banging on the door
# door blast
for x in np.arange(st[19], st[19] + 0.22, 0.07): add(sfx, x, thud(0.5), 0.4)
add(sfx, st[19] + 0.22, boom(2.0, 90), 0.5); add(sfx, st[19] + 0.22, hp(noise(0.6), 800) * np.exp(-tt(0.6) * 6), 0.3)
for i in range(5): add(sfx, st[19] + 0.5 + i * 0.13, knock(), 0.3, pan=rng.uniform(-.6, .6))
add(sfx, st[19] + 1.3, thud(), 0.5)  # door lands
for j in range(1, 9): add(sfx, st[19] + 0.55 + (L[20]['start'] - 0.12 - 0.1 - st[19] - 0.55) * (np.arccos(1 - 2 * j / 8) / np.pi), creak(120 + j * 9), 0.22)  # Collector leaning in
add(sfx, st[19] + 0.6, lp(noise(1.0), 160) * np.sin(np.pi * tt(1.0) / 1.0) * 0.8, 0.35)  # low groan
# bonk + crack
hit = word(20, 'hit') + 0.05
t = tt(0.9); bonk = np.sin(2 * np.pi * 420 * t) * np.exp(-t * 6) + 0.6 * np.sin(2 * np.pi * 1130 * t) * np.exp(-t * 9) + 0.3 * np.sin(2 * np.pi * 2210 * t) * np.exp(-t * 12)
add(sfx, hit, bonk, 0.5); add(sfx, hit, thud(), 0.4); add(sfx, hit + 0.02, hp(noise(0.35), 4000) * np.exp(-tt(0.35) * 10), 0.35)
add(sfx, hit - 0.3, whoosh(0.3, True), 0.2)
# tackle
ti = word(21, 'tackled') + 0.25; ic = ti + 0.3
for x in np.arange(st[21] + 0.05, ti - 0.25, 0.17): add(sfx, x, knock() * 0.6, 0.35)
add(sfx, ti - 0.25, whoosh(0.5, True), 0.3); add(sfx, ti, thud(), 0.6)
add(sfx, ic, boom(1.6, 70), 0.5); add(sfx, ic, lp(noise(1.0), 2500) * np.exp(-tt(1.0) * 4), 0.22)
for i in range(6): add(sfx, ic + 0.1 + i * 0.09, knock(), 0.25, pan=rng.uniform(-.7, .7))
# remote throw
add(sfx, word(22, 'over') + 0.18, whoosh(0.5, True), 0.25)
# beeping phone
bt = word(23, 'beeping') - 0.6
for x in np.arange(np.ceil(bt / 0.8) * 0.8, st[24], 0.8):
    tb = tt(0.16); add(sfx, x, np.sign(np.sin(2 * np.pi * 1760 * tb)) * env(len(tb), 0.002, 0.02) * 0.4, 0.35)
for x in np.arange(st[23] + 0.1, bt, 0.6): add(sfx, x, kick(0.5), 0.3)
# grandma: riser into entrance, slap, transfer shimmer
add(sfx, st[24] - 1.2, riser(1.2), 0.25)
add(sfx, st[24] + 0.3, knock() * 0.5, 0.3); add(sfx, st[24] + 0.9, knock() * 0.5, 0.25)
slap = word(25, 'tab') + 0.1
add(sfx, slap, hp(noise(0.12), 1200) * np.exp(-tt(0.12) * 35), 0.8); add(sfx, slap, thud(0.5), 0.4)
for i, x in enumerate(np.arange(st[26] + 0.2, st[27] - 0.2, 0.09)): add(sfx, x, bell(m2f(72 + [0, 4, 7, 12, 16, 19][i % 6] + 12 * (i // 6 % 2)), 0.6), 0.05, pan=np.sin(i))
add(sfx, st[26] + 0.2, riser(st[27] - st[26] - 0.2), 0.12)
# account settled chime
add(sfx, st[27] + 0.05, bell(m2f(84), 1.5) + bell(m2f(88), 1.5) * 0.7 + bell(m2f(91), 1.5) * 0.5, 0.18)
for i, x in enumerate(np.arange(st[27] + 1.0, st[28], 0.45)): add(sfx, x, knock() * 0.5, 0.15)
for i, x in enumerate(np.arange(st[29] + 0.4, st[30] - 0.1, 0.08)): add(sfx, x, bell(m2f(76 + [0, 3, 7, 12, 15][i % 5]), 0.5), 0.04, pan=np.cos(i))
# dad kicking in couch (cushion thumps)
for x in np.arange(st[30] + 0.1, st[30] + 2.2, 0.24): add(sfx, x, lp(noise(0.1), 500) * np.exp(-tt(0.1) * 30), 0.25, pan=-0.4)
for i, x in enumerate(np.arange(st[32] + 0.4, st[32] + 1.6, 0.12)): add(sfx, x, bell(m2f(84 + [0, 4, 7, 11][i % 4]), 0.9), 0.03, pan=np.sin(i))  # ghost shimmer
add(sfx, L[32]['end'] + 0.32, bell(m2f(96), 0.6) + bell(m2f(103), 0.6) * 0.6, 0.12)  # wink ting
# title hit
add(sfx, L[32]['end'] + 1.55, boom(2.4, 50), 0.45); add(sfx, L[32]['end'] + 1.55, bell(m2f(48), 3) + bell(m2f(55), 3), 0.15)
# transitions: soft whoosh on selected cuts
for k in (1, 2, 3, 6, 8, 9, 10, 17, 18, 26, 28, 31, 32): add(sfx, st[k] - 0.15, whoosh(0.3, True), 0.08)

# ---------- voice bus ----------
voice = np.zeros(N)
for l in L:
    sr, x = wavfile.read(f"{VO}/line{l['i']:02d}.wav"); x = x.astype(float) / 32768
    i = int(l['start'] * SR); voice[i:i + len(x)] += x[:max(0, N - i)]
voice = hp(voice, 90); voice = voice / (np.abs(voice).max() + 1e-9) * 0.85
# light compression on voice
venv = lp(np.abs(voice), 12, 1); gr = np.where(venv > 0.18, (0.18 / np.maximum(venv, 1e-6)) ** 0.4, 1.0); voice = voice * gr; voice = voice / np.abs(voice).max() * 0.9

# reverb on music
ir = rng.standard_normal(int(1.6 * SR)) * np.exp(-np.arange(int(1.6 * SR)) / SR * 4.0); ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
for c in range(2): music[:, c] = music[:, c] * 0.8 + fftconvolve(music[:, c], ir * (0.9 if c else 1.0))[:N] * 0.28
sfxr = sfx.copy()
for c in range(2): sfxr[:, c] = sfx[:, c] + fftconvolve(sfx[:, c], ir)[:N] * 0.12

# duck music under the voice
ve = lp(np.abs(voice), 6, 1); vd = np.clip(ve / 0.05, 0, 1); duck = 1 - 0.72 * vd
music *= duck[:, None]; sfxr *= (1 - 0.35 * vd)[:, None]
mix = music * 0.6 + sfxr * 0.8 + np.stack([voice, voice], 1) * 1.0
# fade
fo = int(0.6 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = mix / np.abs(mix).max() * 0.95
wavfile.write(OUT, SR, (mix * 32767).astype(np.int16))
wavfile.write(OUT.replace('.wav', '_music_only.wav'), SR, (np.clip((music * 0.9 + sfxr * 0.9) / (np.abs(music * 0.9 + sfxr * 0.9).max() + 1e-9) * 0.9, -1, 1) * 32767).astype(np.int16))
print('ok', DUR)
