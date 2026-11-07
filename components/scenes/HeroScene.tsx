"use client";
import { SceneSection, useSceneTimeline } from "@/components/cinematic/SceneSection";
import { Blueprint } from "@/components/transitions/Blueprint";
import { SplitText, scrollToScene } from "@/lib/animation/gsap";
import { projects } from "@/data/projects";

function HeroCopy() {
  useSceneTimeline((tl, root) => {
    const lines = root.querySelectorAll<HTMLElement>("[data-line]");
    lines.forEach((l, i) => {
      // gradient text can't survive per-char transforms → gold line reveals as one masked line
      const gold = l.hasAttribute("data-gold");
      const s = SplitText.create(l, gold ? { type: "lines", mask: "lines", linesClass: "gold-text" } : { type: "chars", mask: "chars" });
      tl.from(gold ? s.lines : s.chars, { yPercent: 115, duration: 0.14, stagger: 0.008, ease: "power4.out" }, 0.01 + i * 0.05);
    });
    const sub = SplitText.create(root.querySelector("[data-sub]"), { type: "lines", mask: "lines" });
    tl.from(sub.lines, { yPercent: 110, duration: 0.12, stagger: 0.03, ease: "power3.out" }, 0.12)
      .from("[data-eyebrow]", { opacity: 0, x: -20, duration: 0.1 }, 0.02)
      // exit: the copy is pulled up as the camera starts to retreat
      .to("[data-copy]", { yPercent: -18, opacity: 0, filter: "blur(6px)", duration: 0.2, ease: "power2.in" }, 0.8);
  });

  const first = projects[0];
  return (
    <div className="relative h-full">
      <div className="scrim-l pointer-events-none absolute inset-0 hidden md:block" aria-hidden />
      <div className="scrim-b pointer-events-none absolute inset-0 md:hidden" aria-hidden />
      <div
        data-copy
        className="relative z-10 flex h-full max-w-[min(100%,58rem)] flex-col justify-end px-[var(--gutter)] pb-[13svh] md:justify-center md:pb-0"
      >
        <p data-eyebrow className="eyebrow mb-6">
          NicoTech · Estúdio digital cinematográfico
        </p>
        <h2 className="display text-[clamp(4.2rem,13.5vw,12.5rem)]">
          <span data-line className="block">
            Além
          </span>
          <span data-line data-gold className="block text-gold">
            do digital.
          </span>
        </h2>
        <p data-sub className="mt-7 max-w-md text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed text-bone/80">
          Transformamos tecnologia em experiências extraordinárias.
        </p>
        <Blueprint mode="scene" sceneId="hero" range={[0.04, 0.34]} cursors={12} className="mt-10 flex flex-wrap items-center gap-6">
          <button
            data-bp
            onClick={() => scrollToScene(`work-${first.slug}`, 0.02)}
            className="group flex min-h-14 items-center gap-4 bg-gold px-7 font-mono text-xs font-medium uppercase tracking-[0.24em] text-void transition-colors hover:bg-gold-hi"
          >
            Conheça nosso trabalho
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
          <p data-bp className="font-mono text-[10px] uppercase leading-5 tracking-[0.2em] text-bone/55">
            OBJ · 01 — Escultura
            <br />
            Metal PBR · luz em tempo real · reage ao cursor
          </p>
        </Blueprint>
      </div>
    </div>
  );
}

export function HeroScene() {
  return (
    <SceneSection id="hero" length={2.8} label="Além do digital">
      <HeroCopy />
    </SceneSection>
  );
}
