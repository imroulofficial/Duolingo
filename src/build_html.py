"""Builds dist/index.html from src/template.html + src/timeline.json.

All scene / card start times live in timeline.json, so re-syncing the video to a
voice-over only means editing that file and re-running the build.
"""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

G, GD, GDD, GL = "#58CC02", "#58A700", "#46A302", "#89E219"
ORANGE, INK = "#FF9600", "#3C3C3C"


# --------------------------------------------------------------------------- Duo
def duo(mood="happy", wave=False, uid="d"):
    """Duo-style owl as inline SVG. mood: happy | sad | joy (eyes closed ^ ^)."""
    lw = (
        '<path d="M30 128 C2 160 8 206 36 224 C42 192 46 160 42 128Z" fill="%s"/>' % GD
    )
    rw_path = '<path d="M210 128 C238 160 232 206 204 224 C198 192 194 160 198 128Z" fill="%s"/>' % GD
    if wave:
        rw = (
            f'<g class="anim" style="transform-box:fill-box;transform-origin:30% 5%;'
            f'animation:wave .32s ease-in-out 0s infinite alternate">'
            f'<g transform="rotate(-20 200 130)">{rw_path}</g></g>'
        )
    else:
        rw = rw_path

    eyes = ""
    if mood == "joy":
        for cx in (82, 158):
            eyes += (
                f'<circle cx="{cx}" cy="102" r="38" fill="#fff"/>'
                f'<path d="M{cx-22} 110 Q{cx} 78 {cx+22} 110" fill="none" stroke="{INK}" '
                f'stroke-width="11" stroke-linecap="round"/>'
            )
        cheeks = (
            '<ellipse cx="52" cy="140" rx="16" ry="9" fill="#FF8FA3" opacity=".55"/>'
            '<ellipse cx="188" cy="140" rx="16" ry="9" fill="#FF8FA3" opacity=".55"/>'
        )
        eyes += cheeks
    else:
        sad = mood == "sad"
        for i, cx in enumerate((82, 158)):
            px = cx + (4 if i == 0 else -4) if sad else cx + (8 if i == 0 else -8)
            py = 118 if sad else 102
            eyes += f'<circle cx="{cx}" cy="102" r="38" fill="#fff"/>'
            eyes += f'<circle cx="{px}" cy="{py}" r="{16 if sad else 19}" fill="{INK}"/>'
            eyes += f'<circle cx="{px+6}" cy="{py-7}" r="6" fill="#fff"/>'
            if sad:
                eyes += (
                    f'<clipPath id="{uid}e{i}"><circle cx="{cx}" cy="102" r="38"/></clipPath>'
                )
                if i == 0:
                    lid = "40,50 124,50 124,86 40,110"
                    brow = "M40 110 L124 86"
                else:
                    lid = "116,50 200,50 200,110 116,86"
                    brow = "M116 86 L200 110"
                eyes += (
                    f'<g clip-path="url(#{uid}e{i})"><polygon points="{lid}" fill="{G}"/>'
                    f'<path d="{brow}" stroke="{GDD}" stroke-width="7"/></g>'
                )

    return f"""<svg viewBox="0 0 240 276" width="100%">
  <path d="M46 74 L32 12 L94 42Z" fill="{G}"/>
  <path d="M194 74 L208 12 L146 42Z" fill="{G}"/>
  {lw}{rw}
  <path d="M120 28 C176 28 206 52 208 102 L212 192 C212 242 176 262 120 262 C64 262 28 242 28 192 L32 102 C34 52 64 28 120 28Z" fill="{G}"/>
  <path d="M68 176 C68 146 172 146 172 176 L172 208 C172 246 68 246 68 208Z" fill="{GL}"/>
  <path d="M98 186 l11 9 l11 -9 M120 186 l11 9 l11 -9 M109 206 l11 9 l11 -9" fill="none" stroke="{G}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  {eyes}
  <path d="M104 132 C110 120 130 120 136 132 C134 150 126 160 120 164 C114 160 106 150 104 132Z" fill="{ORANGE}"/>
  <path d="M108 134 C114 128 126 128 132 134" fill="none" stroke="#FFB84D" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="96" cy="264" rx="22" ry="11" fill="{ORANGE}"/>
  <ellipse cx="144" cy="264" rx="22" ry="11" fill="{ORANGE}"/>
</svg>"""


