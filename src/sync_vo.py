"""Second pass: lock the animation to an uploaded voice-over.

    python3 src/sync_vo.py assets/voiceover.mp3 [--gap 0.22] [--target 17.6] [--tempo 1.04]
    python3 src/sync_vo.py assets/voiceover.mp3 --manual 0.12,3.05,...   (10 line starts, original seconds)

1. decodes the VO and finds speech phrases from pauses (energy gate)
2. aligns phrases to the 10 script lines in src/timeline.json with a small DP that
   matches each line's share of speech time to its share of script text
   (so a line read as two phrases, or a short pause inside a line, is handled)
3. tightens the read: pauses between phrases are capped at --gap seconds
   (cut inside the silence, with short fades, so no syllable is touched)
   -> dist/vo_tight.wav
4. if the tightened read still ends after --target, it is sped up (atempo in the
   mix, pitch kept) just enough, max 1.12x
5. writes dist/vo_sync.json (line start/end + phrase starts, in final-video
   seconds) -> src/cues.py re-times every visual and SFX beat from it.
"""
import argparse
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def phrases(x, thresh_db=-34, min_sil=0.12, min_speech=0.06):
    """speech [start, end] pairs (seconds) separated by >= min_sil of signal below thresh_db"""
    hop = SR // 200  # 5 ms
    n = len(x) // hop
    rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    loud = 20 * np.log10(rms) > thresh_db
    segs, start, quiet = [], None, 0
    for i, on in enumerate(loud):
        if on:
            if start is None:
                start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet * hop / SR >= min_sil:
                segs.append([start, i - quiet + 1])
                start, quiet = None, 0
    if start is not None:
        segs.append([start, n])
    return [[a * hop / SR, b * hop / SR] for a, b in segs if (b - a) * hop / SR >= min_speech]


def align(segs, weights):
    """partition phrases (in order) into len(weights) contiguous groups whose speech
    durations best match the script-text weights; returns list of index groups"""
    S, N = len(segs), len(weights)
    if S < N:
        raise SystemExit(f"only {S} phrases for {N} lines - pass --manual with the 10 line starts")
    dur = [b - a for a, b in segs]
    tot, wt = sum(dur), sum(weights)
    w = [x / wt for x in weights]
    pre = np.concatenate([[0], np.cumsum(dur)]) / tot
    INF = 1e9
    cost = np.full((N + 1, S + 1), INF)
    back = np.zeros((N + 1, S + 1), int)
    cost[0, 0] = 0
    for k in range(1, N + 1):
        for j in range(k, S - (N - k) + 1):
            for i in range(k - 1, j):
                c = cost[k - 1, i] + (pre[j] - pre[i] - w[k - 1]) ** 2
                if c < cost[k, j]:
                    cost[k, j], back[k, j] = c, i
    groups, j = [], S
    for k in range(N, 0, -1):
        i = back[k, j]
        groups.append(list(range(i, j)))
        j = i
    return groups[::-1]


def tighten(x, segs, gap, lead=0.1, fade=0.012):
    """rebuild the read with every pause capped at `gap`; returns audio + old->new time map"""
    out, mapping, cur = [], [], 0.0
    pad = 0.03  # keep a little air around each phrase
    for k, (a, b) in enumerate(segs):
        a0 = max(0.0, a - pad)
        if k == 0:
            silence = min(a0, lead)
        else:
            prev_b = segs[k - 1][1] + pad
            silence = min(max(0.0, a0 - prev_b), gap)
        out.append(np.zeros(int(silence * SR), np.float32))
        cur += silence
        b1 = min(len(x) / SR, b + pad)
        chunk = x[int(a0 * SR): int(b1 * SR)].copy()
        f = min(int(fade * SR), len(chunk) // 4)
        if f:
            chunk[:f] *= np.linspace(0, 1, f)
            chunk[-f:] *= np.linspace(1, 0, f)
        mapping.append((a0, cur))
        out.append(chunk)
        cur += len(chunk) / SR
    y = np.concatenate(out + [np.zeros(int(0.2 * SR), np.float32)])
    return y, mapping


def remap(t, mapping):
    """original VO second -> tightened second (inside a phrase: shift by that phrase's offset)"""
    best = mapping[0]
    for m in mapping:
        if m[0] <= t + 1e-6:
            best = m
    return best[1] + (t - best[0])


def write_wav(path, y):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("vo")
    ap.add_argument("--gap", type=float, default=0.22, help="max pause between phrases (s); 0 = keep original timing")
    ap.add_argument("--target", type=float, default=17.6, help="speed up only if the tightened read ends after this (s)")
    ap.add_argument("--tempo", type=float, help="force a tempo instead of the automatic one")
    ap.add_argument("--manual", help="comma separated start times of the 10 lines (original seconds)")
    a = ap.parse_args()

    tl = json.loads((ROOT / "src" / "timeline.json").read_text())
    lines = tl["lines"]
    x = decode(a.vo)
    total = len(x) / SR
    segs = phrases(x)
    if a.manual:
        st = [float(v) for v in a.manual.split(",")]
        assert len(st) == len(lines), f"need {len(lines)} start times"
        bounds = st + [segs[-1][1]]
        groups = [[i for i, (s, e) in enumerate(segs) if bounds[k] - .05 <= s < bounds[k + 1] - .05] for k in range(len(lines))]
    else:
        groups = align(segs, [len(l["text"].replace(" ", "")) for l in lines])

    if a.gap > 0:
        y, mapping = tighten(x, segs, a.gap)
    else:
        y, mapping = x, [(0.0, 0.0)]
    write_wav(ROOT / "dist" / "vo_tight.wav", y)

    end_tight = remap(segs[-1][1], mapping)
    tempo = a.tempo or max(1.0, min(1.12, end_tight / a.target))
    k = 1.0 / tempo
    T = lambda t: round(remap(t, mapping) * k, 3)
    out = {"file": str((ROOT / "dist" / "vo_tight.wav").resolve()), "source": str(Path(a.vo).resolve()),
           "offset": 0.0, "tempo": round(tempo, 4), "gap": a.gap, "duration": round(len(y) / SR * k, 3), "lines": {}, "parts": {}}
    print(f"VO {total:.2f}s, {len(segs)} phrases -> tightened {end_tight:.2f}s, tempo x{tempo:.3f} -> speech ends {end_tight * k:.2f}s")
    for l, g in zip(lines, groups):
        s, e = segs[g[0]][0], segs[g[-1]][1]
        out["lines"][l["id"]] = [T(s), T(e)]
        out["parts"][l["id"]] = [T(segs[i][0]) for i in g]
        print(f"  {T(s):6.2f} -> {T(e):6.2f}  (orig {s:5.2f})  {l['id']:8s} {len(g)} phrase(s)  {l['text']}")
    (ROOT / "dist" / "vo_sync.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print("wrote dist/vo_sync.json + dist/vo_tight.wav")


if __name__ == "__main__":
    main()
