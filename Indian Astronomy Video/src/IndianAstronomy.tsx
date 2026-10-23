// Root film: six scenes joined by match-cut dissolves (each cut is designed so the shared
// geometry lines up), plus the full audio mix on the global timeline.
import type React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { AudioMix } from "./audio/AudioMix";
import { iris } from "./components/SceneTransition";
import { POLE } from "./lib/sky";
import { AryabhataScene } from "./scenes/AryabhataScene";
import { ChandrayaanScene } from "./scenes/ChandrayaanScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { JantarMantarScene } from "./scenes/JantarMantarScene";
import { ObservationScene } from "./scenes/ObservationScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { C } from "./theme";
import { SCENES, TRANSITIONS } from "./timeline";

export const IndianAstronomy: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="1 · The Question" durationInFrames={SCENES.opening.durationInFrames} premountFor={fps}>
          <OpeningScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={iris({ x: POLE[0], y: POLE[1] })} timing={linearTiming({ durationInFrames: TRANSITIONS[0] })} />
        <TransitionSeries.Sequence name="2 · Observe" durationInFrames={SCENES.observation.durationInFrames} premountFor={fps}>
          <ObservationScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITIONS[1] })} />
        <TransitionSeries.Sequence name="3 · Calculate" durationInFrames={SCENES.aryabhata.durationInFrames} premountFor={fps}>
          <AryabhataScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITIONS[2] })} />
        <TransitionSeries.Sequence name="4 · Measure" durationInFrames={SCENES.jantarMantar.durationInFrames} premountFor={fps}>
          <JantarMantarScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITIONS[3] })} />
        <TransitionSeries.Sequence name="5 · Explore" durationInFrames={SCENES.chandrayaan.durationInFrames} premountFor={fps}>
          <ChandrayaanScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITIONS[4] })} />
        <TransitionSeries.Sequence name="6 · Reflect" durationInFrames={SCENES.closing.durationInFrames} premountFor={fps}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <AudioMix />
    </AbsoluteFill>
  );
};
