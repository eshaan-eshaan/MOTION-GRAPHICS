// Real-sky projections built from the Yale Bright Star Catalog subset in data/stars.json.
import stars from "../data/stars.json";
import { DEG, type Pt } from "./geometry";

export type Star = { ra: number; dec: number; mag: number; hr: number };

const toStars = (rows: number[][]): Star[] =>
  rows.map(([ra, dec, mag, hr]) => ({ ra, dec, mag, hr }));

export const POLAR_STARS = toStars(stars.polar).filter((s) => s.mag < 5.25);
export const TAURUS_STARS = toStars(stars.taurus);

export const HR = {
  capella: 1708,
  polaris: 424,
  aldebaran: 1457,
  betelgeuse: 2061,
  bellatrix: 1790,
  meissa: 1879,
  phi1Ori: 1876,
  phi2Ori: 1907,
  mintaka: 1852,
  alnilam: 1903,
  alnitak: 1948,
  saiph: 2004,
  rigel: 1713,
  elnath: 1791,
  zetaTau: 1910,
  gammaTau: 1346,
  delta1Tau: 1373,
  epsilonTau: 1409,
  theta2Tau: 1412,
  alcyone: 1165,
  atlas: 1178,
  electra: 1142,
  maia: 1149,
  merope: 1156,
  taygeta: 1145,
  pleione: 1180,
} as const;

/** Star radius in px from visual magnitude. */
export const starSize = (mag: number, scale = 1) =>
  scale * Math.max(0.55, 3.1 - 0.52 * (mag + 0.4));

// ---------------------------------------------------------------------------- polar chart
// Azimuthal-equidistant projection about the north celestial pole, oriented as an
// observer facing north sees it: hour angle increases counter-clockwise, so the whole
// sky turns counter-clockwise as time passes.
export const POLE: Pt = [1300, 520];
export const POLAR_K = 8.64; // px per degree of polar distance (Capella's circle ≈ 380 px)

export const polarProject = (s: { ra: number; dec: number }, lstDeg: number): Pt => {
  const r = (90 - s.dec) * POLAR_K;
  const theta = (lstDeg - s.ra) * DEG;
  return [POLE[0] - r * Math.sin(theta), POLE[1] - r * Math.cos(theta)];
};

// ---------------------------------------------------------------------------- Taurus chart
// Equirectangular projection centred on the Taurus–Orion field; RA increases to the left
// (east), as on a sky chart.
export const TAURUS_CENTER = { ra: 72.5, dec: 9.5 };
export const TAURUS_SCALE = 19.5; // px per degree
export const TAURUS_ORIGIN: Pt = [1330, 560];

export const taurusProject = (ra: number, dec: number): Pt => {
  const k = TAURUS_SCALE;
  const c = Math.cos(TAURUS_CENTER.dec * DEG);
  return [
    TAURUS_ORIGIN[0] - (ra - TAURUS_CENTER.ra) * k * c,
    TAURUS_ORIGIN[1] - (dec - TAURUS_CENTER.dec) * k,
  ];
};

const OBLIQUITY = 23.4393 * DEG;

/** Ecliptic (λ, β in degrees) → equatorial (RA, Dec in degrees). */
export const eclipticToEquatorial = (lambda: number, beta = 0) => {
  const l = lambda * DEG;
  const b = beta * DEG;
  const dec = Math.asin(
    Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l),
  );
  const ra = Math.atan2(
    Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY),
    Math.cos(l),
  );
  return { ra: ((ra / DEG) + 360) % 360, dec: dec / DEG };
};

export const MOON_INCLINATION = 5.145;
/** Ascending node used for the drawn lunar path (illustrative epoch). */
export const MOON_NODE = 85;

export const sunPathPoint = (lambda: number): Pt => {
  const { ra, dec } = eclipticToEquatorial(lambda, 0);
  return taurusProject(ra, dec);
};

export const moonPathPoint = (lambda: number): Pt => {
  const beta = MOON_INCLINATION * Math.sin((lambda - MOON_NODE) * DEG);
  const { ra, dec } = eclipticToEquatorial(lambda, beta);
  return taurusProject(ra, dec);
};

export const findStar = (list: Star[], hr: number) => {
  const s = list.find((x) => x.hr === hr);
  if (!s) throw new Error(`Star HR ${hr} not in catalogue subset`);
  return s;
};
