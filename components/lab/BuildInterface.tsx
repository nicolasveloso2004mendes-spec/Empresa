"use client";
import { useRef, useState } from "react";
import { Blueprint } from "@/components/transitions/Blueprint";
import { gsap } from "@/lib/animation/gsap";
import { useDevice } from "@/hooks/useDeviceTier";

/**
 * Experiment 03 — the reference video's "agents build the interface" move as an
 * instrument: scrub the build timeline, change the swarm size, replay.
 */
export function BuildInterface() {
  const { reducedMotion } = useDevice();
  const [p, setP] = useState(0);
  const [swarm, setSwarm] = useState(16);
  const tween = useRef<gsap.core.Tween | null>(null);
  const state = useRef({ v: 0 });

  const playTo = (to: number) => {
    tween.current?.kill();
    tween.current = gsap.to(state.current, {
      v: to,
      duration: 3.2 * Math.abs(to - state.current.v) + 0.2,
      ease: "power1.inOut",
      onUpdate: () => setP(state.current.v),
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <Blueprint mode="manual" progress={reducedMotion ? 1 : p} cursors={swarm} key={swarm} className="aspect-[4/3] w-full bg-void p-4">
        <div className="grid h-full grid-cols-3 grid-rows-[auto_1fr_auto] gap-3">
          <div data-bp className="col-span-3 flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-display text-lg tracking-wide">SEU PROJETO</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold">versão 1</span>
          </div>
          <div data-bp className="col-span-2 flex flex-col justify-end bg-gradient-to-br from-gold/25 via-graphite to-void p-3">
            <p className="display text-[clamp(1.4rem,3vw,2.4rem)]">Hero</p>
            <p className="text-[11px] text-bone/60">Título, subtítulo, CTA</p>
          </div>
          <div className="flex flex-col gap-3">
            <div data-bp className="flex-1 border border-white/10 p-2 font-mono text-[9px] uppercase tracking-[0.16em] text-bone/60">
              Tipografia
              <div className="mt-2 font-display text-2xl normal-case text-bone">Aa</div>
            </div>
            <div data-bp className="flex-1 border border-white/10 p-2 font-mono text-[9px] uppercase tracking-[0.16em] text-bone/60">
              Cor
              <div className="mt-2 flex gap-1">
                {["#050505", "#151515", "#D4AF37", "#F2D67B", "#F5F5F5"].map((c) => (
                  <span key={c} className="h-4 w-4 border border-white/20" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          {["Layout", "Animação", "Publicação"].map((l) => (
            <div data-bp key={l} className="border border-white/10 p-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-bone/60">{l}</p>
              <div className="mt-2 h-1 bg-white/10">
                <div className="h-1 bg-gold" style={{ width: `${Math.round(Math.min(1, Math.max(0, (p - 0.45) / 0.3)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Blueprint>

      <label className="block">
        <span className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-bone/55">
          Linha do tempo da construção <span>{Math.round(p * 100)}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={p}
          onChange={(e) => {
            tween.current?.kill();
            state.current.v = Number(e.target.value);
            setP(state.current.v);
          }}
          className="h-11 w-full accent-[#D4AF37]"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => playTo(1)} className="min-h-11 flex-1 bg-gold px-4 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-void hover:bg-gold-hi">
          Montar
        </button>
        <button onClick={() => playTo(0)} className="min-h-11 flex-1 border border-white/15 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/80 hover:border-gold">
          Desmontar
        </button>
        <div role="group" aria-label="Tamanho do enxame" className="flex border border-white/15">
          {[8, 16, 32].map((n) => (
            <button
              key={n}
              onClick={() => setSwarm(n)}
              aria-pressed={swarm === n}
              className={`min-h-11 min-w-11 px-2 font-mono text-[10px] ${swarm === n ? "bg-bone text-void" : "text-bone/70 hover:text-bone"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
