#!/bin/bash
# Concatenate rendered segments and mux with the soundtrack (loudness-normalized to -14 LUFS for TikTok/Shorts/Reels).
set -e
cd "$(dirname "$0")/.."
printf "file 'seg/seg%d.mp4'\n" 0 1 2 3 > build/concat.txt
ffmpeg -v error -y -f concat -safe 0 -i build/concat.txt -i build/mix.wav \
  -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.0:LRA=9" -c:a aac -b:a 320k -ar 48000 \
  -shortest -movflags +faststart Death_Countdown_1080x1920_60fps.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of compact Death_Countdown_1080x1920_60fps.mp4
