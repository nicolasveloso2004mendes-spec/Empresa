"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ExtrudeGeometry, Shape, type Group, type Vector3 } from "three";
import { cine } from "@/lib/animation/store";
import { seg, smooth, inOut, lerp } from "@/lib/animation/math";
import { useSceneVisibility } from "./useSceneVisibility";
import { Graphite, Gold } from "./materials";

/** NicoTech monogram: two graphite pillars joined by a gold diagonal, inside an orbit ring. */
function useMonogram() {
  return useMemo(() => {
    const ext = { depth: 0.42, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4, curveSegments: 8 };
    const bar = (x0: number, x1: number) => {
      const s = new Shape();
      s.moveTo(x0, -1.3).lineTo(x1, -1.3).lineTo(x1, 1.3).lineTo(x0, 1.3).closePath();
      return s;
    };
    const diag = new Shape();
    diag.moveTo(-0.5, 1.3).lineTo(-0.5, 0.52).lineTo(0.5, -1.3).lineTo(0.5, -0.52).closePath();
    const center = (g: ExtrudeGeometry) => (g.translate(0, 0, -0.21), g);
    return {
      left: center(new ExtrudeGeometry(bar(-1, -0.52), ext)),
      right: center(new ExtrudeGeometry(bar(0.52, 1), ext)),
      diag: center(new ExtrudeGeometry(diag, { ...ext, depth: 0.5 })),
    };
  }, []);
}

export function Logo3D({ mode, position }: { mode: "intro" | "final"; position: Vector3 }) {
  const root = useSceneVisibility<Group>(mode === "intro" ? ["intro", "hero"] : ["final", "lab"], mode === "intro" ? 0 : 1);
  const mark = useRef<Group>(null);
  const L = useRef<Group>(null);
  const R = useRef<Group>(null);
  const D = useRef<Group>(null);
  const ringA = useRef<Group>(null);
  const ringB = useRef<Group>(null);
  const geo = useMonogram();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!mark.current) return;
    if (mode === "intro") {
      const a = smooth(cine.introAuto);
      const p = cine.progress.intro;
      mark.current.rotation.y = lerp(-0.55, 0.12, a) + inOut(p) * 0.35 + cine.pointer.x * 0.08;
      mark.current.rotation.x = cine.pointer.y * -0.05;
      // the doorway: the symbol opens so the camera can pass through it
      const open = inOut(seg(p, 0.24, 0.46));
      L.current!.position.set(-open * 3.8, 0, -open * 1.5);
      R.current!.position.set(open * 3.8, 0, -open * 1.5);
      L.current!.rotation.y = open * 0.6;
      R.current!.rotation.y = -open * 0.6;
      D.current!.position.set(0, open * 3.6, -open * 3);
      D.current!.rotation.z = open * 0.9;
      const rs = 1 + inOut(seg(p, 0.22, 0.6)) * 1.8;
      ringA.current!.scale.setScalar(rs);
      ringB.current!.scale.setScalar(rs * 1.04);
    } else {
      const p = cine.progress.final;
      mark.current.rotation.y = Math.sin(t * 0.3) * 0.18 + lerp(-0.5, 0, smooth(seg(p, 0, 0.7)));
    }
    ringA.current!.rotation.z = t * 0.12;
    ringB.current!.rotation.z = -t * 0.07;
    ringB.current!.rotation.x = Math.sin(t * 0.2) * 0.12;
  });

  return (
    <group ref={root} position={position}>
      <group ref={mark}>
        <group ref={L}>
          <mesh geometry={geo.left}>
            <Graphite />
          </mesh>
        </group>
        <group ref={R}>
          <mesh geometry={geo.right}>
            <Graphite />
          </mesh>
        </group>
        <group ref={D}>
          <mesh geometry={geo.diag}>
            <Gold />
          </mesh>
        </group>
      </group>
      <group ref={ringA}>
        <mesh>
          <torusGeometry args={[2.35, 0.045, 24, 160]} />
          <Gold rough={0.18} />
        </mesh>
        {/* orbit ticks */}
        {Array.from({ length: 24 }, (_, i) => (
          <mesh key={i} position={[Math.cos((i / 24) * Math.PI * 2) * 2.62, Math.sin((i / 24) * Math.PI * 2) * 2.62, 0]} rotation-z={(i / 24) * Math.PI * 2}>
            <boxGeometry args={[i % 6 === 0 ? 0.22 : 0.09, 0.018, 0.018]} />
            <Gold />
          </mesh>
        ))}
      </group>
      <group ref={ringB}>
        <mesh>
          <torusGeometry args={[2.95, 0.012, 12, 200, Math.PI * 1.55]} />
          <meshStandardMaterial color="#F5F5F5" metalness={1} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}
