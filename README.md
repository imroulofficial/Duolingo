# Duolingo Premium Lifetime: 9:16 Reels ad (৳১৯৯)

A motion-graphics ad for Facebook and Instagram Reels, built in the visual grammar of Duolingo's UI:
chunky 3D buttons, pill progress bars, hearts and energy counters, and a lesson path.
Every element is an original vector drawn for this ad, including the owl mascot.

| | |
|---|---|
| **Format** | 1080 × 1920 (9:16), 60 fps, H.264 High (CRF 10, ~8 Mbps) + AAC 192k, −14 LUFS |
| **Length** | **18.8 s** synced to the supplied voice-over (17.4 s on scratch timing) |
| **CTA** | ORDER NOW → `electronicbd.com/product/duolingo` |

## Deliverables (`out/`)
- `final.mp4`: **the ad with the voice-over**, music ducked under it and SFX on the beats.
- `final_no_vo.mp4`: always the music + SFX mix, without VO.
- `poster.png`: 1080×1920 thumbnail on the offer beat (৳১৯৯, ৯০% ছাড়, LIFETIME).
- `contact_sheet.png`: 24 frames from the encode, with the top and bottom 15 % Reels safe zones marked.

### Product-listing images (ElectronicBD), 1080×1080
- `thumbnail_1x1.png`: green hero with the thumbs-up owl, duolingo PREMIUM, a ∞ LIFETIME price card (৳১,৯৯০ struck → **৳১৯৯**), the ৯০% ছাড় stamp and a 4-feature strip.
- `gallery_1x1_1.png`: "প্রিমিয়ামে যা যা পাচ্ছেন", a 2×2 grid of feature cards (Unlimited Hearts and Energy, No Ads, All Lessons Unlocked) and a one-time payment / lifetime access bar.
- `gallery_1x1_2.png`: a Free vs Premium comparison (hearts, energy, ads, lessons) with a price strip.

Rebuild with `node src/render_listing.js`. The images come from `src/listing.html`, laid out at 360×360 and captured at 3×. They share `src/kit.css` and `src/kit.js` (tokens, components, icons, owl) with the video, so both stay in one design system.

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

## Voice-over sync (supplied `assets/voiceover.mp3`, 19.64 s)
Pauses were capped at 0.22 s, which saved 1.6 s, and the read was sped up ×1.024 with pitch kept. Speech now ends at 17.60 s and the ad ends at 18.82 s.

| Line | VO file | In video | Visual beat |
|---|---|---|---|
| হার্ট শেষ? / আবার শুরু থেকে? | 0.12 / 1.43 | 0.13 / 1.31 | slam 0.30, progress drain + subtitle 1.28, crack 1.63 |
| ফ্রি ভার্সনে ভুল করলেই হার্ট শেষ | 3.05 | 2.60 | smash cut 2.52, hearts grey out, energy drains |
| তার উপর বিরক্তিকর Ads! | 5.40 | 4.77 | 3 ads slam 4.72 / 5.02 / 5.32 |
| কিন্তু এখন আছে Duolingo Premium! | 7.43 | 6.58 | button press 6.09, green flood 6.25–6.53, logo 7.32, badge 8.07 |
| আনলিমিটেড হার্টস | 10.07 | 8.94 | feature 1/4 at 8.85 |
| আনলিমিটেড এনার্জি | 11.26 | 10.10 | feature 2/4 at 10.07 |
| কোনো Ads নেই | 12.55 | 11.35 | feature 3/4 at 11.32 |
| আর সব লেসন আনলকড! | 13.59 | 12.37 | feature 4/4 at 12.34 |
| মাত্র ১৯৯ টাকায় লাইফটাইম অ্যাক্সেস! | 15.52 | 13.93 | pan 13.65, ৳১৯৯ slam 14.38, stamp 14.78, LIFETIME pills 15.41 |
| আজই অর্ডার করুন! | 18.56 | 16.84 | CTA card 16.32, button 16.77, taps 17.52 / 18.17, end 18.82 |

## How it works
- **`src/ad.html` + `src/ad.js`**: the whole ad is a pure function of time. `window.seek(t)` poses every element for second `t`, with no timers, CSS transitions or unseeded randomness. Motion uses closed-form damped springs, so buttons overshoot, hearts shake and bars settle. The page is laid out at **360×640 CSS px and captured at deviceScaleFactor 3**, so Duolingo's literal tokens apply at native 1080×1920: the 4px `#58A700` button edge, 12/16/9999px radii and 2px `#E5E5E5` borders.
- **`src/timeline.json`**: the 10 VO lines, with scratch start and end times.
- **`src/cues.py`**: derives every visual and SFX cue from those line anchors and writes `dist/cues.json`, which both the page and the audio read.
- **`src/sync_vo.py`**: the second pass. It finds speech phrases in the uploaded VO and aligns them to the 10 script lines with a small DP that matches each line's share of speech time to its share of the script text, so a line read as two phrases still maps correctly. It caps pauses at 0.22 s, cutting only inside silence, and adds a gentle speed-up only if needed. The result goes to `dist/vo_tight.wav` and `dist/vo_sync.json`, and `cues.py` then lands beats on words ("Duolingo" and "Premium", "১৯৯", "লাইফটাইম").
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
