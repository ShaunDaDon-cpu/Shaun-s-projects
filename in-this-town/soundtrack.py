"""Original soundtrack + SFX + voice blips for "In This Town". Writes soundtrack.wav (44.1 kHz stereo).
Everything is synthesized here; no samples are used."""
import json, math, wave
import numpy as np
from scipy.signal import lfilter, butter

SR = 44100
DATA = json.load(open('shots.json'))
DUR = DATA['duration'] + 0.5
N = int(DUR * SR)
music = np.zeros((N, 2))
sfx = np.zeros((N, 2))
rng = np.random.default_rng(7)
BEAT = 0.5  # 120 BPM


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.005, d=0.1, s=0.6, r=0.1, total=None):
    """ADSR over n samples (r included at end)."""
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, n - a_n - d_n - r_n)
    e = np.concatenate([np.linspace(0, 1, a_n, False), np.linspace(1, s, d_n, False), np.full(s_n, s), np.linspace(s, 0, r_n)])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def lp(x, fc, order=2):
    b, a = butter(order, min(fc, SR * 0.45) / (SR / 2), 'low'); return lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), 'high'); return lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)


def add(buf, t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= len(buf) or len(sig) == 0: return
    sig = sig[: len(buf) - i]
    l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l * 1.414
    buf[i:i + len(sig), 1] += sig * gain * r * 1.414


# ---------------- instruments ----------------
def square(f, t, duty=0.5):
    return np.where((t * f) % 1 < duty, 1.0, -1.0)


def saw(f, t):
    return 2 * ((t * f) % 1) - 1


def tri(f, t):
    return 2 * np.abs(2 * ((t * f) % 1) - 1) - 1


def pluck(m, dur):
    t = t_(dur + 0.25); f = mtof(m)
    x = 0.6 * square(f, t, 0.3) + 0.4 * saw(f * 1.003, t)
    x = lp(x, 2600) * np.exp(-t * 7)
    return x * env(len(t), 0.002, 0.05, 1, 0.05)


def lead(m, dur, vib=True):
    t = t_(dur + 0.08); f = mtof(m)
    fm = f * (1 + (0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.25, 0, 1) if vib else 0))
    ph = 2 * np.pi * np.cumsum(fm) / SR
    x = np.sign(np.sin(ph)) * 0.55 + np.sin(ph) * 0.45
    x = lp(x, 3200)
    return x * env(len(t), 0.01, 0.08, 0.75, 0.07)


def bass(m, dur, stacc=False):
    t = t_(dur + 0.05); f = mtof(m)
    x = 0.7 * np.sin(2 * np.pi * f * t) + 0.35 * tri(f * 2, t) * 0.5 + 0.15 * square(f, t)
    x = lp(x, 900)
    return x * (np.exp(-t * (14 if stacc else 2.5))) * env(len(t), 0.004, 0.02, 1, 0.04)


def marimba(m, dur=0.4):
    t = t_(dur + 0.3); f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30) + 0.12 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t * 60)
    return x * np.exp(-t * 9)


def pad(ms, dur, bright=1400, a=0.3):
    t = t_(dur + 0.6); x = np.zeros(len(t))
    for m in ms:
        f = mtof(m)
        for d in (-0.004, 0, 0.005):
            x += saw(f * (1 + d), t + rng.random())
    x = lp(x / (len(ms) * 3), bright)
    return x * env(len(t), a, 0.2, 0.9, 0.55)


def brass(ms, dur):
    t = t_(dur + 0.2); x = np.zeros(len(t))
    for m in ms:
        f = mtof(m)
        x += saw(f, t) + saw(f * 1.004, t)
    cutoff_env = 600 + 2600 * np.exp(-t * 6)
    x = lp(x / len(ms), 3000) * env(len(t), 0.02, 0.15, 0.7, 0.18)
    return x


def kick():
    t = t_(0.35); f = 45 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + 0.15 * np.exp(-t * 200) * rng.standard_normal(len(t))


def snare():
    t = t_(0.25)
    return 0.55 * bp(rng.standard_normal(len(t)), 1200, 8000) * np.exp(-t * 18) + 0.45 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)


