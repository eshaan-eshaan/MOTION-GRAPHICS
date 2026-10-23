// Scene 2 — Observe. The night chart inverts into an ivory sky chart; Capella's arc
// becomes the ecliptic through Taurus and Orion; the nakshatra patterns connect; the Sun's
// and Moon's paths are drawn; then the ecliptic wraps into a circular calendar.
import type React from "react";
import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Paper } from "../components/Backgrounds";
import { MoonGlyph, SunGlyph } from "../components/Icons";
import { PolarChart, capellaTrail } from "../components/PolarChart";
import { Eyebrow, KineticTitle, Tag } from "../components/Type";
import { DEG, arcPoints, morph, polar, resample, toPath, type Pt } from "../lib/geometry";
import {
  HR,
  POLE,
  TAURUS_STARS,
  findStar,
  moonPathPoint,
  starSize,
  sunPathPoint,
  taurusProject,
} from "../lib/sky";
import { C, EASE, F, clamp } from "../theme";
import { SCENES, cue } from "../timeline";
import { OPENING_CAMERA_END, OPENING_LST } from "./OpeningScene";
import { CAL, CAL_HANDOFF_R } from "./handoffs";

const N = 160;
const ECLIPTIC = resample(
  Array.from({ length: 200 }, (_, i) => sunPathPoint(48 + (48 * i) / 199)),
  N,
);
const MOON_PATH = Array.from({ length: 200 }, (_, i) => moonPathPoint(48 + (48 * i) / 199));

const ASTERISMS: number[][] = [
  // Orion (Mṛgaśīrṣā / Ārdrā region)
  [HR.betelgeuse, HR.meissa, HR.bellatrix],
  [HR.betelgeuse, HR.alnitak, HR.alnilam, HR.mintaka, HR.bellatrix],
  [HR.alnitak, HR.saiph],
  [HR.mintaka, HR.rigel],
  // Hyades V with Aldebaran (Rohiṇī)
  [HR.epsilonTau, HR.delta1Tau, HR.gammaTau, HR.theta2Tau, HR.aldebaran],
  [HR.aldebaran, HR.zetaTau],
  [HR.epsilonTau, HR.elnath],
  // Pleiades (Kṛttikā)
  [HR.atlas, HR.alcyone, HR.merope, HR.electra, HR.taygeta, HR.maia, HR.alcyone],
];

const RTUS = ["VASANTA", "GRĪṢMA", "VARṢĀ", "ŚARAD", "HEMANTA", "ŚIŚIRA"];

const starPt = (hr: number): Pt => {
  const s = findStar(TAURUS_STARS, hr);
  return taurusProject(s.ra, s.dec);
};

