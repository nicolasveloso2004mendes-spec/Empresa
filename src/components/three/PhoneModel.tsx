"use client";
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Group, Material, Mesh, MeshStandardMaterial, Object3D } from "three";
import type { ColorVariant, Product } from "@/lib/schema";
import { useProductGLTF } from "./loader";
import { getScreenTexture } from "./screenTexture";

type Target = { color: Color; metalness?: number; roughness?: number };

/** Calcula o acabamento-alvo de cada material para a variante de cor escolhida. */
export function resolveFinishes(product: Product, variant: ColorVariant): Record<string, Target> {
  const out: Record<string, Target> = {};
  for (const name of product.model.tintMaterials) out[name] = { color: new Color(variant.swatch) };
  for (const [name, f] of Object.entries(variant.finishes)) {
    out[name] = { color: new Color(f.color), metalness: f.metalness, roughness: f.roughness };
  }
  return out;
}

type Props = {
  product: Product;
  variant: ColorVariant;
  /** Intensidade da tela (0 = apagada). */
  screen?: number;
  /** Transição instantânea (prefers-reduced-motion). */
  instant?: boolean;
  children?: ReactNode;
  groupRef?: RefObject<Group | null>;
  onMaterials?: (m: Map<string, MeshStandardMaterial>) => void;
  /** Valores-alvo (0..1) das articulações, por id. Ausente = valor padrão do produto. */
  articulation?: Record<string, number>;
  /** Recebe os valores animados atuais (para hotspots condicionados). */
  articulationRef?: RefObject<Record<string, number>>;
};

/**
 * Renderiza o GLB do produto com materiais PBR próprios (clonados — a cena em cache não é
 * alterada) e transição suave de cor. Os filhos (hotspots) ficam no espaço local do modelo.
 */
export function PhoneModel({ product, variant, screen = 1, instant, children, groupRef, onMaterials, articulation, articulationRef }: Props) {
  const url = variant.modelUrl ?? product.model.url;
  const gltf = useProductGLTF(url);
  const localRef = useRef<Group>(null);
  const ref = groupRef ?? localRef;

  const { scene, materials } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const materials = new Map<string, MeshStandardMaterial>();
    scene.traverse((o: Object3D) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const swap = (m: Material) => {
        const key = m.name || m.uuid;
        let clone = materials.get(key);
        if (!clone) {
          clone = (m as MeshStandardMaterial).clone();
          clone.envMapIntensity = 1.15;
          materials.set(key, clone);
        }
        return clone;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    });
    return { scene, materials };
  }, [gltf.scene]);

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);
  useEffect(() => onMaterials?.(materials), [materials, onMaterials]);

  // Telas com wallpaper gerado (nomes "Inner*" recebem a versão larga, para dobráveis).
  const screenNames = useMemo(
    () => [...new Set([product.model.screenMaterial, ...product.model.screenMaterials].filter(Boolean) as string[])],
    [product.model.screenMaterial, product.model.screenMaterials],
  );
  useEffect(() => {
    for (const name of screenNames) {
      const m = materials.get(name);
      if (!m) continue;
      m.emissiveMap = getScreenTexture(product.name, product.demo, name.startsWith("Inner"));
      m.emissive = new Color("#ffffff");
      m.color = new Color("#000000");
      m.needsUpdate = true;
    }
  }, [materials, screenNames, product.name, product.demo]);

  // Articulações: guarda a rotação base de cada nó e interpola o ângulo a cada quadro.
  type Joint = { a: Product["model"]["articulations"][number]; parts: { axis: "x" | "y" | "z"; from: number; to: number; node: Object3D; base: number }[] };
  const joints = useRef<Joint[]>([]);
  useEffect(() => {
    joints.current = product.model.articulations.map((a) => ({
      a,
      parts: a.parts.flatMap((p) => {
        const node = scene.getObjectByName(p.node);
        return node ? [{ axis: p.axis, from: p.from, to: p.to, node, base: node.rotation[p.axis] }] : [];
      }),
    }));
  }, [scene, product.model.articulations]);
  const current = useRef<Record<string, number>>({});
  useFrame((_, dt) => {
    const k = instant ? 1 : 1 - Math.exp(-dt * 3.2);
    for (const { a, parts } of joints.current) {
      const goal = articulation?.[a.id] ?? a.default;
      const prev = current.current[a.id] ?? goal;
      const v = Math.abs(goal - prev) < 0.0005 ? goal : prev + (goal - prev) * k;
      current.current[a.id] = v;
      // Mutação imperativa do grafo de cena a cada quadro (padrão do R3F, fora do render).
      // eslint-disable-next-line react-hooks/immutability
      for (const j of parts) j.node.rotation[j.axis] = j.base + j.from + (j.to - j.from) * v;
    }
    if (articulationRef) articulationRef.current = current.current;
    // Posição do modelo (+ deslocamento de articulações, ex.: centralizar o dobrável aberto).
    const g = ref.current;
    if (g) {
      const [px, py, pz] = product.model.position;
      let sx = 0, sy = 0, sz = 0;
      for (const { a } of joints.current) {
        if (!a.shift) continue;
        const v = current.current[a.id] ?? a.default;
        sx += a.shift.from[0] + (a.shift.to[0] - a.shift.from[0]) * v;
        sy += a.shift.from[1] + (a.shift.to[1] - a.shift.from[1]) * v;
        sz += a.shift.from[2] + (a.shift.to[2] - a.shift.from[2]) * v;
      }
      g.position.set(px + sx, py + sy, pz + sz);
    }
  });

  const targets = useMemo(() => resolveFinishes(product, variant), [product, variant]);
  const settled = useRef(false);
  useEffect(() => {
    settled.current = false;
  }, [targets]);

  // Aplica imediatamente na primeira montagem para não "piscar" a cor padrão do GLB.
  const first = useRef(true);
  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    for (const [name, t] of Object.entries(targets)) {
      const m = materials.get(name);
      if (!m) continue;
      m.color.copy(t.color);
      if (t.metalness !== undefined) m.metalness = t.metalness;
      if (t.roughness !== undefined) m.roughness = t.roughness;
    }
  }, [materials, targets]);

  useFrame((_, dt) => {
    for (const name of screenNames) {
      const sm = materials.get(name);
      if (sm) sm.emissiveIntensity += (screen * 0.95 - sm.emissiveIntensity) * Math.min(1, dt * 3);
    }
    if (settled.current) return;
    const k = instant ? 1 : 1 - Math.exp(-dt * 5); // ~0,6 s
    let done = true;
    for (const [n, t] of Object.entries(targets)) {
      const m = materials.get(n);
      if (!m) continue;
      m.color.lerp(t.color, k);
      if (t.metalness !== undefined) m.metalness += (t.metalness - m.metalness) * k;
      if (t.roughness !== undefined) m.roughness += (t.roughness - m.roughness) * k;
      const dc = Math.abs(m.color.r - t.color.r) + Math.abs(m.color.g - t.color.g) + Math.abs(m.color.b - t.color.b);
      if (dc > 0.002) done = false;
    }
    if (done) settled.current = true;
  });

  const { scale, rotation } = product.model;
  // A posição é aplicada a cada quadro (inclui o deslocamento das articulações).
  return (
    <group ref={ref} rotation={rotation} scale={scale} name="product-root">
      <primitive object={scene} />
      {children}
    </group>
  );
}
