// Scene 6 — The Connection. Earth above the lunar horizon; a pull-back into a schematic in
// which the opening's sky-chart rings align around Earth with Chandrayaan-3's route; the
// night inverts back to paper and the diagram settles into the end-card emblem. While "tools
// changed, methods changed" is spoken, a 3D chart of ISRO's orbital launches per decade rises
// in the empty sky above the lunar horizon.
import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Night, Paper } from "../components/Backgrounds";
import { EarthGlobe } from "../components/EarthGlobe";
import { GrowthChart } from "../components/GrowthChart";
import { MoonGlobe } from "../components/MoonGlobe";
import { MaskLine, SourceCaption, Tag } from "../components/Type";
import launches from "../data/isroLaunches.json";
import { lerp, toPath, type Pt } from "../lib/geometry";
import { C, EASE, F, clamp } from "../theme";
import { cue } from "../timeline";

const E: Pt = [600, 560];
const MOON: Pt = [1470, 560];
const PERIGEE = 52;

/** Ellipse with Earth at its left focus, apogee pointing right (toward the Moon). */
const orbit = (q: number, Q: number, from = 0, to = 360, n = 160): Pt[] => {
  const a = (q + Q) / 2;
  const c = a - q;
  const b = Math.sqrt(q * Q);
  return Array.from({ length: n }, (_, i) => {
    const th = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
    return [E[0] + c + a * Math.cos(th), E[1] - b * Math.sin(th)];
  });
};

const lunarOrbit = (a: number, b: number, n = 100): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const th = (i / (n - 1)) * Math.PI * 2;
    return [MOON[0] + a * Math.cos(th) - a * 0.35, MOON[1] - b * Math.sin(th)];
  });

const EARTH_ORBITS = [140, 200, 270, 350, 440].map((Q) => orbit(PERIGEE, Q));
// Trans-lunar arc: from perigee (left of Earth) over the top to the Moon's distance.
const TRANSFER = orbit(PERIGEE, MOON[0] - E[0] + 10, 180, 360 + 4);
const LUNAR_ORBITS = [
  [92, 58],
  [66, 40],
  [44, 30],
  [28, 24],
].map(([a, b]) => lunarOrbit(a, b));