def hat(open_=False):
    t = t_(0.25 if open_ else 0.06)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (14 if open_ else 70))


def clap():
    t = t_(0.2); n = bp(rng.standard_normal(len(t)), 900, 5000)
    e = np.exp(-t * 30) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 40) * (t > 0.012) + 0.5 * np.exp(-np.maximum(t - 0.024, 0) * 30) * (t > 0.024)
    return n * e * 0.7


def tom(m):
    t = t_(0.4); f = mtof(m) * (1 + 0.6 * np.exp(-t * 20))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)


def timpani(m, dur=1.2):
    t = t_(dur); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 1.5 * t)) * np.exp(-t * 3) + 0.2 * lp(rng.standard_normal(len(t)), 400) * np.exp(-t * 20)


def crash(dur=1.8):
    t = t_(dur); return hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 2.2) * 0.6


def piano(m, dur=1.2):
    t = t_(dur); f = mtof(m); x = np.zeros(len(t))
    for k, a in ((1, 1), (2, .45), (3, .22), (4, .12)):
        x += a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.5 + k * 1.5))
    return x * env(len(t), 0.003, 0.05, 1, 0.1)


# ---------------- helpers for sequencing ----------------
def notes(buf, start, seq, inst, gain, pan=0.0, **kw):
    for b, d, m in seq:
        add(buf, start + b * BEAT, inst(m, d * BEAT, **kw), gain, pan)


def drums(buf, start, bars, pattern='pop', g=1.0, fill_last=False):
    for bar in range(bars):
        t0 = start + bar * 4 * BEAT
        last = fill_last and bar == bars - 1
        for beat in range(4):
            tb = t0 + beat * BEAT
            if pattern == 'four' or (pattern == 'pop' and beat in (0, 2)) or (pattern == 'sneak' and beat == 0):
                add(buf, tb, kick(), 0.9 * g)
            if pattern == 'pop' and beat == 2: add(buf, tb + 0.75 * BEAT, kick(), 0.6 * g)
            if beat in (1, 3) and not last:
                add(buf, tb, clap() if pattern == 'sneak' else snare(), 0.55 * g, 0.05)
            subs = 4 if pattern == 'four' else 2
            for s in range(subs):
                add(buf, tb + s * BEAT / subs, hat(open_=(pattern != 'sneak' and s == subs - 1 and beat == 3)), (0.16 if s % 2 else 0.22) * g, 0.3)
        if last:
            for i, m in enumerate([50, 50, 47, 47, 43, 43, 40, 40]):
                add(buf, t0 + 2 * BEAT + i * BEAT / 4, tom(m), 0.5 * g, -0.3 + i * 0.08)


# ================= SECTION A: bright theme, C major (0-20) =================
A = 0.0
chordsA = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])]
melody1 = [(0, 1, 76), (1, .5, 79), (1.5, .5, 76), (2, 1, 72), (3, .5, 74), (3.5, .5, 76),
           (4, .5, 72), (4.5, .5, 69), (5, 1, 72), (6, 1.5, 76),
           (8, .5, 77), (8.5, .5, 76), (9, .5, 74), (9.5, .5, 72), (10, 1, 69), (11, 1, 72),
           (12, 1, 74), (13, .5, 71), (13.5, .5, 67), (14, 1, 74), (15, 1, 79)]
melody2 = melody1[:16] + [(12, .5, 67), (12.5, .5, 71), (13, .5, 74), (13.5, .5, 77), (14, 2, 76)]


def chord_bed(start, bars, chords, arp_gain=0.16, bass_gain=0.5, pad_gain=0.0, stacc=False, arp=True):
    for b in range(bars):
        root, ch = chords[b % len(chords)]
        t0 = start + b * 4 * BEAT
        if stacc:
            for i, m in enumerate([root, root + 7, root + 12, root + 7]):
                add(music, t0 + i * BEAT, bass(m, BEAT * 0.5, stacc=True), bass_gain, -0.1)
        else:
            for i in range(8):
                add(music, t0 + i * BEAT / 2, bass(root if i % 4 != 3 else root + 12, BEAT * 0.45), bass_gain * (1 if i % 2 == 0 else 0.7), -0.1)
        if arp:
            seq = ch + [ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]]
            for i, m in enumerate(seq[:8]):
                add(music, t0 + i * BEAT / 2, pluck(m + 12, BEAT / 2), arp_gain, 0.35 if i % 2 else -0.35)
        if pad_gain:
            add(music, t0, pad(ch, 4 * BEAT), pad_gain, 0)


