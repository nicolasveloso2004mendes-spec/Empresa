"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Object3D, Vector3, type InstancedMesh } from "three";
import { cine } from "@/lib/animation/store";
import { WORLD } from "@/lib/animation/world";
import { seg, inOut } from "@/lib/animation/math";
import { useSceneVisibility } from "./useSceneVisibility";
import { GOLD } from "./materials";

/**
 * Manifesto field: hundreds of metal fragments the camera flies through.
 * They burst outward exactly when the headline fragments in the DOM.
 */
export function Shards({ count }: { count: number }) {
  const mesh = useSceneVisibility<InstancedMesh>(["manifesto"], 1);
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const ang = Math.random() * Math.PI * 2;
        const rad = 2.8 + Math.pow(Math.random(), 0.7) * 13;
        return {
          base: new Vector3(Math.cos(ang) * rad, Math.sin(ang) * rad * 0.6 + 0.6, gsapRand(WORLD.manifesto.from, WORLD.manifesto.to - 10)),
          dir: new Vector3(Math.cos(ang), Math.sin(ang), 0),
          rot: new Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
          spin: (Math.random() - 0.5) * 0.8,
          s: 0.12 + Math.random() * 0.5,
          gold: Math.random() < 0.18,
        };
      }),
    [count],
  );
  useLayoutEffect(() => {
    const c = new Color();
    data.forEach((d, i) => mesh.current!.setColorAt(i, c.set(d.gold ? GOLD : "#222222")));
    mesh.current!.instanceColor!.needsUpdate = true;
  }, [data, mesh]);

  const o = useMemo(() => new Object3D(), []);
  useFrame((state) => {
    const m = mesh.current;
    if (!m || !m.visible) return;
    const t = state.clock.elapsedTime;
    const burst = inOut(seg(cine.progress.manifesto, 0.36, 0.62)) * 3.5;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      o.position.copy(d.base).addScaledVector(d.dir, burst * (0.4 + d.s));
      o.rotation.set(d.rot.x + t * d.spin, d.rot.y + t * d.spin * 0.7, d.rot.z);
      o.scale.set(d.s, d.s * 1.6, d.s * 0.18);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial metalness={1} roughness={0.25} clearcoat={0.5} flatShading />
    </instancedMesh>
  );
}

function gsapRand(a: number, b: number) {
  return a + (b - a) * Math.random();
}
