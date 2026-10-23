// The opening sky: real stars around the north celestial pole. As the sky turns (the
// Earth's rotation, time-lapsed), Capella traces its diurnal circle; that arc then
// becomes the first line of a celestial diagram.
import React, { useMemo } from "react";
import { C } from "../theme";
import { DEG, seeded, toPath, type Pt } from "../lib/geometry";
import {
  HR,
  POLAR_K,
  POLAR_STARS,
  POLE,
  findStar,
  polarProject,
  starSize,
} from "../lib/sky";

export type ChartMode = "night" | "paper";

type Props = {
  mode: ChartMode;
  /** Local sidereal time in degrees — drives the sky's rotation. */
  lst: number;
  /** LST at which Capella's trail starts. */
  traceFrom: number;
  /** 0..1 visibility of the trail. */
  trace: number;
  /** Draw-on progress of the diagram layers. */
  rings: number;
  hours: number;
  ticks: number;
  starOpacity?: number;
  headGlow?: number;
};

const CAPELLA = findStar(POLAR_STARS, HR.capella);
export const CAPELLA_RADIUS = (90 - CAPELLA.dec) * POLAR_K;
const RING_DECS = [75, 60, 30, 15];

const twinkle = (() => {
  const rnd = seeded(91);
  return POLAR_STARS.map(() => ({ phase: rnd() * Math.PI * 2, speed: 0.05 + rnd() * 0.09, tint: rnd() }));
})();

