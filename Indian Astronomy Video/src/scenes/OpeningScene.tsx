// Scene 1 — The Question. Night sky around the celestial pole; the sky turns, Capella
// traces its diurnal arc, the arc becomes a celestial diagram, and the title builds itself
// out of dots that spiral from the celestial pole, landing on the score's title hit.
import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Night } from "../components/Backgrounds";
import { PolarChart } from "../components/PolarChart";
import { PixelTitle } from "../components/PixelTitle";
import { POLE } from "../lib/sky";
import { C, EASE, F, clamp } from "../theme";
import { SCENES, cue } from "../timeline";

// Sidereal rotation shown in the opening (degrees of LST) — shared with the next scene,
// which picks the chart up exactly where this one leaves it.
export const OPENING_LST = { from: 79.17 - 105, to: 79.17 + 45 };
export const OPENING_CAMERA_END = 1.1;

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = SCENES.opening;

  const titleAt = cue("opening", "s1b", 4) + 4; // just after "aasmaan"
  // Dots leave the pole early enough that the first ones lock in on the 6.2 s title hit.
  const dotsAt = titleAt - 22;
  const lst = interpolate(frame, [22, titleAt - 4], [OPENING_LST.from, OPENING_LST.to], {
    ...clamp,
    easing: EASE.inOut,
  });
  const camera = interpolate(frame, [0, durationInFrames], [1, OPENING_CAMERA_END], {
    ...clamp,
    easing: EASE.soft,
  });
  const rings = interpolate(frame, [118, 205], [0, 1], { ...clamp, easing: EASE.inOut });
  const hours = interpolate(frame, [138, 222], [0, 1], { ...clamp, easing: EASE.out });
  const ticks = interpolate(frame, [160, 238], [0, 1], { ...clamp, easing: EASE.inOut });
  const titleOut = interpolate(frame, [durationInFrames - 42, durationInFrames - 22], [1, 0], clamp);

  return (
    <AbsoluteFill>
      <Night opacity={interpolate(frame, [0, 26], [0, 1], clamp)}>
        <AbsoluteFill
          style={{
            scale: camera,
            transformOrigin: `${POLE[0]}px ${POLE[1]}px`,
          }}
        >
          <PolarChart
            frame={frame}
            mode="night"
            lst={lst}
            traceFrom={OPENING_LST.from}
            trace={interpolate(frame, [20, 34], [0, 1], clamp)}
            rings={rings}
            hours={hours}
            ticks={ticks}
            headGlow={interpolate(frame, [20, 40, titleAt, titleAt + 40], [0.4, 1.15, 1, 0.75], clamp)}
          />
        </AbsoluteFill>
        {/* legibility wash behind the title */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(90deg, rgba(5,12,20,0.78) 0%, rgba(5,12,20,0.45) 38%, rgba(5,12,20,0) 62%)",
            opacity: interpolate(frame, [titleAt - 20, titleAt + 10], [0, 1], clamp) * titleOut,
          }}
        />
        <AbsoluteFill style={{ opacity: titleOut }}>
          <PixelTitle
            lines={[
              { text: "INDIAN", x: 140, baseline: 445 },
              { text: "ASTRONOMY", x: 140, baseline: 602, delay: 5 },
            ]}
            at={dotsAt}
            size={150}
            centre={POLE}
          />
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 140, top: 318, opacity: titleOut }}>
          {/* the two 150 px title lines are drawn by PixelTitle; this keeps the subtitle in place */}
          <div style={{ height: 318 }} />
          <div
            style={{
              display: "flex",
              gap: 34,
              marginTop: 30,
              marginLeft: 6,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 30,
              letterSpacing: "0.34em",
              color: C.goldSoft,
            }}
          >
            {["OBSERVE.", "CALCULATE.", "EXPLORE."].map((w, i) => {
              const at = titleAt + 26 + i * 9;
              return (
                <span
                  key={w}
                  style={{
                    opacity: interpolate(frame, [at, at + 12], [0, 1], clamp),
                    translate: `0px ${interpolate(frame, [at, at + 16], [14, 0], { ...clamp, easing: EASE.out })}px`,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        </div>
      </Night>
    </AbsoluteFill>
  );
};
