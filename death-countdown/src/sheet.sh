#!/bin/bash
# usage: sheet.sh outdir frac  -> renders one still per shot at fraction frac of each shot, builds contact sheets
OUT=$1; FR=${2:-0.6}; rm -rf $OUT; mkdir -p $OUT
TIMES=$(python3 -c "
import json;d=json.load(open('build/timeline.json'));L=d['lines']
st=[0]+[l['start']-0.12 for l in L[1:]];en=st[1:]+[d['duration']]
print(' '.join(f'{a+(b-a)*$FR:.3f}' for a,b in zip(st,en)))")
node src/render.mjs stills $OUT $TIMES | grep -v "^t=" 
cd $OUT; i=0; for f in t*.png; do ffmpeg -v error -y -i $f -vf "scale=270:480,drawtext=text='$i':x=8:y=8:fontsize=34:fontcolor=white:box=1:boxcolor=black" s_$(printf %02d $i).png; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i 's_*.png' -vf "tile=11x3" sheet.jpg