// Orbital launch attempts per decade, counted from the flight list (through 2025).
const LAUNCHES_BY_DECADE = [1970, 1980, 1990, 2000, 2010, 2020].map((d) => ({
  label: d === 2020 ? "2020–25*" : `${d}s`,
  value: launches.flights.filter((f) => f.year >= d && f.year < d + 10).length,
}));

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",")})`;
};

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = {
    tools: cue("closing", "s6a", 0),
    methods: cue("closing", "s6a", 2),
    question: cue("closing", "s6a", 5),
    universe: cue("closing", "s6a", 8),
    journey: cue("closing", "s6b", 0),
    observe: cue("closing", "s6b", 8),
    calculate: cue("closing", "s6b", 10),
    explore: cue("closing", "s6b", 13),
  };
  const ease = (a: number, b: number, e = EASE.inOut) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });

  // ---------------------------------------------------------------- shot A: Earth over the Moon
  const pull = interpolate(frame, [0, 215], [0, 1], { ...clamp, easing: EASE.soft });
  const shotAOut = ease(212, 214);
  const toSchematic = ease(170, 214);
  const moonR = lerp(1900, 1500, pull);
  const moonCY = lerp(2760, 2400, pull) + 900 * toSchematic;
  const earthR = lerp(lerp(104, 80, pull), 40, toSchematic);
  const earthPos: Pt = [
    lerp(lerp(1240, 1190, pull), E[0], toSchematic),
    lerp(lerp(318, 350, pull), E[1], toSchematic),
  ];
  const earthLon = 78 + frame * 0.08;

  // ---------------------------------------------------------------- shot B: the schematic
  const shotBIn = ease(198, 220);
  const rings = ease(204, 236);
  const earthOrbits = ease(212, 240);
  const transfer = ease(236, 256, EASE.soft);
  const capture = ease(252, 268);
  const inv = ease(240, 274);
  const toEmblem = ease(262, 298);
  const emblemScale = lerp(1, 0.3, toEmblem);
  const emblemShift: Pt = [lerp(0, 960 - (E[0] + MOON[0]) / 2, toEmblem), lerp(0, 205 - E[1], toEmblem)];

  const line = mixHex("#F5EBDD", C.navy, inv);
  const goldLine = C.gold;
  const ringColor = mixHex("#D9A95C", C.gold, inv);

  // spacecraft dot along the route
  const route: Pt[] = [...EARTH_ORBITS.flat(), ...TRANSFER, ...LUNAR_ORBITS.flat()];
  const craftP = ease(212, 268, EASE.soft);
  const craft = route[Math.min(route.length - 1, Math.floor(craftP * (route.length - 1)))];

  const tagsOut = 1 - ease(262, 274);

  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill
        style={{
          WebkitMaskImage: `radial-gradient(circle at ${E[0]}px ${E[1]}px, transparent ${inv * 2300}px, #000 ${inv * 2300 + 2}px)`,
          maskImage: `radial-gradient(circle at ${E[0]}px ${E[1]}px, transparent ${inv * 2300}px, #000 ${inv * 2300 + 2}px)`,
          opacity: inv >= 1 ? 0 : 1,
        }}
      >
        <Night stars={0.9} />
      </AbsoluteFill>

      {/* ---------- shot A ---------- */}
      <AbsoluteFill style={{ opacity: 1 - shotAOut }}>
        <MoonGlobe cx={960} cy={moonCY} r={moonR} lat0={-38} lon0={18} ink={0} sun={[0.78, 0.3, 0.55]} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <EarthGlobe id="earthEnd" cx={earthPos[0]} cy={earthPos[1]} r={earthR} lon={earthLon} lat={14} variant="night" sunAngle={-0.35} />
        </svg>
      </AbsoluteFill>

      {/* ---------- words over shot A ---------- */}
      <div style={{ opacity: 1 - ease(192, 210) }}>
        <div
          style={{
            position: "absolute",
            left: 140,
            top: 150,
            display: "flex",
            gap: 26,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 24,
            letterSpacing: "0.3em",
            color: "rgba(245,235,221,0.8)",
          }}
        >
          <span style={{ opacity: ease(t.tools, t.tools + 12) }}>TOOLS CHANGED.</span>
          <span style={{ opacity: ease(t.methods, t.methods + 12) }}>METHODS CHANGED.</span>
        </div>
        <MaskLine at={t.question} style={{ position: "absolute", left: 136, top: 196 }}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 64, color: C.ivory }}>The question stayed:</div>
        </MaskLine>
        <MaskLine at={t.universe} style={{ position: "absolute", left: 136, top: 276 }}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 64, color: C.goldSoft }}>how does the universe work?</div>
        </MaskLine>

        {/* growth chart: real launch counts, rising on "tools" / "methods"; gone before Earth
            starts its move to the schematic (toSchematic) so it never crosses the bars */}
        <AbsoluteFill style={{ opacity: 1 - ease(166, 182) }}>
          <GrowthChart data={LAUNCHES_BY_DECADE} at={t.tools} origin={[600, 765]} yMax={50} stagger={5} />
          <Tag x={140} y={400} at={t.tools + 6} color="rgba(245,235,221,0.86)" size={18}>
            ISRO ORBITAL LAUNCH ATTEMPTS, PER DECADE
          </Tag>
          <SourceCaption at={t.tools + 20} dark style={{ left: 140, top: 432, width: 520, fontSize: 16 }}>
            ISRO launch records, 1979–2025. Failed launches included. *2020s: six years so far.
          </SourceCaption>
        </AbsoluteFill>
      </div>

      {/* ---------- shot B → emblem ---------- */}
      <AbsoluteFill style={{ opacity: shotBIn }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <g
            transform={`translate(${emblemShift[0] + (E[0] + MOON[0]) / 2} ${emblemShift[1] + E[1]}) scale(${emblemScale}) translate(${-(E[0] + MOON[0]) / 2} ${-E[1]})`}
          >
            {/* the opening's sky chart, re-centred on Earth */}
            {[90, 170, 260, 360].map((r, i) => (
              <circle
                key={r}
                cx={E[0]}
                cy={E[1]}
                r={r}
                fill="none"
                stroke={ringColor}
                strokeOpacity={0.55}
                strokeWidth={1 / Math.max(emblemScale, 0.6)}
                pathLength={1}
                strokeDasharray={`${Math.max(0, Math.min(1, rings * 1.3 - i * 0.1))} 1`}
                transform={`rotate(${-90 + i * 25} ${E[0]} ${E[1]})`}
              />
            ))}
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i * 15 * Math.PI) / 180;
              const r0 = 360;
              const r1 = 360 + (i % 6 === 0 ? 22 : 11);
              return (
                <line
                  key={i}
                  x1={E[0] + r0 * Math.cos(a)}
                  y1={E[1] + r0 * Math.sin(a)}
                  x2={E[0] + r1 * Math.cos(a)}
                  y2={E[1] + r1 * Math.sin(a)}
                  stroke={ringColor}
                  strokeWidth={1.2 / Math.max(emblemScale, 0.6)}
                  opacity={rings}
                />
              );
            })}
            {/* Chandrayaan-3 route (schematic): Earth-bound orbits, transfer, lunar orbits */}
            {EARTH_ORBITS.map((pts, i) => (
              <path
                key={i}
                d={toPath(pts, true)}
                fill="none"
                stroke={line}
                strokeOpacity={0.75}
                strokeWidth={1.3 / Math.max(emblemScale, 0.6)}
                pathLength={1}
                strokeDasharray={`${Math.max(0, Math.min(1, earthOrbits * 5 - i))} 1`}
              />
            ))}
            <path
              d={toPath(TRANSFER)}
              fill="none"
              stroke={goldLine}
              strokeWidth={2.4 / Math.max(emblemScale, 0.6)}
              pathLength={1}
              strokeDasharray={`${transfer} 1`}
            />
            {LUNAR_ORBITS.map((pts, i) => (
              <path
                key={i}
                d={toPath(pts, true)}
                fill="none"
                stroke={line}
                strokeOpacity={0.75}
                strokeWidth={1.2 / Math.max(emblemScale, 0.6)}
                pathLength={1}
                strokeDasharray={`${Math.max(0, Math.min(1, capture * 4 - i))} 1`}
              />
            ))}
            {craftP > 0 && craftP < 1 ? <circle cx={craft[0]} cy={craft[1]} r={5} fill={C.goldSoft} /> : null}
            {frame >= 213 ? (
              <EarthGlobe id="earthSchem" cx={E[0]} cy={E[1]} r={40} lon={earthLon} lat={14} variant={inv > 0.5 ? "diagram" : "night"} sunAngle={-0.35} />
            ) : null}
            <circle cx={MOON[0]} cy={MOON[1]} r={15} opacity={ease(206, 222)} fill={mixHex("#CFCAC0", "#E6DCCB", inv)} stroke={line} strokeWidth={1.4 / Math.max(emblemScale, 0.6)} />
          </g>
        </svg>
        <div style={{ opacity: tagsOut }}>
          <Tag x={E[0] - 360} y={E[1] + 392} at={210} color={ringColor} size={18}>
            THEN · A CHART OF THE TURNING SKY
          </Tag>
          <Tag x={MOON[0] + 110} y={MOON[1] + 250} at={238} color={mixHex("#F5EBDD", C.navy, inv)} size={18} align="right">
            NOW · CHANDRAYAAN-3’S ROUTE TO THE MOON
          </Tag>
          <Tag x={MOON[0] + 110} y={MOON[1] + 280} at={242} color={mixHex("#C9BFAF", C.inkSoft, inv)} size={15} align="right">
            EARTH ORBITS → TRANSFER → LUNAR ORBITS · SCHEMATIC, NOT TO SCALE
          </Tag>
        </div>
      </AbsoluteFill>

      {/* ---------- end card ---------- */}
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 360, width: 1920, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <MaskLine at={t.journey + 26} duration={26}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 92, color: C.navy, letterSpacing: "-0.005em", textAlign: "center" }}>
              FROM OBSERVING THE HEAVENS
            </div>
          </MaskLine>
          <MaskLine at={t.journey + 40} duration={26}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 92, color: C.terracotta, letterSpacing: "-0.005em", textAlign: "center" }}>
              TO EXPLORING THEM.
            </div>
          </MaskLine>
          <div
            style={{
              marginTop: 44,
              width: 540,
              height: 1.5,
              backgroundColor: C.gold,
              scale: `${ease(t.journey + 52, t.journey + 84, EASE.out)} 1`,
            }}
          />
          <div style={{ display: "flex", gap: 30, marginTop: 40, fontFamily: F.body, fontWeight: 600, fontSize: 38, letterSpacing: "0.34em" }}>
            {(
              [
                ["OBSERVE.", t.observe],
                ["CALCULATE.", t.calculate],
                ["EXPLORE.", t.explore],
              ] as const
            ).map(([w, at]) => (
              <span
                key={w}
                style={{
                  color: mixHex("#C9BBA6", C.navy, ease(at - 2, at + 8)),
                  opacity: ease(t.journey + 60, t.journey + 80),
                }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 70,
            width: 1500,
            left: 210,
            textAlign: "center",
            fontFamily: F.body,
            fontSize: 17,
            lineHeight: 1.6,
            letterSpacing: "0.03em",
            color: C.inkSoft,
            opacity: ease(t.explore + 30, t.explore + 50),
          }}
        >
          Mission imagery &amp; footage: ISRO (GODL-India) · Lunar map: NASA Scientific Visualization Studio (LRO) · Star positions: Yale Bright Star Catalogue
          <br />
          Jantar Mantar photographs: Mustang Joe (CC0) and Swapnil Karambelkar (CC BY-SA 4.0) · Āryabhaṭa statue at IUCAA, Pune, via Wikimedia Commons
          <br />
          Narration: synthetic Hindi voice (Microsoft neural TTS) · Original score and sound design · Diagrams are explanatory and not to scale
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