chord_bed(A, 10, chordsA)
drums(music, A, 10, 'pop', 0.9)
add(music, A, crash(), 0.5, 0.2)
notes(music, A + 2.0, melody1, lead, 0.22, 0.05)
notes(music, A + 10.0, melody2, lead, 0.22, 0.05)
notes(music, A + 18.0, [(0, .5, 72), (.5, .5, 74), (1, .5, 76), (1.5, .5, 77), (2, .5, 79), (2.5, .5, 81), (3, 1, 84)], lead, 0.22)

# ================= SECTION B: sneaky, A minor (22-46) =================
B = 22.0
chordsB = [(45, [57, 60, 64]), (45, [57, 60, 64]), (50, [62, 65, 69]), (52, [56, 59, 64])]
motif = [(0, .5, 69), (.5, .5, 72), (1, .5, 76), (2, .5, 75), (2.5, .5, 76), (3.5, .5, 72),
         (4, .5, 69), (5, .5, 71), (5.5, .5, 72), (6, .5, 71), (7, .5, 68),
         (8, .5, 74), (8.5, .5, 77), (9, .5, 81), (10, .5, 80), (10.5, .5, 81), (11.5, .5, 77),
         (12, .5, 76), (13, .5, 74), (13.5, .5, 72), (14, .5, 71), (15, .5, 68)]
chord_bed(B, 12, chordsB, bass_gain=0.6, stacc=True, arp=False)
for rep in range(3):
    notes(music, B + rep * 8.0, motif, lambda m, d: marimba(m, d), 0.3, -0.2)
drums(music, B, 4, 'sneak', 0.7)
drums(music, B + 8, 8, 'pop', 0.75)
for b in range(4, 12):  # from 30s: pad + "mumble" lead doubling as Robs multiply
    root, ch = chordsB[b % 4]
    add(music, B + b * 2.0, pad(ch, 2.0, bright=900), 0.13)
notes(music, B + 16.0, motif, lambda m, d: lead(m - 12, d, vib=False), 0.12, 0.25)

# ================= SECTION C: gloom + Grandma's speech (46-54) =================
C = 46.0
add(music, C, pad([57, 60, 64], 1.9, bright=700, a=0.2), 0.22)
for b, m in [(0, 76), (1, 72), (2, 69), (3, 71)]:
    add(music, C + b * 0.45, piano(m, 1.0), 0.25, 0.1)
# after the slam (47.8): a beat of silence, then the speech bed
add(music, 49.0, pad([50, 57, 62, 65], 5.0, bright=900, a=1.0), 0.22)
for i in range(16):  # timpani roll crescendo
    add(music, 49.0 + i * 0.16, timpani(38, 0.4), 0.08 + i * 0.02)
add(music, 51.69, brass([50, 57, 62, 65, 69], 0.9), 0.32)
add(music, 51.69, timpani(38, 1.6), 0.6)
add(music, 51.69, crash(2.0), 0.35)
add(music, 52.9, brass([52, 56, 59, 64, 68], 1.0), 0.28)

# ================= SECTION D: fight back, D minor (54-80) =================
D = 54.0
chordsD = [(50, [62, 65, 69]), (46, [58, 62, 65]), (48, [60, 64, 67]), (45, [57, 61, 64])]
heroic = [(0, 1.5, 74), (1.5, .5, 69), (2, .5, 74), (2.5, .5, 76), (3, 1, 77),
          (4, .5, 77), (4.5, .5, 76), (5, 1, 74), (6, 1, 77), (7, 1, 82),
          (8, 1.5, 81), (9.5, .5, 79), (10, 1, 77), (11, 1, 76),
          (12, 1, 76), (13, 1, 73), (14, 1, 69), (15, 1, 76)]
