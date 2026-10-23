// Scene 3 — Calculate. The calendar circle becomes a jyā (half-chord) construction;
// Āryabhaṭa is introduced with a clearly labelled artistic statue and his own words on
// the Earth's rotation; the circle becomes a rotating Earth against fixed stars; then a
// separate, geometrically constructed eclipse diagram (lunar, then solar).
import type React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Paper } from "../components/Backgrounds";
import { EarthGlobe } from "../components/EarthGlobe";
import { Eyebrow, KineticTitle, SourceCaption, Tag } from "../components/Type";
import {
  externalTangent,
  internalTangent,
  lerp,
  lerpPt,
  polar,
  seeded,
  toPath,
  type Pt,
} from "../lib/geometry";
import { C, EASE, F, clamp } from "../theme";
import { SCENES, cue } from "../timeline";
import { CAL, CAL_HANDOFF_R, GNOMON_SCREEN } from "./handoffs";

// Eclipse construction (not to scale, but every line is a true tangent for these sizes,
// and the sizes are chosen so Earth's umbra can hold the Moon and the Moon's umbra reaches Earth).
const SUN: Pt = [-80, 600];
const SUN_R = 200;
const EARTH: Pt = [1180, 600];
const EARTH_R = 80;
const ORBIT_R = 220;
const MOON_R = 36;

const EARTH_B: Pt = [1450, 548];
const EARTH_B_R = 250;

const FIXED_STARS = (() => {
  const rnd = seeded(7);
  const out: { p: Pt; s: number }[] = [];
  while (out.length < 46) {
    const p: Pt = [1150 + rnd() * 730, 110 + rnd() * 700];
    const d = Math.hypot(p[0] - EARTH_B[0], p[1] - EARTH_B[1]);
    const clearOfText = p[0] > 1210 || p[1] > 660;
    if (d > EARTH_B_R + 46 && p[1] < 790 && clearOfText) out.push({ p, s: 0.6 + rnd() * 1.4 });
  }
  return out;
})();

const Sparkle: React.FC<{ x: number; y: number; s: number; color?: string }> = ({ x, y, s, color = C.navy }) => (
  <path
    d={`M${x},${y - 6 * s}L${x + 1.4 * s},${y - 1.4 * s}L${x + 6 * s},${y}L${x + 1.4 * s},${y + 1.4 * s}L${x},${y + 6 * s}L${x - 1.4 * s},${y + 1.4 * s}L${x - 6 * s},${y}L${x - 1.4 * s},${y - 1.4 * s}Z`}
    fill={color}
  />
);

/** Clip a ray from a through b to the frame's right edge. */
const toRight = (a: Pt, b: Pt, x = 1960): Pt => {
  const t = (x - a[0]) / (b[0] - a[0]);
  return [x, a[1] + (b[1] - a[1]) * t];
};

