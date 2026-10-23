// Scene 4 — Measure. The eclipse tangent lands on the Samrat Yantra's gnomon edge; a slow
// lateral move across the real instrument; then its graduated quadrant, whose arc closes
// into a circle that becomes the outline of the Moon.
import type React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Paper } from "../components/Backgrounds";
import { Eyebrow, KineticTitle, SourceCaption, Tag } from "../components/Type";
import { DEG, lerp, toPath, type Pt } from "../lib/geometry";
import { C, EASE, F, clamp } from "../theme";
import { SCENES, cue } from "../timeline";
import {
  GNOMON_IMAGE_CORNER,
  GNOMON_IMAGE_END,
  GNOMON_IMAGE_START,
  MOON_OUTLINE,
  QUADRANT,
  SAMRAT_PAN,
  SAMRAT_SCALE,
  SAMRAT_Y,
  gnomonImage,
} from "./handoffs";

const IMG_W = 3400 * SAMRAT_SCALE;
const IMG_H = 2270 * SAMRAT_SCALE;
const disp = (p: Pt): Pt => [p[0] * SAMRAT_SCALE, p[1] * SAMRAT_SCALE];
const EDGE_ANGLE = Math.atan(0.6362);

export const JantarMantarScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = SCENES.jantarMantar;
  const t = {
    jm: cue("jantarMantar", "s4a", 2),
    celestial: cue("jantarMantar", "s4a", 7),
    measure: cue("jantarMantar", "s4a", 10),
    instruments: cue("jantarMantar", "s4a", 15),
    architecture: cue("jantarMantar", "s4b", 1),
    tool: cue("jantarMantar", "s4b", 5),
  };
  const ease = (a: number, b: number, e = EASE.inOut) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });

  const photoIn = ease(2, 30);
  const toQuadrant = ease(t.instruments - 4, t.instruments + 16);
  const pan = interpolate(frame, [0, t.instruments + 16], [0, SAMRAT_PAN], { ...clamp, easing: EASE.soft });

  // gnomon overlays (image-display coordinates inside the panning layer)
  const top = disp(gnomonImage(GNOMON_IMAGE_START));
  const corner = disp(gnomonImage(GNOMON_IMAGE_CORNER));
  const end = disp(gnomonImage(GNOMON_IMAGE_END));
  const dashed = ease(24, 40);
  const ticks = ease(t.measure - 4, t.measure + 30);
  const along = (f: number): Pt => [lerp(corner[0], end[0], f), lerp(corner[1], end[1], f)];
  const nx = Math.sin(EDGE_ANGLE);
  const ny = -Math.cos(EDGE_ANGLE);

  // quadrant
  const qScale = interpolate(frame, [t.instruments - 4, durationInFrames], [1.0, 1.07], { ...clamp, easing: EASE.soft });
  const arcDraw = ease(t.instruments + 14, t.instruments + 50);
  const close = ease(durationInFrames - 58, durationInFrames - 12);
  const toPaper = ease(durationInFrames - 62, durationInFrames - 30);
  // circle morph: the measured arc (in photo space, scaled) → the Moon outline (screen)
  const qcx = 960 + (QUADRANT.cx - 960) * qScale;
  const qcy = 540 + (QUADRANT.cy - 540) * qScale;
  const qr = QUADRANT.r * qScale;
  const cx = lerp(qcx, MOON_OUTLINE.cx, close);
  const cy = lerp(qcy, MOON_OUTLINE.cy, close);
  const r = lerp(qr, MOON_OUTLINE.r, close);
  const a0 = lerp(QUADRANT.to - (QUADRANT.to - QUADRANT.from) * arcDraw, -90, close);
  const a1 = lerp(QUADRANT.to, 270, close);
  const arcPts: Pt[] = Array.from({ length: 160 }, (_, i) => {
    const a = (a0 + ((a1 - a0) * i) / 159) * DEG;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

  return (
    <AbsoluteFill>
      <Paper>
        {/* ---------------- Samrat Yantra, wide ---------------- */}
        <AbsoluteFill style={{ opacity: photoIn * (1 - toQuadrant) }}>
          <div style={{ position: "absolute", left: -pan, top: SAMRAT_Y, width: IMG_W, height: IMG_H }}>
            <Img src={staticFile("img/jm-samrat-wide.jpg")} style={{ width: "100%", height: "100%" }} />
            <svg width={IMG_W} height={IMG_H} style={{ position: "absolute", inset: 0 }}>
              <line
                x1={corner[0]}
                y1={corner[1]}
                x2={lerp(corner[0], top[0], 1.6)}
                y2={lerp(corner[1], top[1], 1.6)}
                stroke="#FFE7B8"
                strokeWidth={2}
                strokeDasharray="10 9"
                opacity={dashed * ease(t.celestial - 6, t.celestial + 10)}
              />
              {Array.from({ length: 34 }, (_, i) => {
                const f = i / 33;
                if (f > ticks) return null;
                const [x, y] = along(f);
                const L = i % 5 === 0 ? 22 : 11;
                return <line key={i} x1={x} y1={y} x2={x + nx * L} y2={y + ny * L} stroke="#FFF1D6" strokeWidth={i % 5 === 0 ? 2 : 1.3} />;
              })}
            </svg>
            {/* label along the edge */}
            <div
              style={{
                position: "absolute",
                left: along(0.36)[0] + nx * 34,
                top: along(0.36)[1] + ny * 34,
                rotate: `${(EDGE_ANGLE / DEG).toFixed(2)}deg`,
                transformOrigin: "left top",
                fontFamily: F.body,
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: "0.22em",
                color: "#FFF6E6",
                textShadow: "0 1px 10px rgba(20,40,70,0.55)",
                whiteSpace: "nowrap",
                opacity: ease(t.celestial + 8, t.celestial + 22),
              }}
            >
              EDGE PARALLEL TO EARTH’S AXIS
            </div>
          </div>
          <Tag x={350 - pan * 0.5} y={52} at={t.celestial} out={t.instruments - 8} color="#FFF6E6" size={19} style={{ textShadow: "0 1px 10px rgba(20,40,70,0.6)" }}>
            ↖ POINTS TO THE NORTH CELESTIAL POLE
          </Tag>
          <div
            style={{
              position: "absolute",
              left: end[0] - pan + 26,
              top: end[1] + SAMRAT_Y + 8,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 19,
              letterSpacing: "0.16em",
              color: C.navy,
              lineHeight: 1.5,
              opacity: ease(t.measure + 18, t.measure + 32) * (1 - ease(t.instruments - 10, t.instruments)),
            }}
          >
            TILTED ≈ 27°
            <br />
            <span style={{ fontWeight: 500, letterSpacing: "0.08em" }}>= JAIPUR’S LATITUDE</span>
          </div>

          {/* title in the sky */}
          <div style={{ position: "absolute", left: 1010, top: 132, textShadow: "0 2px 18px rgba(10,30,60,0.35)" }}>
            <KineticTitle text="JANTAR MANTAR," at={t.jm} size={92} color={C.white} stagger={1.2} />
            <KineticTitle text="JAIPUR" at={t.jm + 8} size={92} color={C.white} stagger={1.2} />
            <div
              style={{
                fontFamily: F.serif,
                fontStyle: "italic",
                fontSize: 34,
                color: "#FFF6E6",
                marginTop: 14,
                opacity: ease(t.jm + 18, t.jm + 32),
              }}
            >
              Early 18th century · built by Maharaja Sawai Jai Singh II
            </div>
            <div
              style={{
                fontFamily: F.body,
                fontWeight: 600,
                fontSize: 32,
                letterSpacing: "0.3em",
                color: "#FFD99A",
                marginTop: 22,
                opacity: ease(t.measure, t.measure + 12),
                translate: `${(1 - ease(t.measure, t.measure + 18, EASE.out)) * -24}px 0px`,
              }}
            >
              MEASURE THE SKY
            </div>
            <div
              style={{
                fontFamily: F.body,
                fontWeight: 500,
                fontSize: 18,
                letterSpacing: "0.14em",
                color: "rgba(255,246,230,0.85)",
                marginTop: 14,
                opacity: ease(t.measure + 10, t.measure + 22),
              }}
            >
              UNESCO WORLD HERITAGE SITE · 2010
            </div>
          </div>
          <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(8,20,34,0.62) 0%, rgba(8,20,34,0) 22%)" }} />
          <SourceCaption at={10} dark style={{ left: 140, bottom: 64, width: 900 }}>
            Vrihat Samrat Yantra, the great sundial · Photo: Mustang Joe, CC0, via Wikimedia Commons
          </SourceCaption>
          <Eyebrow index="03" label="MEASURE" at={16} color="#FFE2B0" style={{ top: 112, left: 1016, textShadow: "0 1px 8px rgba(10,30,60,0.5)" }} />
        </AbsoluteFill>

        {/* the traced gnomon edge: on screen from frame 0 (it is the line the last scene handed over) */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - toQuadrant }}>
          <g transform={`translate(${-pan} ${SAMRAT_Y})`}>
            <line x1={corner[0]} y1={corner[1]} x2={end[0]} y2={end[1]} stroke={C.navy} strokeOpacity={0.35 * photoIn} strokeWidth={7} />
            <line x1={corner[0]} y1={corner[1]} x2={end[0]} y2={end[1]} stroke="#F2B954" strokeWidth={3.2} />
            <line x1={top[0]} y1={top[1]} x2={corner[0]} y2={corner[1]} stroke="#F2B954" strokeWidth={3.2} strokeOpacity={1 - dashed} />
          </g>
        </svg>

        {/* ---------------- graduated quadrant ---------------- */}
        <AbsoluteFill style={{ opacity: toQuadrant * (1 - toPaper) }}>
          <AbsoluteFill style={{ scale: qScale, transformOrigin: "960px 540px" }}>
            <Img src={staticFile("img/jm-quadrant.jpg")} style={{ width: 1920, height: 1080 }} />
          </AbsoluteFill>
          <div style={{ position: "absolute", left: 700, top: 120, width: 470 }}>
            <Tag x={0} y={0} at={t.instruments + 22} color={C.navy} size={21}>
              GRADUATED QUADRANT
            </Tag>
            <div
              style={{
                position: "absolute",
                top: 40,
                width: 470,
                fontFamily: F.serif,
                fontStyle: "italic",
                fontSize: 31,
                lineHeight: 1.28,
                color: C.navy,
                opacity: ease(t.instruments + 30, t.instruments + 44),
              }}
            >
              The gnomon’s shadow falls on this curved scale; where it falls gives the local time.
            </div>
          </div>
          <SourceCaption at={t.instruments + 18} style={{ left: 140, bottom: 64, width: 980 }}>
            Hour and minute scale of the Samrat Yantra · Photo: Swapnil Karambelkar, CC BY-SA 4.0, via Wikimedia Commons
          </SourceCaption>
        </AbsoluteFill>

        {/* measured arc → Moon outline (drawn over photo and paper alike) */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <path
            d={toPath(arcPts, close > 0.999)}
            fill="none"
            stroke={C.navy}
            strokeOpacity={0.3 * (1 - close)}
            strokeWidth={8}
            opacity={arcDraw > 0 ? 1 : 0}
          />
          <path
            d={toPath(arcPts, close > 0.999)}
            fill="none"
            stroke={close > 0.5 ? C.navy : "#F2B954"}
            strokeWidth={lerp(4, 2, close)}
            strokeLinecap="round"
            opacity={arcDraw > 0 ? 1 : 0}
          />
          {Array.from({ length: 34 }, (_, i) => {
            const a = (QUADRANT.from + ((QUADRANT.to - QUADRANT.from) * i) / 33) * DEG;
            if ((QUADRANT.to - QUADRANT.from) * (1 - i / 33) > (QUADRANT.to - QUADRANT.from) * arcDraw) return null;
            const L = i % 6 === 0 ? 30 : 15;
            const x0 = qcx + qr * Math.cos(a);
            const y0 = qcy + qr * Math.sin(a);
            return (
              <line
                key={i}
                x1={x0}
                y1={y0}
                x2={x0 - Math.cos(a) * L}
                y2={y0 - Math.sin(a) * L}
                stroke={C.gold}
                strokeWidth={i % 6 === 0 ? 2.4 : 1.4}
                opacity={1 - close}
              />
            );
          })}
        </svg>
      </Paper>
    </AbsoluteFill>
  );
};
