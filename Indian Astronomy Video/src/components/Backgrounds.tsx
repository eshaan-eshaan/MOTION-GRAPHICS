import type React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { seeded } from "../lib/geometry";
import { C } from "../theme";

const FIELD = (() => {
  const rnd = seeded(2023);
  return Array.from({ length: 320 }, () => ({ x: rnd() * 1920, y: rnd() * 1080, r: 0.45 + rnd() ** 3 * 1.6, o: 0.25 + rnd() * 0.6 }));
})();

/** Warm editorial paper: ivory base, fibre grain, soft vignette. */
export const Paper: React.FC<{ opacity?: number; children?: React.ReactNode }> = ({
  opacity = 1,
  children,
}) => (
  <AbsoluteFill style={{ backgroundColor: C.ivory, opacity }}>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 95% at 50% 45%, rgba(255,250,240,0.55) 0%, rgba(245,235,221,0) 55%, rgba(176,140,98,0.16) 100%)",
      }}
    />
    <Img
      src={staticFile("img/paper-grain.png")}
      style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.42 }}
    />
    {children}
  </AbsoluteFill>
);

/** Deep night sky used only for the opening and the lunar climax. */
export const Night: React.FC<{ opacity?: number; stars?: number; children?: React.ReactNode }> = ({
  opacity = 1,
  stars = 0,
  children,
}) => (
  <AbsoluteFill
    style={{
      opacity,
      background: `radial-gradient(110% 90% at 62% 45%, ${C.nightLift} 0%, ${C.night} 62%, #04090F 100%)`,
    }}
  >
    {stars > 0 ? (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: stars }}>
        {FIELD.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#F4F1EA" opacity={s.o} />
        ))}
      </svg>
    ) : null}
    {children}
  </AbsoluteFill>
);
