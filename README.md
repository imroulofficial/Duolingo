# Duolingo Premium Lifetime: 9:16 Reels ad (৳১৯৯)

A motion-graphics ad for Facebook and Instagram Reels, built in the visual grammar of Duolingo's UI:
chunky 3D buttons, pill progress bars, hearts and energy counters, and a lesson path.
Every element is an original vector drawn for this ad, including the owl mascot.

| | |
|---|---|
| **Format** | 1080 × 1920 (9:16), 60 fps, H.264 High (CRF 10, ~8 Mbps) + AAC 192k, −14 LUFS |
| **Length** | 17.6 s on scratch timing; follows the VO once synced (VO end + 0.9 s, max 20 s) |
| **CTA** | ORDER NOW → `electronicbd.com/product/duolingo` |

## Deliverables (`out/`)
- `final.mp4`: the ad. Before a VO is supplied it is the music + SFX version.
- `final_no_vo.mp4`: always the music + SFX mix, without VO.
- `poster.png`: 1080×1920 thumbnail on the offer beat (৳১৯৯, ৯০% ছাড়, LIFETIME).
- `contact_sheet.png`: 24 frames from the encode, with the top and bottom 15 % Reels safe zones marked.

## Storyboard

| Time* | Scene | Motion | SFX / music |
|---|---|---|---|
| 0.0–1.9 | **Hook: pain point** | Frame 0 is already moving: a giant heart flies out of the counter, 1 → **0** with a red flash and shake. Then **হার্ট শেষ?** slams in, **আবার শুরু থেকে?** follows as the lesson bar drains, and the heart cracks and greys out | Wrong buzz, thud, crack, tension drone and clock ticks |
| 1.9–4.6 | **Free-version struggle** | Smash-cut punch-in. The 5 hearts grey out one by one, energy drains 25 → 0, a sad owl peeks in, and 3 ad pop-ups slam in (**তার উপর বিরক্তিকর ADS!**) | Muffled minor groove, ad jingles, drain zap, buzz |
| 4.2–5.0 | **Turn** | A 3D **GET PREMIUM** button pops in and a finger presses it (the 4px edge collapses). A green circle mask grows out of the button | Tap, riser |
| 5.0–7.8 | **Transform** | **কিন্তু এখন আছে / duolingo / PREMIUM** (shine sweep). A status card flips hearts 0 → ∞, refills energy → ∞, and switches Ads ON → OFF. A happy owl hops in and winks | **Beat drop** + crash, correct chime, sparkle, owl chirp |
| 7.8–12.0 | **Features ×4** | The card morphs into a full white screen. A pill progress bar springs 0/4 → 4/4, one hero per feature (∞ heart, energy ring, AD stamped out of a phone, lesson nodes unlock with confetti), and a checklist builds up | Pop + correct chime per feature, pitch rising |
| 12.0–15.0 | **Offer** | Camera pans up. ৳১,৯৯০ is struck through, **৳১৯৯** slams in with a coin burst, the **৯০% ছাড়** stamp lands, and **ONE-TIME PAYMENT / LIFETIME ACCESS** pills pop in | Thud, cash register, coins, stamp |
| 15.0–end | **CTA** | The offer screen shrinks into the CTA card. The owl springs up with a thumbs-up and wink, **আজই অর্ডার করুন!**, the 3D **ORDER NOW** button breathes with a ripple ring, a finger taps it twice and then leaves, and the URL stays clear for the final hold | Owl chirp, button pops, success sting, outro chord |

\* Scratch timing. Every beat moves with the VO after sync.

## How it works
- **`src/ad.html` + `src/ad.js`**: the whole ad is a pure function of time. `window.seek(t)` poses every element for second `t`, with no timers, CSS transitions or unseeded randomness. Motion uses closed-form damped springs, so buttons overshoot, hearts shake and bars settle. The page is laid out at **360×640 CSS px and captured at deviceScaleFactor 3**, so Duolingo's literal tokens apply at native 1080×1920: the 4px `#58A700` button edge, 12/16/9999px radii and 2px `#E5E5E5` borders.
- **`src/timeline.json`**: the 10 VO lines, with scratch start and end times.
- **`src/cues.py`**: derives every visual and SFX cue from those line anchors and writes `dist/cues.json`, which both the page and the audio read.
- **`src/sync_vo.py`**: the second pass. It measures the uploaded VO, detects its lines from pauses, speeds it up if needed so the ad stays under 20 s, and writes `dist/vo_sync.json`.
- **`src/audio.py`**: synthesises all SFX and a 120 BPM chiptune bed with numpy, so nothing is licensed. The music bed is a placeholder; swap `dist/music.wav` for a licensed track if wanted.
- **`src/render.js`**: Playwright drives headless Chromium with 4 parallel workers, seeks frame by frame and pipes into FFmpeg/x264.
- **`src/sheets.py`**: renders the poster and contact sheet.
- **`src/build.sh`**: runs the full pipeline and the final mix. When a VO is present, the music ducks under it via a sidechain.

## Build
```bash
npm install                                    # fonts: Nunito + Baloo Da 2 (Bangla)
bash src/build.sh                              # first pass: scratch timing, no VO
bash src/build.sh --vo assets/voiceover.mp3    # second pass: sync to the VO and mix it
FPS=30 bash src/build.sh                       # quicker preview
```
Requires Node with Playwright (Chromium), Python 3 with numpy and Pillow, and FFmpeg.
A full 60 fps render takes about 1.5 min on 4 cores.

See [`VOICEOVER_SCRIPT.md`](VOICEOVER_SCRIPT.md) for the script to record.
The previous ৳249 / 1-year version is kept in `legacy/v1-249-1year/`.
