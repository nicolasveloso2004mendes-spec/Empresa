"use client";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { gsap } from "@/lib/animation/gsap";

/** Black frame + gold counter while the WebGL assets stream in. */
export function Loader({ use3D, ready, onDone }: { use3D: boolean; ready: boolean; onDone: () => void }) {
  const { progress, active } = useProgress();
  const [done, setDone] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const shown = useRef({ v: 0 });
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    if (!ready || finished.current) return;
    const target = use3D ? progress : 100;
    gsap.to(shown.current, {
      v: target,
      duration: 0.6,
      onUpdate: () => {
        if (num.current) num.current.textContent = String(Math.round(shown.current.v)).padStart(3, "0");
        if (bar.current) bar.current.style.transform = `scaleX(${shown.current.v / 100})`;
      },
    });
    // finish when everything loaded — or after a grace period (assets keep streaming)
    const complete = (use3D && !active && progress >= 100) || !use3D;
    const grace = setTimeout(() => finish(), 6000);
    if (complete) {
      clearTimeout(grace);
      setTimeout(finish, 650);
    }
    function finish() {
      if (finished.current) return;
      finished.current = true;
      gsap.to(el.current, {
        opacity: 0,
        duration: 0.9,
        ease: "power2.inOut",
        onComplete: () => setDone(true),
      });
      onDone();
    }
    return () => clearTimeout(grace);
  }, [progress, active, ready, use3D, onDone]);

  if (done) return null;
  return (
    <div ref={el} className="fixed inset-0 z-[100] grid place-items-center bg-void" role="status" aria-live="polite">
      <div className="flex w-56 flex-col items-center gap-4">
        <span className="font-mono text-[11px] tracking-[0.3em] text-gold">
          NT — <span ref={num}>000</span>
        </span>
        <div className="h-px w-full bg-white/10">
          <div ref={bar} className="h-px w-full origin-left scale-x-0 bg-gold" />
        </div>
        <span className="sr-only">Carregando a experiência</span>
      </div>
    </div>
  );
}
