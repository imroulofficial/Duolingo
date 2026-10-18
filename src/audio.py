"""Sound design for the ad, synthesised from scratch with numpy (no samples, no licensing).

    python3 src/audio.py     -> dist/sfx.wav + dist/music.wav  (48 kHz stereo)

Every hit is placed from dist/cues.json, the same cue sheet that drives the
picture, so SFX stay frame-locked to the animation (and to the VO once synced).

Music (placeholder bed, 120 BPM chiptune — swap for a licensed track if wanted):
  hook      : tension drone + clock ticks, no beat
  struggle  : muffled, minor, half-energy groove
  premium   : beat DROP on the green flood -> bright major chiptune to the end
"""
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(5)


# ---------------------------------------------------------------- primitives
def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.004, d=None, curve=6.0):
    x = np.arange(n) / SR
    e = np.exp(-curve * x / (d or max(n / SR, 1e-3)))
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def lp(x, fc):
    """one-pole low-pass (fc scalar or per-sample)"""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s
        y[i] = s
    return y


def bp(x, f):
    l1 = lp(x, np.asarray(f) * 1.6)
    return l1 - lp(l1, np.asarray(f) * 0.5)


def osc(freq, d, kind="sine", duty=0.5):
    n = int(d * SR)
    ph = np.cumsum(np.broadcast_to(np.asarray(freq, float), (n,))) / SR
    if kind == "sine":
        return np.sin(2 * np.pi * ph)
    if kind == "tri":
        return 2 * np.abs(2 * (ph % 1) - 1) - 1
    if kind == "pulse":  # naive chip pulse, softened a touch
        y = np.where((ph % 1) < duty, 1.0, -1.0)
        return np.convolve(y, np.ones(6) / 6, mode="same")
    if kind == "saw":
        return 2 * (ph % 1) - 1
    raise ValueError(kind)


def bell(f, d, decay=4.0):
    tt = t_(d)
    x = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 8)
         + 0.2 * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt * 14))
    return x * env(len(tt), 0.002, d, decay)


def norm(x, g=1.0):
    return g * x / (np.abs(x).max() + 1e-9)


def over(a, b):
    """a + b, zero-padding the shorter one"""
    y = np.zeros(max(len(a), len(b)))
    y[:len(a)] += a
    y[:len(b)] += b
    return y


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


# ---------------------------------------------------------------------- SFX
def whoosh(d=0.45, lo=300, hi=4000, amp=0.5, rise=False):
    n = int(d * SR)
    p = np.linspace(0, 1, n)
    shape = p ** 2 if rise else np.sin(np.pi * p) ** 1.5
    y = bp(rng.standard_normal(n), lo + (hi - lo) * shape)
    return norm(y * (p ** 1.5 if rise else np.sin(np.pi * p) ** 2), amp)


def pop(f0=950, f1=280, d=0.11, amp=0.6):
    tt = t_(d)
    return amp * osc(f1 + (f0 - f1) * np.exp(-tt * 45), d) * env(len(tt), 0.001, d, 5)


def thud(amp=0.9, body=48):
    d = 0.5
    tt = t_(d)
    b = osc(body + 120 * np.exp(-tt * 20), d) * env(len(tt), 0.001, d, 5)
    nz = lp(rng.standard_normal(len(tt)), 1500) * env(len(tt), 0.001, 0.1, 6)
    return norm(b + 0.7 * norm(nz), amp)


def wrong_buzz(amp=0.38):
    """harsh two-step 'wrong answer' buzz"""
    a = osc(196, 0.15, "pulse", 0.3) + 0.5 * osc(207, 0.15, "pulse")
    b = osc(147, 0.34, "pulse", 0.3) + 0.5 * osc(155, 0.34, "pulse")
    a *= env(len(a), 0.003, 0.3, 1.5)
    b *= env(len(b), 0.003, 0.34, 2.5)
    return norm(np.concatenate([a, np.zeros(int(0.025 * SR)), b]), amp)


def crack(amp=0.6):
    n = int(0.28 * SR)
    clicks = np.zeros(n)
    for k in range(9):
        o = int((k * 0.018 + rng.uniform(0, 0.01)) * SR)
        clicks[o:o + 200] += rng.standard_normal(200) * np.exp(-np.arange(200) / 40) * rng.uniform(.4, 1)
    clicks = clicks - lp(clicks, 900)
    y = norm(clicks) + 0.6 * thud(1, 70)[:n]
    return norm(y, amp)