const annulus = (r0: number, r1: number, a0: number, a1: number) => {
  const [x0, y0] = polar(CAL[0], CAL[1], r1, a0);
  const [x1, y1] = polar(CAL[0], CAL[1], r1, a1);
  const [x2, y2] = polar(CAL[0], CAL[1], r0, a1);
  const [x3, y3] = polar(CAL[0], CAL[1], r0, a0);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0},${y0}A${r1},${r1} 0 ${large} 0 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${large} 1 ${x3},${y3}Z`;
};

export const ObservationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = SCENES.observation;

  const t = {
    sun: cue("observation", "s2a", 4),
    moon: cue("observation", "s2a", 5),
    stars: cue("observation", "s2a", 7),
    patterns: cue("observation", "s2a", 9),
    calendars: cue("observation", "s2b", 3),
    seasons: cue("observation", "s2b", 5),
    cycles: cue("observation", "s2b", 12),
    predict: cue("observation", "s2b", 15),
  };
  const tighten = durationInFrames - 46;

  // --- hand-off from the opening: identical chart, now ink on paper
  const handoff = interpolate(frame, [12, 62], [0, 1], { ...clamp, easing: EASE.inOut });
  const camera = interpolate(handoff, [0, 1], [OPENING_CAMERA_END, 1]);
  const trail = useMemo(
    () =>
      resample(capellaTrail(OPENING_LST.from, OPENING_LST.to), N).map(
        ([x, y]) => [POLE[0] + (x - POLE[0]) * OPENING_CAMERA_END, POLE[1] + (y - POLE[1]) * OPENING_CAMERA_END] as Pt,
      ),
    [],
  );

  // --- ecliptic → calendar ring
  const toRing = interpolate(frame, [t.calendars - 8, t.calendars + 34], [0, 1], { ...clamp, easing: EASE.inOut });
  const ring = useMemo(() => resample(arcPoints(CAL[0], CAL[1], 330, 200, -160, 200), N), []);
  const eclipticNow = toRing > 0 ? morph(ECLIPTIC, ring, toRing) : morph(trail, ECLIPTIC, handoff);

  const chartOut = interpolate(frame, [t.calendars - 14, t.calendars + 10], [1, 0], clamp);
  const gridIn = interpolate(frame, [34, 96], [0, 1], { ...clamp, easing: EASE.out });
  const starsIn = (i: number) => interpolate(frame, [44 + (i % 40), 64 + (i % 40)], [0, 1], clamp);
  const lines = interpolate(frame, [t.stars, t.patterns + 22], [0, 1], { ...clamp, easing: EASE.inOut });

  const sunLambda = interpolate(frame, [t.sun, t.calendars], [57, 66], clamp);
  const moonLambda = interpolate(frame, [t.moon, t.calendars], [50, 95], clamp);
  const moonPathDraw = interpolate(frame, [t.moon - 4, t.moon + 30], [0, 1], { ...clamp, easing: EASE.out });

  // --- calendar
  const tightenP = interpolate(frame, [tighten, tighten + 34], [0, 1], { ...clamp, easing: EASE.inOut });
  const calOpacity = 1 - tightenP;
  const seg = (i: number, total: number, start: number) =>
    interpolate(frame, [start + i * 2.2, start + i * 2.2 + 16], [0, 1], { ...clamp, easing: EASE.out });
  const sunAngle = 90 - interpolate(frame, [t.calendars + 30, durationInFrames], [0, 40], clamp);
  const moonAngle = 90 - interpolate(frame, [t.calendars + 30, durationInFrames], [0, 40 * 12.37], clamp);
  const elong = ((sunAngle - moonAngle) % 360 + 360) % 360;
  const handR = interpolate(tightenP, [0, 1], [330, CAL_HANDOFF_R]);
  const predictP = interpolate(frame, [t.predict - 6, t.predict + 22], [0, 1], { ...clamp, easing: EASE.out });

  const leftOut = interpolate(frame, [tighten - 6, tighten + 14], [1, 0], clamp);

  return (
    <AbsoluteFill>
      <Paper>
        {/* polar chart carried over from the opening, dissolving away */}
        <AbsoluteFill
          style={{
            scale: camera,
            transformOrigin: `${POLE[0]}px ${POLE[1]}px`,
            opacity: interpolate(frame, [16, 54], [1, 0], clamp),
          }}
        >
          <PolarChart
            frame={frame}
            mode="paper"
            lst={OPENING_LST.to}
            traceFrom={OPENING_LST.from}
            trace={0}
            rings={1}
            hours={1}
            ticks={1}
          />
        </AbsoluteFill>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* sky-chart grid */}
          <g opacity={gridIn * chartOut}>
            {[45, 60, 75, 90].map((ra) => {
              const [x] = taurusProject(ra, 0);
              return (
                <g key={ra}>
                  <line x1={x} y1={110} x2={x} y2={110 + 880 * gridIn} stroke={C.hairline} strokeWidth={1} />
                  <text x={x + 8} y={134} fontFamily={F.body} fontSize={17} fill={C.inkSoft} letterSpacing="0.08em">
                    {`${ra / 15}h`}
                  </text>
                </g>
              );
            })}
            {[-10, 0, 10, 20, 30].map((dec) => {
              const [, y] = taurusProject(72.5, dec);
              return (
                <g key={dec}>
                  <line x1={1810 - 1010 * gridIn} y1={y} x2={1810} y2={y} stroke={C.hairline} strokeWidth={dec === 0 ? 1.4 : 1} />
                  <text x={1818} y={y + 6} fontFamily={F.body} fontSize={17} fill={C.inkSoft}>
                    {`${dec > 0 ? "+" : dec < 0 ? "−" : ""}${Math.abs(dec)}°`}
                  </text>
                </g>
              );
            })}
          </g>

          {/* stars */}
          <g opacity={chartOut}>
            {TAURUS_STARS.map((s, i) => {
              const [x, y] = taurusProject(s.ra, s.dec);
              if (x < 790 || x > 1810 || y < 112 || y > 990) return null;
              return <circle key={s.hr} cx={x} cy={y} r={Math.max(1.1, starSize(s.mag, 1.55))} fill={C.navy} opacity={starsIn(i) * 0.92} />;
            })}
            {ASTERISMS.map((chain, k) => (
              <path
                key={k}
                d={toPath(chain.map(starPt))}
                fill="none"
                stroke={C.navy}
                strokeOpacity={0.55}
                strokeWidth={1.3}
                pathLength={1}
                strokeDasharray={`${Math.max(0, Math.min(1, lines * 1.6 - k * 0.08))} 1`}
              />
            ))}
          </g>

          {/* Moon's path, tilted ~5° to the ecliptic */}
          <g opacity={chartOut}>
            <path
              d={toPath(MOON_PATH)}
              fill="none"
              stroke={C.spaceBlue}
              strokeWidth={2}
              strokeDasharray="7 7"
              opacity={frame > t.moon - 4 ? 1 : 0}
              style={{ clipPath: `inset(0 0 0 ${(1 - moonPathDraw) * 100}%)` }}
            />
            {frame > t.moon ? (
              <g opacity={interpolate(frame, [t.moon, t.moon + 10], [0, 1], clamp)}>
                {(() => {
                  const node = sunPathPoint(85);
                  return (
                    <circle cx={node[0]} cy={node[1]} r={9} fill="none" stroke={C.terracotta} strokeWidth={1.6} />
                  );
                })()}
              </g>
            ) : null}
          </g>

          {/* the ecliptic: morphs from Capella's arc, later wraps into the calendar ring */}
          <path
            d={toPath(eclipticNow)}
            fill="none"
            stroke={C.gold}
            strokeWidth={interpolate(toRing, [0, 1], [2.6, 2])}
            strokeLinecap="round"
            opacity={1 - tightenP}
          />

          {/* Sun and Moon moving along their paths */}
          {frame > t.sun - 2 ? (
            <SunGlyph
              x={sunPathPoint(sunLambda)[0]}
              y={sunPathPoint(sunLambda)[1]}
              opacity={interpolate(frame, [t.sun, t.sun + 10], [0, 1], clamp) * chartOut}
            />
          ) : null}
          {frame > t.moon - 2 ? (
            <MoonGlyph
              x={moonPathPoint(moonLambda)[0]}
              y={moonPathPoint(moonLambda)[1]}
              r={10}
              elong={Math.abs(moonLambda - sunLambda)}
              sunSide={moonLambda > sunLambda ? 0 : Math.PI}
              lit={C.ivory}
              dark={C.spaceBlue}
              stroke={C.spaceBlue}
              opacity={interpolate(frame, [t.moon, t.moon + 10], [0, 1], clamp) * chartOut}
            />
          ) : null}

          {/* ---------------- circular calendar ---------------- */}
          <g opacity={calOpacity}>
            {/* 12 solar months */}
            {Array.from({ length: 12 }, (_, i) => {
              const p = seg(i, 12, t.calendars + 8);
              if (p <= 0) return null;
              const a0 = 90 - i * 30 + 1.2;
              const a1 = a0 - 30 + 2.4;
              return (
                <path
                  key={i}
                  d={annulus(300, 360, a1, a0)}
                  fill={i % 2 ? "rgba(197,139,54,0.14)" : "rgba(23,50,77,0.05)"}
                  stroke={C.hairline}
                  strokeWidth={1}
                  opacity={p}
                  transform={`rotate(${(1 - p) * -14} ${CAL[0]} ${CAL[1]}) translate(${CAL[0] * (1 - (0.9 + 0.1 * p))} ${CAL[1] * (1 - (0.9 + 0.1 * p))}) scale(${0.9 + 0.1 * p})`}
                />
              );
            })}
            {/* 30 tithis */}
            {Array.from({ length: 30 }, (_, i) => {
              const p = seg(i, 30, t.calendars + 18);
              const a = 90 - i * 12;
              const [x0, y0] = polar(CAL[0], CAL[1], 268, a);
              const [x1, y1] = polar(CAL[0], CAL[1], i % 5 === 0 ? 288 : 280, a);
              return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={C.navy} strokeOpacity={0.6 * p} strokeWidth={i % 5 === 0 ? 1.6 : 1} />;
            })}
            <circle cx={CAL[0]} cy={CAL[1]} r={268} fill="none" stroke={C.hairline} opacity={seg(0, 1, t.calendars + 18)} />
            {/* six seasons */}
            {RTUS.map((name, i) => {
              const p = seg(i, 6, t.seasons);
              if (p <= 0) return null;
              const a0 = 90 - i * 60 - 1.5;
              const a1 = a0 - 57;
              const [lx, ly] = polar(CAL[0], CAL[1], 416, (a0 + a1) / 2);
              return (
                <g key={name} opacity={p}>
                  <path d={annulus(372, 384, a1, a0)} fill={i % 2 ? C.terracotta : C.gold} opacity={0.75} />
                  <text
                    x={lx}
                    y={ly + 6}
                    textAnchor="middle"
                    fontFamily={F.body}
                    fontWeight={600}
                    fontSize={17}
                    letterSpacing="0.2em"
                    fill={C.navy}
                    opacity={0.78}
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Sun on the year ring, Moon on the month ring: two cycles, one calendar */}
          {frame > t.calendars + 24 ? (
            <g opacity={interpolate(frame, [t.calendars + 24, t.calendars + 36], [0, 1], clamp) * calOpacity}>
              <SunGlyph x={polar(CAL[0], CAL[1], 330, sunAngle)[0]} y={polar(CAL[0], CAL[1], 330, sunAngle)[1]} r={11} />
              <MoonGlyph
                x={polar(CAL[0], CAL[1], 278, moonAngle)[0]}
                y={polar(CAL[0], CAL[1], 278, moonAngle)[1]}
                r={10}
                elong={elong}
                sunSide={-(sunAngle * DEG)}
                lit={C.ivory}
                dark={C.spaceBlue}
                stroke={C.spaceBlue}
              />
              {/* prediction: the next full moon sits opposite the Sun */}
              <g opacity={predictP}>
                <line
                  x1={polar(CAL[0], CAL[1], 330, sunAngle)[0]}
                  y1={polar(CAL[0], CAL[1], 330, sunAngle)[1]}
                  x2={polar(CAL[0], CAL[1], 278, sunAngle + 180)[0]}
                  y2={polar(CAL[0], CAL[1], 278, sunAngle + 180)[1]}
                  stroke={C.terracotta}
                  strokeWidth={1.2}
                  strokeDasharray="5 6"
                  pathLength={1}
                />
                <circle
                  cx={polar(CAL[0], CAL[1], 278, sunAngle + 180)[0]}
                  cy={polar(CAL[0], CAL[1], 278, sunAngle + 180)[1]}
                  r={13}
                  fill="none"
                  stroke={C.terracotta}
                  strokeWidth={1.4}
                  strokeDasharray="3 3"
                />
              </g>
            </g>
          ) : null}

          {/* hand-off circle that the next scene picks up */}
          <circle
            cx={CAL[0]}
            cy={CAL[1]}
            r={handR}
            fill="none"
            stroke={C.navy}
            strokeWidth={interpolate(tightenP, [0, 1], [0, 2])}
            opacity={tightenP}
          />
        </svg>

        {/* labels */}
        {/* legend */}
        <div
          style={{
            position: "absolute",
            left: 788,
            top: 912,
            padding: "12px 14px",
            backgroundColor: "rgba(245,235,221,0.9)",
            display: "flex",
            gap: 40,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 17,
            letterSpacing: "0.16em",
            opacity: chartOut,
          }}
        >
          {(
            [
              ["SUN’S PATH · ECLIPTIC", C.gold, "solid", t.sun + 6],
              ["MOON’S PATH · TILTED 5°", C.spaceBlue, "dashed", t.moon + 8],
              ["NODE · WHERE THEY CROSS", C.terracotta, "ring", t.moon + 14],
            ] as const
          ).map(([label, color, kind, at]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color,
                opacity: interpolate(frame, [at, at + 12], [0, 1], clamp),
              }}
            >
              {kind === "ring" ? (
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: `1.6px solid ${color}` }} />
              ) : (
                <span style={{ width: 30, height: 0, borderTop: `2.4px ${kind} ${color}` }} />
              )}
              {label}
            </div>
          ))}
        </div>
        {(
          [
            ["KṚTTIKĀ", HR.alcyone, 18, -46],
            ["ROHIṆĪ", HR.aldebaran, 20, 16],
            ["MṚGAŚĪRṢA", HR.meissa, -20, -42],
            ["ĀRDRĀ", HR.betelgeuse, -24, 14],
          ] as const
        ).map(([name, hr, dx, dy], i) => {
          const [x, y] = starPt(hr);
          return (
            <Tag
              key={name}
              x={x + dx}
              y={y + dy}
              at={t.patterns + 4 + i * 5}
              out={t.calendars - 16}
              color={C.terracotta}
              size={18}
              align={dx < 0 ? "right" : "left"}
            >
              {name}
            </Tag>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 800,
            top: 1000,
            fontFamily: F.serif,
            fontStyle: "italic",
            fontSize: 26,
            color: C.inkSoft,
            opacity: interpolate(frame, [t.patterns + 20, t.patterns + 34], [0, 1], clamp) * chartOut,
          }}
        >
          Nakṣatras: star groups that mark the Moon’s monthly path. Real star positions (BSC5).
        </div>
        <Tag x={polar(CAL[0], CAL[1], 236, sunAngle + 180)[0]} y={polar(CAL[0], CAL[1], 236, sunAngle + 180)[1] - 12} at={t.predict + 6} out={tighten - 10} color={C.terracotta} size={17} align="center">
          NEXT FULL MOON
        </Tag>

        {/* left column */}
        <div style={{ opacity: leftOut }}>
          <Eyebrow index="01" label="OBSERVE" at={26} />
          <div style={{ position: "absolute", left: 132, top: 168 }}>
            <KineticTitle text="OBSERVE" at={34} size={168} color={C.navy} stagger={1.8} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 140,
              top: 382,
              display: "flex",
              gap: 22,
              alignItems: "center",
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 36,
              letterSpacing: "0.22em",
              color: C.navy,
            }}
          >
            <span style={{ opacity: interpolate(frame, [t.patterns, t.patterns + 12], [0, 1], clamp) }}>PATTERNS</span>
            <span
              style={{
                color: C.gold,
                opacity: interpolate(frame, [t.calendars - 6, t.calendars + 6], [0, 1], clamp),
                translate: `${interpolate(frame, [t.calendars - 6, t.calendars + 14], [-18, 0], { ...clamp, easing: EASE.out })}px 0px`,
              }}
            >
              →
            </span>
            <span style={{ opacity: interpolate(frame, [t.calendars, t.calendars + 12], [0, 1], clamp) }}>CALENDARS</span>
          </div>
          <div
            style={{
              position: "absolute",
              left: 140,
              top: 470,
              width: 560,
              fontFamily: F.serif,
              fontSize: 34,
              lineHeight: 1.3,
              color: C.inkSoft,
              opacity: interpolate(frame, [t.seasons, t.seasons + 16], [0, 1], clamp),
            }}
          >
            One wheel, two clocks: twelve solar months, thirty lunar <i>tithis</i>, six seasons.
          </div>
        </div>
      </Paper>
    </AbsoluteFill>
  );
};
