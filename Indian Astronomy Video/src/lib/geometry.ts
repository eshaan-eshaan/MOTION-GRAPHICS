// Small deterministic geometry / randomness helpers shared by the diagrams.

export type Pt = [number, number];

/** Deterministic PRNG (mulberry32) so star fields are identical on every frame and render. */
export const seeded = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
];

export const DEG = Math.PI / 180;

/** Point on a circle; angle in degrees, counter-clockwise on screen (y down). */
export const polar = (cx: number, cy: number, r: number, deg: number): Pt => [
  cx + r * Math.cos(deg * DEG),
  cy - r * Math.sin(deg * DEG),
];

export const arcPoints = (
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
  n = 120,
): Pt[] =>
  Array.from({ length: n }, (_, i) =>
    polar(cx, cy, r, fromDeg + ((toDeg - fromDeg) * i) / (n - 1)),
  );

export const toPath = (pts: Pt[], close = false) =>
  pts.length === 0
    ? ""
    : `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}${close ? "Z" : ""}`;

/** Resample a polyline to n points evenly spaced along its length (for morphing). */
export const resample = (pts: Pt[], n: number): Pt[] => {
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = seg[seg.length - 1];
  const out: Pt[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const d = (total * i) / (n - 1);
    while (j < seg.length - 2 && seg[j + 1] < d) j++;
    const t = (d - seg[j]) / Math.max(seg[j + 1] - seg[j], 1e-9);
    out.push(lerpPt(pts[j], pts[j + 1], Math.min(1, Math.max(0, t))));
  }
  return out;
};

export const morph = (a: Pt[], b: Pt[], t: number) => a.map((p, i) => lerpPt(p, b[i], t));

/** External tangent of two circles (upper or lower), returned as the two touch points. */
export const externalTangent = (
  c1: Pt,
  r1: number,
  c2: Pt,
  r2: number,
  upper: boolean,
): [Pt, Pt] => {
  const dx = c2[0] - c1[0];
  const dy = c2[1] - c1[1];
  const d = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx);
  const a = Math.acos((r1 - r2) / d);
  const ang = base + (upper ? -a : a);
  return [
    [c1[0] + r1 * Math.cos(ang), c1[1] + r1 * Math.sin(ang)],
    [c2[0] + r2 * Math.cos(ang), c2[1] + r2 * Math.sin(ang)],
  ];
};

/** Internal (crossing) tangent of two circles. */
export const internalTangent = (
  c1: Pt,
  r1: number,
  c2: Pt,
  r2: number,
  upper: boolean,
): [Pt, Pt] => {
  const dx = c2[0] - c1[0];
  const dy = c2[1] - c1[1];
  const d = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx);
  const a = Math.acos((r1 + r2) / d);
  const ang = base + (upper ? -a : a);
  return [
    [c1[0] + r1 * Math.cos(ang), c1[1] + r1 * Math.sin(ang)],
    [c2[0] - r2 * Math.cos(ang), c2[1] - r2 * Math.sin(ang)],
  ];
};

/** Extend segment a→b to parameter t (t=1 is b). */
export const extend = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
