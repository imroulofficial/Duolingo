"""QA + thumbnail deliverables.

    python3 src/sheets.py  -> out/poster.png (1080x1920) + out/contact_sheet.png

The poster is rendered straight from the page (lossless) on the offer beat;
the contact sheet samples 24 frames from the encoded out/final.mp4 with
timestamps and the 15% Reels safe-zone lines drawn in.
"""
import json
import os
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT, DIST = ROOT / "out", ROOT / "dist"


def main():
    cues = json.loads((DIST / "cues.json").read_text())
    c, dur = cues["cue"], cues["duration"]
    env = dict(os.environ, NODE_PATH=os.environ.get("NODE_PATH", "/opt/node22/lib/node_modules:/opt/node-tools/node_modules"))

    # poster: the offer beat (price + 90% stamp + lifetime pills all on screen)
    tp = round(c["pills"] + 0.7, 2)
    subprocess.run(["node", str(ROOT / "src" / "render.js"), "stills", str(DIST / "poster"), str(tp)], check=True, env=env)
    Image.open(next((DIST / "poster").glob("*.png"))).convert("RGB").save(OUT / "poster.png", optimize=True)

    # contact sheet from the actual encode
    n, cols, tw = 24, 8, 270
    th = tw * 16 // 9
    sheet = Image.new("RGB", (cols * (tw + 8) + 8, (n // cols) * (th + 34) + 8), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    tmp = DIST / "cs.png"
    for i in range(n):
        t = (i + 0.5) * dur / n
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(OUT / "final.mp4"),
                        "-frames:v", "1", "-vf", f"scale={tw}:{th}", str(tmp)], check=True)
        im = Image.open(tmp).convert("RGB")
        x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 34)
        sheet.paste(im, (x, y))
        for yy in (int(th * .15), int(th * .85)):  # Reels UI safe-zone guides
            d.line([(x, y + yy), (x + tw, y + yy)], fill=(255, 0, 255), width=1)
        d.text((x + 4, y + th + 8), f"{t:5.2f}s", fill=(230, 230, 230))
    sheet.save(OUT / "contact_sheet.png", optimize=True)
    print("wrote out/poster.png + out/contact_sheet.png")


if __name__ == "__main__":
    main()
