// Geometry shared across scene boundaries, so each match cut lands exactly.
import type { Pt } from "../lib/geometry";

/** Observe → Calculate: the calendar tightens to this circle. */
export const CAL: Pt = [1330, 570];
export const CAL_HANDOFF_R = 240;

/**
 * Calculate → Measure: Samrat Yantra photo (public/img/jm-samrat-wide.jpg, 3400×2270)
 * is shown at SAMRAT_SCALE, offset SAMRAT_Y. The gnomon's top edge was measured in the
 * photo as y = 0.6362·x − 12.2 (image px) from x = 404 (wall corner) to x = 1945.
 */
export const SAMRAT_SCALE = 0.62;
export const SAMRAT_Y = -10;
export const SAMRAT_PAN = 188;
export const gnomonImage = (x: number): Pt => [x, 0.6362 * x - 12.2];
export const GNOMON_IMAGE_START = 44.5; // where the edge's extension leaves the top of frame
export const GNOMON_IMAGE_CORNER = 404;
export const GNOMON_IMAGE_END = 1945;
export const samratToScreen = ([x, y]: Pt, pan = 0): Pt => [x * SAMRAT_SCALE - pan, y * SAMRAT_SCALE + SAMRAT_Y];
export const GNOMON_SCREEN: [Pt, Pt] = [
  samratToScreen(gnomonImage(GNOMON_IMAGE_START)),
  samratToScreen(gnomonImage(GNOMON_IMAGE_END)),
];

/**
 * Measure → Explore: inner edge of the graduated quadrant in jm-quadrant.jpg, fitted as a
 * circle in 1920×1080 display coordinates (visible from 92.7° to 175.2°, y-down angles).
 */
export const QUADRANT = { cx: 1482.6, cy: -14.7, r: 898.6, from: 92.7, to: 175.2 };

/** …which becomes the outline of the Moon. */
export const MOON_OUTLINE = { cx: 960, cy: 540, r: 280 };
