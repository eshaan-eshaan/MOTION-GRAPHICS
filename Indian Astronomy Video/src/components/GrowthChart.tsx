// 3D bar chart for real counts. Bars are boxes in a small orthographic 3D scene: the camera
// drifts a few degrees in yaw and pitch so the depth reads, faces are back-face culled and
// painter-sorted, and each bar rises on a well-damped spring while its value counts up.
// Values are labelled directly on each bar; there is deliberately no back-wall grid, because
// in 3D a grid behind the bars reads higher than the bar tops and misstates the numbers.
import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, type Pt } from "../lib/geometry";
import { C, EASE, F, clamp } from "../theme";

export type GrowthDatum = {
  label: string;
  value: number;
};

type V3 = [number, number, number];

/** Mix two #rrggbb colours; returns #rrggbb so the result can be mixed again. */
const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(lerp(v, pb[i], t)).toString(16).padStart(2, "0")).join("")}`;
};

/** Shade a #rrggbb colour toward black (k < 1) or white (k > 1). */
const shade = (hex: string, k: number) =>
  k < 1 ? mixHex(hex, "#000000", 1 - k) : mixHex(hex, "#FFFFFF", k - 1);

export const GrowthChart: React.FC<{
  data: GrowthDatum[];
  /** Local frame the chart starts drawing. */
  at: number;
  /** Screen position of the floor's centre. */
  origin: Pt;
  /** Bar height = value / yMax * height. */
  yMax: number;
  /** Pixel height of yMax before pitch foreshortening. */
  height?: number;
  /** World-space distance between bar centres. */
  spacing?: number;
  /** Frames between successive bars starting to rise. */
  stagger?: number;
  /** Camera drift over the shot, in degrees. */
  yaw?: [number, number];
  pitch?: [number, number];
  drift?: number;
  /** Colour ramp from the first bar to the last. */
  ramp?: [string, string];
}> = ({
  data,
  at,
  origin,
  yMax,
  height = 340,
  spacing = 122,
  stagger = 7,
  yaw = [27, 18],
  pitch = [20, 15],
  drift = 170,
  ramp = ["#7A5E3A", C.goldSoft],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = interpolate(frame, [at, at + drift], [0, 1], { ...clamp, easing: EASE.soft });
  const ya = (lerp(yaw[0], yaw[1], cam) * Math.PI) / 180;
  const pa = (lerp(pitch[0], pitch[1], cam) * Math.PI) / 180;
  const [cy, sy, cp, sp] = [Math.cos(ya), Math.sin(ya), Math.cos(pa), Math.sin(pa)];

  // Orthographic camera at -z, looking +z, yawed then pitched down.
  const project = ([x, y, z]: V3): Pt => {
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    return [origin[0] + x1, origin[1] - (y * cp + z1 * sp)];
  };
  const depth = ([x, y, z]: V3) => (-x * sy + z * cy) * cp - y * sp;
  const facing = (n: V3) => depth(n) < 0;
  const poly = (pts: V3[]) => pts.map((p) => project(p).map((v) => v.toFixed(1)).join(",")).join(" ");

  const n = data.length;
  const w = spacing * 0.56;
  const xs = data.map((_, i) => (i - (n - 1) / 2) * spacing);
  const halfX = ((n - 1) / 2) * spacing + spacing * 0.5;
  const halfZ = w * 0.95;
  const toY = (v: number) => (v / yMax) * height;

  const floorIn = interpolate(frame, [at - 8, at + 16], [0, 1], { ...clamp, easing: EASE.out });
  const labelIn = (i: number) =>
    interpolate(frame, [at + i * stagger, at + i * stagger + 14], [0, 1], { ...clamp, easing: EASE.out });

  const rise = data.map((_, i) =>
    spring({ frame: frame - at - 6 - i * stagger, fps, config: { damping: 200, stiffness: 110, mass: 1 } }),
  );

  const ivory = (a: number) => `rgba(245,235,221,${a})`;

  // Bars, farthest first.
  const order = data.map((_, i) => i).sort((a, b) => depth([xs[b], 0, 0]) - depth([xs[a], 0, 0]));

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* floor plate */}
      <g opacity={floorIn}>
        <polygon
          points={poly([
            [-halfX * floorIn, 0, -halfZ],
            [halfX * floorIn, 0, -halfZ],
            [halfX * floorIn, 0, halfZ],
            [-halfX * floorIn, 0, halfZ],
          ])}
          fill={ivory(0.05)}
          stroke={ivory(0.42)}
          strokeWidth={1.2}
        />
        {xs.map((x, i) => (
          <polyline key={i} points={poly([[x, 0, -halfZ], [x, 0, -halfZ - 10]])} stroke={ivory(0.5)} strokeWidth={1.2} />
        ))}
      </g>


      {/* bars */}
      {order.map((i) => {
        const h = Math.max(0.01, toY(data[i].value) * rise[i]);
        const x0 = xs[i] - w / 2;
        const x1 = xs[i] + w / 2;
        const z0 = -w / 2;
        const z1 = w / 2;
        const base = mixHex(ramp[0], ramp[1], n === 1 ? 1 : i / (n - 1));
        const faces: { n: V3; pts: V3[]; fill: string }[] = [
          { n: [0, 0, -1], pts: [[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], fill: base },
          { n: [1, 0, 0], pts: [[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]], fill: shade(base, 0.62) },
          { n: [-1, 0, 0], pts: [[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1]], fill: shade(base, 0.62) },
          { n: [0, 1, 0], pts: [[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]], fill: shade(base, 1.35) },
        ];
        return (
          <g key={i} opacity={interpolate(rise[i], [0, 0.05], [0, 1], clamp)}>
            {faces
              .filter((f) => facing(f.n))
              .map((f, k) => (
                <polygon key={k} points={poly(f.pts)} fill={f.fill} stroke={ivory(0.55)} strokeWidth={0.9} strokeLinejoin="round" />
              ))}
          </g>
        );
      })}

      {/* value and category labels */}
      {data.map((d, i) => {
        const top = project([xs[i], toY(d.value) * rise[i], 0]);
        const foot = project([xs[i], 0, -halfZ]);
        return (
          <g key={i}>
            <text
              x={top[0]}
              y={top[1] - 22}
              textAnchor="middle"
              fontFamily={F.display}
              fontWeight={700}
              fontSize={36}
              fill={C.ivory}
              opacity={interpolate(rise[i], [0.04, 0.2], [0, 1], clamp)}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {Math.round(d.value * rise[i])}
            </text>
            <text
              x={foot[0]}
              y={foot[1] + 40}
              textAnchor="middle"
              fontFamily={F.body}
              fontWeight={600}
              fontSize={18}
              letterSpacing="0.12em"
              fill={ivory(0.78)}
              opacity={labelIn(i)}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
