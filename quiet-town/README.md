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
