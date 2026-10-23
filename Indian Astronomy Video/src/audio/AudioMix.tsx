// Narration, score and sound effects on the film's global timeline. The score is ducked
// under every spoken line (from measured word timings), with the impact left open so the
// Chandrayaan-3 payoff lands before the narrator names it.
import type React from "react";
import { Audio } from "@remotion/media";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import { FPS, MUSIC, SCENES, VO_IDS, cue, voLine, type SceneId } from "../timeline";

const MUSIC_OPEN = 0.7; // score level with no narration
const MUSIC_UNDER = 0.25; // under speech (~-9 dB)
const VO_LEVEL = 0.78; // narration sits ~-16 LUFS with headroom for the sum
const SFX_LEVEL = 0.85;
const ATTACK = 0.25; // seconds the duck leads the voice
const RELEASE = 0.55;

const SPEECH = VO_IDS.map((id) => voLine(id)).map((l) => [l.speechStart, l.speechEnd] as const);

/** Smooth duck envelope from the narration's speech intervals (seconds). */
const musicGain = (t: number) => {
  let duck = 0;
  for (const [s, e] of SPEECH) {
    const d =
      t < s - ATTACK
        ? 0
        : t < s
          ? (t - (s - ATTACK)) / ATTACK
          : t <= e
            ? 1
            : t < e + RELEASE
              ? 1 - (t - e) / RELEASE
              : 0;
    duck = Math.max(duck, d);
  }
  // keep the lunar payoff open, and let the final chord ring out
  const payoff = interpolate(t, [MUSIC.impact - 0.3, MUSIC.impact, MUSIC.impact + 1.6, MUSIC.impact + 2.6], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const under = MUSIC_UNDER + (0.55 - MUSIC_UNDER) * payoff;
  const fadeIn = interpolate(t, [0, 1.2], [0.6, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (MUSIC_OPEN + (under - MUSIC_OPEN) * duck) * fadeIn;
};

const g = (scene: SceneId, localFrame: number) => SCENES[scene].from + localFrame;

type Sfx = { name: string; file: string; at: number; volume: number };

const SFX: Sfx[] = [
  { name: "Opening swell", file: "swell", at: 0, volume: 0.55 },
  { name: "Star trace", file: "trace", at: 20, volume: 0.5 },
  { name: "Sweep · night to paper", file: "sweep", at: Math.round(9.0 * FPS), volume: 0.5 },
  { name: "Observation ticks", file: "observe-ticks", at: Math.round(10.0 * FPS), volume: 0.32 },
  { name: "Sweep · calendar to circle", file: "sweep", at: Math.round(24.55 * FPS), volume: 0.42 },
  { name: "Click · jya", file: "click", at: g("aryabhata", 74), volume: 0.45 },
  { name: "Click · 23h", file: "click", at: g("aryabhata", cue("aryabhata", "s3b", 4) + 24), volume: 0.4 },
  { name: "Click · 56m", file: "click", at: g("aryabhata", cue("aryabhata", "s3b", 4) + 31), volume: 0.4 },
  { name: "Click · 4.1s", file: "click", at: g("aryabhata", cue("aryabhata", "s3b", 4) + 38), volume: 0.4 },
  { name: "Click · lunar eclipse", file: "click", at: g("aryabhata", cue("aryabhata", "s3b", 14) + 6), volume: 0.4 },
  { name: "Click · solar eclipse", file: "click", at: g("aryabhata", cue("aryabhata", "s3b", 14) + 72), volume: 0.4 },
  { name: "Sweep · line to gnomon", file: "sweep", at: Math.round(41.55 * FPS), volume: 0.42 },
  { name: "Click · measure", file: "click", at: g("jantarMantar", cue("jantarMantar", "s4a", 10) - 4), volume: 0.3 },
  { name: "Sweep · arc to Moon", file: "sweep", at: Math.round(56.05 * FPS), volume: 0.4 },
  { name: "Lunar impact", file: "impact", at: Math.round(MUSIC.impact * FPS), volume: 0.78 },
  { name: "Space swell", file: "space-swell", at: Math.round(MUSIC.impact * FPS), volume: 0.55 },
  { name: "Sweep · push to landing site", file: "sweep", at: g("chandrayaan", cue("chandrayaan", "s5b", 6) + 42), volume: 0.42 },
  { name: "Sweep · lunar horizon", file: "sweep", at: Math.round(83.0 * FPS), volume: 0.34 },
  { name: "Chime · observe", file: "chime-a", at: g("closing", cue("closing", "s6b", 8)), volume: 0.5 },
  { name: "Chime · calculate", file: "chime-b", at: g("closing", cue("closing", "s6b", 10)), volume: 0.5 },
  { name: "Chime · explore", file: "chime-c", at: g("closing", cue("closing", "s6b", 13)), volume: 0.55 },
];

export const AudioMix: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      <Audio
        name="Score"
        src={staticFile("audio/music/score.wav")}
        premountFor={fps}
        volume={(f) => musicGain(f / fps)}
      />
      {VO_IDS.map((id) => {
        const l = voLine(id);
        return (
          <Audio
            key={id}
            name={`VO ${id}`}
            src={staticFile(l.file)}
            from={l.from}
            durationInFrames={l.durationInFrames}
            premountFor={fps}
            volume={VO_LEVEL}
          />
        );
      })}
      {SFX.map((s) => (
        <Audio
          key={`${s.name}-${s.at}`}
          name={`SFX ${s.name}`}
          src={staticFile(`audio/sfx/${s.file}.wav`)}
          from={s.at}
          premountFor={fps}
          volume={s.volume * SFX_LEVEL}
        />
      ))}
    </>
  );
};
