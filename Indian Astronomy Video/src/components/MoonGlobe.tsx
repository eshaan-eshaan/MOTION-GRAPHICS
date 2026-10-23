// Moon globe rendered per pixel on a canvas from NASA's LRO colour map (NASA SVS CGI Moon
// Kit) and an ink-drawing map derived from it. The same projection serves the "drawn
// diagram" (ink) and the lit globe (colour), so one dissolves into the other exactly.
//
// View convention: the disc centre faces selenographic (lat0, lon0); north is up and east
// (Mare Crisium side) is to the right, as seen from Earth. Matches d3.geoOrthographic with
// rotate([-lon0, -lat0]) so SVG overlays (graticule, markers) line up.
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

type Texture = { data: Uint8ClampedArray; w: number; h: number };
const cache = new Map<string, Promise<Texture>>();

const loadTexture = (src: string) => {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise<Texture>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(img, 0, 0);
          resolve({ data: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height });
        };
        img.onerror = () => reject(new Error(`Could not load ${src}`));
        img.src = src;
      }),
    );
  }
  return cache.get(src)!;
};

export type MoonGlobeProps = {
  cx: number;
  cy: number;
  r: number;
  lat0: number;
  lon0: number;
  /** 0 = lit colour globe, 1 = ink drawing on paper. */
  ink: number;
  /** Sunlight direction in view space (x right, y up, z toward viewer). */
  sun?: [number, number, number];
  /** Ink reveal: fraction of the disc radius drawn so far (radial sweep). */
  reveal?: number;
  paper?: [number, number, number];
  inkColor?: [number, number, number];
  width?: number;
  height?: number;
  style?: React.CSSProperties;
};

const DEG = Math.PI / 180;

