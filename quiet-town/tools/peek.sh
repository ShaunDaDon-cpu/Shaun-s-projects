#!/bin/sh
# peek.sh out.jpg shotN[:u] ...  -> tiles of the given shots (u = 0..1 through the shot, default .6)
out=$1; shift
spec="$*"
times=$(node -e "import('./src/script.js').then(m=>{console.log(process.argv.slice(1).map(a=>{const [n,u]=a.split(':');const L=m.LINES[n-1];return (L.start+L.dur*(u===undefined?.6:+u)).toFixed(3)}).join(','))})" $spec)
rm -rf out/.peek; node tools/render.mjs stills out/.peek "$times" >/dev/null
n=$(ls out/.peek | wc -l); cols=$(( n < 6 ? n : 6 )); rows=$(( (n + cols - 1) / cols ))
ffmpeg -y -loglevel error -pattern_type glob -i 'out/.peek/*.jpg' -vf "scale=330:-2,tile=${cols}x${rows}:padding=4" -frames:v 1 "$out"