# ------------------------------------------------------------------------- icons
HEART_PATH = (
    '<path d="M12 21.3s-8.2-4.9-10.3-10C.2 7.6 2.4 3.6 6.3 3.6c2.4 0 3.9 1.4 4.8 2.8.4.6 1.4.6 1.8 0'
    ' .9-1.4 2.4-2.8 4.8-2.8 3.9 0 6.1 4 4.6 7.7C20.2 16.4 12 21.3 12 21.3z" fill="#FF4B4B"/>'
    '<ellipse cx="6.6" cy="7.6" rx="1.6" ry="1.1" transform="rotate(-35 6.6 7.6)" fill="#fff" opacity=".75"/>'
)
ICON_HEART = f'<svg viewBox="0 0 24 24">{HEART_PATH}</svg>'
ICON_FLAME = (
    '<svg viewBox="0 0 24 24"><path d="M12 2c1 3.5 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6 0 2 1 3 2 3'
    ' -.5-3 0-6 1-9z" fill="#FF9600"/><path d="M12 12c.6 1.8 3 3 3 5.5a3 3 0 0 1-6 0c0-1.5 1-2.5 2-3'
    ' .2 1 .6 1.3 1 1.3-.4-1.5-.3-2.7 0-3.8z" fill="#FFC800"/></svg>'
)
ICON_GEM = (
    '<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 13L2 9z" fill="#1CB0F6"/>'
    '<path d="M6 3l3 6h6l3-6M2 9h20M9 9l3 13 3-13" fill="none" stroke="#84D8FF" stroke-width="1.2"/></svg>'
)
ICON_BOLT = (
    '<svg viewBox="0 0 24 24"><path d="M14 1.5 4 13.5h6.5l-1.5 9 10.5-13H13z" fill="#1CB0F6" '
    'stroke="#1899D6" stroke-width="1" stroke-linejoin="round"/>'
    '<path d="M13 4.5 7.5 11.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".7"/></svg>'
)
ICON_NOADS = (
    '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="3" fill="#FF9600"/>'
    '<text x="12" y="15.6" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="8" fill="#fff">AD</text>'
    '<circle cx="12" cy="12" r="10.2" fill="none" stroke="#FF4B4B" stroke-width="2.4"/>'
    '<path d="M4.8 4.8 19.2 19.2" stroke="#FF4B4B" stroke-width="2.4" stroke-linecap="round"/></svg>'
)
ICON_CROWN = (
    '<svg viewBox="0 0 24 24"><path d="M2.5 7.5 7.5 12 12 4l4.5 8 5-4.5-2 12H4.5z" fill="#FFC800" '
    'stroke="#E5A800" stroke-width="1" stroke-linejoin="round"/>'
    '<rect x="4.5" y="17.5" width="15" height="2.5" rx="1" fill="#E5A800"/>'
    '<circle cx="12" cy="13.5" r="1.6" fill="#CE82FF"/></svg>'
)
ICON_CAL = (
    '<svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="17.5" rx="3.5" fill="#fff" stroke="#CE82FF" stroke-width="1.6"/>'
    '<path d="M2.5 7.5a3.5 3.5 0 0 1 3.5-3.5h12a3.5 3.5 0 0 1 3.5 3.5V10h-19z" fill="#CE82FF"/>'
    '<rect x="6.5" y="2" width="2" height="4.5" rx="1" fill="#A560E8"/><rect x="15.5" y="2" width="2" height="4.5" rx="1" fill="#A560E8"/>'
    '<text x="12" y="19" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="7.5" fill="#A560E8">1Y</text></svg>'
)
ICON_CHECK = (
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#58CC02"/>'
    '<path d="M6.8 12.4l3.4 3.4 7-7.2" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
)
SPARK = '<svg viewBox="0 0 24 24"><path d="M12 0c.8 6.5 5.5 11.2 12 12-6.5.8-11.2 5.5-12 12-.8-6.5-5.5-11.2-12-12C6.5 11.2 11.2 6.5 12 0z" fill="{c}"/></svg>'

FEATURES = [
    ("Unlimited Hearts", "ভুল করলেও শেখা থামবে না", ICON_HEART, "#FFDFE0"),
    ("Unlimited Energy", "যত খুশি লেসন, বিরতি ছাড়াই", ICON_BOLT, "#DDF4FF"),
    ("No Ads", "বিজ্ঞাপন ছাড়া মনোযোগী শেখা", ICON_NOADS, "#FFF0D5"),
    ("All Lessons Unlocked", "Legendary লেভেল সহ সব আনলক", ICON_CROWN, "#FFF6CC"),
    ("One-Time Payment", "একবার পেমেন্ট, পুরো ১ বছর", ICON_CAL, "#F4E6FF"),
]


def cards(times):
    out = []
    for i, ((title, sub, icon, tint), t) in enumerate(zip(FEATURES, times)):
        top = 390 + i * 222
        out.append(
            f'<div class="card anim" style="top:{top}px;animation:slideRight .5s var(--bounce) var(--t-c{i}) both">'
            f'<div class="ico flex-c" style="background:{tint}">'
            f'<div class="anim" style="width:100px;height:100px;animation:popIn .45s var(--bounce) calc(var(--t-c{i}) + .2s) both">{icon}</div></div>'
            f'<div class="txt"><h3>{title}</h3><p class="bn">{sub}</p></div>'
            f'<div class="chk anim" style="animation:popIn .4s var(--bounce) calc(var(--t-c{i}) + .45s) both">{ICON_CHECK}</div>'
            f"</div>"
        )
    return "\n".join(out)


def progress_segs(n=5):
    return "".join(
        f'<div class="seg anim" style="animation:grow .4s ease-out calc(var(--t-c{i}) + .45s) both"></div>'
        for i in range(n)
    )


