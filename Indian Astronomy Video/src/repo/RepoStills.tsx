// Stills for the GitHub repository: README banners and a design-system sheet, built from
// the film's own components so they match it exactly.
import type React from "react";
import { AbsoluteFill } from "remotion";
import { Night, Paper } from "../components/Backgrounds";
import { MoonGlobe } from "../components/MoonGlobe";
import { C, F } from "../theme";

const W = 1600;

const Rings: React.FC<{ cx: number; cy: number; radii: number[]; color: string; ticksR: number; opacity?: number }> = ({
  cx,
  cy,
  radii,
  color,
  ticksR,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    {radii.map((r) => (
      <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.45} />
    ))}
    {Array.from({ length: 120 }, (_, i) => {
      const a = (i * 3 * Math.PI) / 180;
      const L = i % 5 === 0 ? 16 : 7;
      return (
        <line
          key={i}
          x1={cx + ticksR * Math.cos(a)}
          y1={cy + ticksR * Math.sin(a)}
          x2={cx + (ticksR + L) * Math.cos(a)}
          y2={cy + (ticksR + L) * Math.sin(a)}
          stroke={color}
          strokeOpacity={0.55}
          strokeWidth={i % 5 === 0 ? 1.3 : 0.8}
        />
      );
    })}
  </g>
);

/** 1600×800 banner for the project README. */
export const ProjectBanner: React.FC = () => {
  const moon = { cx: 1190, cy: 400, r: 250 };
  return (
    <AbsoluteFill>
      <Night stars={1}>
        <svg width={W} height={800} style={{ position: "absolute", inset: 0 }}>
          <Rings cx={moon.cx} cy={moon.cy} radii={[300, 345, 420]} color={C.goldSoft} ticksR={420} />
          <path
            d={`M ${moon.cx + 345 * Math.cos(-2.6)} ${moon.cy + 345 * Math.sin(-2.6)} A 345 345 0 0 1 ${moon.cx + 345 * Math.cos(-0.35)} ${moon.cy + 345 * Math.sin(-0.35)}`}
            fill="none"
            stroke={C.gold}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <circle cx={moon.cx + 345 * Math.cos(-0.35)} cy={moon.cy + 345 * Math.sin(-0.35)} r={4} fill="#FFF4DC" />
          <circle cx={moon.cx + 345 * Math.cos(-0.35)} cy={moon.cy + 345 * Math.sin(-0.35)} r={16} fill={C.goldSoft} opacity={0.25} />
        </svg>
        <MoonGlobe cx={moon.cx} cy={moon.cy} r={moon.r} lat0={-28} lon0={18} ink={0} width={W} height={800} sun={[-0.7, 0.35, 0.62]} />
        <div style={{ position: "absolute", left: 96, top: 150 }}>
          <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 20, letterSpacing: "0.34em", color: C.goldSoft }}>
            A FILM IN SIX SCENES · 105 SECONDS
          </div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 118, lineHeight: 0.98, color: C.ivory, marginTop: 26 }}>
            INDIAN
            <br />
            ASTRONOMY
          </div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 40, color: "rgba(245,235,221,0.86)", marginTop: 22 }}>
            From ancient skies to lunar exploration
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 40, fontFamily: F.body, fontWeight: 600, fontSize: 19, letterSpacing: "0.3em" }}>
            {["OBSERVE", "CALCULATE", "MEASURE", "EXPLORE"].map((w, i) => (
              <span key={w} style={{ color: i === 3 ? C.goldSoft : "rgba(245,235,221,0.7)" }}>
                {w}
                {i < 3 ? <span style={{ color: C.gold, marginLeft: 22 }}>→</span> : null}
              </span>
            ))}
          </div>
        </div>
      </Night>
    </AbsoluteFill>
  );
};

