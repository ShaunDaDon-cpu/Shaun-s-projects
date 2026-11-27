# Death Countdown — Roblox-style storyteller short

An 86-second, 1080×1920, 60fps vertical animated short built from the "Death Countdown" script. Every part is procedurally generated:
blocky R6-style characters with drawn expressive faces, bright low-poly sets, 33 camera shots, word-by-word captions, voice acting and an original score.

## Pipeline

| Step | File | What it does |
|---|---|---|
| Script | `src/lines.json` | 33 narration/dialogue lines, speaker tags, pauses |
| Voices | `src/voices.py` | Offline Piper TTS (LibriTTS multi-speaker): narrator, Mom, Dad, Sister, Grandma. Measures each line and builds `timeline.json` with per-word caption timings |
| Film | `src/film/*.js` | Three.js engine. `lib.js` = R6 rigs, faces, phones, Collector screens · `sets.js` = town, sky, bus crash, cafeteria, classroom, house, bedroom, dining room · `shots.js` = the 33 shots, synced to word timings · `main.js` = lighting, captions, deterministic `renderAt(t)` |
| Render | `src/render.mjs` | Headless Chromium renders frames and pipes them to ffmpeg (`stills` mode for previews, `segment` mode for final frames) |
| Score + SFX | `src/music.py` | Original synthesized soundtrack (7 sections: bouncy town theme → music-box sadness → 3 AM tension → suspense ostinato → action drums → Grandma's hero brass/choir → warm reprise) plus timed SFX (knocks, slam, door blast, BONK, crash, beeps, slap, chimes), voice ducking |
| Mux | `src/mux.sh` | Concatenates segments, loudness-normalizes to −14 LUFS, writes `Death_Countdown_1080x1920_60fps.mp4` |

## Rebuild

```bash
npm install                      # three + caption fonts
pip install piper-tts numpy scipy
src/build.sh /path/to/piper/voices   # folder with en-us-libritts-high.onnx(+.json)
```

Preview a few frames: `node src/render.mjs stills /tmp/stills 1.0 40.5 63.6`

Contact sheet of every shot: `src/sheet.sh /tmp/sheet 0.5`
