"use client";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

type Props = {
  /** 0..1 — multiplica as luzes (usado na revelação da hero). */
  intensity?: number;
  shadowY?: number;
  shadows?: boolean;
  quality?: "high" | "low";
};

/**
 * Estúdio fotográfico procedural: um environment map gerado na GPU com softboxes
 * (Lightformers) — reflexos metálicos realistas sem baixar HDRIs externos.
 */
export function Studio({ intensity = 1, shadowY = -0.82, shadows = true, quality = "high" }: Props) {
  const i = Math.max(0, intensity);
  return (
    <>
      <Environment resolution={quality === "high" ? 256 : 128} frames={1} environmentIntensity={0.9 * i}>
        <color attach="background" args={["#000000"]} />
        {/* Softbox principal (topo) */}
        <Lightformer form="rect" intensity={3.2} position={[0, 4.5, 1]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 3, 1]} />
        {/* Faixas laterais — desenham as linhas de reflexo na moldura metálica */}
        <Lightformer form="rect" intensity={2.4} position={[-5, 1, -1]} rotation={[0, Math.PI / 2, 0]} scale={[10, 0.6, 1]} />
        <Lightformer form="rect" intensity={2.4} position={[5, 1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 0.6, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[5, -1.5, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 0.3, 1]} />
        {/* Softbox traseira — reflexos na traseira e nas lentes */}
        <Lightformer form="rect" intensity={1.8} position={[-2.5, 2.5, -5]} rotation={[0, Math.PI * 0.85, 0]} scale={[5, 3, 1]} />
        {/* Luz quente de recorte por trás */}
        <Lightformer form="ring" color="#e8d2a6" intensity={1.6} position={[0, 1, -6]} scale={3} />
        <Lightformer form="rect" color="#9fb3c8" intensity={0.6} position={[0, -4, 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[6, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.08 * i} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.4 * i} color="#fff7ec" />
      <directionalLight position={[-3, 1.5, -3]} intensity={1.3 * i} color="#e3d3b3" />
      {shadows && (
        <ContactShadows
          position={[0, shadowY, 0]}
          opacity={0.55 * Math.min(1, i)}
          scale={4}
          blur={2.6}
          far={1.6}
          resolution={quality === "high" ? 512 : 256}
          color="#000000"
        />
      )}
    </>
  );
}
