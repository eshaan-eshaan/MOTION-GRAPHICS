# Indian Astronomy: From Ancient Skies to Lunar Exploration

A 105-second educational motion-design film for college students, built in React + Remotion.
It runs at 1920 × 1080, 30 fps, 3,150 frames, with Hinglish narration, an original score and sound design.

**OBSERVE → CALCULATE → MEASURE → EXPLORE → REFLECT.** *From observing the heavens to exploring them.*

**Rendered film:** [IndianAstronomy.mp4](IndianAstronomy.mp4) (105 s, 1920 × 1080, 30 fps, H.264 / AAC).

| # | Scene | Time | What happens |
|---|---|---|---|
| 1 | The Question | 0:00–0:09.5 | Real stars round the celestial pole; the sky turns and Capella traces its diurnal circle; the arc becomes a polar chart; the title lands |
| 2 | Observe | 0:09.5–0:25 | Iris-inversion into an ivory sky chart (real BSC5 stars); the arc becomes the ecliptic; nakshatras connect; the Sun's and Moon's paths; the ecliptic wraps into a 12-month / 30-tithi / 6-ṛtu calendar |
| 3 | Calculate | 0:25–0:42 | Jyā (half-chord) construction; Āryabhaṭa, with a labelled artistic statue and Golapāda verse 9; the Earth rotates against fixed stars (23ʰ 56ᵐ 4.1ˢ); a tangent-exact lunar and solar eclipse diagram |
| 4 | Measure | 0:42–0:56.5 | The eclipse tangent swings onto the Samrat Yantra's gnomon edge (measured in the photo); lateral move; then the graduated quadrant, whose fitted arc closes into a circle |
| 5 | Explore | 0:56.5–1:23.5 | The circle becomes an ink Moon drawn from NASA LRO data, which becomes a lit globe; impact; CHANDRAYAAN-3 · 23 AUGUST 2023; landing site 69.37° S; push into ISRO's LPDC approach footage; Vikram and Pragyan in ISRO imagery; hold on Vikram |
| 6 | Reflect | 1:23.5–1:45 | Earth (India facing) above the lunar horizon; schematic in which the opening's chart rings align with Chandrayaan-3's route; night inverts to paper; end card |

## Run it

```bash
npm i
```

```bash
npx remotion studio
```

The composition is **IndianAstronomy**. Each scene is also registered under *Scenes/* for preview on its own.

### Render the MP4

```bash
npm run render
```

That writes `out/IndianAstronomy.mp4` (H.264 CRF 16, AAC 320 kbps).

**Rendering on Windows from a deeply nested folder.** Remotion's bundled headless Chrome sits under
`node_modules/.remotion/…`. If the project path is long, that path can exceed Windows' 260-character limit
and fail with `spawn … chrome-headless-shell.exe ENOENT`. `remotion.config.ts` therefore uses a copy at
`%LOCALAPPDATA%\remotion-chs\chrome-headless-shell.exe` when one exists. To create it, copy the contents of
`node_modules\.remotion\chrome-headless-shell\win64\chrome-headless-shell-win64\` there (after
`npx remotion browser ensure`). In a short project path none of this is needed.

### QA stills

```bash
node tools/stills.mjs IndianAstronomy 300 900 1500 1900 2300 3000
```

## How it fits together

- `src/data/cues.json` is the single source of truth for timing: scene cuts, transition lengths, narration start times and musical hit points. It is read by both the React code (`src/timeline.ts`) and the score generator (`tools/compose_score.py`), so picture, voice, music and SFX cannot drift apart.
- `public/audio/vo/vo-timing.json` holds measured word boundaries for every narration line. Visual reveals are keyed to spoken words with `cue(scene, line, wordIndex)`.
- `src/scenes/handoffs.ts` holds the geometry shared across each match cut: the calendar circle, the gnomon edge (fitted in the photo), the quadrant arc (fitted in the photo) and the Moon outline.
- `src/IndianAstronomy.tsx` is the root: a `TransitionSeries` of six scenes (an iris from the celestial pole, then match-cut dissolves) plus `src/audio/AudioMix.tsx`. The mix ducks the score under every spoken line and leaves the Chandrayaan-3 impact open.
- Components: `PolarChart` (real-sky polar projection), `MoonGlobe` (per-pixel canvas sphere from the LRO map, with an ink mode on the same projection), `MoonOverlay` (d3 graticule, south polar region, landing site), `EarthGlobe` (d3 orthographic, Natural Earth), `Type` (kinetic title, eyebrow, source captions, tags), `SceneTransition` (iris).

## Regenerating assets (Python 3.12, with numpy, scipy, pillow, soundfile, pyloudnorm, edge-tts)

```bash
npm run audio
```

This regenerates the narration (TTS), loudness-normalises it, and composes the score and SFX.

```bash
npm run textures
```

This rebuilds the resized photos, the paper grain, the ink Moon map and the star subsets.

Source downloads and licences are listed in [docs/ASSET_MANIFEST.md](docs/ASSET_MANIFEST.md). The full narration script with timings is in [docs/NARRATION_SCRIPT.md](docs/NARRATION_SCRIPT.md).

## QA summary (export of 23 Oct 2026)

**Checked**

- **Export.** [`IndianAstronomy.mp4`](IndianAstronomy.mp4) (new renders go to `out/`): 105.003 s, 3,150 frames, 1920 × 1080, 30 fps, H.264 at about 6 Mb/s, AAC 48 kHz stereo at 317 kb/s, 82.7 MB.
- **Audio.** −16.1 LUFS integrated, true peak about −1.1 dBTP, no clipping. Narration sits about 11 dB above the ducked score. The score opens up only around the 01:02 impact and the final chord.
- **Narration.** All 14 lines were transcribed with Whisper (small) and compared with the script (`tools/transcribe_vo.py`). Every line matches. Two checked in isolation: the opening "Centuries baad" of s4a is spoken, and the date in s5b is read "तेईस अगस्त दो हज़ार तेईस".
- **Picture.** Frames were extracted from the exported file across all six scenes and at every cut. The match cuts line up (pole iris, calendar circle, gnomon edge, quadrant arc → Moon), nothing important is clipped, and every authentic image carries a source caption.
- **Accuracy.**
  - Landing is shown as near the south polar region (69.37° S), not at the pole.
  - Vikram and Pragyan are separately labelled from ISRO imagery.
  - The Āryabhaṭa statue is labelled as an artistic representation.
  - Jantar Mantar is dated to the early 18th century.
  - Eclipse lines are true tangents, and diagrams carry "not to scale" labels.
  - No authentic image is composited, and no mission interface or telemetry is invented.

**Limitations**

- **Narration voice.** It is synthetic (Microsoft neural TTS via `edge-tts`), not a human recording, and the credits say so. Check Microsoft's terms before public or commercial release, or re-voice (see docs/NARRATION_SCRIPT.md).
- **Music and SFX.** Both are synthesised in code and were checked by measurement and spectrogram, not by a human listen. Give the mix a listen on good headphones before release.
- **LPDC footage.** The source is 1080 px tall, and the shot upscales a crop of it, so it is slightly soft.
- **Quadrant photo.** It is CC BY-SA 4.0. See the manifest if ShareAlike terms are a problem.
- **Console notice.** Rendering logs an empty React console notice from `react-dom` in each tab. Frames are unaffected.
