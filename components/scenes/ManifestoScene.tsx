"use client";
import { SceneSection, useSceneTimeline } from "@/components/cinematic/SceneSection";
import { gsap, SplitText } from "@/lib/animation/gsap";

function ManifestoCopy() {
  useSceneTimeline((tl, root) => {
    const a = SplitText.create(root.querySelector("[data-a]"), { type: "words,chars" });
    const b = SplitText.create(root.querySelector("[data-b]"), { type: "words,chars" });
    const body = SplitText.create(root.querySelector("[data-body]"), { type: "lines", mask: "lines" });
    const rnd = gsap.utils.random;

    // A arrives out of the dark
    tl.from(a.chars, { opacity: 0, z: -500, filter: "blur(12px)", duration: 0.16, stagger: { each: 0.004, from: "random" }, ease: "power3.out" }, 0.05)
      // A fragments toward the lens (in sync with the 3D shard burst)
      .to(
        a.chars,
        {
          x: () => rnd(-500, 500),
          y: () => rnd(-320, 320),
          z: () => rnd(250, 750),
          rotationX: () => rnd(-160, 160),
          rotationY: () => rnd(-160, 160),
          opacity: 0,
          filter: "blur(10px)",
          duration: 0.2,
          stagger: { each: 0.0025, from: "center" },
          ease: "power2.in",
        },
        0.36,
      )
      // B assembles from the fragments
      .from(
        b.chars,
        {
          x: () => rnd(-600, 600),
          y: () => rnd(-360, 360),
          z: () => rnd(-900, -300),
          rotationX: () => rnd(-120, 120),
          rotationY: () => rnd(-120, 120),
          opacity: 0,
          filter: "blur(12px)",
          duration: 0.2,
          stagger: { each: 0.004, from: "edges" },
          ease: "power3.out",
        },
        0.5,
      )
      .to("[data-b-wrap]", { y: "-18svh", scale: 0.72, duration: 0.14, ease: "power2.inOut" }, 0.72)
      .from(body.lines, { yPercent: 110, duration: 0.1, stagger: 0.02, ease: "power3.out" }, 0.78)
      .from("[data-rule]", { scaleX: 0, duration: 0.12 }, 0.76)
      .to("[data-stage]", { opacity: 0, duration: 0.05 }, 0.95);
  });

  return (
    <div data-stage className="relative flex h-full items-center justify-center px-[var(--gutter)] [perspective:900px]">
      <p className="eyebrow absolute left-[var(--gutter)] top-24">02 — Manifesto</p>
      <h2 className="sr-only">Não fazemos apenas sites. Criamos experiências.</h2>
      <p data-a aria-hidden className="display absolute inset-x-[var(--gutter)] text-center text-[clamp(3rem,10.5vw,10rem)] [transform-style:preserve-3d]">
        Não fazemos apenas sites.
      </p>
      <div data-b-wrap className="absolute inset-x-[var(--gutter)] text-center">
        <p data-b aria-hidden className="display text-[clamp(3.4rem,12vw,11.5rem)] [transform-style:preserve-3d]">
          Criamos <span className="text-gold">experiências.</span>
        </p>
      </div>
      <div className="absolute inset-x-[var(--gutter)] bottom-[14svh] mx-auto max-w-2xl text-center">
        <div data-rule className="hairline mx-auto mb-6 w-40" />
        <p data-body className="text-[clamp(1.05rem,1.8vw,1.45rem)] leading-relaxed text-bone/85">
          Desenvolvemos experiências digitais, sistemas inteligentes e soluções tecnológicas para empresas que querem ir além.
        </p>
      </div>
    </div>
  );
}

export function ManifestoScene() {
  return (
    <SceneSection id="manifesto" length={3.4} label="Manifesto">
      <ManifestoCopy />
    </SceneSection>
  );
}
