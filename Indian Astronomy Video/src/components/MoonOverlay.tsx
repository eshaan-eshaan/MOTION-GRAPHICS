// SVG overlays that sit exactly on the MoonGlobe (same orthographic view): graticule,
// south polar region, south pole and the Chandrayaan-3 landing site.
import type React from "react";
import { geoCircle, geoGraticule, geoOrthographic, geoPath } from "d3-geo";

// ISRO (Chandrayaan-2 OHRC image annotation) and NASA LROC: 69.373° S, 32.319° E.
export const LANDING_SITE = { lat: -69.373, lon: 32.319 };

const GRAT = geoGraticule().step([15, 15])();
const POLAR_CAP = geoCircle().center([0, -90]).radius(30)(); // edge at 60° S

export const moonProjection = (cx: number, cy: number, r: number, lat0: number, lon0: number) =>
  geoOrthographic().scale(r).translate([cx, cy]).rotate([-lon0, -lat0, 0]).clipAngle(90).precision(0.3);

/** Screen position of a lat/lon on the globe, and whether it faces the viewer. */
export const moonPoint = (cx: number, cy: number, r: number, lat0: number, lon0: number, lat: number, lon: number) => {
  const p = moonProjection(cx, cy, r, lat0, lon0)([lon, lat]) as [number, number];
  const d = (Math.PI / 180);
  const cosc =
    Math.sin(lat0 * d) * Math.sin(lat * d) + Math.cos(lat0 * d) * Math.cos(lat * d) * Math.cos((lon - lon0) * d);
  return { x: p[0], y: p[1], visible: cosc > 0 };
};

export const MoonOverlay: React.FC<{
  cx: number;
  cy: number;
  r: number;
  lat0: number;
  lon0: number;
  graticule: number;
  graticuleColor: string;
  polar: number;
  limb?: number;
  limbColor?: string;
}> = ({ cx, cy, r, lat0, lon0, graticule, graticuleColor, polar, limb = 0, limbColor = "#17324D" }) => {
  const path = geoPath(moonProjection(cx, cy, r, lat0, lon0));
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {graticule > 0 ? (
        <path
          d={path(GRAT) ?? ""}
          fill="none"
          stroke={graticuleColor}
          strokeWidth={0.9}
          strokeOpacity={0.35}
          pathLength={1}
          strokeDasharray={`${graticule} 1`}
        />
      ) : null}
      {polar > 0 ? (
        <path d={path(POLAR_CAP) ?? ""} fill="rgba(197,139,54,0.14)" stroke="#E8B867" strokeWidth={1.6} strokeDasharray="6 6" opacity={polar} />
      ) : null}
      {limb > 0 ? <circle cx={cx} cy={cy} r={r} fill="none" stroke={limbColor} strokeWidth={2} opacity={limb} /> : null}
    </svg>
  );
};
