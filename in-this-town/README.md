# In This Town

A 90-second vertical (1080×1920, 60 fps) blocky-character animated short. In a town where everyone is an actor, Robert Pattinson clones start taking every role, until one family fights back.

## Files
- `shots.json` holds the 32 shots, their timecodes and the caption lines. Side-character lines carry a `who` speaker tag.
- `film.html` is the whole film in three.js. It builds the characters, faces, sets, camera moves and timed captions, and `renderFrame(f)` draws one frame.
- `render.js` uses headless Chromium (Playwright) to render stills or frame ranges and send them to ffmpeg.
- `soundtrack.py` synthesizes the original score, the sound effects, the character voice blips and the caption ticks into `soundtrack.wav`.

## Rebuild
```bash
npm install                 # three, @fontsource/fredoka
pip install numpy scipy
python3 soundtrack.py
mkdir -p seg
node render.js video seg/part0.mp4 0 1800 &
node render.js video seg/part1.mp4 1800 3600 &
node render.js video seg/part2.mp4 3600 5400 &
wait
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\n" > seg/list.txt
ffmpeg -f concat -safe 0 -i seg/list.txt -i soundtrack.wav -c:v copy -c:a aac -b:a 192k -shortest in-this-town.mp4
```
