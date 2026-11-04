import { z } from "zod";

/** Vetor 3D [x, y, z]. */
export const vec3 = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
export type Vec3 = z.infer<typeof vec3>;

const id = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Use apenas letras minúsculas, números e hífen");

const text = (max = 200) => z.string().trim().max(max);

/** Caminho de modelo: arquivo público (/models/...) ou enviado pelo admin (/api/models/...). */
export const modelUrl = z
  .string()
  .regex(/^\/(models\/[a-z0-9-]+\.(glb|gltf)|api\/models\/[a-f0-9-]{36}\.(glb|gltf))$/, "Caminho de modelo inválido");

export const imageUrl = z
  .string()
  .regex(/^\/(posters\/[a-z0-9-]+\.(png|jpg|jpeg|webp)|api\/uploads\/[a-f0-9-]{36}\.(png|jpg|webp))$/, "Caminho de imagem inválido");

export const cameraView = z.object({
  position: vec3,
  target: vec3,
});
export type CameraView = z.infer<typeof cameraView>;

/** Acabamento aplicado a um material do GLB (por nome do material). */
export const finish = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  metalness: z.number().min(0).max(1).optional(),
  roughness: z.number().min(0).max(1).optional(),
});
export type Finish = z.infer<typeof finish>;

export const colorVariant = z.object({
  id,
  name: text(60).min(1),
  swatch: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  available: z.boolean(),
  /** Acabamento por nome de material. Materiais ausentes recebem o swatch se estiverem em tintMaterials. */
  finishes: z.record(z.string().max(64), finish).default({}),
  /** Se a variante exige geometria/textura diferente, aponta para outro arquivo. */
  modelUrl: modelUrl.optional(),
});
export type ColorVariant = z.infer<typeof colorVariant>;

export const capacity = z.object({
  id,
  label: text(30).min(1),
  /** Preço em reais. null = não cadastrado (exibe "Consulte"). */
  price: z.number().positive().max(1_000_000).nullable(),
  available: z.boolean(),
});
export type Capacity = z.infer<typeof capacity>;

export const spec = z.object({ label: text(60).min(1), value: text(200).min(1) });
export type Spec = z.infer<typeof spec>;

/** Peça móvel do modelo (ex.: dobradiça de dobrável). Valor 0..1 interpola os ângulos. */
export const articulationPart = z.object({
  node: z.string().min(1).max(64),
  axis: z.enum(["x", "y", "z"]),
  from: z.number().min(-7).max(7),
  to: z.number().min(-7).max(7),
});
export const articulation = z.object({
  id,
  label: text(40).min(1),
  /** Textos dos botões que levam ao valor 0 e ao valor 1, ex.: ["Abrir", "Fechar"]. */
  labels: z.tuple([text(20).min(1), text(20).min(1)]),
  default: z.number().min(0).max(1),
  parts: z.array(articulationPart).min(1).max(8),
  /** Deslocamento do modelo inteiro (coordenadas do mundo) entre os estados 0 e 1 — mantém o aparelho centralizado. */
  shift: z.object({ from: vec3, to: vec3 }).optional(),
});
export type Articulation = z.infer<typeof articulation>;

export const hotspot = z.object({
  id,
  label: text(40).min(1),
  /** Posição no espaço LOCAL do modelo (antes de escala/posição). */
  position: vec3,
  /** Normal da superfície (espaço local), usada para ocultar o hotspot quando está de costas. */
  normal: vec3,
  /** Câmera de foco, em coordenadas do mundo. */
  camera: cameraView,
  title: text(80).min(1),
  description: text(600),
  specs: z.array(spec).max(12).default([]),
  /** true apenas quando as informações foram conferidas com a ficha oficial do aparelho real. */
  verified: z.boolean(),
  /** Hotspot que depende de uma articulação (ex.: tela interna só com o aparelho aberto). */
  articulation: z.object({ id, value: z.number().min(0).max(1) }).optional(),
});
export type Hotspot = z.infer<typeof hotspot>;

export const product = z.object({
  id,
  slug: id,
  name: text(80).min(1),
  /** Identificador da categoria (data/categories.json). */
  category: id.default("outros"),
  tagline: text(160).default(""),
  published: z.boolean(),
  /** Modelo demonstrativo (não representa um aparelho comercial). Exibe selo na interface. */
  demo: z.boolean(),
  condition: text(60).min(1),
  description: text(1200).default(""),
  poster: imageUrl.optional(),
  model: z.object({
    url: modelUrl,
    scale: z.number().positive().max(10_000),
    position: vec3,
    rotation: vec3,
    /** Materiais do GLB que recebem a cor da variante quando não há acabamento específico. */
    tintMaterials: z.array(z.string().max(64)).max(20).default([]),
    /** Nome do material da tela (recebe um wallpaper gerado). Opcional. */
    screenMaterial: z.string().max(64).optional(),
    /** Telas adicionais (ex.: tela interna e externa de dobráveis). Nomes iniciados por "Inner" recebem wallpaper largo. */
    screenMaterials: z.array(z.string().max(64)).max(6).default([]),
    articulations: z.array(articulation).max(4).default([]),
  }),
  camera: z.object({
    fov: z.number().min(15).max(75),
    initial: cameraView,
    front: cameraView,
    back: cameraView,
    side: cameraView,
    minDistance: z.number().positive(),
    maxDistance: z.number().positive(),
  }),
  colors: z.array(colorVariant).min(1).max(16),
  capacities: z.array(capacity).max(8).default([]),
  hotspots: z.array(hotspot).max(12).default([]),
  specs: z.array(spec).max(30).default([]),
  whatsappMessage: text(300).optional(),
  updatedAt: z.string().optional(),
});
export type Product = z.infer<typeof product>;

export const productList = z.array(product);

export const category = z.object({
  id,
  slug: id,
  name: text(40).min(1),
  description: text(240).default(""),
  order: z.number().int().min(0).max(999),
});
export type Category = z.infer<typeof category>;
export const categoryList = z.array(category).max(40);
