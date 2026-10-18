"""Second pass: lock the animation to an uploaded voice-over.

    python3 src/sync_vo.py assets/voiceover.mp3 [--tempo 1.05] [--offset 0.0]
    python3 src/sync_vo.py assets/voiceover.mp3 --manual 0.12,2.0,3.3,...   (10 line starts, seconds)

1. measures the VO (ffprobe) and finds speech segments (ffmpeg silencedetect)
2. merges / distributes segments onto the 10 script lines in src/timeline.json
3. if the VO would push the ad past ~19.1 s it is sped up (atempo, pitch kept)
   just enough to fit, max 1.12x
4. writes dist/vo_sync.json -> src/cues.py re-times every visual + SFX beat
   and sets the end = VO end + CTA hold.

Print-out shows the detected line timings so they can be sanity-checked or
overridden with --manual.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_END = 19.1  # VO must end by this point so the ad (VO + hold) stays <= 20 s


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def speech_segments(path, noise_db=-34, min_sil=0.16):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"silencedetect=noise={noise_db}dB:d={min_sil}",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    total = duration(path)
    sil = list(zip(starts, ends + [total] * (len(starts) - len(ends))))
    segs, cur = [], 0.0
    for a, b in sil:
        if a - cur > 0.05:
            segs.append([cur, a])
        cur = b
    if total - cur > 0.05:
        segs.append([cur, total])
    return segs, total


def fit_to_lines(segs, lines):
    n = len(lines)
    segs = [s[:] for s in segs]
    # too many pieces: merge across the smallest pauses
    while len(segs) > n:
        gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
        i = gaps.index(min(gaps))
        segs[i:i + 2] = [[segs[i][0], segs[i + 1][1]]]
    # too few: halve the longest segment until every line has one (estimated)
    while len(segs) < n:
        lens = [b - a for a, b in segs]
        i = lens.index(max(lens))
        a, b = segs[i]
        m = a + (b - a) / 2
        segs[i:i + 1] = [[a, m - 0.02], [m + 0.02, b]]
    return segs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("vo")
    ap.add_argument("--tempo", type=float)
    ap.add_argument("--offset", type=float, default=0.0)
    ap.add_argument("--manual", help="comma separated start times of the 10 lines (seconds, in the original file)")
    a = ap.parse_args()

    tl = json.loads((ROOT / "src" / "timeline.json").read_text())
    lines = tl["lines"]
    segs, total = speech_segments(a.vo)
    if a.manual:
        st = [float(x) for x in a.manual.split(",")]
        assert len(st) == len(lines), f"need {len(lines)} start times"
        ends = st[1:] + [segs[-1][1] if segs else total]
        fitted = [[s, e] for s, e in zip(st, ends)]
    else:
        fitted = fit_to_lines(segs, lines)
        if len(segs) < len(lines):
            print(f"! only {len(segs)} pauses-separated segments found for {len(lines)} lines - some splits are estimated; "
                  f"check the table below or pass --manual")

    vo_end = fitted[-1][1]
    tempo = a.tempo or (1.0 if vo_end + a.offset <= MAX_END else min(1.12, (vo_end + a.offset) / MAX_END))
    k = 1.0 / tempo
    out = {"file": str(Path(a.vo).resolve()), "offset": a.offset, "tempo": round(tempo, 4),
           "duration": round(total * k + a.offset, 3),
           "lines": {l["id"]: [round(s * k + a.offset, 3), round(e * k + a.offset, 3)] for l, (s, e) in zip(lines, fitted)}}
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "vo_sync.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print(f"VO {total:.2f}s  speech segments: {len(segs)}  tempo x{tempo:.3f}")
    for l, (s, e) in zip(lines, out["lines"].values()):
        print(f"  {s:6.2f} -> {e:6.2f}  {l['id']:8s} {l['text']}")
    print("wrote dist/vo_sync.json")


if __name__ == "__main__":
    main()
