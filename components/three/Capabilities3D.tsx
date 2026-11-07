"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Edges } from "@react-three/drei";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Object3D,
  Vector3,
  type Group,
  type InstancedMesh,
  type LineBasicMaterial,
} from "three";
import { WORLD } from "@/lib/animation/world";
import type { Tier } from "@/hooks/useDeviceTier";
import { useSceneVisibility } from "./useSceneVisibility";
import { Gold, Graphite, GOLD, GOLD_HI } from "./materials";

/**
 * Six visual metaphors on one lateral track. The Director trucks the camera
 * from one to the next while the DOM list follows.
 */
export function Capabilities3D({ tier }: { tier: Tier }) {
  const root = useSceneVisibility<Group>(["capabilities"], 1);
  const C = WORLD.caps;
  const at = (i: number): [number, number, number] => [C.x + i * WORLD.capsSpacing, C.y, C.z];
  return (
    <group ref={root}>
      <Panes position={at(0)} />
      <Knot position={at(1)} />
      <Network position={at(2)} count={tier === "low" ? 45 : 80} />
      <Flow position={at(3)} />
      <Systems position={at(4)} />
      <Gyro position={at(5)} />
    </group>
  );
}

type P = { position: [number, number, number] };

/* 01 — interfaces floating in depth */
function Panes({ position }: P) {
  const g = useRef<Group>(null);
  const panes = useMemo(
    () => [
      { p: [-1.6, 0.9, -1.6], r: 0.25, w: 2.6, h: 1.6 },
      { p: [1.4, 0.4, -0.6], r: -0.3, w: 2.2, h: 1.4 },
      { p: [-0.4, -0.5, 0.6], r: 0.1, w: 2.8, h: 1.7 },
      { p: [1.8, -1.2, 1.4], r: -0.2, w: 1.2, h: 2.1 },
      { p: [-2.2, -1.3, 1.2], r: 0.35, w: 1.4, h: 0.9 },
    ],
    [],
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    g.current?.children.forEach((c, i) => {
      c.position.y = panes[i].p[1] + Math.sin(t * 0.7 + i) * 0.12;
      c.rotation.y = panes[i].r + Math.sin(t * 0.3 + i) * 0.06;
    });
  });
  return (
    <group position={position} ref={g}>
      {panes.map((pn, i) => (
        <group key={i} position={pn.p as [number, number, number]} rotation-y={pn.r}>
          <RoundedBox args={[pn.w, pn.h, 0.04]} radius={0.03}>
            <Graphite rough={0.4} />
            <Edges color={i === 2 ? GOLD_HI : GOLD} threshold={20} />
          </RoundedBox>
          {/* UI skeleton */}
          {[0.32, 0.12, -0.05, -0.2].map((y, j) => (
            <mesh key={j} position={[-pn.w * 0.15 + (j === 0 ? 0 : 0.0), y * pn.h, 0.025]}>
              <planeGeometry args={[pn.w * (j === 0 ? 0.55 : 0.6 - j * 0.1), j === 0 ? 0.12 : 0.04]} />
              <meshBasicMaterial color={j === 0 ? GOLD : "#3a3a3a"} />
            </mesh>
          ))}
          <mesh position={[pn.w * 0.28, -pn.h * 0.25, 0.025]}>
            <planeGeometry args={[pn.w * 0.28, 0.14]} />
            <meshBasicMaterial color={GOLD_HI} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* 02 — a living metallic form */
function Knot({ position }: P) {
  const m = useRef<Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (!m.current) return;
    m.current.rotation.set(t * 0.2, t * 0.3, 0);
    const k = 1 + Math.sin(t * 1.2) * 0.04;
    m.current.scale.set(k, 1 / k, k);
  });
  return (
    <group position={position}>
      <group ref={m}>
        <mesh>
          <torusKnotGeometry args={[1.3, 0.36, 220, 32, 2, 3]} />
          <Gold rough={0.14} />
        </mesh>
      </group>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[2.6, 0.008, 8, 200]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

/* 03 — neural network of connections */
function Network({ position, count }: P & { count: number }) {
  const g = useRef<Group>(null);
  const nodes = useRef<InstancedMesh>(null);
  const lineMat = useRef<LineBasicMaterial>(null);
  const { pts, lines } = useMemo(() => {
    const pts = Array.from({ length: count }, () => new Vector3().randomDirection().multiplyScalar(1.2 + Math.random() * 1.6));
    const pos: number[] = [];
    pts.forEach((a, i) =>
      pts.forEach((b, j) => {
        if (j > i && a.distanceTo(b) < 1.05) pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }),
    );
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    return { pts, lines: geo };
  }, [count]);
  const o = useMemo(() => new Object3D(), []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (g.current) g.current.rotation.y = t * 0.15;
    if (lineMat.current) lineMat.current.opacity = 0.28 + Math.sin(t * 2) * 0.12;
    const m = nodes.current;
    if (!m) return;
    pts.forEach((p, i) => {
      o.position.copy(p);
      o.scale.setScalar(0.045 + Math.max(0, Math.sin(t * 2.4 - i * 0.7)) * 0.05);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={position} ref={g}>
      <instancedMesh ref={nodes} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={[2.2, 1.7, 0.6]} toneMapped={false} />
      </instancedMesh>
      <lineSegments geometry={lines}>
        <lineBasicMaterial ref={lineMat} color={GOLD} transparent opacity={0.3} depthWrite={false} />
      </lineSegments>
      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <Graphite rough={0.2} />
      </mesh>
    </group>
  );
}

/* 04 — data flowing between interfaces */
function Flow({ position }: P) {
  const packets = useRef<InstancedMesh>(null);
  const nodes: [number, number, number][] = useMemo(
    () => [
      [-2.4, 1.0, -0.6],
      [2.3, 1.3, -1.0],
      [0.2, -1.4, 0.8],
      [-2.2, -1.2, 1.2],
    ],
    [],
  );
  const curves = useMemo(
    () =>
      [
        [0, 1],
        [1, 2],
        [0, 2],
        [3, 2],
        [0, 3],
      ].map(([a, b]) => {
        const A = new Vector3(...nodes[a]);
        const B = new Vector3(...nodes[b]);
        const mid = A.clone().add(B).multiplyScalar(0.5).add(new Vector3(0, 0.8, 0.9));
        return new CatmullRomCurve3([A, mid, B]);
      }),
    [nodes],
  );
  const N = 18;
  const o = useMemo(() => new Object3D(), []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const m = packets.current;
    if (!m) return;
    for (let i = 0; i < N; i++) {
      const c = curves[i % curves.length];
      const u = (t * 0.22 + i / N) % 1;
      c.getPointAt(u, o.position);
      o.scale.setScalar(0.06);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={position}>
      {nodes.map((n, i) => (
        <RoundedBox key={i} args={[1.3, 0.8, 0.05]} radius={0.03} position={n}>
          <Graphite rough={0.4} />
          <Edges color={GOLD} threshold={20} />
        </RoundedBox>
      ))}
      {curves.map((c, i) => (
        <mesh key={i}>
          <tubeGeometry args={[c, 48, 0.008, 6, false]} />
          <meshBasicMaterial color={GOLD} transparent opacity={0.55} />
        </mesh>
      ))}
      <instancedMesh ref={packets} args={[undefined, undefined, N]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={[3, 2.3, 0.9]} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* 05 — panels and structures in perspective */
function Systems({ position }: P) {
  const bars = useRef<InstancedMesh>(null);
  const cols = 9;
  const rows = 5;
  const o = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const c = new Color();
    for (let i = 0; i < cols * rows; i++) bars.current!.setColorAt(i, c.set(i % 7 === 0 ? GOLD : "#202020"));
    bars.current!.instanceColor!.needsUpdate = true;
  }, []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const m = bars.current;
    if (!m) return;
    let k = 0;
    for (let x = 0; x < cols; x++)
      for (let z = 0; z < rows; z++) {
        const h = 0.25 + (Math.sin(t * 0.9 + x * 0.6 + z * 0.9) * 0.5 + 0.5) * 1.6;
        o.position.set((x - (cols - 1) / 2) * 0.55, h / 2 - 1.3, (z - (rows - 1) / 2) * 0.55);
        o.scale.set(0.4, h, 0.4);
        o.updateMatrix();
        m.setMatrixAt(k++, o.matrix);
      }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={position} rotation={[0.35, -0.6, 0]}>
      <instancedMesh ref={bars} args={[undefined, undefined, cols * rows]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial metalness={0.9} roughness={0.3} clearcoat={0.4} />
      </instancedMesh>
      <mesh position={[0, -1.32, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[6, 3.6, 12, 8]} />
        <meshBasicMaterial color={GOLD} wireframe transparent opacity={0.25} />
      </mesh>
      <RoundedBox args={[3.2, 1.8, 0.04]} radius={0.03} position={[0.4, 1.6, -1.8]}>
        <Graphite rough={0.4} />
        <Edges color={GOLD} threshold={20} />
      </RoundedBox>
    </group>
  );
}

/* 06 — strategy: aligned orbits around a target */
function Gyro({ position }: P) {
  const g = useRef<Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    g.current?.children.forEach((c, i) => {
      c.rotation.x = t * (0.2 + i * 0.12) * (i % 2 ? 1 : -1);
      c.rotation.y = t * (0.15 + i * 0.08);
    });
  });
  return (
    <group position={position}>
      <group ref={g}>
        {[1.2, 1.7, 2.2, 2.7].map((r, i) => (
          <mesh key={r}>
            <torusGeometry args={[r, i === 1 ? 0.04 : 0.018, 16, 160]} />
            {i % 2 ? <Gold rough={0.16} /> : <meshStandardMaterial color="#F5F5F5" metalness={1} roughness={0.25} />}
          </mesh>
        ))}
      </group>
      <mesh>
        <sphereGeometry args={[0.5, 48, 48]} />
        <Gold rough={0.1} />
      </mesh>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} rotation-z={r}>
          <boxGeometry args={[6.4, 0.008, 0.008]} />
          <meshBasicMaterial color={GOLD} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
