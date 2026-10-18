# Voice-over script — Duolingo Premium Lifetime (৳১৯৯)

Generate this **externally** (ElevenLabs) as **one file**, then drop it in `assets/voiceover.mp3`
and run `bash src/build.sh --vo assets/voiceover.mp3`. The pipeline finds each line
from the pauses and re-times every visual and sound effect to it.

**Target:** the whole read in **15.5–18 s**. Leave a short, clear pause (~0.25 s) between lines,
because the sync tool uses those pauses to tell the lines apart.
**Tone:** energetic, friendly and confident, like a game commercial, not a lecture.

## Paste into ElevenLabs (one block)

```
হার্ট শেষ? আবার শুরু থেকে?
ফ্রি ভার্সনে ভুল করলেই হার্ট শেষ, তার উপর বিরক্তিকর Ads!
কিন্তু এখন আছে Duolingo Premium!
আনলিমিটেড হার্টস, আনলিমিটেড এনার্জি, কোনো Ads নেই, আর সব লেসন আনলকড!
মাত্র ১৯৯ টাকায় লাইফটাইম অ্যাক্সেস!
আজই অর্ডার করুন!
```

## Line → beat map (scratch timing used for the no-VO render)

| # | id | Line | Scratch start | What's on screen |
|---|---|---|---|---|
| 1 | hook | হার্ট শেষ? আবার শুরু থেকে? | 0.10 | Heart counter hits 0, giant heart cracks, progress bar drains |
| 2 | free | ফ্রি ভার্সনে ভুল করলেই হার্ট শেষ, | 2.05 | Hearts go grey one by one, energy drains 25 → 0 |
| 3 | ads | তার উপর বিরক্তিকর Ads! | 3.35 | Three ad pop-ups slam in, screen shakes |
| 4 | premium | কিন্তু এখন আছে Duolingo Premium! | 5.05 | GET PREMIUM press → green flood → logo + PREMIUM badge, 0 → ∞ |
| 5 | hearts | আনলিমিটেড হার্টস, | 8.00 | Feature 1/4: ∞ heart |
| 6 | energy | আনলিমিটেড এনার্জি, | 9.00 | Feature 2/4: energy ring refills |
| 7 | noads | কোনো Ads নেই, | 10.00 | Feature 3/4: AD stamped out of the phone |
| 8 | lessons | আর সব লেসন আনলকড! | 10.95 | Feature 4/4: lesson nodes unlock + confetti |
| 9 | offer | মাত্র ১৯৯ টাকায় লাইফটাইম অ্যাক্সেস! | 12.30 | ৳১,৯৯০ struck → **৳১৯৯** slam, ৯০% ছাড় stamp, ONE-TIME / LIFETIME pills |
| 10 | cta | আজই অর্ডার করুন! | 15.30 | CTA card, ORDER NOW pressed twice, URL, owl thumbs-up |

The ad ends **VO end + 0.9 s** (minimum 2.6 s on the CTA).

## Suggested ElevenLabs settings
- **Model:** Eleven v3 (best Bangla emotion), or Multilingual v2
- **Voice:** young and lively, male or female
- **Stability** ~35–45 % · **Similarity** ~75 % · **Style** ~30–40 % · **Speed** 1.05–1.1
- v3 tags if wanted: `[frustrated] হার্ট শেষ? …` `[excited] কিন্তু এখন আছে …`
- **Output:** WAV, or MP3 at 44.1 kHz / 128 kbps or higher

If the read runs past ~19 s, `sync_vo.py` speeds it up automatically (pitch kept, max 1.12×)
so the ad stays at 20 s or less. If a pause is too short for the line detection, pass the
10 start times by hand: `bash src/build.sh --vo assets/voiceover.mp3 --manual 0.1,2.0,...`