chord_bed(D, 11, chordsD, arp_gain=0.13, bass_gain=0.55)
drums(music, D, 1, 'sneak', 0.7)
drums(music, D + 2, 2, 'pop', 0.85, fill_last=True)
drums(music, D + 6, 8, 'four', 0.9, fill_last=True)
add(music, 60.0, crash(), 0.5, -0.2)
notes(music, 60.0, heroic, lead, 0.22)
notes(music, 68.0, heroic, lead, 0.22)
notes(music, 68.0, [(b, d, m - 12) for b, d, m in heroic], lead, 0.1, -0.3)
for b in range(3, 11):
    add(music, D + b * 2.0, pad(chordsD[b % 4][1], 2.0, bright=1600), 0.08)
# 76-80: riser + snare roll on held A chord
add(music, 76.0, pad([57, 61, 64, 69], 3.9, bright=2400, a=1.5), 0.4)
for i in range(32):
    tt = 76.0 + i * (3.3 / 32) * (1 - i / 64)
    add(music, tt, snare(), 0.2 + i * 0.016)
rt = t_(3.9); rise = saw(220 * 2 ** (rt / 3.9 * 2), rt) * (rt / 3.9) ** 2
add(music, 76.0, lp(rise, 3000), 0.28)
for i, m in enumerate([45, 45, 45, 45, 45, 45, 45, 45]):
    add(music, 76.0 + i * 0.5, bass(m, 0.3, True), 0.7); add(music, 76.0 + i * 0.5, kick(), 0.5 + i * 0.05)

# ================= SECTION E: triumphant reprise, C major (81-90) =================
E = 81.0
chord_bed(E, 4, chordsA, arp_gain=0.16, bass_gain=0.55, pad_gain=0.1)
drums(music, E, 4, 'pop', 1.0)
add(music, E, crash(), 0.5)
notes(music, E, melody2, lead, 0.24)
notes(music, E, [(b, d, m - 12) for b, d, m in melody2], lead, 0.1, -0.3)
add(music, 89.0, brass([48, 55, 60, 64, 67, 72], 1.3), 0.3)
add(music, 89.0, kick(), 0.9); add(music, 89.0, crash(1.5), 0.5)

# ================= SFX =================
def noise(d): return rng.standard_normal(int(d * SR))


def whoosh(d=0.6, lo=300, hi=3000):
    t = t_(d); n = noise(d); x = np.zeros(len(t)); segs = 12
    for k in range(segs):
        a, b = k * len(t) // segs, (k + 1) * len(t) // segs
        fc = lo + (hi - lo) * math.sin(math.pi * (k + .5) / segs)
        x[a:b] = lp(n, fc)[a:b]
    return x * np.sin(np.pi * t / d) ** 2


def ding(m=96, d=0.8):
    t = t_(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 8)) * np.exp(-t * 5)


def sparkle(t0, n=6):
    for i in range(n): add(sfx, t0 + i * 0.05, ding(96 + [0, 4, 7, 12, 16, 19][i % 6], 0.5), 0.12, -0.5 + i * 0.2)


def pop():
    t = t_(0.05); return np.sin(2 * np.pi * (900 + 1500 * t / 0.05) * t) * np.exp(-t * 80)


def thud(f=70, d=0.4):
    t = t_(d); return np.sin(2 * np.pi * f * t * (1 + np.exp(-t * 20))) * np.exp(-t * 10) + 0.3 * lp(noise(d), 600) * np.exp(-t * 25)


def scratch():
    t = t_(0.55); f = 300 + 900 * np.abs(np.sin(2 * np.pi * 2.2 * t))
    return (bp(noise(0.55), 400, 3000) * 0.6 + 0.4 * saw(1, t) * 0) * np.abs(np.sin(2 * np.pi * 3.6 * t)) * np.exp(-t * 2) + 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3)


def cough():
    t = t_(0.22); return bp(noise(0.22), 300, 2500) * np.exp(-t * 14) + 0.4 * np.sin(2 * np.pi * 160 * t) * np.exp(-t * 20)


