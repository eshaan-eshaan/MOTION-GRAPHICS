// Title built from dots. The lines are drawn once with the display font on an offscreen
// canvas and sampled on a strict square grid, so every dot sits on a letterform. The dots
// spiral out of a centre point (the celestial pole) along the sky's turning direction and
// lock into the grid, left to right. They are uniform in size and colour and land on a
// grid, so they read as type, never as catalogue stars.
import type React from "react";
import { useEffect, useState } from "react";
import { continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import { DEG, lerp, seeded, type Pt } from "../lib/geometry";
import { C, EASE, F, clamp } from "../theme";

type Line = {
  text: string;
  /** Left edge and alphabetic baseline, in frame pixels. */
  x: number;
  baseline: number;
  /** Extra frames before this line starts. */
  delay?: number;
};

type Dot = {
  x: number;
  y: number;
  /** Polar position about the centre: final and start radius / angle (degrees). */
  r1: number;
  a1: number;
  r0: number;
  a0: number;
  delay: number;
};

const sample = (lines: Line[], size: number, pitch: number, centre: Pt, spread: number): Dot[] => {
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${size}px "${F.display}"`;
  ctx.letterSpacing = `${-0.01 * size}px`;
  ctx.textBaseline = "alphabetic";

  const rand = seeded(1729);
  const dots: Dot[] = [];
  lines.forEach((line) => {
    ctx.clearRect(0, 0, 1920, 1080);
    ctx.fillText(line.text, line.x, line.baseline);
    const width = Math.ceil(ctx.measureText(line.text).width);
    const top = Math.floor(line.baseline - size);
    const h = Math.ceil(size * 1.2);
    const data = ctx.getImageData(line.x, top, width, h).data;
    // Grid anchored to the frame, so both lines share one lattice.
    const gx0 = Math.ceil(line.x / pitch) * pitch;
    const gy0 = Math.ceil(top / pitch) * pitch;
    for (let gy = gy0; gy < top + h; gy += pitch) {
      for (let gx = gx0; gx < line.x + width; gx += pitch) {
        // Coverage of the cell centred on the grid point.
        let sum = 0;
        let n = 0;
        for (let dy = -pitch / 2 + 1; dy < pitch / 2; dy += 2) {
          for (let dx = -pitch / 2 + 1; dx < pitch / 2; dx += 2) {
            const px = Math.round(gx + dx - line.x);
            const py = Math.round(gy + dy - top);
            if (px < 0 || py < 0 || px >= width || py >= h) continue;
            sum += data[(py * width + px) * 4 + 3];
            n++;
          }
        }
        if (n === 0 || sum / n < 128) continue;
        const vx = gx - centre[0];
        const vy = centre[1] - gy;
        const r1 = Math.hypot(vx, vy);
        const a1 = Math.atan2(vy, vx) / DEG;
        dots.push({
          x: gx,
          y: gy,
          r1,
          a1,
          r0: r1 * (0.12 + 0.5 * rand()),
          a0: a1 - (24 + 22 * rand()),
          delay: ((gx - line.x) / width) * spread + (line.delay ?? 0) + rand() * 6,
        });
      }
    }
  });
  return dots;
};

export const PixelTitle: React.FC<{
  lines: Line[];
  /** Local frame the first dots leave the centre. */
  at: number;
  size: number;
  centre: Pt;
  pitch?: number;
  radius?: number;
  /** Flight time of one dot, in frames. */
  flight?: number;
  /** Frames between the first and last column leaving. */
  spread?: number;
  color?: string;
}> = ({ lines, at, size, centre, pitch = 7, radius = 2.3, flight = 30, spread = 14, color = C.ivory }) => {
  const frame = useCurrentFrame();
  const [dots, setDots] = useState<Dot[] | null>(null);
  const [handle] = useState(() => delayRender("Sampling the pixel title"));

  useEffect(() => {
    document.fonts
      .load(`700 ${size}px "${F.display}"`)
      .then(() => {
        setDots(sample(lines, size, pitch, centre, spread));
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
    // Sampled once per mount: inputs are constants for a given composition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!dots) return null;

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {dots.map((d, i) => {
        const p = interpolate(frame, [at + d.delay, at + d.delay + flight], [0, 1], { ...clamp, easing: EASE.out });
        if (p <= 0) return null;
        const r = lerp(d.r0, d.r1, p);
        const a = lerp(d.a0, d.a1, p) * DEG;
        // A small flare as each dot locks into the grid.
        const flare = interpolate(p, [0.9, 0.97, 1], [0, 1, 0], clamp);
        return (
          <circle
            key={i}
            cx={centre[0] + r * Math.cos(a)}
            cy={centre[1] - r * Math.sin(a)}
            r={radius * lerp(0.4, 1, p) * (1 + 0.25 * flare)}
            fill={color}
            opacity={interpolate(p, [0, 0.3], [0, 1], clamp)}
          />
        );
      })}
    </svg>
  );
};
