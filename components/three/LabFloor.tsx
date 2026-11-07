"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, MeshBasicMaterial } from "three";
import { WORLD } from "@/lib/animation/world";
import { useSceneVisibility } from "./useSceneVisibility";
import { GOLD } from "./materials";

/** The lab: an endless blueprint floor under the experiments. */
export function LabFloor() {
  const root = useSceneVisibility<Group>(["lab"], 0);
  const mat = useRef<MeshBasicMaterial>(null);
  useFrame((s) => {
    if (mat.current) mat.current.opacity = 0.16 + Math.sin(s.clock.elapsedTime * 0.8) * 0.04;
  });
  const B = WORLD.lab;
  return (
    <group ref={root} position={[B.x, B.y - 9, B.z - 10]}>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[90, 90, 45, 45]} />
        <meshBasicMaterial ref={mat} color={GOLD} wireframe transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {[-12, 0, 12].map((x, i) => (
        <mesh key={x} position={[x, 3 + i, -12 - i * 4]}>
          <octahedronGeometry args={[0.9 + i * 0.3, 0]} />
          <meshStandardMaterial color="#151515" metalness={1} roughness={0.3} flatShading />
        </mesh>
      ))}
    </group>
  );
}
