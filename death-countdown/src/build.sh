#!/bin/bash
# Full pipeline. Requires: python3 (piper-tts, numpy, scipy), node + playwright chromium, ffmpeg.
# Usage: src/build.sh <piper_voice_dir>
set -e
cd "$(dirname "$0")/.."
VOX=${1:?path to folder containing en-us-libritts-high.onnx}
mkdir -p build/vo build/seg
python3 src/voices.py "$VOX" build/vo && cp build/vo/timeline.json build/
python3 src/music.py build/timeline.json build/vo build/mix.wav
N=$(python3 -c "import json,math;print(math.ceil(json.load(open('build/timeline.json'))['duration']*60))"); Q=$(( (N+3)/4 ))
for k in 0 1 2 3; do s=$((k*Q)); e=$(( (k+1)*Q < N ? (k+1)*Q : N )); node src/render.mjs segment $s $e build/seg/seg$k.mp4 & done; wait
src/mux.sh