export const AryabhataScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = SCENES.aryabhata;
  const t = {
    math: cue("aryabhata", "s3a", 1),
    deeper: cue("aryabhata", "s3a", 5),
    name: cue("aryabhata", "s3b", 0),
    earth: cue("aryabhata", "s3b", 2),
    rotation: cue("aryabhata", "s3b", 4),
    eclipses: cue("aryabhata", "s3b", 8),
    supernatural: cue("aryabhata", "s3b", 10),
    not: cue("aryabhata", "s3b", 12),
    shadows: cue("aryabhata", "s3b", 14),
    explain: cue("aryabhata", "s3b", 17),
  };
  const ease = (a: number, b: number, e = EASE.inOut) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });

  // ---------------------------------------------------------------- phase A: jyā
  const theta = 52;
  const A = polar(CAL[0], CAL[1], CAL_HANDOFF_R, theta);
  const M: Pt = [A[0], CAL[1]];
  const A2: Pt = [A[0], CAL[1] + (CAL[1] - A[1])];
  const jyaOut = 1 - ease(t.name - 18, t.name + 4);
  const dia = ease(18, 44);
  const rad = ease(38, 58);
  const arcTheta = ease(52, 68);
  const half = ease(64, 92);
  const chord = ease(80, 102);

  // ---------------------------------------------------------------- phase B: Earth
  const toEarth = ease(t.name - 6, t.name + 30);
  const circleC = lerpPt(CAL, EARTH_B, toEarth);
  const circleR = lerp(CAL_HANDOFF_R, EARTH_B_R, toEarth);
  const globeIn = ease(t.earth - 6, t.earth + 18);
  const phaseBOut = 1 - ease(t.supernatural - 10, t.supernatural + 14);

  // ---------------------------------------------------------------- phase C: eclipses
  const toEclipse = ease(t.supernatural - 6, t.supernatural + 34);
  const earthC = lerpPt(circleC, EARTH, toEclipse);
  const earthR = lerp(circleR, EARTH_R, toEclipse);
  const earthLon = 40 + frame * 1.15;
  const sunIn = ease(t.supernatural + 8, t.supernatural + 40, EASE.out);
  const sunPos: Pt = [lerp(-320, SUN[0], sunIn), SUN[1]];
  const geom = ease(t.supernatural + 26, t.shadows + 12);
  const orbit = ease(t.supernatural + 30, t.shadows + 4);
  const endFade = 1 - ease(durationInFrames - 44, durationInFrames - 26);

  const [u1, u2] = externalTangent(SUN, SUN_R, EARTH, EARTH_R, true);
  const [l1, l2] = externalTangent(SUN, SUN_R, EARTH, EARTH_R, false);
  const [pu1, pu2] = internalTangent(SUN, SUN_R, EARTH, EARTH_R, true);
  const [pl1, pl2] = internalTangent(SUN, SUN_R, EARTH, EARTH_R, false);
  const apex: Pt = [EARTH[0] + (EARTH[0] - SUN[0]) * EARTH_R / (SUN_R - EARTH_R), EARTH[1]];

  // Moon: CCW along its orbit; into Earth's shadow (lunar eclipse), then between Sun and Earth (solar)
  const lunarAt = t.shadows + 10;
  const solarAt = lunarAt + 64;
  const moonA = interpolate(
    frame,
    [t.shadows - 26, lunarAt, lunarAt + 24, solarAt],
    [-62, 0, 0, 180],
    { ...clamp, easing: EASE.inOut },
  );
  const moon = polar(EARTH[0], EARTH[1], ORBIT_R, moonA);
  const off = Math.abs(moon[1] - EARTH[1]);
  const inUmbra = moon[0] > EARTH[0] ? interpolate(off, [22, 92], [1, 0], clamp) : 0;
  const solar = ease(solarAt - 14, solarAt + 6);
  const [mu1, mu2] = externalTangent(SUN, SUN_R, moon, MOON_R, true);
  const [ml1, ml2] = externalTangent(SUN, SUN_R, moon, MOON_R, false);
  const moonApex: Pt = [moon[0] + (moon[0] - SUN[0]) * MOON_R / (SUN_R - MOON_R), moon[1]];

  // hand-off: Sun–Earth tangent swings onto the Samrat Yantra's gnomon edge
  const swing = ease(durationInFrames - 42, durationInFrames - 14);
  const tanA: Pt = [0, u1[1] + (u2[1] - u1[1]) * ((0 - u1[0]) / (u2[0] - u1[0]))];
  const tanB = toRight(u1, u2, 1920);
  const lineA = lerpPt(tanA, GNOMON_SCREEN[0], swing);
  const lineB = lerpPt(tanB, GNOMON_SCREEN[1], swing);

  return (
    <AbsoluteFill>
      <Paper>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* ---------- jyā construction ---------- */}
          <g opacity={jyaOut} stroke={C.navy} fill="none">
            <line x1={CAL[0] - CAL_HANDOFF_R} y1={CAL[1]} x2={CAL[0] - CAL_HANDOFF_R + 2 * CAL_HANDOFF_R * dia} y2={CAL[1]} strokeWidth={1.2} strokeOpacity={0.55} />
            <line x1={CAL[0]} y1={CAL[1]} x2={lerp(CAL[0], A[0], rad)} y2={lerp(CAL[1], A[1], rad)} strokeWidth={1.6} />
            <path
              d={toPath(Array.from({ length: 30 }, (_, i) => polar(CAL[0], CAL[1], 58, (theta * arcTheta * i) / 29)))}
              strokeWidth={1.4}
            />
            <line x1={A[0]} y1={A[1]} x2={A[0]} y2={lerp(A[1], A2[1], chord)} strokeWidth={1.2} strokeDasharray="6 6" strokeOpacity={0.6} />
            <line x1={A[0]} y1={A[1]} x2={A[0]} y2={lerp(A[1], M[1], half)} stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
            <path d={`M${M[0] - 16},${M[1]}L${M[0] - 16},${M[1] - 16}L${M[0]},${M[1] - 16}`} strokeWidth={1.2} opacity={half > 0.98 ? 1 : 0} />
            <circle cx={A[0]} cy={A[1]} r={5} fill={C.navy} opacity={rad} stroke="none" />
            <circle cx={CAL[0]} cy={CAL[1]} r={4} fill={C.navy} opacity={dia} stroke="none" />
          </g>
          {/* the circle itself — carried from the calendar, becoming the Earth */}
          <circle cx={circleC[0]} cy={circleC[1]} r={circleR} fill="none" stroke={C.navy} strokeWidth={2} opacity={1 - globeIn} />

          {/* ---------- fixed stars + rotating Earth ---------- */}
          <g opacity={globeIn * phaseBOut}>
            {FIXED_STARS.map((s, i) => (
              <Sparkle key={i} x={s.p[0]} y={s.p[1]} s={s.s} color={C.navy} />
            ))}
            <path
              d={toPath(Array.from({ length: 40 }, (_, i) => polar(EARTH_B[0], EARTH_B[1], EARTH_B_R + 34, 122 - (64 * i) / 39)))}
              fill="none"
              stroke={C.gold}
              strokeWidth={2.4}
              pathLength={1}
              strokeDasharray={`${ease(t.rotation - 4, t.rotation + 18)} 1`}
            />
            {(() => {
              const tip = polar(EARTH_B[0], EARTH_B[1], EARTH_B_R + 34, 58);
              return (
                <path
                  d={`M${tip[0] - 13},${tip[1] - 9}L${tip[0] + 3},${tip[1] + 1}L${tip[0] - 9},${tip[1] + 14}`}
                  fill="none"
                  stroke={C.gold}
                  strokeWidth={2.4}
                  opacity={ease(t.rotation + 14, t.rotation + 20)}
                />
              );
            })()}
          </g>
          <EarthGlobe
            id="earthA"
            cx={earthC[0]}
            cy={earthC[1]}
            r={earthR}
            lon={earthLon}
            lat={lerp(16, 8, toEclipse)}
            variant="diagram"
            opacity={globeIn * endFade}
            graticuleOpacity={1 - toEclipse * 0.6}
          />

          {/* ---------- eclipse geometry ---------- */}
          <g opacity={endFade}>
            <g opacity={sunIn}>
              <circle cx={sunPos[0]} cy={sunPos[1]} r={SUN_R + 26} fill={C.gold} opacity={0.12} />
              <circle cx={sunPos[0]} cy={sunPos[1]} r={SUN_R} fill={C.gold} />
            </g>
            <g opacity={geom}>
              {/* umbra and penumbra regions behind Earth */}
              <path d={toPath([pu2, toRight(pu1, pu2), toRight(pl1, pl2), pl2], true)} fill={C.navy} opacity={0.06} />
              <path d={toPath([u2, apex, l2], true)} fill={C.navy} opacity={0.16} />
              {/* construction lines: true tangents to both circles */}
              {[
                [u1, u2],
                [l1, l2],
              ].map(([a, b], i) => (
                <line key={`e${i}`} x1={a[0]} y1={a[1]} x2={lerp(a[0], apex[0], geom)} y2={lerp(a[1], apex[1], geom)} stroke={C.navy} strokeWidth={1.2} strokeOpacity={0.7} />
              ))}
              {[
                [pu1, pu2],
                [pl1, pl2],
              ].map(([a, b], i) => {
                const end = toRight(a, b);
                return (
                  <line key={`i${i}`} x1={a[0]} y1={a[1]} x2={lerp(a[0], end[0], geom)} y2={lerp(a[1], end[1], geom)} stroke={C.navy} strokeWidth={1} strokeOpacity={0.35} strokeDasharray="8 7" />
                );
              })}
            </g>
            {/* Moon's orbit */}
            <circle
              cx={EARTH[0]}
              cy={EARTH[1]}
              r={ORBIT_R}
              fill="none"
              stroke={C.navy}
              strokeOpacity={0.35}
              strokeWidth={1}
              strokeDasharray="3 7"
              pathLength={1}
              opacity={orbit > 0 ? 1 : 0}
              style={{ strokeDasharray: `${orbit} 1` }}
            />
            {/* Moon's own shadow (solar eclipse) */}
            <g opacity={solar}>
              <line x1={mu1[0]} y1={mu1[1]} x2={mu2[0]} y2={mu2[1]} stroke={C.terracotta} strokeOpacity={0.45} strokeWidth={1} />
              <line x1={ml1[0]} y1={ml1[1]} x2={ml2[0]} y2={ml2[1]} stroke={C.terracotta} strokeOpacity={0.45} strokeWidth={1} />
              <path d={toPath([mu2, moonApex, ml2], true)} fill={C.terracotta} opacity={0.5} />
              <ellipse cx={EARTH[0] - EARTH_R + 3} cy={EARTH[1]} rx={6} ry={16} fill={C.navy} opacity={0.85} />
            </g>
            {orbit > 0 ? (
              <g>
                <circle cx={moon[0]} cy={moon[1]} r={MOON_R} fill={inUmbra > 0 ? `rgb(${lerp(236, 169, inUmbra)},${lerp(228, 81, inUmbra)},${lerp(214, 55, inUmbra)})` : "#ECE4D6"} stroke={C.navy} strokeWidth={1.4} />
              </g>
            ) : null}
          </g>

          {/* swinging tangent → gnomon edge */}
          <line x1={lineA[0]} y1={lineA[1]} x2={lineB[0]} y2={lineB[1]} stroke={C.gold} strokeWidth={lerp(1.2, 3, swing)} opacity={swing > 0 ? 1 : 0} />
        </svg>

        {/* ---------- phase A text ---------- */}
        <div style={{ opacity: jyaOut }}>
          <Eyebrow index="02" label="CALCULATE" at={14} />
          <div style={{ position: "absolute", left: 136, top: 176 }}>
            <KineticTitle text="MATHEMATICS" at={t.math} size={112} stagger={1.3} />
            <KineticTitle text="MEETS THE SKY" at={t.math + 9} size={112} stagger={1.3} color={C.terracotta} style={{ marginTop: 4 }} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 140,
              top: 470,
              width: 640,
              fontFamily: F.serif,
              fontSize: 36,
              lineHeight: 1.3,
              color: C.inkSoft,
              opacity: ease(t.deeper, t.deeper + 16),
            }}
          >
            The <i>Āryabhaṭīya</i> tabulates the <i>jyā</i>, the half-chord of a circle and the ancestor of
            today’s sine.
          </div>
          <Tag x={A[0] + 18} y={(A[1] + M[1]) / 2 - 16} at={74} color={C.gold} size={24}>
            JYĀ
          </Tag>
          <Tag x={CAL[0] + 66} y={CAL[1] - 46} at={66} color={C.navy} size={22} style={{ fontFamily: F.serif, fontStyle: "italic", letterSpacing: 0 }}>
            θ
          </Tag>
          <Tag x={lerp(CAL[0], A[0], 0.45) - 40} y={lerp(CAL[1], A[1], 0.45) - 36} at={56} color={C.navy} size={22} style={{ fontFamily: F.serif, fontStyle: "italic", letterSpacing: 0 }}>
            R
          </Tag>
        </div>

        {/* ---------- phase B: Āryabhaṭa ---------- */}
        <div style={{ opacity: phaseBOut }}>
          <div
            style={{
              position: "absolute",
              left: 140,
              top: 150,
              width: 330,
              height: 472,
              borderRadius: "165px 165px 6px 6px",
              overflow: "hidden",
              clipPath: `inset(${(1 - ease(t.name - 10, t.name + 18, EASE.out)) * 100}% 0 0 0)`,
              boxShadow: "0 0 0 1px rgba(23,50,77,0.25)",
            }}
          >
            <Img
              src={staticFile("img/aryabhata-statue-iucaa.jpg")}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "50% 20%",
                filter: "sepia(0.25) saturate(0.85) contrast(1.02)",
                scale: interpolate(frame, [t.name - 10, t.supernatural], [1.08, 1], clamp),
              }}
            />
          </div>
          <SourceCaption at={t.name + 6} style={{ left: 140, top: 640, width: 360 }}>
            Statue at IUCAA, Pune: an artistic representation. No portrait from Āryabhaṭa’s lifetime survives.
          </SourceCaption>
          <div style={{ position: "absolute", left: 528, top: 150 }}>
            <KineticTitle text="ARYABHATA" at={t.name + 2} size={104} stagger={1.5} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 532,
              top: 268,
              fontFamily: F.serif,
              fontStyle: "italic",
              fontSize: 36,
              color: C.terracotta,
              opacity: ease(t.name + 12, t.name + 26),
            }}
          >
            Āryabhaṭa · born 476 CE · author of the Āryabhaṭīya
          </div>
          <div
            style={{
              position: "absolute",
              left: 532,
              top: 342,
              width: 560,
              height: 1,
              backgroundColor: C.hairline,
              scale: `${ease(t.name + 14, t.name + 34)} 1`,
              transformOrigin: "left",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 532,
              top: 372,
              fontFamily: F.deva,
              fontSize: 38,
              lineHeight: 1.45,
              color: C.navy,
              opacity: ease(t.earth + 2, t.earth + 18),
            }}
          >
            अनुलोमगतिर्नौस्थः पश्यत्यचलं विलोमगं यद्वत् ।
            <br />
            अचलानि भानि तद्वत् समपश्चिमगानि लङ्कायाम् ॥
          </div>
          <div
            style={{
              position: "absolute",
              left: 532,
              top: 506,
              width: 590,
              fontFamily: F.serif,
              fontStyle: "italic",
              fontSize: 30,
              lineHeight: 1.3,
              color: C.inkSoft,
              opacity: ease(t.rotation, t.rotation + 16),
            }}
          >
            “As a person in a moving boat sees the still shore move backward, so the still stars
            appear to move due west.”
          </div>
          <Tag x={532} y={606} at={t.rotation + 8} color={C.terracotta} size={17}>
            ĀRYABHAṬĪYA · GOLAPĀDA, VERSE 9
          </Tag>
          {/* sidereal day */}
          <div style={{ position: "absolute", left: EARTH_B[0], top: 830, translate: "-50% 0", textAlign: "center", opacity: globeIn }}>
            <Tag x={0} y={0} at={t.rotation + 16} size={16} align="center" color={C.inkSoft}>
              ONE TURN OF THE EARTH, TIMED AGAINST THE STARS
            </Tag>
            <div style={{ display: "flex", gap: 18, justifyContent: "center", marginTop: 30, fontFamily: F.display, fontWeight: 600, fontSize: 60, color: C.navy }}>
              {[
                ["23", "h"],
                ["56", "m"],
                ["4.1", "s"],
              ].map(([n, u], i) => {
                const at = t.rotation + 24 + i * 7;
                return (
                  <span key={u} style={{ opacity: ease(at, at + 6), translate: `0px ${(1 - ease(at, at + 10, EASE.out)) * 12}px` }}>
                    {n}
                    <sup style={{ fontSize: 30, marginLeft: 3, color: C.terracotta }}>{u}</sup>
                  </span>
                );
              })}
            </div>
            <div style={{ marginTop: 6, fontFamily: F.body, fontSize: 19, color: C.inkSoft, opacity: ease(t.rotation + 46, t.rotation + 58), whiteSpace: "nowrap" }}>
              Āryabhaṭa’s figure · modern value 23 h 56 min 4.09 s
            </div>
          </div>
          <Tag x={EARTH_B[0] + EARTH_B_R + 6} y={EARTH_B[1] - EARTH_B_R - 22} at={t.rotation + 10} color={C.gold} size={17}>
            EARTH ROTATES
          </Tag>
        </div>

        {/* ---------- phase C text ---------- */}
        <div style={{ opacity: endFade }}>
          <div style={{ position: "absolute", left: 140, top: 136 }}>
            <div
              style={{
                position: "relative",
                display: "inline-block",
                fontFamily: F.display,
                fontWeight: 600,
                fontSize: 62,
                letterSpacing: "0.01em",
                color: C.inkSoft,
                opacity: ease(t.supernatural + 2, t.supernatural + 14),
              }}
            >
              SUPERNATURAL
              <span
                style={{
                  position: "absolute",
                  left: -6,
                  right: -6,
                  top: "52%",
                  height: 5,
                  backgroundColor: C.terracotta,
                  scale: `${ease(t.not, t.not + 12, EASE.out)} 1`,
                  transformOrigin: "left",
                }}
              />
            </div>
            <KineticTitle text="SHADOWS." at={t.shadows} size={124} stagger={1.6} style={{ marginTop: 6 }} />
            <div
              style={{
                fontFamily: F.body,
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: "0.26em",
                color: C.terracotta,
                marginTop: 14,
                opacity: ease(t.explain, t.explain + 12),
              }}
            >
              ECLIPSES, EXPLAINED BY GEOMETRY
            </div>
          </div>
          <Tag x={1430} y={386} at={lunarAt - 4} out={solarAt - 26} size={20}>
            LUNAR ECLIPSE
          </Tag>
          <div
            style={{
              position: "absolute",
              left: 1430,
              top: 418,
              fontFamily: F.serif,
              fontStyle: "italic",
              fontSize: 27,
              color: C.inkSoft,
              opacity: ease(lunarAt + 2, lunarAt + 14) * (1 - ease(solarAt - 26, solarAt - 16)),
            }}
          >
            The Moon passes into Earth’s shadow
          </div>
          <Tag x={EARTH[0] + 400} y={EARTH[1] - 11} at={t.shadows + 14} size={15} color={C.inkSoft}>
            UMBRA
          </Tag>
          <Tag x={EARTH[0] + 360} y={EARTH[1] + 96} at={t.shadows + 18} size={15} color={C.inkSoft}>
            PENUMBRA
          </Tag>
          <Tag x={940} y={700} at={solarAt - 2} size={20} align="center">
            SOLAR ECLIPSE
          </Tag>
          <div
            style={{
              position: "absolute",
              left: 940,
              top: 734,
              translate: "-50% 0",
              fontFamily: F.serif,
              fontStyle: "italic",
              fontSize: 27,
              color: C.inkSoft,
              whiteSpace: "nowrap",
              opacity: ease(solarAt + 4, solarAt + 16),
            }}
          >
            The Moon’s shadow falls on Earth
          </div>
          <Tag x={1780} y={1000} at={t.shadows + 20} size={15} align="right" color={C.inkSoft}>
            DIAGRAM NOT TO SCALE
          </Tag>
        </div>
      </Paper>
    </AbsoluteFill>
  );
};
