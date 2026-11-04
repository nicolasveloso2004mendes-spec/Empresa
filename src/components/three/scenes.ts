import type { Product, Vec3 } from "@/lib/schema";

export const firstAvailableColor = (p: Product) => p.colors.find((c) => c.available) ?? p.colors[0];

/** Espelha um vetor por uma rotação de 180° no eixo Y. */
export const mirrorY = ([x, y, z]: Vec3): Vec3 => [-x, y, -z];

export type StoryKey = { cam: Vec3; target: Vec3; rotY: number; float: number; screen: number };

/**
 * Roteiro do scroll storytelling, derivado da configuração do produto
 * (o close das câmeras usa o hotspot "cameras", se existir).
 */
export function storyKeys(p: Product, mobile: boolean): StoryKey[] {
  const far = mobile ? 1.3 : 1;
  const cams = p.hotspots.find((h) => h.id === "cameras");
  const camClose: StoryKey = cams
    ? { cam: mirrorY(cams.camera.position), target: mirrorY(cams.camera.target), rotY: Math.PI, float: 0, screen: 0.3 }
    : { cam: [0, 0.4, 2.2], target: [0, 0.3, 0], rotY: Math.PI, float: 0, screen: 0.3 };
  if (mobile) camClose.cam = camClose.cam.map((v, i) => (i === 2 ? v * 1.25 : v)) as Vec3;
  return [
    { cam: [0.3, 0.15, 4.4 * far], target: [0, 0, 0], rotY: -0.45, float: 1, screen: 0.6 },
    camClose,
    { cam: [0, 0.05, 3.7 * far], target: [0, 0, 0], rotY: Math.PI + 0.55, float: 0.4, screen: 0.2 },
    { cam: [0, 0, 3.4 * far], target: [0, 0.02, 0], rotY: Math.PI * 2, float: 0.2, screen: 1 },
    { cam: [0.2, 0.25, 4.6 * far], target: [0, 0.1, 0], rotY: Math.PI * 2 + 0.35, float: 1, screen: 1 },
  ];
}
