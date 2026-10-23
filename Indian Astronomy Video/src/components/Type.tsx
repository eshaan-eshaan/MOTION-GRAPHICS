// Typography primitives: kinetic headline, eyebrow, labels and source captions.
import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, EASE, F, clamp } from "../theme";

type KineticTitleProps = {
  text: string;
  /** Local frame the reveal starts. */
  at: number;
  size: number;
  color?: string;
  /** Frames between letters. */
  stagger?: number;
  weight?: number;
  tracking?: string;
  style?: React.CSSProperties;
  font?: string;
};

/** Letters rise out of a mask on a well-damped spring: precise, not bouncy. */
export const KineticTitle: React.FC<KineticTitleProps> = ({
  text,
  at,
  size,
  color = C.navy,
  stagger = 1.4,
  weight = 700,
  tracking = "-0.01em",
  style,
  font = F.display,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: tracking,
        color,
        whiteSpace: "pre",
        display: "flex",
        overflow: "hidden",
        paddingBottom: size * 0.08,
        ...style,
      }}
    >
      {[...text].map((ch, i) => {
        const p = spring({
          frame: frame - at - i * stagger,
          fps,
          config: { damping: 200, stiffness: 140, mass: 0.9 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              translate: `0px ${(1 - p) * size * 1.05}px`,
              opacity: interpolate(p, [0, 0.35], [0, 1], clamp),
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** A whole line that slides up from a mask (for longer phrases). */
export const MaskLine: React.FC<{
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  duration?: number;
  out?: number;
}> = ({ at, children, style, duration = 22, out }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + duration], [0, 1], { ...clamp, easing: EASE.out });
  const o = out === undefined ? 1 : interpolate(frame, [out, out + 14], [1, 0], clamp);
  return (
    <div style={{ overflow: "hidden", ...style, opacity: o * (style?.opacity === undefined ? 1 : Number(style.opacity)) }}>
      <div style={{ translate: `0px ${(1 - p) * 110}%` }}>{children}</div>
    </div>
  );
};

export const Eyebrow: React.FC<{
  index: string;
  label: string;
  at: number;
  color?: string;
  out?: number;
  style?: React.CSSProperties;
}> = ({ index, label, at, color = C.terracotta, out, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 20], [0, 1], { ...clamp, easing: EASE.out });
  const o = out === undefined ? 1 : interpolate(frame, [out, out + 12], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        top: 112,
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: 22,
        letterSpacing: "0.32em",
        color,
        opacity: p * o,
        ...style,
      }}
    >
      <span>{index}</span>
      <span style={{ width: 56 * p, height: 1.5, backgroundColor: color, display: "inline-block" }} />
      <span>{label}</span>
    </div>
  );
};

/** Provenance caption for authentic imagery: always on screen while the image is. */
export const SourceCaption: React.FC<{
  children: React.ReactNode;
  at: number;
  out?: number;
  dark?: boolean;
  style?: React.CSSProperties;
}> = ({ children, at, out, dark = false, style }) => {
  const frame = useCurrentFrame();
  const i = interpolate(frame, [at, at + 14], [0, 1], clamp);
  const o = out === undefined ? 1 : interpolate(frame, [out, out + 10], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: F.body,
        fontWeight: 500,
        fontSize: 19,
        letterSpacing: "0.04em",
        lineHeight: 1.45,
        color: dark ? "rgba(245,235,221,0.78)" : "rgba(23,50,77,0.72)",
        opacity: i * o,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        ...style,
      }}
    >
      <span
        style={{
          width: 18,
          height: 1.5,
          marginTop: 13,
          flexShrink: 0,
          backgroundColor: dark ? C.goldSoft : C.terracotta,
        }}
      />
      <span>{children}</span>
    </div>
  );
};

/** Small uppercase annotation used on diagrams. */
export const Tag: React.FC<{
  children: React.ReactNode;
  x: number;
  y: number;
  at: number;
  out?: number;
  color?: string;
  size?: number;
  align?: "left" | "right" | "center";
  style?: React.CSSProperties;
}> = ({ children, x, y, at, out, color = C.navy, size = 21, align = "left", style }) => {
  const frame = useCurrentFrame();
  const i = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: EASE.out });
  const o = out === undefined ? 1 : interpolate(frame, [out, out + 10], [1, 0], clamp);
  const tx = align === "left" ? "0%" : align === "right" ? "-100%" : "-50%";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: `${tx} ${(1 - i) * 8}px`,
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "0.18em",
        color,
        opacity: i * o,
        whiteSpace: "nowrap",
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
