// Tiny celestial glyphs drawn in the film's line style.
import type React from "react";
import { C } from "../theme";

export const SunGlyph: React.FC<{ x: number; y: number; r?: number; opacity?: number; color?: string }> = ({
  x,
  y,
  r = 13,
  opacity = 1,
  color = C.gold,
}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r} fill={color} />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return (
        <line
          key={i}
          x1={x + Math.cos(a) * (r + 5)}
          y1={y + Math.sin(a) * (r + 5)}
          x2={x + Math.cos(a) * (r + (i % 2 ? 9 : 13))}
          y2={y + Math.sin(a) * (r + (i % 2 ? 9 : 13))}
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      );
    })}
  </g>
);

/**
 * Moon with a phase. `elong` is the Sun–Moon elongation in degrees (0 new, 180 full);
 * `sunSide` is the screen direction (radians) the sunlight comes from.
 */
export const MoonGlyph: React.FC<{
  x: number;
  y: number;
  r?: number;
  elong: number;
  sunSide?: number;
  lit?: string;
  dark?: string;
  stroke?: string;
  opacity?: number;
}> = ({ x, y, r = 10, elong, sunSide = 0, lit = C.ivory, dark = C.navy, stroke = C.navy, opacity = 1 }) => {
  const k = Math.cos((elong * Math.PI) / 180); // terminator ellipse squash: 1 new, -1 full
  const rot = (sunSide * 180) / Math.PI;
  // lit half on the sun side, plus/minus the terminator ellipse
  const d = `M0,${-r} A${r},${r} 0 0 1 0,${r} A${Math.abs(k) * r},${r} 0 0 ${k > 0 ? 0 : 1} 0,${-r}Z`;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) rotate(${rot})`}>
      <circle r={r} fill={dark} />
      <path d={d} fill={lit} />
      <circle r={r} fill="none" stroke={stroke} strokeWidth={1.2} />
    </g>
  );
};