export const PolarChart: React.FC<Props & { frame: number }> = ({
  mode,
  lst,
  traceFrom,
  trace,
  rings,
  hours,
  ticks,
  starOpacity = 1,
  headGlow = 1,
  frame,
}) => {
  const night = mode === "night";
  const line = night ? "rgba(245,235,221,0.32)" : C.hairline;
  const lineStrong = night ? "rgba(245,235,221,0.55)" : "rgba(23,50,77,0.5)";
  const traceColor = C.gold;

  const trail = useMemo(() => {
    const pts: Pt[] = [];
    const steps = 140;
    for (let i = 0; i <= steps; i++) {
      pts.push(polarProject(CAPELLA, traceFrom + ((lst - traceFrom) * i) / steps));
    }
    return pts;
  }, [lst, traceFrom]);
  const head = polarProject(CAPELLA, lst);

  const outerR = (90 - 15) * POLAR_K;
  const hourLines = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id="capellaGlow">
          <stop offset="0%" stopColor="#FFF4DC" stopOpacity={1} />
          <stop offset="35%" stopColor={C.goldSoft} stopOpacity={0.55} />
          <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="trailFade" gradientUnits="userSpaceOnUse" x1={trail[0][0]} y1={trail[0][1]} x2={head[0]} y2={head[1]}>
          <stop offset="0%" stopColor={traceColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={traceColor} stopOpacity={1} />
        </linearGradient>
      </defs>

      {/* declination rings */}
      {RING_DECS.map((d, i) => (
        <circle
          key={d}
          cx={POLE[0]}
          cy={POLE[1]}
          r={(90 - d) * POLAR_K}
          fill="none"
          stroke={i === 3 ? lineStrong : line}
          strokeWidth={i === 3 ? 1.4 : 1}
          pathLength={1}
          strokeDasharray={`${Math.max(0, Math.min(1, rings * 1.25 - i * 0.08))} 1`}
          transform={`rotate(${-90 + i * 30} ${POLE[0]} ${POLE[1]})`}
        />
      ))}
      {/* Capella's own circle, completing the trace into a full ring */}
      <circle
        cx={POLE[0]}
        cy={POLE[1]}
        r={CAPELLA_RADIUS}
        fill="none"
        stroke={traceColor}
        strokeOpacity={night ? 0.45 : 0.6}
        strokeWidth={1.2}
        pathLength={1}
        strokeDasharray={`${rings} 1`}
        strokeDashoffset={rings}
        transform={`rotate(${-((lst - CAPELLA.ra) % 360) - 90} ${POLE[0]} ${POLE[1]})`}
      />
      {/* hour circles */}
      {hourLines.map((deg, i) => {
        const p = Math.max(0, Math.min(1, hours * 1.4 - (i % 6) * 0.07));
        const a = (deg + lst) * DEG;
        const r0 = (90 - 80) * POLAR_K;
        const r1 = r0 + (outerR - r0) * p;
        return (
          <line
            key={deg}
            x1={POLE[0] - r0 * Math.sin(a)}
            y1={POLE[1] - r0 * Math.cos(a)}
            x2={POLE[0] - r1 * Math.sin(a)}
            y2={POLE[1] - r1 * Math.cos(a)}
            stroke={i % 6 === 0 ? lineStrong : line}
            strokeWidth={i % 6 === 0 ? 1.2 : 0.8}
            opacity={p > 0 ? 1 : 0}
          />
        );
      })}
      {/* graduated outer rim */}
      {Array.from({ length: 120 }, (_, i) => {
        const show = ticks * 120 > i;
        if (!show) return null;
        const a = (i * 3 + lst) * DEG;
        const long = i % 5 === 0;
        const r0 = outerR;
        const r1 = outerR + (long ? 16 : 8);
        return (
          <line
            key={i}
            x1={POLE[0] - r0 * Math.sin(a)}
            y1={POLE[1] - r0 * Math.cos(a)}
            x2={POLE[0] - r1 * Math.sin(a)}
            y2={POLE[1] - r1 * Math.cos(a)}
            stroke={lineStrong}
            strokeWidth={long ? 1.3 : 0.8}
          />
        );
      })}
      {/* pole mark */}
      <g opacity={rings} stroke={lineStrong} strokeWidth={1.2}>
        <line x1={POLE[0] - 10} y1={POLE[1]} x2={POLE[0] + 10} y2={POLE[1]} />
        <line x1={POLE[0]} y1={POLE[1] - 10} x2={POLE[0]} y2={POLE[1] + 10} />
      </g>

      {/* stars */}
      <g opacity={starOpacity}>
        {POLAR_STARS.map((s, i) => {
          if (s.hr === HR.capella) return null;
          const [x, y] = polarProject(s, lst);
          if (x < -20 || x > 1940 || y < -20 || y > 1100) return null;
          const tw = twinkle[i];
          const flick = night ? 0.82 + 0.18 * Math.sin(frame * tw.speed + tw.phase) : 1;
          const r = starSize(s.mag, night ? 1 : 0.95);
          const fill = night
            ? tw.tint > 0.8
              ? "#FFE7C4"
              : tw.tint < 0.15
                ? "#DCE9FF"
                : "#FFFFFF"
            : C.navy;
          return (
            <circle
              key={s.hr}
              cx={x}
              cy={y}
              r={r}
              fill={fill}
              opacity={(night ? 0.35 + 0.65 * Math.min(1, (5.2 - s.mag) / 3) : 0.85) * flick}
            />
          );
        })}
      </g>

      {/* Capella trail and head */}
      {trace > 0 ? (
        <g opacity={trace}>
          <path d={toPath(trail)} fill="none" stroke="url(#trailFade)" strokeWidth={2.6} strokeLinecap="round" />
          <circle cx={head[0]} cy={head[1]} r={26 * headGlow} fill="url(#capellaGlow)" opacity={night ? 1 : 0.6} />
          <circle cx={head[0]} cy={head[1]} r={3.6} fill={night ? "#FFF6E6" : C.gold} />
        </g>
      ) : null}
    </svg>
  );
};

export const capellaTrail = (traceFrom: number, lst: number, n = 140): Pt[] =>
  Array.from({ length: n }, (_, i) => polarProject(CAPELLA, traceFrom + ((lst - traceFrom) * i) / (n - 1)));
