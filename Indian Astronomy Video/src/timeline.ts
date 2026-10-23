// Film timing. Everything is derived from src/data/cues.json (shared with the music
// generator) and the measured narration word timings, so picture, voice, music and SFX
// cannot drift apart.
import cues from "./data/cues.json";
import voTiming from "../public/audio/vo/vo-timing.json";

export const FPS = cues.fps;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = cues.durationInFrames;

export type SceneId =
  | "opening"
  | "observation"
  | "aryabhata"
  | "jantarMantar"
  | "chandrayaan"
  | "closing";

const ORDER: SceneId[] = [
  "opening",
  "observation",
  "aryabhata",
  "jantarMantar",
  "chandrayaan",
  "closing",
];

export type SceneTiming = {
  /** Global frame at which the scene's local frame 0 plays. */
  from: number;
  durationInFrames: number;
};

// Each transition is centred on its cut point, so scene k runs from
// (cut[k-1] - L/2) to (cut[k] + L/2). The TransitionSeries overlap then sums exactly
// to TOTAL_FRAMES.
const cutFrames = cues.cuts.map((s) => Math.round(s * FPS));
export const TRANSITIONS = cues.transitionFrames;

export const SCENES = ORDER.reduce(
  (acc, id, i) => {
    const from = i === 0 ? 0 : cutFrames[i - 1] - TRANSITIONS[i - 1] / 2;
    const end =
      i === ORDER.length - 1 ? TOTAL_FRAMES : cutFrames[i] + TRANSITIONS[i] / 2;
    acc[id] = { from, durationInFrames: end - from };
    return acc;
  },
  {} as Record<SceneId, SceneTiming>,
);

export type VoId = keyof typeof cues.vo;

type VoRecord = {
  file: string;
  duration: number;
  text: string;
  words: { text: string; start: number; end: number }[];
};

const VO = voTiming as unknown as Record<VoId, VoRecord>;

export const voLine = (id: VoId) => {
  const rec = VO[id];
  const startSec = cues.vo[id];
  return {
    id,
    file: rec.file,
    from: Math.round(startSec * FPS),
    durationInFrames: Math.ceil(rec.duration * FPS),
    speechStart: startSec + rec.words[0].start,
    speechEnd: startSec + rec.words[rec.words.length - 1].end,
  };
};

export const VO_IDS = Object.keys(cues.vo) as VoId[];

/** Global frame at which word `index` of a narration line starts. */
export const wordFrame = (id: VoId, index: number) =>
  Math.round((cues.vo[id] + VO[id].words[index].start) * FPS);

/** Convert a global frame to a scene's local frame. */
export const local = (scene: SceneId, globalFrame: number) =>
  globalFrame - SCENES[scene].from;

/** Local frame (within `scene`) at which word `index` of line `id` is spoken. */
export const cue = (scene: SceneId, id: VoId, index: number) =>
  local(scene, wordFrame(id, index));

export const sec = (s: number) => Math.round(s * FPS);

export const MUSIC = cues.music;
