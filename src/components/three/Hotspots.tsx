"use client";
import type * as THREE from "three";
import { useRef, type RefObject } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import type { Hotspot } from "@/lib/schema";

const wp = new Vector3();
const wn = new Vector3();
const toCam = new Vector3();
const q = new Quaternion();

type Props = {
  hotspots: Hotspot[];
  activeId: string | null;
  onSelect: (h: Hotspot) => void;
  visible: boolean;
  /** Valores atuais das articulações (hotspots condicionados somem fora da posição certa). */
  articulationRef?: RefObject<Record<string, number>>;
};

/**
 * Marcadores interativos no espaço local do modelo. Cada marcador some quando a face onde
 * está fica de costas para a câmera (teste pela normal — barato, sem raycast por quadro).
 */
export function Hotspots({ hotspots, activeId, onSelect, visible, articulationRef }: Props) {
  return (
    <>
      {hotspots.map((h) => (
        <Marker key={h.id} h={h} active={activeId === h.id} dimmed={!!activeId && activeId !== h.id} onSelect={onSelect} visible={visible} artRef={articulationRef} />
      ))}
    </>
  );
}

function Marker({ h, active, dimmed, onSelect, visible, artRef }: { h: Hotspot; active: boolean; dimmed: boolean; onSelect: (h: Hotspot) => void; visible: boolean; artRef?: RefObject<Record<string, number>> }) {
  const anchor = useRef<THREE.Group>(null);
  const el = useRef<HTMLButtonElement>(null);
  const camera = useThree((s) => s.camera);
  const facing = useRef(true);

  useFrame(() => {
    const a = anchor.current, b = el.current;
    if (!a || !b) return;
    a.getWorldPosition(wp);
    a.getWorldQuaternion(q);
    wn.set(...h.normal).applyQuaternion(q).normalize();
    toCam.copy(camera.position).sub(wp).normalize();
    let f = wn.dot(toCam) > 0.12;
    if (f && h.articulation && artRef?.current) {
      const v = artRef.current[h.articulation.id];
      if (v !== undefined && Math.abs(v - h.articulation.value) > 0.12) f = false;
    }
    if (f !== facing.current) {
      facing.current = f;
      b.dataset.facing = f ? "1" : "0";
    }
  });

  return (
    <group ref={anchor} position={h.position}>
      <Html center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <button
          ref={el}
          type="button"
          data-facing="1"
          data-hotspot={h.id}
          aria-label={`Detalhe: ${h.label}`}
          aria-pressed={active}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(h);
          }}
          className={[
            "hotspot group pointer-events-auto relative flex h-11 w-11 items-center justify-center rounded-full outline-none",
            "transition-[opacity,transform] duration-300",
            visible ? "" : "!opacity-0 !pointer-events-none",
            dimmed ? "opacity-40" : "",
          ].join(" ")}
        >
          <span className={`absolute h-7 w-7 rounded-full border ${active ? "border-champagne bg-champagne/25" : "border-white/70 bg-black/35"} backdrop-blur-sm transition-colors`} />
          <span className={`relative h-2 w-2 rounded-full ${active ? "bg-champagne" : "bg-white"}`} />
          {!active && <span className="hotspot-pulse absolute h-7 w-7 rounded-full border border-white/40" />}
          <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/90 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {h.label}
          </span>
        </button>
      </Html>
    </group>
  );
}
