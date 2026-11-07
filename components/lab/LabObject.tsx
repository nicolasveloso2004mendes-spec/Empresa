"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Color, type Group, type MeshPhysicalMaterial } from "three";
import { useDevice } from "@/hooks/useDeviceTier";

const FINISHES = {
  ouro: { color: "#D4AF37", rough: 0.18, label: "Ouro" },
  grafite: { color: "#1c1c1c", rough: 0.32, label: "Grafite" },
  cromo: { color: "#e6e6e6", rough: 0.06, label: "Cromo" },
} as const;
type Finish = keyof typeof FINISHES;

function Core({ finish, explode, readout }: { finish: Finish; explode: number; readout: React.RefObject<HTMLSpanElement | null> }) {
  const g = useRef<Group>(null);
  const mats = useRef<MeshPhysicalMaterial[]>([]);
  const target = useMemo(() => new Color(), []);
  const ex = useRef(0);
  const parts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return { a, y: (i % 2 ? 1 : -1) * 0.35, r: 1.15 };
      }),
    [],
  );
  useFrame((s, dt) => {
    ex.current += (explode - ex.current) * Math.min(1, dt * 5);
    const f = FINISHES[finish];
    target.set(f.color);
    mats.current.forEach((m) => {
      m.color.lerp(target, Math.min(1, dt * 4));
      m.roughness += (f.rough - m.roughness) * Math.min(1, dt * 4);
    });
    if (!g.current) return;
    g.current.children.forEach((c, i) => {
      if (i === 0) return;
      const p = parts[i - 1];
      const r = p.r + ex.current * 1.4;
      c.position.set(Math.cos(p.a) * r, p.y * (1 + ex.current * 2), Math.sin(p.a) * r);
      c.rotation.set(ex.current * p.a, -p.a, ex.current * 0.8);
    });
    if (readout.current) {
      const cam = s.camera.position;
      readout.current.textContent = `az ${Math.round((Math.atan2(cam.x, cam.z) * 180) / Math.PI)}° · el ${Math.round(
        (Math.asin(cam.y / cam.length()) * 180) / Math.PI,
      )}° · explode ${Math.round(ex.current * 100)}%`;
    }
  });
  const reg = (m: MeshPhysicalMaterial | null) => {
    if (m && !mats.current.includes(m)) mats.current.push(m);
  };
  return (
    <group ref={g}>
      <mesh>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshPhysicalMaterial ref={reg} color="#D4AF37" metalness={1} roughness={0.18} clearcoat={0.6} flatShading />
      </mesh>
      {parts.map((p, i) => (
        <mesh key={i}>
          <boxGeometry args={[0.5, 0.12, 0.3]} />
          <meshPhysicalMaterial ref={reg} color="#D4AF37" metalness={1} roughness={0.18} clearcoat={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** Experiment 01 — a real, manipulable PBR object (drag to orbit). Mounted only on screen. */
export function LabObject() {
  const { webgl } = useDevice();
  const host = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [finish, setFinish] = useState<Finish>("ouro");
  const [explode, setExplode] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    if (host.current) io.observe(host.current);
    return () => io.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div ref={host} data-bp className="relative aspect-square w-full cursor-grab overflow-hidden bg-void active:cursor-grabbing" data-lenis-prevent>
        {webgl && visible ? (
          <Canvas dpr={[1, 1.5]} camera={{ position: [0, 1.2, 5], fov: 35 }} gl={{ antialias: true }} aria-label="Objeto 3D interativo">
            <color attach="background" args={["#070707"]} />
            <Environment resolution={128} frames={1}>
              <Lightformer form="rect" intensity={2.5} color="#F2D67B" position={[0, 4, -3]} scale={[8, 1, 1]} />
              <Lightformer form="rect" intensity={1.5} color="#F5F5F5" position={[-4, 0, 3]} rotation-y={Math.PI / 2.5} scale={[5, 2, 1]} />
              <Lightformer form="ring" intensity={1.2} color="#D4AF37" position={[3, -2, 2]} scale={2} />
            </Environment>
            <pointLight position={[2, 3, 3]} intensity={20} color="#F2D67B" />
            <Core finish={finish} explode={explode} readout={readout} />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate={auto} autoRotateSpeed={1.4} enableDamping />
          </Canvas>
        ) : (
          <div className="grid h-full place-items-center p-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-bone/50">
            {webgl ? "Carregando objeto…" : "WebGL indisponível neste dispositivo"}
          </div>
        )}
        <span ref={readout} aria-hidden className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.12em] text-bone/55" />
      </div>
      <div data-bp className="mt-4 space-y-4">
        <fieldset>
          <legend className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/55">Material</legend>
          <div className="flex gap-2">
            {(Object.keys(FINISHES) as Finish[]).map((f) => (
              <button
                key={f}
                onClick={() => setFinish(f)}
                aria-pressed={finish === f}
                className={`min-h-11 flex-1 border px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                  finish === f ? "border-gold bg-gold text-void" : "border-white/15 text-bone/75 hover:border-gold/60"
                }`}
              >
                {FINISHES[f].label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-bone/55">
            Explodir peças <span>{Math.round(explode * 100)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explode}
            onChange={(e) => setExplode(Number(e.target.value))}
            className="h-11 w-full accent-[#D4AF37]"
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/70">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-4 w-4 accent-[#D4AF37]" />
          Rotação automática
        </label>
      </div>
    </div>
  );
}
