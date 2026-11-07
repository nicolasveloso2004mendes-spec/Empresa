"use client";
import { useEffect, useRef, useState } from "react";
import { cine, SCENES, SCENE_LABELS, subscribe } from "@/lib/animation/store";
import { scrollToScene, gsap } from "@/lib/animation/gsap";

/** Film HUD: scene slate, timecode synced to scroll, chapter rail. */
export function Hud() {
  const [active, setActive] = useState(0);
  const tc = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribe(() => setActive(cine.active));
    const tick = () => {
      const g = cine.global;
      const frames = Math.floor(g * 24 * 150); // a 2:30 film
      const s = Math.floor(frames / 24);
      const f = frames % 24;
      const pad = (n: number) => String(n).padStart(2, "0");
      if (tc.current) tc.current.textContent = `00:${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(f)}`;
      if (bar.current) bar.current.style.transform = `scaleX(${g})`;
    };
    gsap.ticker.add(tick);
    return () => {
      unsub();
      gsap.ticker.remove(tick);
    };
  }, []);

  const id = SCENES[active];
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden items-end justify-between px-[var(--gutter)] pb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-bone/55 sm:flex">
        <span>
          <span className="text-gold">SC {String(active).padStart(2, "0")}</span> — {SCENE_LABELS[id]}
        </span>
        <div className="mx-8 mb-1 h-px flex-1 bg-white/10">
          <div ref={bar} className="h-px w-full origin-left scale-x-0 bg-gold/80" />
        </div>
        <span ref={tc} aria-hidden>
          00:00:00:00
        </span>
      </div>
      <nav
        aria-label="Cenas"
        className="fixed right-[calc(var(--gutter)*0.5)] top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 lg:flex"
      >
        {SCENES.map((s, i) => (
          <button
            key={s}
            onClick={() => (s === "lab" ? scrollToScene("lab", 0) : scrollToScene(s, s === "intro" ? 0 : 0.02))}
            className="group flex h-6 items-center justify-end gap-3"
            aria-label={`Ir para ${SCENE_LABELS[s]}`}
            aria-current={i === active ? "step" : undefined}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone/0 transition-colors group-hover:text-bone/80 group-focus-visible:text-bone/80">
              {SCENE_LABELS[s]}
            </span>
            <span className={`block h-px transition-all ${i === active ? "w-8 bg-gold" : "w-4 bg-white/30 group-hover:bg-white/70"}`} />
          </button>
        ))}
      </nav>
    </>
  );
}