def correct_chime(amp=0.34):
    """bright two-note 'correct answer' ding"""
    y = np.zeros(int(0.75 * SR))
    for k, f in enumerate((midi(81), midi(88))):  # A5 -> E6
        b = bell(f, 0.62, 5) + 0.25 * osc(f, 0.62, "pulse") * env(int(0.62 * SR), 0.002, 0.2, 6)
        o = int(k * 0.085 * SR)
        y[o:o + len(b)] += b
    return norm(y, amp)


def sparkle(n=8, d=0.7, amp=0.2, seed=0):
    r = np.random.default_rng(seed)
    y = np.zeros(int(d * SR) + SR // 2)
    notes = [2093, 2349, 2637, 3136, 3520, 4186]
    for i in range(n):
        b = bell(notes[r.integers(len(notes))], 0.35, 7) * r.uniform(.5, 1)
        o = int(i * d / n * SR)
        y[o:o + len(b)] += b
    return norm(y, amp)


def ad_pop(k=0, amp=0.42):
    """cheap, annoying ad jingle blip (pulse arpeggio + boing)"""
    notes = [(72, 76, 79), (74, 78, 81), (76, 80, 83)][k % 3]
    y = np.zeros(int(0.42 * SR))
    for i, n in enumerate(notes):
        s = osc(midi(n), 0.09, "pulse", 0.25) * env(int(0.09 * SR), 0.002, 0.09, 3)
        o = int(i * 0.05 * SR)
        y[o:o + len(s)] += s
    tt = t_(0.3)
    boing = osc(220 + 180 * np.sin(tt * 40) * np.exp(-tt * 8), 0.3, "sine") * env(len(tt), 0.002, 0.3, 4)
    y[:len(boing)] += 0.7 * boing
    return norm(y, amp)


def drain(d=0.75, amp=0.22):
    tt = t_(d)
    f = 880 * np.exp(-tt * 2.6)
    s = osc(f, d, "pulse", 0.25) * (0.6 + 0.4 * (np.sin(2 * np.pi * 22 * tt) > 0))
    return norm(s * env(len(tt), 0.01, d, 1.2), amp)


def tap(amp=0.5):
    tt = t_(0.06)
    y = osc(2200 * np.exp(-tt * 30) + 600, 0.06) * env(len(tt), 0.0005, 0.06, 8)
    y += 0.5 * rng.standard_normal(len(tt)) * env(len(tt), 0.0005, 0.01, 8)
    return norm(y, amp)


def chirp(amp=0.4):
    """owl 'hoo-hoo!' chirp: two quick upward-bending whistles"""
    y = np.zeros(int(0.42 * SR))
    for k, (f0, f1) in enumerate(((900, 1500), (1100, 1900))):
        tt = t_(0.13)
        f = f0 + (f1 - f0) * (tt / 0.13) ** 0.6
        s = (osc(f, 0.13) + 0.3 * osc(f * 2, 0.13)) * np.sin(np.pi * tt / 0.13) ** 0.8
        o = int(k * 0.16 * SR)
        y[o:o + len(s)] += s
    return norm(y, amp)


def coin(amp=0.22):
    a = osc(988, 0.06, "pulse") * 0.9
    b = osc(1319, 0.38, "pulse") * env(int(0.38 * SR), 0.001, 0.38, 4)
    return norm(np.concatenate([a, b]), amp)


def register(amp=0.45):
    """cash-register 'ka-ching'"""
    tt = t_(0.05)
    k = rng.standard_normal(len(tt)) * env(len(tt), 0.0005, 0.05, 6)
    k = k - lp(k, 2500)
    ring = bell(2637, 0.9, 3.2) + 0.7 * bell(3520, 0.9, 3.6)
    y = np.zeros(int(1.0 * SR))
    y[:len(k)] += 0.8 * norm(k)
    o = int(0.06 * SR)
    y[o:o + len(ring)] += norm(ring)
    return norm(y, amp)


def crash(d=1.4, amp=0.3):
    n = int(d * SR)
    x = rng.standard_normal(n)
    x = x - lp(x, 5000)
    return norm(x * env(n, 0.001, d, 4), amp)


def success(amp=0.36):
    y = np.zeros(int(1.6 * SR))
    for i, n in enumerate((72, 76, 79, 84)):
        b = over(bell(midi(n), 1.2 if i == 3 else 0.45, 3.2 if i == 3 else 6), 0.2 * osc(midi(n), 0.12, "pulse") * env(int(0.12 * SR), 0.001, 0.12, 5))
        o = int(i * 0.075 * SR)
        y[o:o + len(b)] += b
    return norm(y, amp)


# -------------------------------------------------------------------- music
def kick(g=1.0):
    tt = t_(0.32)
    return g * osc(45 + 130 * np.exp(-tt * 30), 0.32) * env(len(tt), 0.001, 0.32, 6)


def snare():
    n = int(0.16 * SR)
    x = rng.standard_normal(n)
    x = x - lp(x, 1200)
    return norm(x, 1) * env(n, 0.001, 0.16, 7) + 0.4 * osc(190, 0.16) * env(n, 0.001, 0.16, 9)


def hat():
    n = int(0.04 * SR)
    x = rng.standard_normal(n)
    x = x - lp(x, 7500)
    return norm(x, 1) * env(n, 0.0005, 0.04, 8)


def music(cue, total):
    L = int(total * SR) + SR
    out = np.zeros(L)

    def add(sig, t, g=1.0):
        o = int(max(0.0, t) * SR)
        if o >= L:
            return
        sig = sig[: L - o]
        out[o:o + len(sig)] += g * sig

    beat = 0.5  # 120 BPM
    s2, drop, end = cue["s2"], cue["s3"], total

    # hook: low drone swelling into the smash cut + clock ticks
    dd = s2
    tt = t_(dd)
    drone = lp(osc(55, dd, "saw") * 0.6 + osc(58.3, dd, "saw") * 0.4, 260 + 500 * (tt / dd))
    add(norm(drone, 0.35) * np.minimum(1, tt / 0.05), 0)
    for k in range(int(dd / 0.25)):
        add(tap(0.12), k * 0.25)

    # struggle: muffled minor groove (Am - F), soft kick, dull triangle chords
    t = s2
    prog_m = [(57, 60, 64), (53, 57, 60)]
    bar = 0
    while t < drop - 0.05:
        ch = prog_m[bar % 2]
        for b in range(4):
            bt = t + b * beat
            if bt >= drop - 0.05:
                break
            add(kick(0.55), bt)
            bd = beat * 0.9
            add(osc(midi(ch[0] - 24), bd, "tri") * env(int(bd * SR), 0.005, bd, 2) * 0.35, bt)
            pd = 0.3
            pl = sum(osc(midi(n), pd, "sine") for n in ch) / 3
            add(pl * env(int(pd * SR), 0.004, pd, 5) * 0.16, bt + beat / 2)
        t += 4 * beat
        bar += 1
    # riser into the drop
    rd = drop - cue["btn"]
    add(whoosh(rd, 200, 6000, 0.22, rise=True), cue["btn"])

    # premium: bright major chiptune (C - G - Am - F), drop lands on the green flood
    prog = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]
    roots = [48, 43, 45, 41]
    lead = [[79, 76, 72, 76], [79, 74, 71, 74], [76, 72, 69, 72], [77, 72, 69, 72]]
    stop = end - 1.25
    add(crash(1.6, 0.5), drop)
    t, bar = drop, 0
    while t < stop:
        ch, root = prog[bar % 4], roots[bar % 4]
        for b in range(4):
            bt = t + b * beat
            if bt >= stop:
                break
            add(kick(), bt, 0.95)
            if b in (1, 3):
                add(snare(), bt, 0.32)
            add(hat(), bt + beat / 2, 0.16)
            add(hat(), bt + beat / 4, 0.07)
            add(hat(), bt + 3 * beat / 4, 0.07)
            # chip bass: root/octave bounce in 8ths
            for e in range(2):
                n = root - 12 + (12 if e else 0)
                bd = beat / 2 * 0.85
                add(osc(midi(n), bd, "pulse", 0.5) * env(int(bd * SR), 0.003, bd, 2.5) * 0.17, bt + e * beat / 2)
            # arpeggiated lead
            n = lead[bar % 4][b]
            ld = beat * 0.42
            add(osc(midi(n), ld, "pulse", 0.25) * env(int(ld * SR), 0.003, ld, 3) * 0.085, bt)
            add(osc(midi(ch[(b + 1) % 3] + 12), ld * .6, "pulse", 0.125) * env(int(ld * .6 * SR), 0.003, ld * .6, 4) * 0.05, bt + beat / 2)
        t += 4 * beat
        bar += 1
    # outro sting: final chord ring-out
    add(kick(), stop, 1.0)
    add(crash(1.4, 0.35), stop)
    for n in (48, 60, 64, 67, 72, 79):
        add(over(bell(midi(n), 1.3, 2.6) * 0.16, osc(midi(n), 0.25, "pulse", .25) * env(int(.25 * SR), .002, .25, 4) * 0.04), stop)
    out = out[: int(total * SR)]
    fade = int(0.3 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


# --------------------------------------------------------------- arrangement
def sfx_track(c, total):
    L = int(total * SR) + 2 * SR
    out = np.zeros(L)

    def add(sig, t, g=1.0):
        o = int(max(0.0, t) * SR)
        if o >= L:
            return
        sig = sig[: L - o]
        out[o:o + len(sig)] += g * sig

    # 1 hook
    add(whoosh(0.3, 500, 3000, 0.3), 0.0)
    add(wrong_buzz(0.5), c["zero"])
    add(thud(0.9), c["t1"])
    add(pop(700, 300, amp=0.35), c["t2"])
    add(drain(0.5, 0.16), c["t2"] + 0.05)
    add(crack(0.7), c["crack"])
    # 2 struggle
    add(thud(0.8, 60), c["s2"])
    add(whoosh(0.25, 1500, 6000, 0.35), c["s2"] - 0.12)
    for i in range(5):
        add(pop(700 - i * 70, 200, d=0.08, amp=0.28), c["s2"] + 0.08 + i * 0.075)
    add(drain(0.75, 0.2), c["s2"] + 0.5)
    add(wrong_buzz(0.3), c["s2"] + 1.25)
    for i in range(3):
        add(ad_pop(i, 0.45), c["ads"] + i * 0.3)
        add(thud(0.4, 90), c["ads"] + i * 0.3)
    add(pop(1100, 400, amp=0.5), c["btn"])
    add(tap(0.6), c["press"])
    add(pop(500, 150, d=0.09, amp=0.5), c["press"])
    # 3 transform (drop + crash live in the music bed)
    add(correct_chime(0.4), c["s3"])
    add(sparkle(10, 0.9, 0.24, 1), c["s3"] + 0.05)
    add(chirp(0.38), c["s3"] + 0.3)
    add(pop(900, 300, amp=0.5), c["logo"])
    add(pop(1300, 500, amp=0.45), c["logo"] + 0.22)
    add(sparkle(5, 0.4, 0.16, 2), c["logo"] + 0.7)
    for i, r in enumerate(c["rows"]):
        hit = r + (0.32 if i == 1 else 0.05)
        if i == 1:
            add(whoosh(0.3, 800, 5000, 0.18, rise=True), r)
        add(pop(1000 + i * 150, 400, amp=0.4), hit)
        add(correct_chime(0.22), hit + 0.04)
    add(whoosh(0.4, 300, 3500, 0.4), c["s4"] - 0.3)
    # 4 features: pop on reveal, chime on the green check, rising pitch
    for i, f in enumerate(c["feat"]):
        add(whoosh(0.25, 900, 5000, 0.22), f - 0.08)
        add(pop(900 + 120 * i, 350, amp=0.45), f)
        add(correct_chime(0.3), f + 0.3)
    add(sparkle(10, 0.6, 0.22, 3), c["feat"][3] + 0.5)
    # 5 offer
    add(whoosh(0.45, 300, 4500, 0.5), c["s5"] - 0.05)
    add(pop(1000, 400, amp=0.35), c["s5"] + 0.2)
    add(whoosh(0.18, 2000, 7000, 0.25), c["old"] + 0.18)
    add(thud(1.0), c["price"])
    add(register(0.5), c["price"] + 0.04)
    for k in range(5):
        add(coin(0.2), c["price"] + 0.08 + k * 0.08)
    add(thud(0.8, 70), c["stamp"])
    add(pop(1200, 500, amp=0.4), c["pills"])
    add(pop(1400, 600, amp=0.4), c["pills"] + 0.14)
    # 6 CTA
    add(whoosh(0.45, 300, 4000, 0.5), c["s6"] - 0.36)
    add(chirp(0.42), c["s6"] + 0.12)
    add(thud(0.75), c["s6"] + 0.2)
    add(sparkle(8, 0.7, 0.18, 4), c["s6"] + 0.25)
    add(pop(800, 250, amp=0.55), c["btn6"])
    for i, tp in enumerate(c["taps"]):
        add(tap(0.6), tp)
        add(pop(600, 200, d=0.08, amp=0.4), tp)
        if i == 0:
            add(success(0.36), tp + 0.05)
    return out[: int(total * SR)]


def write_wav(path, left, right=None):
    right = left if right is None else right
    st = np.clip(np.stack([left, right], 1), -1, 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())


def main():
    cues = json.loads((ROOT / "dist" / "cues.json").read_text())
    c, total = cues["cue"], cues["duration"]
    fx = norm(sfx_track(c, total), 0.89)
    mu = norm(music(c, total), 0.89)
    d = int(0.011 * SR)
    mu_r = np.concatenate([np.zeros(d), mu[:-d]])
    write_wav(ROOT / "dist" / "sfx.wav", fx)
    write_wav(ROOT / "dist" / "music.wav", mu, 0.72 * mu + 0.28 * mu_r)
    print(f"wrote dist/sfx.wav + dist/music.wav ({total}s)")


if __name__ == "__main__":
    main()