def clatter():
    x = np.zeros(int(0.6 * SR))
    for i in range(9):
        k = int(rng.random() * 0.45 * SR); d = ding(90 + int(rng.random() * 12), 0.15)
        x[k:k + len(d)] += d[: len(x) - k] * 0.5
    return x


def boom():
    t = t_(2.6); f = 30 + 60 * np.exp(-t * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * 1.2 + lp(noise(2.6), 900) * np.exp(-t * 2.2) * 0.9 + hp(noise(2.6), 3000) * np.exp(-t * 6) * 0.3


def slide_whistle(d=0.6, down=True):
    t = t_(d); f = 1400 - 1000 * (t / d) if down else 400 + 1000 * (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.02, 0.05, 0.8, 0.08)


def hum(d):
    t = t_(d); return (saw(55, t) * 0.5 + np.sin(2 * np.pi * 110 * t) * 0.5) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t))


def clank():
    t = t_(0.3); return (np.sin(2 * np.pi * 420 * t) + np.sin(2 * np.pi * 1130 * t) * 0.6) * np.exp(-t * 18) + bp(noise(0.3), 1500, 5000) * np.exp(-t * 40) * 0.3


add(sfx, 0.0, whoosh(1.8, 200, 2500), 0.35)
for t0 in np.arange(8.3, 11, 0.37): add(sfx, t0 + rng.random() * 0.1, pop(), 0.12, rng.uniform(-.6, .6))
sparkle(10.1)
add(sfx, 13.0, ding(84, 0.4), 0.0)
sparkle(16.0, 3)
add(sfx, 17.1, noise(0.08) * np.exp(-t_(0.08) * 40), 0.35); sparkle(17.15, 6)
add(sfx, 19.45, scratch(), 0.55)
# doors slam open: low boom + wood crack + crash + orchestral hit
add(sfx, 20.0, thud(48, 0.9), 1.0); add(sfx, 20.0, bp(noise(0.25), 200, 2500) * np.exp(-t_(0.25) * 18), 0.6)
add(sfx, 20.0, crash(2.0), 0.45); add(sfx, 20.0, timpani(36, 1.8), 0.7)
add(sfx, 20.0, brass([36, 43, 48, 51, 55], 0.7), 0.35)
for k, d in enumerate([0.09, 0.2]): add(sfx, 20.0 + d, thud(70, 0.4), 0.35 / (k + 1))  # door bounce
for ft in (20.55, 21.05, 21.55):  # heavy footsteps with a little hall echo
    add(sfx, ft, thud(105, 0.3), 0.45); add(sfx, ft + 0.14, thud(105, 0.3), 0.14)
add(sfx, 25.5, whoosh(0.9, 400, 4000), 0.3)
for i in range(12): add(sfx, 30.0 + i * 0.165, thud(90, 0.2), 0.18, ((i % 2) - .5) * .4)
for t0 in np.arange(34.2, 37, 0.33): add(sfx, t0 + rng.random() * 0.1, pop(), 0.12, rng.uniform(-.6, .6))
for t0 in (38.0, 38.7, 39.3): add(sfx, t0, cough(), 0.5)
add(sfx, 44.0, whoosh(0.5, 600, 5000), 0.35); add(sfx, 44.45, ding(88, 0.8), 0.25)
add(sfx, 47.8, thud(55, 0.6), 1.0); add(sfx, 47.8, clatter(), 0.45)
add(sfx, 60.0, hum(2.0) * np.sin(np.pi * t_(2.0) / 2.0), 0.12)
add(sfx, 60.25, slide_whistle(0.45, down=False), 0.15); add(sfx, 60.75, pop(), 0.4)
for t0 in np.arange(60.2, 62, 0.42): add(sfx, t0, clank(), 0.12, 0.3)
add(sfx, 67.3, ding(91, 1.0), 0.2); sparkle(67.4, 6)
for t0 in np.arange(69.2, 72, 0.33): add(sfx, t0 + rng.random() * 0.1, pop(), 0.11, rng.uniform(-.6, .6))
add(sfx, 72.4, slide_whistle(0.6), 0.22); add(sfx, 73.0, thud(80, 0.4), 0.6)
for t0 in np.arange(74.0, 77, 0.42): add(sfx, t0, clank(), 0.1, -0.3)
add(sfx, 75.8, ding(93, 0.6), 0.2)
add(sfx, 79.35, clank() * 0.6 + thud(200, 0.2)[: int(0.3 * SR)] if False else thud(200, 0.25), 0.6)
add(sfx, 80.0, boom(), 1.0)
for i in range(10): add(sfx, 80.4 + rng.random() * 1.5, thud(120 + rng.random() * 200, 0.25), 0.15, rng.uniform(-.7, .7))
add(sfx, 84.0, whoosh(0.6, 300, 1500), 0.15); add(sfx, 84.4, thud(140, 0.15), 0.25)
crowd = bp(noise(2.6), 400, 3500) * (np.sin(np.pi * t_(2.6) / 2.6) ** 0.5)
add(sfx, 87.3, crowd, 0.18)

