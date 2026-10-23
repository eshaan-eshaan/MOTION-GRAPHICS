# Asset manifest, sources and licensing

Every file the render uses lives in `public/` and is loaded locally. Nothing is fetched while the
film renders. Raw downloads are kept in `assets-src/raw/` (git-ignored, re-fetchable with
`tools/fetch_preview.py "<Commons title>" 0 <dest>`). Commons metadata snapshots are in
`assets-src/research/*.json`.

No image in the film is AI-generated, and no authentic image has been composited or retouched.
Mission imagery is shown with its own caption and source. Diagrams and illustrations are drawn
in code and labelled as such where they could be mistaken for imagery.

## Authentic imagery

| File in `public/` | Used in | Source (Wikimedia Commons title → original) | Author | Licence | Changes |
|---|---|---|---|---|---|
| `img/c3-vikram-navcam-1104.jpg` | Scene 5 hero hold | *Chandrayaan-3 – Image of Vikram lander on lunar surface taken by Pragyan rover navcam at 1104 IST, 30 August 2023 from 15 meters away (without text).webp* ← isro.gov.in/chandrayaan3_gallery.html | ISRO | GODL-India | WebP → JPEG, native 1125 px; edge-feathered in the frame. |
| `img/c3-vikram-navcam-0735.jpg` | Scene 5 split screen | *Chandrayaan 3 lander.jpg*: "Chandrayaan-3 lander on the lunar surface; photo taken by Pragyan rover", 30 Aug 2023 | ISRO | GODL-India | None (cropped by the frame). |
| `video/c3-pragyan-rampdown.mp4` | Scene 5 split screen | *Chandrayaan-3 Pragyan rover ramped down from the Lander to the Lunar surface.webm*. ISRO's title card: "Rollout of the Rover from the Lander as observed by Lander Imager Camera, August 23, 2023" | ISRO | GODL-India | Trimmed 11–26 s, pillarbox cropped, H.264, silent; played in real time. |
| `video/c3-lpdc-approach.mp4` | Scene 5 approach shot | *Moon as captured by the Lander Position Detection Camera (LPDC) aboard Chandrayaan-3 lander on 15 August 2023.webm* ← isro.gov.in | ISRO | GODL-India | Trimmed 0.4–9.4 s; cropped to the imagery, leaving out ISRO's burned-in caption and logo (credited on screen instead); H.264, silent. |
| `img/jm-samrat-wide.jpg` | Scene 4 lateral move | *Vrihat Samrat Yantra, Jantar Mantar, Jaipur (54358376655).jpg* | Mustang Joe (Flickr) | **CC0** | Resized 6016 → 3400 px. |
| `img/jm-quadrant.jpg` | Scene 4 quadrant | *Samrat yantra hour minute time scale engraved on marble stone at jantar mantar ,Jaipur India.jpg* | Swapnil.Karambelkar | **CC BY-SA 4.0** | Resized 4608 → 2880 px. |
| `img/aryabhata-statue-iucaa.jpg` | Scene 3 | *2064 aryabhata-crp.jpg*: statue at IUCAA, Pune | Commons uploader (own work) | Public domain (per Commons) | None. Labelled on screen as an artistic representation; no portrait from his lifetime exists. |

**GODL-India** (Government Open Data License – India) permits use and adaptation with
attribution and without misrepresentation. The film credits ISRO on every mission shot and in
the end credits.

**CC BY-SA 4.0 (quadrant photo):** attribution is on screen and in the credits. ShareAlike may
apply to adaptations of the photo. If the film must be distributed under different terms,
replace this one image with a CC0 or CC BY alternative from Commons' *Brihat Samrat Yantra*
category (e.g. Arian Zwegers, CC BY 2.0). The overlay geometry is fitted in
`src/scenes/handoffs.ts` (`QUADRANT`) and would need re-measuring.

## Data and illustration sources

| File | Used in | Source | Licence / terms |
|---|---|---|---|
| `img/moon-lroc-2k.jpg` | Scene 5 globe, Scene 6 horizon | NASA SVS CGI Moon Kit, `lroc_color_poles_4k.tif` (svs.gsfc.nasa.gov/4720), resized to 2048 × 1024 | NASA media; credit "NASA's Scientific Visualization Studio" (on screen and in credits). The map is optimised for looks; the globe is a lit visualisation, captioned as such. |
| `img/moon-ink-2k.png` | Scene 5 drawn lunar diagram | Derived from the LRO map by `tools/make_textures.py` (maria outlines, rims, stipple) | Same as above |
| `src/data/jyaTable.json` | Scene 3 jyā line | Āryabhaṭa's 24 sine differences, *Āryabhaṭīya* Gītikāpada 12 (Shukla & Sarma 1976; Plofker 2009) | Historical text (public domain) |
| `src/data/stars.json` | Scenes 1–2 star charts | Yale Bright Star Catalogue, 5th rev. (Hoffleit & Warren), J2000, via github.com/brettonw/YaleBrightStarCatalog | Public-domain catalogue data |
| `world-atlas/land-110m.json` (npm) | Earth globes | Natural Earth 1:110m land via `world-atlas` | Natural Earth: public domain |
| `src/data/isroLaunches.json` | Scene 6 launch chart | Every ISRO orbital launch attempt, 1979–2025 (SLV-3, ASLV, PSLV, GSLV, LVM3, SSLV), compiled from ISRO's launch records (isro.gov.in, *List of launches* / *Launch Missions*) and checked against published flight-count milestones. Counted per decade in `ClosingScene.tsx` | Factual data |
| `img/paper-grain.png` | Paper texture | Procedural (`tools/make_textures.py`) | Original |

## Fonts (local, `public/fonts/`; all SIL Open Font License 1.1, from github.com/google/fonts)

Space Grotesk (headlines) · Inter (labels and body) · EB Garamond and EB Garamond Italic (serif
accents, IAST diacritics) · Tiro Devanagari Sanskrit (the Āryabhaṭīya verse).

## Audio

| File(s) | What | Source / terms |
|---|---|---|
| `audio/vo/s1a…s6b.wav` (+ `.mp3`, `vo-timing.json`) | Hinglish narration, 14 lines with word timings | **Synthetic voice**: Microsoft neural TTS `hi-IN-SwaraNeural`, generated with the open-source `edge-tts` client (`tools/generate_vo.py`), normalised by `tools/normalize_vo.py`. `edge-tts` uses Microsoft Edge's online read-aloud service, so check Microsoft's terms before public or commercial distribution. For a cleared voice, regenerate the same lines with Azure Speech (same voice name) or record a human narrator. The film credits list the narration as synthetic. |
| `audio/music/score.wav` | Original score (D, Yaman/Lydian colour, 120 BPM; tanpura drone, santoor-like ostinato, string pads, frame drum, bansuri resolution) | Composed procedurally, locked to `src/data/cues.json` (`tools/compose_score.py`). No third-party samples. |
| `audio/sfx/*.wav` | Swell, star-trace chime, observation ticks, clicks, sweeps, lunar impact, space swell, closing chimes | Synthesised by `tools/compose_score.py`. Original. |

## Considered, not used

- *Chandrayaan 3 landing video (53152466103).webm*: a Flickr re-upload of ISRO footage under a CC BY 2.0 claim by a third party. Not used because the licence chain is unclear.
- *Image of Chandrayaan-3 Lander captured by OHRC camera aboard Chandrayaan-2 Orbiter.webp* (ISRO, GODL-India): used only to verify the landing-site coordinates.
