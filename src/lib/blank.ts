import type { Product } from "./schema";

export function blankProduct(): Product {
  return {
    id: "",
    slug: "",
    name: "",
    tagline: "",
    published: false,
    demo: false,
    condition: "Novo",
    description: "",
    model: { url: "/models/demo-pro.glb", scale: 10, position: [0, 0, 0], rotation: [0, 0, 0], tintMaterials: [], screenMaterial: undefined },
    camera: {
      fov: 30,
      initial: { position: [1.3, 0.35, 3.3], target: [0, 0, 0] },
      front: { position: [0, 0, 3.6], target: [0, 0, 0] },
      back: { position: [0, 0, -3.6], target: [0, 0, 0] },
      side: { position: [3.4, 0.15, 0.9], target: [0, 0, 0] },
      minDistance: 1.6,
      maxDistance: 6,
    },
    colors: [{ id: "padrao", name: "Padrão", swatch: "#8c8a85", available: true, finishes: {} }],
    capacities: [],
    hotspots: [],
    specs: [],
  };
}

