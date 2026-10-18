#!/usr/bin/env bash
# Full pipeline: cues -> sound design -> deterministic frame render -> mix -> deliverables
#
#   bash src/build.sh                         # first pass, scratch timing, no voice-over
#   bash src/build.sh --vo assets/vo.mp3      # second pass: sync to the VO and mix it in
#   FPS=30 bash src/build.sh                  # faster preview render
#
# Outputs: out/final.mp4  out/final_no_vo.mp4  out/poster.png  out/contact_sheet.png
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_PATH="${NODE_PATH:-/opt/node22/lib/node_modules:/opt/node-tools/node_modules}"
mkdir -p dist out

VO=""
if [[ "${1:-}" == "--vo" ]]; then
  VO="$2"; shift 2
  python3 src/sync_vo.py "$VO" "$@"
else
  rm -f dist/vo_sync.json
fi

python3 src/cues.py
python3 src/audio.py
node src/render.js video dist/video.mp4
DUR=$(python3 -c "import json;print(json.load(open('dist/cues.json'))['duration'])")

# music + SFX bed (no VO)
ffmpeg -y -loglevel error -i dist/video.mp4 -i dist/music.wav -i dist/sfx.wav -filter_complex \
  "[1:a]volume=0.55[m];[2:a]volume=0.9[s];[m][s]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,apad[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -t "$DUR" -movflags +faststart out/final_no_vo.mp4

if [[ -n "$VO" ]]; then
  read -r TEMPO OFFSET < <(python3 -c "import json;s=json.load(open('dist/vo_sync.json'));print(s['tempo'],s['offset'])")
  DELAY_MS=$(python3 -c "print(int(float('$OFFSET')*1000))")
  # VO cleaned + compressed; music ducks under it (sidechain); SFX tucked a little lower
  ffmpeg -y -loglevel error -i dist/video.mp4 -i dist/music.wav -i dist/sfx.wav -i "$VO" -filter_complex \
    "[3:a]aresample=48000,atempo=${TEMPO},aformat=channel_layouts=stereo,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,adelay=${DELAY_MS}|${DELAY_MS},volume=1.7,asplit=2[vo][key]; \
     [1:a]volume=0.45[m];[m][key]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=300[md]; \
     [2:a]volume=0.6[s]; \
     [md][s][vo]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,apad[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -t "$DUR" -movflags +faststart out/final.mp4
else
  cp out/final_no_vo.mp4 out/final.mp4
fi

python3 src/sheets.py
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate:format=duration -of compact out/final.mp4
