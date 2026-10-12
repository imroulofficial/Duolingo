# Duolingo Premium — 9:16 Motion-Graphics Ad (৳২৪৯)

1080×1920 · 30fps · H.264 + AAC · ~19 s — for a Facebook sales campaign.

- [`STORYBOARD.md`](STORYBOARD.md) — scene-by-scene storyboard
- [`VOICEOVER_SCRIPT.md`](VOICEOVER_SCRIPT.md) — timed Bangla/English VO script + ElevenLabs settings
- `output/duolingo_premium_ad_no_vo.mp4` — video without voice-over (motion graphics + SFX + music)

## How it's built (code)
| File | What it does |
|---|---|
| `src/timeline.json` | Every scene / feature-card start time (single source of truth for video **and** audio) |
| `src/template.html` | All motion graphics as HTML/CSS keyframe animations |
| `src/build_html.py` | Generates the Duo-style owl, icons, cards, coins, confetti and fills the template → `dist/index.html` |
| `src/render.js` | Headless Chromium (Playwright) seeks every frame deterministically and pipes it into FFmpeg (libx264) |
| `src/audio.py` | Synthesizes all SFX (whoosh, pop, slam, error, coin, ding, sparkle, tap, success) + a 120 BPM music bed with numpy |
| `src/build.sh` | Runs everything and mixes audio with FFmpeg (loudness-normalised to −14 LUFS) |

```bash
npm install                                  # fonts (Nunito, Baloo Da 2)
bash src/build.sh                            # → output/duolingo_premium_ad_no_vo.mp4
bash src/build.sh --vo assets/voiceover.mp3  # → output/duolingo_premium_ad_final.mp4 (music auto-ducks under VO)
```
Requires: Node + Playwright (Chromium), Python 3 + numpy, FFmpeg.
