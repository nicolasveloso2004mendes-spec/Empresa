"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, IcosahedronGeometry, EdgesGeometry, Object3D, Vector3, type Group, type InstancedMesh } from "three";
import { cine } from "@/lib/animation/store";
import { WORLD } from "@/lib/animation/world";
import { seg, smooth, inOut } from "@/lib/animation/math";
import type { Tier } from "@/hooks/useDeviceTier";
import { useSceneVisibility } from "./useSceneVisibility";
import { Gold, Graphite, GOLD } from "./materials";

/**
 * Hero sculpture: a faceted graphite core wrapped by a shell of instanced
 * plates (one draw call) that breathe open with scroll and lean toward the cursor.
 */
export function Sculpture({ tier }: { tier: Tier }) {
  const root = useSceneVisibility<Group>(["intro", "hero", "manifesto"], 0);
  const body = useRef<Group>(null);
  const plates = useRef<InstancedMesh>(null);
  const rings = useRef<Group>(null);
  const count = tier === "high" ? 180 : tier === "mid" ? 130 : 90;

  const core = useMemo(() => new IcosahedronGeometry(1.25, 1), []);
  const edges = useMemo(() => new EdgesGeometry(new IcosahedronGeometry(1.27, 1)), []);
  const layout = useMemo(() => {
    // fibonacci sphere → evenly spread plates
    const out: { n: Vector3; s: number; gold: boolean; phase: number }[] = [];
    const g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = g * i;
      const n = new Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
      out.push({ n, s: 0.7 + Math.random() * 0.7, gold: Math.random() < 0.16, phase: Math.random() * Math.PI * 2 });
    }
    return out;
  }, [count]);

  useLayoutEffect(() => {
    const m = plates.current!;
    const c = new Color();
    layout.forEach((l, i) => m.setColorAt(i, c.set(l.gold ? GOLD : "#1d1d1d")));
    m.instanceColor!.needsUpdate = true;
  }, [layout]);

  const dummy = useMemo(() => new Object3D(), []);
  const lean = useRef({ x: 0, y: 0 });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const hp = cine.progress.hero;
    const mp = cine.progress.manifesto;
    const open = smooth(seg(hp, 0.1, 0.9)) * 0.55 + smooth(seg(mp, 0.05, 0.3)) * 1.4;
    lean.current.x += (cine.pointer.y * 0.35 - lean.current.x) * Math.min(1, dt * 2.5);
    lean.current.y += (cine.pointer.x * 0.5 - lean.current.y) * Math.min(1, dt * 2.5);

    if (body.current) {
      body.current.rotation.y = t * 0.12 + lean.current.y + inOut(hp) * 1.2;
      body.current.rotation.x = lean.current.x + Math.sin(t * 0.25) * 0.08;
      body.current.position.y = Math.sin(t * 0.6) * 0.08 + inOut(hp) * 0.35;
    }
    if (rings.current) {
      rings.current.children.forEach((r, i) => {
        r.rotation.x = Math.PI / 2 + Math.sin(t * 0.2 + i) * 0.35 + lean.current.x * (i + 1) * 0.3;
        r.rotation.y = t * (0.08 + i * 0.05) * (i % 2 ? -1 : 1);
      });
    }
    const m = plates.current;
    if (!m) return;
    for (let i = 0; i < layout.length; i++) {
      const l = layout[i];
      const breathe = Math.sin(t * 0.8 + l.phase) * 0.04;
      const r = 1.85 + breathe + open * (0.6 + (i % 5) * 0.12);
      dummy.position.copy(l.n).multiplyScalar(r);
      dummy.lookAt(0, 0, 0);
      dummy.rotateZ(l.phase + t * 0.05);
      dummy.scale.set(0.34 * l.s, 0.2 * l.s, 0.05);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={root} position={WORLD.hero}>
      <group ref={body}>
        <mesh geometry={core}>
          <Graphite rough={0.28} />
        </mesh>
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={GOLD} transparent opacity={0.55} />
        </lineSegments>
        {/* the inner light leaking between plates */}
        <mesh scale={0.55}>
          <icosahedronGeometry args={[1, 2]} />
          <meshBasicMaterial color={[2.4, 1.8, 0.6]} toneMapped={false} />
        </mesh>
        <instancedMesh ref={plates} args={[undefined, undefined, layout.length]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial metalness={0.95} roughness={0.3} clearcoat={0.5} />
        </instancedMesh>
        {/* spine */}
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 9, 8]} />
          <Gold />
        </mesh>
      </group>
      <group ref={rings}>
        {[3.1, 3.55, 4.1].map((r, i) => (
          <mesh key={r}>
            <torusGeometry args={[r, i === 1 ? 0.022 : 0.01, 12, 220, i === 2 ? Math.PI * 1.3 : Math.PI * 2]} />
            {i === 1 ? <Gold rough={0.15} /> : <meshStandardMaterial color="#F5F5F5" metalness={1} roughness={0.3} />}
          </mesh>
        ))}
      </group>
      {/* stage disc */}
      <mesh position={[0, -3.4, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[3.8, 3.84, 160]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, -3.41, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[3.8, 96]} />
        <meshStandardMaterial color="#0b0b0b" metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}