# ================= voice blips & caption ticks =================
VOICE = {'ROB': (150, 'mumble'), 'ROB #7': (165, 'mumble'), 'REAL ROB': (140, 'mumble'), 'GRANDMA BEV': (430, 'bright'), 'LINDA': (560, 'bright')}


def blip(f0, kind, d):
    t = t_(d); f = f0 * (1 + 0.15 * np.sin(2 * np.pi * 6 * t)) * (1.08 - 0.16 * t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    if kind == 'mumble':
        x = lp(np.sign(np.sin(ph)) * 0.6 + np.sin(ph), 900)
    else:
        x = lp(np.sign(np.sin(ph)) * 0.4 + np.sin(ph) + 0.3 * np.sin(2 * ph), 3000)
    return x * env(len(t), 0.005, 0.02, 0.8, 0.03)


def word_times(s):
    n = len(s['text'].split()); dur = s['t1'] - s['t0']; step = min(0.3, dur * 0.72 / n)
    return [s['t0'] + 0.12 + i * step for i in range(n)], step


for s in DATA['shots']:
    wt, step = word_times(s)
    words = s['text'].split()
    if s['who']:
        f0, kind = VOICE[s['who']]
        for w, t0 in zip(words, wt):
            syl = max(1, min(3, sum(1 for c in w.lower() if c in 'aeiouy') // 1))
            sd = step / syl
            for k in range(syl):
                pitch = f0 * (1 + 0.12 * rng.standard_normal()) * (1.25 if w.isupper() and len(w) > 1 else 1)
                add(sfx, t0 + k * sd, blip(pitch, kind, sd * 0.85), 0.2 if kind == 'mumble' else 0.15, 0)
    else:
        for t0 in wt:  # soft caption "type" tick
            t = t_(0.03); add(sfx, t0, hp(noise(0.03), 2500) * np.exp(-t * 150), 0.05, rng.uniform(-.2, .2))

# ================= mix =================
# duck music under spoken character lines a little
duck = np.ones(N)
for s in DATA['shots']:
    if s['who']:
        a, b = int(s['t0'] * SR), int(s['t1'] * SR)
        duck[a:b] = 0.7
duck = lfilter([0.0005], [1, -0.9995], duck) / 1.0
duck = np.clip(duck / duck.max(), 0.5, 1)
# hard cut at the record scratch and before the boom
for a, b in [(19.5, 22.0), (79.95, 81.0), (47.8, 49.0)]:
    i, j = int(a * SR), int(b * SR); fade = np.linspace(1, 0, 400)
    music[i:i + 400] *= fade[:, None]; music[i + 400:j] = 0
# low drone under the "then he walked in" + Rob line
dr = pad([45, 52], 2.0, bright=400, a=0.4); add(music, 20.2, dr, 0.18)
mix = music * duck[:, None] * 0.8 + sfx
mix = np.tanh(mix * 1.1) * 0.9
mix /= np.max(np.abs(mix)) / 0.89
end = int(DATA['duration'] * SR); mix = mix[:end]
fade = int(0.6 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
pcm = (mix * 32767).astype(np.int16)
with wave.open('soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote soundtrack.wav', len(pcm) / SR, 's')
