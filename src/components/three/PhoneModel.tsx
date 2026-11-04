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
};

/**
 * Renderiza o GLB do produto com materiais PBR próprios (clonados — a cena em cache não é
 * alterada) e transição suave de cor. Os filhos (hotspots) ficam no espaço local do modelo.
 */
export function PhoneModel({ product, variant, screen = 1, instant, children, groupRef, onMaterials }: Props) {
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

  // Tela com wallpaper gerado.
  useEffect(() => {
    const name = product.model.screenMaterial;
    const m = name ? materials.get(name) : undefined;
    if (!m) return;
    m.emissiveMap = getScreenTexture(product.name, product.demo);
    m.emissive = new Color("#ffffff");
    m.color = new Color("#000000");
    m.needsUpdate = true;
  }, [materials, product.model.screenMaterial, product.name, product.demo]);

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
    const name = product.model.screenMaterial;
    const sm = name ? materials.get(name) : undefined;
    if (sm) sm.emissiveIntensity += (screen * 0.95 - sm.emissiveIntensity) * Math.min(1, dt * 3);
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

  const { scale, position, rotation } = product.model;
  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale} name="product-root">
      <primitive object={scene} />
      {children}
    </group>
  );
}
