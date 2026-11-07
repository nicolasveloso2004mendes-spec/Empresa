import { projects } from "@/data/projects";

/**
 * Single source of truth shared by GSAP (DOM) and React Three Fiber (WebGL).
 *
 * GSAP/ScrollTrigger only WRITE normalized numbers here (0..1 per scene).
 * R3F only READS them inside useFrame and damps its own objects.
 * No React state is involved in the hot path → no re-renders, no GSAP/R3F fights.
 */
export const SCENES = [
  "intro",
  "hero",
  "manifesto",
  ...projects.map((p) => `work-${p.slug}`),
  "capabilities",
  "lab",
  "final",
] as const;

export type SceneId = string;

export const SCENE_LABELS: Record<string, string> = {
  intro: "Abertura",
  hero: "Além do digital",
  manifesto: "Manifesto",
  capabilities: "Serviços",
  lab: "Laboratório",
  final: "Contato",
  ...Object.fromEntries(projects.map((p) => [`work-${p.slug}`, p.client])),
};

type DeviceFocus = "auto" | "desktop" | "mobile";

export const cine = {
  /** progress 0..1 of each pinned scene */
  progress: Object.fromEntries(SCENES.map((s) => [s, 0])) as Record<string, number>,
  /** index into SCENES of the scene currently owning the viewport */
  active: 0,
  /** 0..1 over the whole document */
  global: 0,
  /** time-based intro (light appears before the user scrolls) */
  introAuto: 0,
  /** normalized pointer -1..1 */
  pointer: { x: 0, y: 0 },
  /** per project device focus chosen by the visitor */
  device: Object.fromEntries(projects.map((p) => [p.slug, "auto"])) as Record<string, DeviceFocus>,
  reduced: false,
};

export function recomputeActive() {
  let a = 0;
  for (let i = 0; i < SCENES.length; i++) if (cine.progress[SCENES[i]] > 0) a = i;
  cine.active = a;
}

/** cheap pub/sub for the few DOM bits that need React state (HUD, toggles) */
type Listener = () => void;
const listeners = new Set<Listener>();
export const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const emit = () => listeners.forEach((l) => l());
