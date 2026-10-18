"""Turns VO line anchors into every visual + audio cue of the ad.

    python3 src/cues.py            -> dist/cues.json + dist/cues.js

Line timings come from dist/vo_sync.json when it exists (written by
src/sync_vo.py from a real voice-over), otherwise from the scratch defaults in
src/timeline.json. The page (src/ad.js) and the sound design (src/audio.py)
both read the same dist/cues.json, so picture, SFX and VO can never drift apart.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, DIST = ROOT / "src", ROOT / "dist"


def load_lines():
    tl = json.loads((SRC / "timeline.json").read_text())
    lines = {l["id"]: [l["start"], l["end"]] for l in tl["lines"]}
    vo = {"file": None, "offset": 0.0, "duration": None}
    sync = DIST / "vo_sync.json"
    if sync.exists():
        s = json.loads(sync.read_text())
        for k, (a, b) in s["lines"].items():
            lines[k] = [a, b]
        vo = {"file": s["file"], "offset": s.get("offset", 0.0), "duration": s["duration"]}
    return tl, lines, vo


def build():
    tl, L, vo = load_lines()
    st = lambda k: L[k][0]
    en = lambda k: L[k][1]

    c = {}
    # 1 - HOOK (fixed: motion starts on frame 0, never waits for the VO)
    c["s1"] = 0.0
    c["zero"] = 0.12            # heart counter 1 -> 0, buzz, red flash
    c["t1"] = 0.30              # "হার্ট শেষ?" slam
    c["t2"] = max(0.85, min(1.2, st("hook") + 0.80))   # "আবার শুরু থেকে?" + progress drains
    c["crack"] = c["t2"] + 0.35

    # 2 - FREE-VERSION STRUGGLE
    c["s2"] = max(1.85, st("free") - 0.08)
    c["ads"] = max(c["s2"] + 0.95, st("ads") - 0.05)
    c["s3"] = max(c["ads"] + 1.25, st("premium") - 0.05)   # green flood fully open
    c["btn"] = c["s3"] - 0.78                               # GET PREMIUM button pops in
    c["press"] = c["s3"] - 0.44                             # finger presses it
    c["flood"] = c["press"] + 0.16                          # circle mask grows out of the button

    # 3 - TRANSFORM
    c["s4"] = max(c["s3"] + 2.4, st("hearts") - 0.15)
    c["logo"] = c["s3"] + 0.30
    span = c["s4"] - 0.55 - (c["s3"] + 1.0)
    step = max(0.32, min(0.55, span / 2))
    c["rows"] = [round(c["s3"] + 1.0 + i * step, 3) for i in range(3)]

    # 4 - FEATURE RAPID-FIRE (one beat per spoken feature)
    c["feat"] = [c["s4"] + 0.06] + [st(k) - 0.03 for k in ("energy", "noads", "lessons")]

    # 5 - OFFER
    c["s5"] = max(c["feat"][3] + 0.9, st("offer") - 0.28)
    c["old"] = c["s5"] + 0.25
    c["price"] = c["s5"] + 0.55
    c["stamp"] = c["price"] + 0.45
    c["pills"] = max(c["stamp"] + 0.3, st("offer") + 1.15)

    # 6 - CTA
    c["s6"] = max(c["pills"] + 0.8, st("cta") - 0.32)
    c["end"] = round(max(en("cta") + tl["cta_hold"], c["s6"] + tl["cta_min_hold"]), 3)
    c["btn6"] = c["s6"] + 0.45
    c["taps"] = [c["s6"] + 1.2, c["s6"] + 1.85]

    c = {k: ([round(x, 3) for x in v] if isinstance(v, list) else round(v, 3)) for k, v in c.items()}
    out = {"fps": tl["fps"], "width": tl["width"], "height": tl["height"], "scale": tl["scale"],
           "duration": c["end"], "vo": vo, "lines": L, "cue": c}
    DIST.mkdir(exist_ok=True)
    (DIST / "cues.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    (DIST / "cues.js").write_text("window.CUES=" + json.dumps(out, ensure_ascii=False) + ";")
    return out


if __name__ == "__main__":
    o = build()
    print(f"cues -> dist/cues.json  duration={o['duration']}s  vo={o['vo']['file']}")