def coins(rng):
    out = []
    for i in range(16):
        ang = rng.uniform(-3.1, 0.05) if i % 2 else rng.uniform(-3.2, 0.1)
        import math
        dist = rng.uniform(380, 620)
        dx, dy = math.cos(ang) * dist, math.sin(ang) * dist * 0.9 + rng.uniform(-60, 160)
        delay = 0.47 + (i % 4) * 0.05
        size = rng.randint(70, 110)
        out.append(
            f'<div class="abs anim" style="left:{540-size//2}px;top:{640-size//2}px;width:{size}px;height:{size}px;'
            f"--dx:{dx:.0f}px;--dy:{dy:.0f}px;--r:{rng.randint(-540,540)}deg;--s:{rng.uniform(.8,1.2):.2f};"
            f'animation:coinFly 1.1s cubic-bezier(.2,.7,.4,1) calc(var(--t-price) + {delay - 0.45:.2f}s) both">'
            f'<svg viewBox="0 0 24 24" width="100%"><circle cx="12" cy="12" r="11" fill="#FFC800" stroke="#E5A800" stroke-width="1.5"/>'
            f'<circle cx="12" cy="12" r="7.5" fill="none" stroke="#FFE066" stroke-width="1.2"/>'
            f'<text x="12" y="16.2" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="11" fill="#E5A800">৳</text></svg></div>'
        )
    return "\n".join(out)


def sparkles(rng, var, positions, colors=("#fff", "#FFC800")):
    out = []
    for i, (x, y, s) in enumerate(positions):
        c = colors[i % len(colors)]
        d = 0.25 + i * 0.12
        out.append(
            f'<div class="sparkle anim" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;'
            f'animation:twinkle 1.1s ease-in-out calc(var({var}) + {d:.2f}s) infinite">{SPARK.format(c=c)}</div>'
        )
    return "\n".join(out)


def confetti(rng):
    cols = ["#FFC800", "#FF4B4B", "#1CB0F6", "#CE82FF", "#FFFFFF", "#FF9600"]
    out = []
    for i in range(46):
        x = rng.randint(0, 1060)
        dur = rng.uniform(2.6, 4.2)
        delay = rng.uniform(0.0, 3.5)
        out.append(
            f'<div class="confetti anim" style="left:{x}px;background:{cols[i % len(cols)]};'
            f"--dx:{rng.randint(-220,220)}px;--r:{rng.randint(360,1080)}deg;"
            f"width:{rng.randint(16,26)}px;height:{rng.randint(26,40)}px;"
            f'animation:fall {dur:.2f}s linear calc(var(--t-s4) + {delay - 1.6:.2f}s) infinite"></div>'
        )
    return "\n".join(out)


def main():
    tl = json.loads((SRC / "timeline.json").read_text())
    rng = random.Random(7)
    timing = {
        "--t-nope": tl["nope"],
        "--t-s2": tl["s2"],
        "--t-s3": tl["s3"],
        "--t-bubble": tl["bubble"],
        "--t-s4": tl["s4"],
        "--t-heart": tl["heart"],
        "--t-title": tl["title"],
        "--t-break": tl["break"],
        "--t-sub": tl["sub"],
        "--t-sadduo": tl["sadduo"],
        "--t-price": tl["price"],
        "--t-year": tl["year"],
        "--t-badge": tl["badge"],
    }
    for i, t in enumerate(tl["cards"]):
        timing[f"--t-c{i}"] = t
    timing_css = " ".join(f"{k}:{v}s;" for k, v in timing.items())

    html = (SRC / "template.html").read_text()
    subs = {
        "{{TIMING_CSS}}": timing_css,
        "{{ICON_FLAME}}": ICON_FLAME,
        "{{ICON_GEM}}": ICON_GEM,
        "{{ICON_HEART}}": ICON_HEART,
        "{{HEART_PATH}}": HEART_PATH,
        "{{DUO_SAD}}": duo("sad", uid="sad"),
        "{{DUO_JOY}}": duo("joy", uid="joy1"),
        "{{DUO_HAPPY}}": duo("happy", uid="hap1"),
        "{{DUO_HAPPY_WAVE}}": duo("happy", wave=True, uid="hap2"),
        "{{COINS}}": coins(rng),
        "{{CARDS}}": cards(tl["cards"]),
        "{{PROGRESS_SEGS}}": progress_segs(),
        "{{CONFETTI}}": confetti(rng),
        "{{SPARKLES_NOPE}}": sparkles(rng, "--t-nope", [(250, 260, 80), (790, 300, 60), (230, 620, 56), (800, 610, 84), (520, 180, 50)]),
        "{{SPARKLES_PRICE}}": sparkles(rng, "--t-s2", [(110, 520, 80), (900, 470, 64), (140, 860, 56), (880, 860, 76), (860, 1250, 60), (120, 1300, 70)]),
    }
    for k, v in subs.items():
        html = html.replace(k, v)
    assert "{{" not in html, "unfilled placeholder"
    DIST.mkdir(exist_ok=True)
    (DIST / "index.html").write_text(html)
    print("wrote", DIST / "index.html")


if __name__ == "__main__":
    main()
