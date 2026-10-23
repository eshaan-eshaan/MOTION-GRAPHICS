// A chart that draws itself: one smooth gradient line through real data points, drawn
// left to right with a glowing head, the area beneath filling behind it, each data point
// ticking in as the head passes, and a value chip landing on the last point.
import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, type Pt } from "../lib/geometry";
import { C, EASE, F, clamp } from "../theme";

/** Catmull-Rom spline through the points, as cubic Béziers. */
const smoothPath = (pts: Pt[]) => {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};

export const LineDraw: React.FC<{
  id: string;
  /** Data as [x, y] in data units. */
  data: [number, number][];
  xDomain: [number, number];
  yDomain: [number, number];
  /** Plot box in frame pixels. */
  box: { x: number; y: number; w: number; h: number };
  /** Local frame the axes start; the line follows. */
  at: number;
  /** Frames the line takes to draw. */
  draw?: number;
  xTicks: { v: number; label: string }[];
  yTicks?: number[];
  chip: string;
  /** Gradient stops along the line, left to right. */
  colors?: string[];
}> = ({ id, data, xDomain, yDomain, box, at, draw = 42, xTicks, yTicks = [], chip, colors = [C.navy, C.terracotta, C.gold] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sx = (v: number) => box.x + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * box.w;
  const sy = (v: number) => box.y + box.h - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * box.h;
  const pts: Pt[] = data.map(([x, y]) => [sx(x), sy(y)]);
  const path = smoothPath(pts);

  const axes = interpolate(frame, [at, at + 14], [0, 1], { ...clamp, easing: EASE.out });
  const start = at + 8;
  const p = interpolate(frame, [start, start + draw], [0, 1], { ...clamp, easing: EASE.inOut });
  // The head travels at constant x speed; points are evenly spaced in x, so x stands in
  // for arc length closely enough to place the head on the curve.
  const headX = lerp(pts[0][0], pts[pts.length - 1][0], p);
  const seg = Math.min(pts.length - 2, Math.max(0, pts.findIndex((q) => q[0] >= headX) - 1));
  const segT = (headX - pts[seg][0]) / (pts[seg + 1][0] - pts[seg][0] || 1);
  const head: Pt = [headX, lerp(pts[seg][1], pts[seg + 1][1], Math.min(1, Math.max(0, segT)))];
  const done = start + draw;
  const chipIn = spring({ frame: frame - done, fps, config: { damping: 18, stiffness: 160, mass: 0.7 } });
  const last = pts[pts.length - 1];
  const base = box.y + box.h;

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-stroke`} gradientUnits="userSpaceOnUse" x1={box.x} y1={0} x2={box.x + box.w} y2={0}>
          {colors.map((c, i) => (
            <stop key={i} offset={i / (colors.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-fill`} gradientUnits="userSpaceOnUse" x1={0} y1={box.y} x2={0} y2={base}>
          <stop offset={0} stopColor={C.gold} stopOpacity={0.32} />
          <stop offset={1} stopColor={C.gold} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset={0} stopColor={C.goldSoft} stopOpacity={0.75} />
          <stop offset={1} stopColor={C.goldSoft} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <rect x={box.x - 10} y={box.y - 40} width={headX - box.x + 10} height={box.h + 50} />
        </clipPath>
      </defs>

      {/* axes and grid */}
      <g opacity={axes}>
        {yTicks.map((v) => (
          <line key={v} x1={box.x} x2={box.x + box.w * axes} y1={sy(v)} y2={sy(v)} stroke={C.hairline} strokeDasharray="4 7" />
        ))}
        <line x1={box.x} x2={box.x + box.w * axes} y1={base} y2={base} stroke={C.ink} strokeOpacity={0.5} strokeWidth={1.2} />
        {xTicks.map(({ v, label }) => (
          <g key={v}>
            <line x1={sx(v)} x2={sx(v)} y1={base} y2={base + 8} stroke={C.ink} strokeOpacity={0.5} />
            <text x={sx(v)} y={base + 30} textAnchor="middle" fontFamily={F.body} fontWeight={600} fontSize={16} letterSpacing="0.08em" fill={C.inkSoft}>
              {label}
            </text>
          </g>
        ))}
      </g>

      {/* area, line, data points (all revealed up to the head) */}
      <g clipPath={`url(#${id}-clip)`}>
        <path d={`${path}L${last[0]},${base}L${pts[0][0]},${base}Z`} fill={`url(#${id}-fill)`} />
        <path d={path} fill="none" stroke={`url(#${id}-stroke)`} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.slice(1).map((q, i) => (
          <circle key={i} cx={q[0]} cy={q[1]} r={2.6} fill={C.ivory} stroke={C.navy} strokeWidth={1.2} />
        ))}
      </g>

      {/* glowing head */}
      {p > 0 ? (
        <g>
          <circle cx={head[0]} cy={head[1]} r={26} fill={`url(#${id}-glow)`} />
          <circle cx={head[0]} cy={head[1]} r={7} fill={C.ivory} stroke={C.gold} strokeWidth={3.5} />
        </g>
      ) : null}

      {/* value chip on the last point */}
      {frame >= done ? (
        <g transform={`translate(${last[0]} ${last[1] - 30}) scale(${chipIn})`} opacity={Math.min(1, chipIn * 2)}>
          <rect x={-74} y={-48} width={148} height={46} rx={10} fill={C.navy} />
          <text x={0} y={-17} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={24} fill={C.ivory}>
            {chip}
          </text>
        </g>
      ) : null}
    </svg>
  );
};
