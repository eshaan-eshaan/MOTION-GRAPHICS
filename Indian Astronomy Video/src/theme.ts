// Design tokens: palette, type families and shared easing curves.
import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

export const C = {
  ivory: "#F5EBDD",
  ivoryDeep: "#EADBC6",
  navy: "#17324D",
  gold: "#C58B36",
  goldSoft: "#D9A95C",
  terracotta: "#A95137",
  spaceBlue: "#376A94",
  white: "#FFFFFF",
  night: "#07111C",
  nightLift: "#0D2033",
  ink: "rgba(23, 50, 77, 0.9)",
  inkSoft: "rgba(23, 50, 77, 0.55)",
  hairline: "rgba(23, 50, 77, 0.22)",
} as const;

export const F = {
  display: "Space Grotesk",
  body: "Inter",
  serif: "EB Garamond",
  deva: "Tiro Devanagari Sanskrit",
} as const;

// Local fonts only: rendering never depends on a network request.
loadFont({ family: F.display, url: staticFile("fonts/SpaceGrotesk.ttf"), weight: "300 700" });
loadFont({ family: F.body, url: staticFile("fonts/Inter.ttf"), weight: "100 900" });
loadFont({ family: F.serif, url: staticFile("fonts/EBGaramond.ttf"), weight: "400 800" });
loadFont({
  family: F.serif,
  url: staticFile("fonts/EBGaramond-Italic.ttf"),
  weight: "400 800",
  style: "italic",
});
loadFont({ family: F.deva, url: staticFile("fonts/TiroDevanagariSanskrit.ttf") });

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.33, 0, 0.2, 1),
};

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const SAFE = { x: 140, y: 110 };
