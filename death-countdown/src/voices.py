# Generate voice lines with Piper TTS, then build timeline.json with per-word caption timings.
import json, subprocess, sys, os, numpy as np
from scipy.io import wavfile
VOX = sys.argv[1]; OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
lines = json.load(open(f"{HERE}/lines.json"))
# who -> (speaker id, semitone shift, length scale)
CAST = {"N": (40, 2.0, 0.93), "DAD": (20, -0.5, 0.95), "MOM": (64, 0.0, 0.95),
        "SIS": (56, 1.5, 0.9), "GMA": (0, -1.0, 1.08)}
SR = 22050
timeline = []; t = 0.12  # small lead-in
for i, L in enumerate(lines):
    spk, semi, ls = CAST[L["who"]]
    raw = f"{OUT}/raw{i:02d}.wav"; fin = f"{OUT}/line{i:02d}.wav"
    subprocess.run([sys.executable, "-m", "piper", "-m", f"{VOX}/en-us-libritts-high.onnx",
                    "--speaker", str(spk), "--length-scale", str(ls), "-f", raw],
                   input=L["t"].encode(), check=True, capture_output=True)
    r = 2 ** (semi / 12)
    af = f"asetrate={int(SR*r)},aresample={SR},atempo={1/r:.4f}"
    if L["who"] == "GMA": af += ",vibrato=f=5.5:d=0.25"
    af += ",silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", af, "-ar", "48000", "-ac", "1", fin], check=True)
    sr, x = wavfile.read(fin); x = x.astype(float); dur = len(x) / sr
    # find internal silences (>110ms) to anchor phrase boundaries
    hop = int(sr * 0.01); env = np.array([np.abs(x[j:j+hop]).mean() for j in range(0, len(x)-hop, hop)])
    quiet = env < max(env.max() * 0.04, 60)
    gaps = []; run = 0
    for k, q in enumerate(quiet):
        if q: run += 1
        else:
            if run >= 11 and k - run > 5: gaps.append(((k - run) * 0.01, k * 0.01))
            run = 0
    words = L["t"].split()
    # phrases split after words ending in punctuation
    phrases = []; cur = []
    for w in words:
        cur.append(w)
        if w[-1] in ",.!?": phrases.append(cur); cur = []
    if cur: phrases.append(cur)
    # choose the largest len(phrases)-1 gaps as phrase boundaries if available
    segs = []
    need = len(phrases) - 1
    if need > 0 and len(gaps) >= need:
        g = sorted(sorted(gaps, key=lambda a: a[1]-a[0], reverse=True)[:need])
        starts = [0.0] + [b for a, b in g]; ends = [a for a, b in g] + [dur]
        segs = list(zip(starts, ends))
    else:
        segs = [(0.0, dur)]; phrases = [words]
    wt = []
    for (s, e), ph in zip(segs, phrases):
        wts = [len(w.strip(",.!?")) + 2.5 for w in ph]; tot = sum(wts); c = s
        for w, ww in zip(ph, wts):
            d = (e - s) * ww / tot; wt.append({"w": w, "s": round(t + c, 3), "e": round(t + c + d, 3)}); c += d
    timeline.append({"i": i, "who": L["who"], "text": L["t"], "start": round(t, 3), "end": round(t + dur, 3), "words": wt})
    t += dur + L["gap"]
json.dump({"duration": round(t, 3), "lines": timeline}, open(f"{OUT}/timeline.json", "w"), indent=1)
print("total", round(t, 2))
for L in timeline: print(L["i"], L["who"], L["start"], L["end"])