export const MoonGlobe: React.FC<MoonGlobeProps> = ({
  cx,
  cy,
  r,
  lat0,
  lon0,
  ink,
  sun = [-0.55, 0.32, 0.77],
  reveal = 1,
  paper = [245, 235, 221],
  inkColor = [23, 50, 77],
  width = 1920,
  height = 1080,
  style,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tex, setTex] = useState<{ color: Texture; ink: Texture } | null>(null);
  const [handle] = useState(() => delayRender("Loading Moon textures"));

  useEffect(() => {
    Promise.all([loadTexture(staticFile("img/moon-lroc-2k.jpg")), loadTexture(staticFile("img/moon-ink-2k.png"))])
      .then(([color, inkTex]) => {
        setTex({ color, ink: inkTex });
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
      });
  }, [handle]);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || !tex) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);
    const x0 = Math.max(0, Math.floor(cx - r - 2));
    const x1 = Math.min(width, Math.ceil(cx + r + 2));
    const y0 = Math.max(0, Math.floor(cy - r - 2));
    const y1 = Math.min(height, Math.ceil(cy + r + 2));
    const bw = x1 - x0;
    const bh = y1 - y0;
    if (bw <= 0 || bh <= 0) return;
    const out = ctx.createImageData(bw, bh);
    const o = out.data;

    // basis: T toward viewer, U up (north-ward), R = U × T (east)
    const p0 = lat0 * DEG;
    const l0 = lon0 * DEG;
    const T = [Math.cos(p0) * Math.cos(l0), Math.cos(p0) * Math.sin(l0), Math.sin(p0)];
    const U = [-Math.sin(p0) * Math.cos(l0), -Math.sin(p0) * Math.sin(l0), Math.cos(p0)];
    const R = [U[1] * T[2] - U[2] * T[1], U[2] * T[0] - U[0] * T[2], U[0] * T[1] - U[1] * T[0]];
    const sl = Math.hypot(sun[0], sun[1], sun[2]);
    const sx = sun[0] / sl;
    const sy = sun[1] / sl;
    const sz = sun[2] / sl;

    const C = tex.color;
    const I = tex.ink;
    const cw = C.w;
    const ch = C.h;
    const cd = C.data;
    const iw = I.w;
    const ih = I.h;
    const id = I.data;
    const inv = 1 / r;
    const inkK = Math.max(0, Math.min(1, ink));
    const revealR = reveal;

    for (let py = 0; py < bh; py++) {
      const vy = -((y0 + py + 0.5 - cy) * inv);
      for (let px = 0; px < bw; px++) {
        const vx = (x0 + px + 0.5 - cx) * inv;
        const d2 = vx * vx + vy * vy;
        const k = (py * bw + px) * 4;
        if (d2 >= 1.0 + 2 * inv) {
          o[k + 3] = 0;
          continue;
        }
        const dist = Math.sqrt(d2);
        const edge = Math.max(0, Math.min(1, (1 - dist) * r + 0.5));
        const vz = Math.sqrt(Math.max(0, 1 - d2));
        const bx = vx * R[0] + vy * U[0] + vz * T[0];
        const by = vx * R[1] + vy * U[1] + vz * T[1];
        const bz = vx * R[2] + vy * U[2] + vz * T[2];
        const lat = Math.asin(Math.max(-1, Math.min(1, bz)));
        const lon = Math.atan2(by, bx);

        // colour (bilinear)
        let u = (lon / (2 * Math.PI) + 0.5) * cw - 0.5;
        let v = (0.5 - lat / Math.PI) * ch - 0.5;
        if (u < 0) u += cw;
        const ux = Math.floor(u);
        const vyi = Math.max(0, Math.min(ch - 2, Math.floor(v)));
        const fu = u - ux;
        const fv = Math.max(0, Math.min(1, v - vyi));
        const ux1 = (ux + 1) % cw;
        const i00 = (vyi * cw + (ux % cw)) * 4;
        const i10 = (vyi * cw + ux1) * 4;
        const i01 = ((vyi + 1) * cw + (ux % cw)) * 4;
        const i11 = ((vyi + 1) * cw + ux1) * 4;
        const w00 = (1 - fu) * (1 - fv);
        const w10 = fu * (1 - fv);
        const w01 = (1 - fu) * fv;
        const w11 = fu * fv;
        let cr = cd[i00] * w00 + cd[i10] * w10 + cd[i01] * w01 + cd[i11] * w11;
        let cg = cd[i00 + 1] * w00 + cd[i10 + 1] * w10 + cd[i01 + 1] * w01 + cd[i11 + 1] * w11;
        let cb = cd[i00 + 2] * w00 + cd[i10 + 2] * w10 + cd[i01 + 2] * w01 + cd[i11 + 2] * w11;

        // lunar-like lighting: mostly Lommel–Seeliger with a little Lambert, soft terminator
        const mu0 = vx * sx + vy * sy + vz * sz;
        const lit = mu0 > 0 ? (mu0 / (mu0 + vz + 0.05)) * 1.55 * 0.8 + mu0 * 0.35 : 0;
        const term = Math.max(0, Math.min(1, (mu0 + 0.06) / 0.16));
        const shade = Math.min(1.25, lit * term) + 0.025;
        cr = cr * shade;
        cg = cg * shade;
        cb = cb * shade * 1.02;

        let rr = cr;
        let gg = cg;
        let bb = cb;
        if (inkK > 0) {
          const iu = Math.floor(((lon / (2 * Math.PI) + 0.5) * iw) % iw);
          const iv = Math.max(0, Math.min(ih - 1, Math.floor((0.5 - lat / Math.PI) * ih)));
          let a = 1 - id[(iv * iw + iu) * 4] / 255; // ink amount
          if (dist > revealR) a = 0;
          const pr = paper[0] + (inkColor[0] - paper[0]) * a;
          const pg = paper[1] + (inkColor[1] - paper[1]) * a;
          const pb = paper[2] + (inkColor[2] - paper[2]) * a;
          rr = rr + (pr - rr) * inkK;
          gg = gg + (pg - gg) * inkK;
          bb = bb + (pb - bb) * inkK;
        }
        o[k] = rr;
        o[k + 1] = gg;
        o[k + 2] = bb;
        o[k + 3] = 255 * edge;
      }
    }
    ctx.putImageData(out, x0, y0);
  }, [tex, cx, cy, r, lat0, lon0, ink, sun, reveal, paper, inkColor, width, height]);

  return <canvas ref={ref} width={width} height={height} style={{ position: "absolute", left: 0, top: 0, ...style }} />;
};