/** 1600×560 banner for the MOTION-GRAPHICS root README. */
export const RootBanner: React.FC = () => (
  <AbsoluteFill>
    <Paper>
      <svg width={W} height={560} style={{ position: "absolute", inset: 0 }}>
        <Rings cx={1330} cy={280} radii={[120, 190, 270]} color={C.navy} ticksR={270} opacity={0.7} />
        <path d="M 1060 280 A 270 270 0 0 1 1521 89" fill="none" stroke={C.gold} strokeWidth={3} strokeLinecap="round" />
        <circle cx={1521} cy={89} r={6} fill={C.gold} />
        <circle cx={1330} cy={280} r={36} fill={C.navy} />
        <circle cx={1330 + 190 * Math.cos(0.9)} cy={280 + 190 * Math.sin(0.9)} r={12} fill={C.terracotta} />
      </svg>
      <div style={{ position: "absolute", left: 96, top: 112 }}>
        <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 20, letterSpacing: "0.34em", color: C.terracotta }}>
          FILMS BUILT IN CODE · REACT + REMOTION
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 150, lineHeight: 0.95, color: C.navy, marginTop: 22, letterSpacing: "-0.01em" }}>
          MOTION
          <br />
          <span style={{ color: C.terracotta }}>GRAPHICS</span>
        </div>
      </div>
    </Paper>
  </AbsoluteFill>
);

const SWATCHES: [string, string, string][] = [
  ["Warm ivory", C.ivory, "paper, end card"],
  ["Deep navy", C.navy, "ink, headlines"],
  ["Saffron gold", C.gold, "sky paths, emphasis"],
  ["Terracotta", C.terracotta, "labels, accents"],
  ["Space blue", C.spaceBlue, "Moon's path, Earth"],
  ["Night", C.night, "opening & lunar climax"],
];

/** 1600×790 design-system sheet. */
export const DesignSystem: React.FC = () => (
  <AbsoluteFill>
    <Paper>
      <div style={{ position: "absolute", left: 96, top: 80, fontFamily: F.body, fontWeight: 600, fontSize: 20, letterSpacing: "0.34em", color: C.terracotta }}>
        DESIGN SYSTEM
      </div>
      <div style={{ position: "absolute", left: 96, top: 128, display: "flex", gap: 22 }}>
        {SWATCHES.map(([name, hex, use]) => (
          <div key={name} style={{ width: 218 }}>
            <div style={{ height: 150, backgroundColor: hex, borderRadius: 6, boxShadow: "inset 0 0 0 1px rgba(23,50,77,0.18)" }} />
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: C.navy, marginTop: 14 }}>{name}</div>
            <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 17, letterSpacing: "0.12em", color: C.inkSoft, marginTop: 4 }}>{hex.toUpperCase()}</div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 21, color: C.inkSoft, marginTop: 2 }}>{use}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 96, top: 440, right: 96, height: 1, backgroundColor: C.hairline }} />
      <div style={{ position: "absolute", left: 96, top: 476, display: "grid", gridTemplateColumns: "640px 640px", columnGap: 120, rowGap: 34 }}>
        {(
          [
            ["Space Grotesk · headlines", <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 84, color: C.navy, lineHeight: 1 }}>OBSERVE</span>],
            ["Inter · labels & captions", <span style={{ fontFamily: F.body, fontWeight: 600, fontSize: 30, letterSpacing: "0.3em", color: C.navy }}>23 AUGUST 2023</span>],
            ["EB Garamond · historical accents", <span style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 46, color: C.terracotta }}>Āryabhaṭīya, Golapāda 9</span>],
            ["Tiro Devanagari Sanskrit · the source text", <span style={{ fontFamily: F.deva, fontSize: 44, color: C.navy }}>अचलानि भानि तद्वत्</span>],
          ] as const
        ).map(([label, specimen]) => (
          <div key={label}>
            <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 16, letterSpacing: "0.24em", color: C.inkSoft, marginBottom: 12 }}>
              {label.toUpperCase()}
            </div>
            {specimen}
          </div>
        ))}
      </div>
    </Paper>
  </AbsoluteFill>
);
