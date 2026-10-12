#!/usr/bin/env bash
# Full pipeline:  HTML -> frames (Chromium) -> H.264  +  synthesized SFX/music  -> MP4
#   bash src/build.sh                         # no voice-over  -> output/duolingo_premium_ad_no_vo.mp4
#   bash src/build.sh --vo assets/vo.mp3      # with voice-over -> output/duolingo_premium_ad_final.mp4
#   VO_OFFSET=0.15 bash src/build.sh --vo ... # shift VO start (seconds)
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_PATH="${NODE_PATH:-/opt/node-tools/node_modules}"

VO=""
if [[ "${1:-}" == "--vo" ]]; then VO="$2"; fi
VO_OFFSET="${VO_OFFSET:-0}"

mkdir -p dist output
python3 src/build_html.py
python3 src/audio.py
[[ -f dist/video_silent.mp4 && "${SKIP_RENDER:-0}" == "1" ]] || node src/render.js dist/video_silent.mp4

if [[ -z "$VO" ]]; then
  OUT=output/duolingo_premium_ad_no_vo.mp4
  ffmpeg -y -loglevel error -i dist/video_silent.mp4 -i dist/music.wav -i dist/sfx.wav -filter_complex \
    "[1:a]volume=0.42[m];[2:a]volume=0.95[s];[m][s]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT"
else
  OUT=output/duolingo_premium_ad_final.mp4
  DELAY_MS=$(python3 -c "print(int(float('$VO_OFFSET')*1000))")
  # VO: cleaned + compressed; music ducks under the VO (sidechain); SFX pulled back a little.
  ffmpeg -y -loglevel error -i dist/video_silent.mp4 -i dist/music.wav -i dist/sfx.wav -i "$VO" -filter_complex \
    "[3:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,adelay=${DELAY_MS}|${DELAY_MS},volume=1.6,asplit=2[vo][key]; \
     [1:a]volume=0.40[m];[m][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[md]; \
     [2:a]volume=0.55[s]; \
     [md][s][vo]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT"
fi
echo "==> $OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of compact "$OUT"
