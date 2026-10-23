// A number that rolls up like an odometer. Each digit is a reel of 0–9 that spins to its
// final digit (lower digits spin more turns and land later), with motion blur that follows
// each reel's speed. It settles on the exact figure and stays there: a fixed fact does not
// keep ticking.
import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE, F, clamp } from "../theme";

export const NumberRoll: React.FC<{
  value: number;
  /** Local frame the reels start. */
  at: number;
  /** Frames until the last reel lands. */
  duration?: number;
  size: number;
  color: string;
  unit?: string;
  unitColor?: string;
}> = ({ value, at, duration = 40, size, color, unit, unitColor = color }) => {
  const frame = useCurrentFrame();
  const digits = Math.round(value).toLocaleString("en-US").split("");
  const numeric = digits.filter((c) => c !== ",").length;
  const h = size * 1.1;

  let k = 0;
  return (
    <div style={{ display: "flex", alignItems: "baseline", fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 1, color }}>
      {digits.map((ch, i) => {
        if (ch === ",") {
          return (
            <span key={i} style={{ opacity: interpolate(frame, [at, at + 8], [0, 1], clamp) }}>
              ,
            </span>
          );
        }
        // place 0 = leftmost digit; lower places spin more and land later
        const place = k++;
        const fromRight = numeric - 1 - place;
        const turns = 1 + fromRight;
        const end = at + duration * (0.55 + (0.45 * place) / Math.max(1, numeric - 1));
        const target = Number(ch) + 10 * turns;
        const pos = (f: number) => interpolate(f, [at, end], [0, target], { ...clamp, easing: EASE.out });
        const now = pos(frame);
        const speed = Math.abs(now - pos(frame - 1));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              height: h,
              overflow: "hidden",
              position: "relative",
              opacity: interpolate(frame, [at, at + 6], [0, 1], clamp),
              // odometer window: digits fade out toward the reel's top and bottom edges
              WebkitMaskImage: "linear-gradient(transparent 0%, #000 18%, #000 82%, transparent 100%)",
              maskImage: "linear-gradient(transparent 0%, #000 18%, #000 82%, transparent 100%)",
            }}
          >
            {/* the widest digit sets the reel width */}
            <span style={{ visibility: "hidden" }}>0</span>
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                translate: `0px ${-((now % 10) * h)}px`,
                filter: `blur(${Math.min(6, speed * 4.5).toFixed(2)}px)`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => (
                <span key={j} style={{ height: h, display: "flex", alignItems: "center", fontVariantNumeric: "tabular-nums" }}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      {unit ? (
        <span style={{ marginLeft: size * 0.18, fontSize: size * 0.42, fontWeight: 600, color: unitColor, opacity: interpolate(frame, [at + duration - 6, at + duration + 6], [0, 1], clamp) }}>
          {unit}
        </span>
      ) : null}
    </div>
  );
};
