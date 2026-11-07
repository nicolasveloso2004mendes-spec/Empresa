"use client";
import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, AdaptiveEvents, Preload } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { Tier } from "@/hooks/useDeviceTier";
import { DirectorRig } from "./DirectorRig";
import { Logo3D } from "./Logo3D";
import { Sculpture } from "./Sculpture";
import { Shards } from "./Shards";
import { ProjectStage } from "./ProjectStage";
import { Capabilities3D } from "./Capabilities3D";
import { Dust } from "./Dust";
import { LabFloor } from "./LabFloor";
import { Effects } from "./Effects";
import { projects } from "@/data/projects";
import { WORLD } from "@/lib/animation/world";

/**
 * One persistent canvas behind the whole document. Every scene lives in the
 * same world; the DirectorRig moves the camera between them.
 */
export default function Stage({ tier }: { tier: Tier }) {
  const maxDpr = tier === "high" ? 1.75 : tier === "mid" ? 1.4 : 1.15;
  const [dpr, setDpr] = useState<number>(Math.min(maxDpr, typeof window !== "undefined" ? devicePixelRatio : 1));
  const [fx, setFx] = useState(tier !== "low");
  const [dof, setDof] = useState(tier === "high");

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: tier !== "high", powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ fov: 35, near: 0.1, far: 140, position: [0, 0, 14] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = SRGBColorSpace;
        scene.environmentIntensity = 0;
      }}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
      aria-hidden="true"
    >
      <color attach="background" args={["#050505"]} />
      <fogExp2 attach="fog" args={["#050505", 0.035]} />

      <PerformanceMonitor
        bounds={(refresh) => (refresh > 90 ? [50, 90] : [40, 58])}
        onDecline={() => {
          setDpr((d) => Math.max(0.85, d - 0.25));
          setDof(false);
        }}
        onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.15))}
        flipflops={3}
        onFallback={() => {
          setDpr(1);
          setFx(false);
        }}
      >
        {/* procedural studio: no HDR download, real PBR reflections */}
        <Environment resolution={tier === "low" ? 128 : 256} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#F2D67B" position={[0, 5, -4]} scale={[10, 1.2, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#F5F5F5" position={[-6, 1, 3]} rotation-y={Math.PI / 2.4} scale={[6, 2.5, 1]} />
          <Lightformer form="rect" intensity={1.0} color="#D4AF37" position={[6, -1, 2]} rotation-y={-Math.PI / 2.4} scale={[6, 1.5, 1]} />
          <Lightformer form="ring" intensity={1.6} color="#F2D67B" position={[0, -4, 4]} scale={3} />
        </Environment>

        <DirectorRig />
        <ambientLight intensity={0.05} />

        <Logo3D mode="intro" position={WORLD.logo} />
        <Sculpture tier={tier} />
        <Shards count={tier === "high" ? 300 : tier === "mid" ? 190 : 110} />
        {projects.map((p, i) => (
          <Suspense key={p.slug} fallback={null}>
            <ProjectStage project={p} index={i} />
          </Suspense>
        ))}
        <Capabilities3D tier={tier} />
        <LabFloor />
        <Logo3D mode="final" position={WORLD.final} />
        <Dust count={tier === "high" ? 2200 : tier === "mid" ? 1300 : 700} />

        {fx && <Effects dof={dof} tier={tier} />}
        <AdaptiveEvents />
        <Preload all />
      </PerformanceMonitor>
    </Canvas>
  );
}
