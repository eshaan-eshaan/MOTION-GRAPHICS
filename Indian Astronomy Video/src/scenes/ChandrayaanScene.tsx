// Scene 5 — Explore (hero). The measured circle becomes a drawn lunar diagram, the
// drawing becomes a lit globe in deep space, the globe turns to the south polar region and
// the landing site, the camera pushes in to ISRO's own approach footage, then the Vikram
// lander and Pragyan rover in authentic mission imagery, holding on Vikram. On "a new
// scale", the Earth–Moon distance rolls up beside the drawn Moon.
import type React from "react";
import { Video } from "@remotion/media";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Night, Paper } from "../components/Backgrounds";
import { MoonGlobe } from "../components/MoonGlobe";
import { LANDING_SITE, MoonOverlay, moonPoint } from "../components/MoonOverlay";
import { NumberRoll } from "../components/NumberRoll";
import { Eyebrow, KineticTitle, SourceCaption, Tag } from "../components/Type";
import { lerp } from "../lib/geometry";
import { C, EASE, F, clamp } from "../theme";
import { MUSIC, SCENES, cue, local, sec } from "../timeline";
import { MOON_OUTLINE } from "./handoffs";

const PLATE = { w: 760, h: 690, top: 150 };

// Mean Earth–Moon distance (centre to centre) and Earth's mean diameter, in km.
const MOON_DISTANCE_KM = 384400;
const EARTH_DIAMETER_KM = 12742;

/** Label, rolling figure and comparison chip; drawn once for paper and once for night. */
const DistanceRoll: React.FC<{ at: number; ink: string; soft: string; chipBg: string; chipInk: string; opacity: number }> = ({
  at,
  ink,
  soft,
  chipBg,
  chipInk,
  opacity,
}) => {
  const frame = useCurrentFrame();
  const chip = interpolate(frame, [at + 44, at + 58], [0, 1], { ...clamp, easing: EASE.out });
  return (
    <div style={{ position: "absolute", left: 140, top: 404, opacity }}>
      <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 18, letterSpacing: "0.2em", color: soft, opacity: interpolate(frame, [at - 6, at + 6], [0, 1], clamp) }}>
        EARTH TO MOON · AVERAGE DISTANCE
      </div>
      <div style={{ marginTop: 14 }}>
        <NumberRoll value={MOON_DISTANCE_KM} at={at} duration={42} size={88} color={ink} unit="km" unitColor={soft} />
      </div>
      <div
        style={{
          display: "inline-block",
          marginTop: 22,
          padding: "10px 18px",
          borderRadius: 10,
          backgroundColor: chipBg,
          color: chipInk,
          fontFamily: F.body,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: "0.02em",
          opacity: chip,
          translate: `0px ${(1 - chip) * 10}px`,
        }}
      >
        ≈ {Math.round(MOON_DISTANCE_KM / EARTH_DIAMETER_KM)} Earths, side by side
      </div>
    </div>
  );
};
const LABEL_X = 1010;
const LABEL_Y = 770;

