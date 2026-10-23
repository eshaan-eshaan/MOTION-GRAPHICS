// Vector Earth (Natural Earth 110m land via world-atlas, orthographic projection).
// "diagram" style for the ivory scenes, "night" style for the lunar climax.
import type React from "react";
import { useMemo } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import land110 from "world-atlas/land-110m.json";
import { C } from "../theme";

const topo = land110 as unknown as Topology<{ land: GeometryCollection }>;
const LAND = feature(topo, topo.objects.land);
const GRATICULE = geoGraticule10();

type Props = {
  cx: number;
  cy: number;
  r: number;
  /** Longitude at the centre of the disc (degrees); increasing it turns the Earth eastward. */
  lon: number;
  /** Tilt of the view: latitude at the centre of the disc. */
  lat?: number;
  variant: "diagram" | "night";
  opacity?: number;
  landOpacity?: number;
  graticuleOpacity?: number;
  /** Direction of sunlight on screen, radians (night variant only). */
  sunAngle?: number;
  id?: string;
};

export const EarthGlobe: React.FC<Props> = ({
  cx,
  cy,
  r,
  lon,
  lat = 18,
  variant,
  opacity = 1,
  landOpacity = 1,
  graticuleOpacity = 1,
  sunAngle = -0.6,
  id = "earth",
}) => {
  const { sphere, land, grid } = useMemo(() => {
    const proj = geoOrthographic()
      .scale(r)
      .translate([cx, cy])
      .rotate([-lon, -lat, 0])
      .clipAngle(90)
      .precision(0.4);
    const path = geoPath(proj);
    return {
      sphere: path({ type: "Sphere" }) ?? "",
      land: path(LAND) ?? "",
      grid: path(GRATICULE) ?? "",
    };
  }, [cx, cy, r, lon, lat]);

  const night = variant === "night";
  const lx = cx + Math.cos(sunAngle) * r * 0.55;
  const ly = cy + Math.sin(sunAngle) * r * 0.55;

  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={`${id}-ocean`} cx={lx} cy={ly} r={r * 1.6} gradientUnits="userSpaceOnUse">
          {night ? (
            <>
              <stop offset="0%" stopColor="#4F86B5" />
              <stop offset="45%" stopColor="#24527E" />
              <stop offset="100%" stopColor="#0B1F35" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#FBF4EA" />
              <stop offset="100%" stopColor="#E7D7C1" />
            </>
          )}
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx={lx} cy={ly} r={r * 1.55} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#000" stopOpacity={0} />
          <stop offset="55%" stopColor="#000" stopOpacity={night ? 0.08 : 0} />
          <stop offset="100%" stopColor="#020812" stopOpacity={night ? 0.88 : 0.1} />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={sphere} />
        </clipPath>
      </defs>
      {night ? <circle cx={cx} cy={cy} r={r * 1.035} fill="none" stroke="#7FB2E0" strokeOpacity={0.35} strokeWidth={r * 0.04} /> : null}
      <path d={sphere} fill={`url(#${id}-ocean)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <path d={grid} fill="none" stroke={night ? "#BFD8EE" : C.navy} strokeOpacity={(night ? 0.12 : 0.16) * graticuleOpacity} strokeWidth={0.8} />
        <path
          d={land}
          fill={night ? "#D9C79F" : C.spaceBlue}
          fillOpacity={(night ? 0.92 : 0.22) * landOpacity}
          stroke={night ? "none" : C.navy}
          strokeOpacity={0.55 * landOpacity}
          strokeWidth={0.9}
        />
        <path d={sphere} fill={`url(#${id}-shade)`} />
      </g>
      <path d={sphere} fill="none" stroke={night ? "rgba(190,220,245,0.5)" : C.navy} strokeWidth={night ? 1 : 1.6} />
    </g>
  );
};
