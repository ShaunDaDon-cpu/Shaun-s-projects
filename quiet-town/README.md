# The Quiet Town

An 84-second vertical animated short (1080×1920, 60 fps) with blocky R6-style characters, timed captions and an original synthesized score, all made in code.

- `src/script.js`: the script, one line per shot, on a 150 BPM beat grid (every cut lands on a beat)
- `src/world.js`: characters (jointed blocky bodies, swappable faces, hair, outfits), the town, mountain, dam and interiors
- `src/faces.js`: the expression set (smile, shout, gasp, wink, dizzy …) drawn into face textures
- `src/film.js`: lighting, rain, particles, shockwaves and the 49 shots plus end card
- `src/captions.js`: word-by-word captions, speaker tags for side characters, shouted lines
- `src/score.js`: the music and sound effects, written in Web Audio and rendered offline

## Render

```sh
npm install
node tools/render.mjs sheet out/sheet.jpg            # contact sheet, one tile per shot
node tools/render.mjs stills out/stills shots        # a still from the middle of every shot
node tools/render.mjs video out/quiet-town.mp4       # full film: 4 parallel workers, then muxes the score
```

Uses the Chromium that Playwright finds and ffmpeg. Software WebGL renders at about 4 frames/s across 4 workers.

## Voiceover

Voiced locally with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) (open-weight TTS, Apache-2.0). The model files aren't in the repo:

```sh
pip install kokoro-onnx soundfile
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
node -e "import('./src/script.js').then(m=>require('fs').writeFileSync('out/lines.json', JSON.stringify(m.LINES.map(l=>({n:l.n,text:l.text,who:l.who||'',style:l.style,start:l.start,dur:l.dur})))))"
python tools/voiceover.py kokoro-v1.0.onnx voices-v1.0.bin   # -> out/vo.wav + src/vo-timing.js
python tools/mouth.py                                          # -> src/vo-mouth.js (lip-sync from the voice)
```

Cast: the kid af_heart (+1 semitone), Mom af_nicole, Dad am_michael, Mayor bm_george, Grandma bf_emma (−2 semitones). Each line is fitted into its shot; the captions pop words in time with it, and the score is ducked under the voice in the final mix. To use your own recording instead, replace `out/vo.wav` (same timing) and run `node tools/render.mjs remux out/quiet-town.mp4`.
