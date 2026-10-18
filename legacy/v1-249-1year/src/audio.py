"""Synthesizes the sound design (SFX) and a light music bed, synced to timeline.json.

Outputs (48 kHz stereo, 16-bit):
  dist/sfx.wav    - whoosh / pop / slam / error / coin / ding / sparkle / tap / success
  dist/music.wav  - 120 BPM upbeat bed (tension drone under the hook, beat drops on "আর না!")
Everything is generated from scratch with numpy -> no third-party samples / licensing issues.
"""
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(3)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(n, a=0.005, d=None, curve=6.0):
    """attack + exponential decay envelope of n samples"""
    x = np.arange(n) / SR
    e = np.exp(-curve * x / (d or (n / SR)))
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def onepole_lp(x, fc):
    """time-varying one-pole low-pass; fc can be scalar or array"""
    fc = np.broadcast_to(fc, x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s
        y[i] = s
    return y


def bandsweep(x, f):
    lp = onepole_lp(x, f * 1.6)
    return lp - onepole_lp(lp, f * 0.5)


def osc(freq, dur, kind="sine"):
    ph = 2 * np.pi * np.cumsum(np.broadcast_to(freq, t_(dur).shape)) / SR
    if kind == "sine":
        return np.sin(ph)
    if kind == "square":  # soft band-limited-ish square
        return sum(np.sin(ph * k) / k for k in (1, 3, 5, 7, 9))
    if kind == "tri":
        return sum(((-1) ** (k // 2)) * np.sin(ph * k) / (k * k) for k in (1, 3, 5, 7))
    if kind == "saw":
        return sum(np.sin(ph * k) / k for k in range(1, 12))
    raise ValueError(kind)


def bell(f, dur, decay=4.0):
    tt = t_(dur)
    x = (np.sin(2 * np.pi * f * tt) + 0.45 * np.sin(2 * np.pi * f * 2.0 * tt) * np.exp(-tt * 8)
         + 0.25 * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt * 14))
    return x * env(len(tt), 0.002, dur, decay)


# ----------------------------------------------------------------------- SFX
def whoosh(dur=0.5, lo=300, hi=3500, amp=0.55):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    p = np.linspace(0, 1, n)
    f = lo + (hi - lo) * np.sin(np.pi * p) ** 1.5
    y = bandsweep(x, f)
    y *= np.sin(np.pi * p) ** 2
    return amp * y / (np.abs(y).max() + 1e-9)


def riser(dur=1.0):
    n = int(dur * SR)
    p = np.linspace(0, 1, n)
    y = bandsweep(rng.standard_normal(n), 200 + 5000 * p ** 2) * p ** 2
    y = y / np.abs(y).max() * 0.35
    y += 0.12 * osc(110 + 330 * p ** 2, dur, "saw") * p ** 2
    return y


def pop(f0=900, f1=260, dur=0.12, amp=0.7):
    tt = t_(dur)
    f = f1 + (f0 - f1) * np.exp(-tt * 40)
    return amp * osc(f, dur) * env(len(tt), 0.001, dur, 5)


def slam(amp=0.9):
    dur = 0.45
    tt = t_(dur)
    body = osc(45 + 110 * np.exp(-tt * 18), dur) * env(len(tt), 0.001, dur, 5)
    noise = onepole_lp(rng.standard_normal(len(tt)), 1800) * env(len(tt), 0.001, 0.12, 6)
    y = body + 0.8 * noise / (np.abs(noise).max() + 1e-9)
    return amp * y / np.abs(y).max()


def error_buzz():
    a = osc(233, 0.16, "square") * env(int(0.16 * SR), 0.004, 0.2, 2)
    b = osc(174, 0.30, "square") * env(int(0.30 * SR), 0.004, 0.3, 3)
    y = np.concatenate([a, np.zeros(int(0.03 * SR)), b])
    return 0.28 * onepole_lp(y, 2500)


def coin():
    a = osc(988, 0.07, "square") * 0.9
    b = osc(1319, 0.42, "square") * env(int(0.42 * SR), 0.001, 0.42, 4)
    return 0.22 * np.concatenate([a, b])


def ding():  # "correct answer" style two-note chime
    y = np.zeros(int(0.7 * SR))
    for k, f in enumerate((1046.5, 1568.0)):
        b = bell(f, 0.6, 5)
        o = int(k * 0.09 * SR)
        y[o:o + len(b)] += b
    return 0.32 * y


def sparkle(n=7, dur=0.8):
    y = np.zeros(int(dur * SR) + SR // 2)
    notes = [2093, 2349, 2637, 3136, 3520, 4186]
    for i in range(n):
        b = bell(notes[rng.integers(len(notes))], 0.35, 7) * rng.uniform(.5, 1)
        o = int(i * dur / n * SR)
        y[o:o + len(b)] += b
    return 0.16 * y


def tap():
    tt = t_(0.06)
    y = osc(2200 * np.exp(-tt * 30) + 600, 0.06) * env(len(tt), 0.0005, 0.06, 8)
    y += 0.5 * rng.standard_normal(len(tt)) * env(len(tt), 0.0005, 0.01, 8)
    return 0.45 * y


def success():
    notes = [523.25, 659.25, 783.99, 1046.5]
    y = np.zeros(int(1.6 * SR))
    for i, f in enumerate(notes):
        b = bell(f, 1.2 if i == 3 else 0.5, 3.5 if i == 3 else 6)
        o = int(i * 0.085 * SR)
        y[o:o + len(b)] += b * (1.0 if i == 3 else 0.8)
    return 0.3 * y


# --------------------------------------------------------------------- music
def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def kick():
    tt = t_(0.35)
    return osc(42 + 120 * np.exp(-tt * 28), 0.35) * env(len(tt), 0.001, 0.35, 6)


def clap():
    n = int(0.18 * SR)
    x = bandsweep(rng.standard_normal(n), np.full(n, 1500.0))
    return x / np.abs(x).max() * env(n, 0.001, 0.18, 7)


def hat():
    n = int(0.05 * SR)
    x = rng.standard_normal(n)
    x = x - onepole_lp(x, 7000)
    return x / np.abs(x).max() * env(n, 0.0005, 0.05, 8)


def music(total, drop):
    L = int(total * SR) + SR
    out = np.zeros(L)

    def add(sig, t, g=1.0):
        o = int(t * SR)
        if o >= L:
            return
        sig = sig[: L - o]
        out[o:o + len(sig)] += g * sig

    # tension drone before the drop
    dd = drop
    tt = t_(dd)
    drone = (osc(55, dd, "saw") * 0.5 + osc(82.4, dd, "saw") * 0.3)
    drone = onepole_lp(drone, 300 + 900 * (tt / dd) ** 2) * np.minimum(1, tt / 0.3) * 0.5
    add(drone, 0)
    # clock-like ticks under the hook
    for k in range(int(dd / 0.25)):
        add(tap() * 0.35, k * 0.25)

    bpm = 120
    beat = 60 / bpm
    prog = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]  # C G Am F
    roots = [36, 43, 45, 41]
    end_music = total - 1.2
    t = dd
    bar = 0
    while t < end_music:
        chord = prog[bar % 4]
        root = roots[bar % 4]
        for b in range(4):
            bt = t + b * beat
            if bt >= end_music:
                break
            add(kick(), bt, 0.9)
            if b in (1, 3):
                add(clap(), bt, 0.35)
            add(hat(), bt + beat / 2, 0.18)
            add(hat(), bt, 0.10)
            # bass
            bd = beat * 0.9
            add(onepole_lp(osc(midi(root), bd, "saw"), 400) * env(int(bd * SR), 0.005, bd, 2) * 0.6, bt)
            # off-beat chord pluck
            pd = 0.28
            pl = sum(osc(midi(n + 12), pd, "tri") for n in chord) / 3
            add(pl * env(int(pd * SR), 0.002, pd, 6) * 0.35, bt + beat / 2)
        # lead "duo" motif every bar start
        for k, n in enumerate((chord[2] + 12, chord[1] + 12, chord[0] + 24)):
            add(bell(midi(n), 0.3, 6) * 0.12, t + k * beat * 0.5)
        t += 4 * beat
        bar += 1
    # final chord ring-out
    for n in (48, 60, 64, 67, 72):
        add(bell(midi(n), 1.4, 2.5) * 0.18, end_music)
    add(kick(), end_music, 0.9)
    out = out[: int(total * SR)]
    fade = int(0.4 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


# --------------------------------------------------------------- arrangement
def sfx_track(tl):
    total = tl["duration"]
    L = int(total * SR) + 2 * SR
    out = np.zeros(L)

    def add(sig, t, g=1.0):
        o = int(max(0, t) * SR)
        sig = sig[: L - o]
        out[o:o + len(sig)] += g * sig

    nope, s2, s3, s4 = tl["nope"], tl["s2"], tl["s3"], tl["s4"]
    # Scene 1 - hook
    add(whoosh(0.35, 400, 2500, 0.35), 0.0)
    add(pop(700, 200), tl["heart"])
    add(slam(), tl["title"])
    add(error_buzz(), tl["break"])
    add(whoosh(0.4, 200, 1500, 0.3), tl["sadduo"])
    add(riser(nope - 1.1), 1.1)
    # "আর না!"
    add(whoosh(0.5, 500, 5000, 0.6), nope - 0.1)
    add(pop(1200, 400, amp=0.6), nope + 0.1)
    add(sparkle(), nope + 0.15)
    add(slam(0.8), nope + 0.3)
    add(pop(900, 500, amp=0.4), nope + 0.6)
    # Scene 2 - price
    add(whoosh(0.5, 400, 4000, 0.55), s2 - 0.1)
    add(pop(), s2 + 0.2)
    add(pop(1000, 350), s2 + 0.3)
    add(slam(0.85), tl["price"])
    for k in range(5):
        add(coin(), tl["price"] + 0.05 + k * 0.09, 0.8 if k else 1.0)
    add(pop(800, 300, amp=0.5), tl["year"])
    add(pop(1100, 400), tl["badge"])
    add(sparkle(9, 0.9), tl["badge"] + 0.5)
    # Scene 3 - features
    add(whoosh(0.5, 300, 3500, 0.55), s3 - 0.1)
    add(pop(), s3 + 0.1)
    for c in tl["cards"]:
        add(whoosh(0.35, 800, 4500, 0.4), c - 0.05)
        add(pop(1000, 500, amp=0.45), c + 0.2)
        add(ding(), c + 0.45)
    add(pop(900, 400), tl["bubble"])
    # Scene 4 - CTA
    add(whoosh(0.5, 300, 4000, 0.6), s4 - 0.1)
    add(pop(800, 250), s4 + 0.15)
    add(slam(0.8), s4 + 0.45)
    add(coin(), s4 + 0.8)
    add(coin(), s4 + 0.9, 0.8)
    add(pop(1200, 400), s4 + 1.25)
    for tp in (2.3, 3.7):
        add(tap(), s4 + tp)
    add(success(), s4 + 2.35)
    return out[: int(total * SR)]


def write_wav(path, mono_l, mono_r=None):
    if mono_r is None:
        mono_r = mono_l
    st = np.stack([mono_l, mono_r], 1)
    st = np.clip(st, -1, 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())


def main():
    tl = json.loads((ROOT / "src" / "timeline.json").read_text())
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    fx = sfx_track(tl)
    fx = fx / np.abs(fx).max() * 0.89
    mu = music(tl["duration"], tl["nope"])
    mu = mu / np.abs(mu).max() * 0.89
    # slight stereo width on music
    d = int(0.012 * SR)
    mu_r = np.concatenate([np.zeros(d), mu[:-d]])
    write_wav(dist / "sfx.wav", fx)
    write_wav(dist / "music.wav", mu, 0.7 * mu + 0.3 * mu_r)
    print("wrote sfx.wav, music.wav")


if __name__ == "__main__":
    main()