export const ChandrayaanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { durationInFrames } = SCENES.chandrayaan;
  const t = {
    curiosity: cue("chandrayaan", "s5a", 3),
    scale: cue("chandrayaan", "s5a", 6),
    // the title lands on the score's impact; the narrator names it half a second later
    c3: local("chandrayaan", sec(MUSIC.impact)),
    date: cue("chandrayaan", "s5b", 2),
    south: cue("chandrayaan", "s5b", 6),
    vikram: cue("chandrayaan", "s5c", 0),
    pragyan: cue("chandrayaan", "s5c", 3),
    observe: cue("chandrayaan", "s5d", 5),
    explore: cue("chandrayaan", "s5d", 10),
  };
  const ease = (a: number, b: number, e = EASE.inOut) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });

  // ---------------------------------------------------------------- globe choreography
  const night = ease(t.scale + 10, t.c3 - 2);
  const inkAmt = 1 - ease(t.scale + 14, t.c3 - 4);
  const reveal = interpolate(frame, [10, 104], [0, 1.02], { ...clamp, easing: EASE.soft });
  const settle = ease(t.c3 - 30, t.c3 + 26);
  const turn = ease(t.c3 + 10, t.south + 2);
  const lat0 = lerp(0, -54, turn);
  const lon0 = lerp(0, 30, turn);
  const baseR = lerp(lerp(MOON_OUTLINE.r, 300, ease(0, t.c3 - 30, EASE.soft)), 330, settle);
  const baseC: [number, number] = [lerp(MOON_OUTLINE.cx, 1430, settle), lerp(MOON_OUTLINE.cy, 500, settle)];
  // push toward the landing site
  const push = interpolate(frame, [t.south + 40, t.south + 70], [0, 1], { ...clamp, easing: EASE.in });
  const zoom = Math.pow(9, push);
  const site0 = moonPoint(baseC[0], baseC[1], baseR, lat0, lon0, LANDING_SITE.lat, LANDING_SITE.lon);
  const target: [number, number] = [lerp(site0.x, 960, push), lerp(site0.y, 540, push)];
  const gC: [number, number] = [target[0] - (site0.x - baseC[0]) * zoom, target[1] - (site0.y - baseC[1]) * zoom];
  const gR = baseR * zoom;
  const site = moonPoint(gC[0], gC[1], gR, lat0, lon0, LANDING_SITE.lat, LANDING_SITE.lon);
  const pole = moonPoint(gC[0], gC[1], gR, lat0, lon0, -90, 0);
  const impactPulse = ease(t.c3, t.c3 + 26, EASE.out);
  const labelsOut = 1 - ease(t.south + 38, t.south + 48);
  const distanceOut = 1 - ease(t.c3 - 22, t.c3 - 8);
  const sunBoost = 1 + 0.18 * Math.max(0, 1 - Math.abs(frame - t.c3 - 2) / 14);

  // ---------------------------------------------------------------- footage + plates
  const footageIn = ease(t.south + 56, t.south + 70);
  const footageOut = ease(t.vikram - 6, t.vikram + 10);
  const titleOut = 1 - ease(t.south + 34, t.south + 46);
  const plateV = ease(t.vikram, t.vikram + 22, EASE.out);
  const plateP = ease(t.pragyan, t.pragyan + 22, EASE.out);
  const heroAt = t.observe - 52;
  const platesOut = ease(heroAt - 10, heroAt + 8);
  const heroIn = ease(heroAt - 2, heroAt + 26);
  const pullBack = ease(durationInFrames - 66, durationInFrames - 22, EASE.inOut);
  const heroScale = interpolate(frame, [heroAt, durationInFrames - 62], [1.0, 1.07], { ...clamp, easing: EASE.soft }) - 0.13 * pullBack;
  const heroText = 1 - ease(durationInFrames - 60, durationInFrames - 42);

  return (
    <AbsoluteFill>
      <Paper />
      {/* distance roll, lands on "scale". The ink copy sits on paper and the ivory copy inside
          the night iris, so its colour flips exactly at the iris edge; gone before the title hit. */}
      <DistanceRoll at={t.curiosity - 14} ink={C.navy} soft={C.inkSoft} chipBg="rgba(197,139,54,0.18)" chipInk={C.terracotta} opacity={distanceOut} />
      <AbsoluteFill style={{ clipPath: `circle(${lerp(MOON_OUTLINE.r * 0.9, 2300, night)}px at ${baseC[0]}px ${baseC[1]}px)`, opacity: night > 0 ? 1 : 0 }}>
        <Night stars={0.75} />
        <DistanceRoll at={t.curiosity - 14} ink={C.ivory} soft="rgba(245,235,221,0.7)" chipBg="rgba(217,169,92,0.2)" chipInk={C.goldSoft} opacity={distanceOut} />
      </AbsoluteFill>

      {/* ---------------- globe ---------------- */}
      <AbsoluteFill style={{ opacity: 1 - footageIn }}>
        {/* soft glow behind the lit globe */}
        <div
          style={{
            position: "absolute",
            left: gC[0] - gR * 1.5,
            top: gC[1] - gR * 1.5,
            width: gR * 3,
            height: gR * 3,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(170,190,215,0.16) 0%, rgba(170,190,215,0.05) 40%, rgba(0,0,0,0) 66%)",
            opacity: night,
          }}
        />
        <MoonGlobe
          cx={gC[0]}
          cy={gC[1]}
          r={gR}
          lat0={lat0}
          lon0={lon0}
          ink={inkAmt}
          reveal={reveal}
          sun={[-0.62 * sunBoost, 0.38, 0.69 * sunBoost]}
        />
        <MoonOverlay
          cx={gC[0]}
          cy={gC[1]}
          r={gR}
          lat0={lat0}
          lon0={lon0}
          graticule={interpolate(frame, [26, 110], [0, 1], { ...clamp, easing: EASE.inOut }) * (1 - night * 0.75)}
          graticuleColor={night > 0.5 ? "#D8E2EE" : C.navy}
          polar={ease(t.south - 4, t.south + 14) * (1 - push)}
          limb={(1 - night) * 1}
        />
        {/* impact ring */}
        {frame >= t.c3 && frame < t.c3 + 30 ? (
          <div
            style={{
              position: "absolute",
              left: gC[0] - gR * (1 + impactPulse * 0.45),
              top: gC[1] - gR * (1 + impactPulse * 0.45),
              width: gR * 2 * (1 + impactPulse * 0.45),
              height: gR * 2 * (1 + impactPulse * 0.45),
              borderRadius: "50%",
              border: `2px solid ${C.goldSoft}`,
              opacity: 1 - impactPulse,
            }}
          />
        ) : null}
        {/* south pole + landing site */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {pole.visible ? (
            <g opacity={ease(t.south, t.south + 12) * (1 - push)} stroke="#F2E6D2" strokeWidth={1.4}>
              <line x1={pole.x - 7} y1={pole.y} x2={pole.x + 7} y2={pole.y} />
              <line x1={pole.x} y1={pole.y - 7} x2={pole.x} y2={pole.y + 7} />
            </g>
          ) : null}
          {site.visible ? (
            <g opacity={ease(t.south + 8, t.south + 20)}>
              <circle cx={site.x} cy={site.y} r={5} fill={C.goldSoft} />
              <circle
                cx={site.x}
                cy={site.y}
                r={10 + 16 * ((frame - t.south) % 30) / 30}
                fill="none"
                stroke={C.goldSoft}
                strokeWidth={1.6}
                opacity={1 - ((frame - t.south) % 30) / 30}
              />
              <line
                x1={site.x - 10}
                y1={site.y + 7}
                x2={LABEL_X + 14}
                y2={LABEL_Y + 14}
                stroke={C.goldSoft}
                strokeWidth={1.2}
                pathLength={1}
                strokeDasharray={`${ease(t.south + 2, t.south + 14, EASE.out)} 1`}
                opacity={labelsOut}
              />
            </g>
          ) : null}
        </svg>
        <div style={{ opacity: labelsOut }}>
          <Tag x={LABEL_X} y={LABEL_Y} at={t.south + 6} color={C.goldSoft} size={20} align="right">
            CHANDRAYAAN-3 LANDING SITE
          </Tag>
          <Tag x={LABEL_X} y={LABEL_Y + 32} at={t.south + 10} color="#E9DFCF" size={18} align="right">
            69.37° S · 32.32° E
          </Tag>
          <Tag x={pole.x + 14} y={pole.y - 8} at={t.south + 6} color="#E9DFCF" size={15}>
            SOUTH POLE
          </Tag>
        </div>
      </AbsoluteFill>

      {/* ---------------- text over the globe ---------------- */}
      <div style={{ opacity: 1 - night }}>
        <Eyebrow index="04" label="EXPLORE" at={16} />
        <SourceCaption at={60} style={{ left: 140, bottom: 64, width: 620 }}>
          Maria traced from NASA’s Lunar Reconnaissance Orbiter colour map (NASA SVS)
        </SourceCaption>
      </div>
      <div style={{ opacity: night * titleOut }}>
        <Eyebrow index="04" label="EXPLORE" at={t.scale + 20} color={C.goldSoft} />
        <div style={{ position: "absolute", left: 132, top: 292 }}>
          <KineticTitle text="CHANDRAYAAN-3" at={t.c3} size={120} color={C.white} stagger={1.1} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 140,
            top: 438,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 40,
            letterSpacing: "0.3em",
            color: C.goldSoft,
            opacity: ease(t.date, t.date + 12),
            translate: `0px ${(1 - ease(t.date, t.date + 18, EASE.out)) * 16}px`,
          }}
        >
          23 AUGUST 2023
        </div>
        <div
          style={{
            position: "absolute",
            left: 140,
            top: 506,
            width: 700,
            fontFamily: F.serif,
            fontStyle: "italic",
            fontSize: 34,
            lineHeight: 1.3,
            color: "rgba(245,235,221,0.86)",
            opacity: ease(t.south + 4, t.south + 18),
          }}
        >
          Soft landing near the Moon’s south polar region, not at the pole itself.
        </div>
        <SourceCaption at={t.c3 + 10} dark style={{ left: 140, bottom: 64, width: 760 }}>
          Globe: NASA SVS CGI Moon Kit (LRO data), lit for illustration
        </SourceCaption>
      </div>

      {/* ---------------- ISRO approach footage ---------------- */}
      <AbsoluteFill style={{ opacity: footageIn * (1 - footageOut), backgroundColor: C.night }}>
        <AbsoluteFill style={{ scale: interpolate(frame, [t.south + 56, t.vikram + 10], [1.02, 1.1], clamp) }}>
          <Video
            src={staticFile("video/c3-lpdc-approach.mp4")}
            from={t.south + 52}
            durationInFrames={t.vikram + 14 - (t.south + 52)}
            premountFor={fps}
            muted
            objectFit="cover"
            style={{ width: 1920, height: 1080, filter: "contrast(1.06)" }}
          />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(4,9,15,0.78) 0%, rgba(4,9,15,0) 24%)" }} />
        <SourceCaption at={t.south + 64} dark style={{ left: 140, bottom: 64, width: 1100 }}>
          Chandrayaan-3’s Lander Position Detection Camera approaching the Moon · 15 Aug 2023 · Video: ISRO (GODL-India)
        </SourceCaption>
      </AbsoluteFill>

      {/* ---------------- Vikram & Pragyan ---------------- */}
      <AbsoluteFill style={{ opacity: footageOut * (1 - platesOut) }}>
        <div
          style={{
            position: "absolute",
            left: 140,
            top: PLATE.top,
            width: PLATE.w,
            height: PLATE.h,
            overflow: "hidden",
            clipPath: `inset(${(1 - plateV) * 100}% 0 0 0)`,
            boxShadow: "0 0 0 1px rgba(232,184,103,0.35)",
          }}
        >
          <Img
            src={staticFile("img/c3-vikram-navcam-0735.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 0%",
              scale: interpolate(frame, [t.vikram, heroAt], [1.06, 1], clamp),
              transformOrigin: "50% 20%",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 1020,
            top: PLATE.top,
            width: PLATE.w,
            height: PLATE.h,
            overflow: "hidden",
            clipPath: `inset(${(1 - plateP) * 100}% 0 0 0)`,
            boxShadow: "0 0 0 1px rgba(232,184,103,0.35)",
            backgroundColor: "#000",
          }}
        >
          <Video
            src={staticFile("video/c3-pragyan-rampdown.mp4")}
            from={t.pragyan - 4}
            trimBefore={3 * fps}
            premountFor={fps}
            muted
            objectFit="cover"
            style={{ width: PLATE.w, height: PLATE.h }}
          />
        </div>
        <div style={{ position: "absolute", left: 140, top: PLATE.top + PLATE.h + 24, width: PLATE.w }}>
          <KineticTitle text="VIKRAM LANDER" at={t.vikram + 8} size={40} color={C.white} stagger={0.8} tracking="0.06em" />
        </div>
        <SourceCaption at={t.vikram + 14} dark style={{ left: 140, top: PLATE.top + PLATE.h + 82, width: PLATE.w }}>
          Photographed by the Pragyan rover’s navigation camera · 30 Aug 2023 · Image: ISRO
        </SourceCaption>
        <div style={{ position: "absolute", left: 1020, top: PLATE.top + PLATE.h + 24, width: PLATE.w }}>
          <KineticTitle text="PRAGYAN ROVER" at={t.pragyan + 8} size={40} color={C.white} stagger={0.8} tracking="0.06em" />
        </div>
        <SourceCaption at={t.pragyan + 14} dark style={{ left: 1020, top: PLATE.top + PLATE.h + 82, width: PLATE.w }}>
          Rolling down Vikram’s ramp, seen by the lander’s imager camera · 23 Aug 2023 · Video: ISRO
        </SourceCaption>
        <Tag x={140} y={96} at={t.vikram + 4} color={C.goldSoft} size={19}>
          ON THE LUNAR SURFACE · IN THEIR OWN IMAGES
        </Tag>
      </AbsoluteFill>

      {/* ---------------- hero hold: Vikram from 15 m ---------------- */}
      <AbsoluteFill style={{ opacity: heroIn * (1 - ease(durationInFrames - 40, durationInFrames - 22)) }}>
        <div
          style={{
            position: "absolute",
            left: 860,
            top: 70 + 70 * pullBack,
            width: 940,
            height: 940,
            scale: heroScale,
            transformOrigin: "50% 40%",
            WebkitMaskImage:
              "radial-gradient(ellipse 72% 70% at 50% 52%, #000 55%, rgba(0,0,0,0) 100%)",
            maskImage: "radial-gradient(ellipse 72% 70% at 50% 52%, #000 55%, rgba(0,0,0,0) 100%)",
          }}
        >
          <Img src={staticFile("img/c3-vikram-navcam-1104.jpg")} style={{ width: "100%", height: "100%" }} />
        </div>
        <div style={{ opacity: heroText }}>
          <div style={{ position: "absolute", left: 132, top: 330 }}>
            <KineticTitle text="OBSERVE" at={t.observe} size={118} color="rgba(245,235,221,0.6)" stagger={1.4} />
          </div>
          <svg width={600} height={60} style={{ position: "absolute", left: 140, top: 474 }}>
            <line x1={4} y1={30} x2={4 + 250 * ease(t.observe + 22, t.explore - 2, EASE.out)} y2={30} stroke={C.gold} strokeWidth={3} />
            <path d="M246,18 L262,30 L246,42" fill="none" stroke={C.gold} strokeWidth={3} opacity={ease(t.explore - 6, t.explore)} />
          </svg>
          <div style={{ position: "absolute", left: 132, top: 548 }}>
            <KineticTitle text="EXPLORE" at={t.explore} size={118} color={C.white} stagger={1.4} />
          </div>
          <SourceCaption at={heroAt + 18} dark style={{ left: 140, bottom: 64, width: 640 }}>
            Vikram lander from about 15 m, Pragyan rover’s NavCam · 30 Aug 2023 · Image: ISRO (GODL-India)
          </SourceCaption>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
