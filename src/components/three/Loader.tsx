"use client";
import { useProgress } from "@react-three/drei";

/** Indicador de carregamento: anel fino com percentual real do download. */
export function ViewerLoader({ label = "Preparando o showroom" }: { label?: string }) {
  const { active, progress } = useProgress();
  const p = Math.round(progress);
  if (!active && p >= 100) return null;
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke="var(--color-champagne)" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dashoffset .3s ease" }}
        />
      </svg>
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-white/50">{label}</div>
        <div className="mt-1 font-display text-sm tabular-nums text-white/80">{p}%</div>
      </div>
    </div>
  );
}
