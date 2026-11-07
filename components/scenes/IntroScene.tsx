"use client";
import { useEffect, useRef } from "react";
import { SceneSection, useSceneTimeline } from "@/components/cinematic/SceneSection";
import { gsap, SplitText } from "@/lib/animation/gsap";
import { cine } from "@/lib/animation/store";

function IntroCopy() {
  const brand = useRef<HTMLHeadingElement>(null);

  // "NICOTECH" is revealed by the light (time-based, before the first scroll)
  useEffect(() => {
    const el = brand.current!;
    const split = SplitText.create(el, { type: "chars" });
    gsap.set(split.chars, { opacity: 0, filter: "blur(14px)", yPercent: 18 });
    let played = false;
    const tick = () => {
      if (!played && cine.introAuto > 0.5) {
        played = true;
        gsap.to(split.chars, {
          opacity: 1,
          filter: "blur(0px)",
          yPercent: 0,
          duration: 1.6,
          ease: "expo.out",
          stagger: { each: 0.07, from: "center" },
        });
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      split.revert();
    };
  }, []);

  useSceneTimeline((tl, root) => {
    const tagline = SplitText.create(root.querySelector("[data-tagline]"), { type: "words,lines", mask: "lines" });
    tl.from(tagline.words, { yPercent: 120, duration: 0.14, stagger: 0.012, ease: "power3.out" }, 0.08)
      .to("[data-cue]", { opacity: 0, duration: 0.06 }, 0.02)
      // the dive: type pushes toward the lens as the camera passes the symbol
      .to("[data-brand]", { scale: 2.6, opacity: 0, filter: "blur(10px)", duration: 0.22, ease: "power2.in" }, 0.22)
      .to("[data-tagline]", { y: -40, opacity: 0, duration: 0.14, ease: "power2.in" }, 0.24)
      .fromTo("[data-flash]", { opacity: 0 }, { opacity: 0.85, duration: 0.08, ease: "power2.in" }, 0.45)
      .to("[data-flash]", { opacity: 0, duration: 0.2, ease: "power2.out" }, 0.53);
  });

  return (
    <div className="relative flex h-full flex-col items-center justify-end px-[var(--gutter)] pb-[12svh] text-center">
      <h1 className="sr-only">NicoTech — Digital Experiences Beyond Ordinary</h1>
      <p
        ref={brand}
        data-brand
        aria-hidden
        className="display select-none text-[clamp(3.6rem,15vw,13rem)] tracking-[0.06em] text-bone [text-shadow:0_0_60px_rgba(212,175,55,0.25)]"
      >
        NICOTECH
      </p>
      <p data-tagline className="mt-4 font-mono text-[clamp(0.7rem,1.4vw,0.95rem)] uppercase tracking-[0.42em] text-gold-hi">
        We create digital experiences.
      </p>
      <div data-cue className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2" aria-hidden>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50">Scroll to enter</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-gold to-transparent" />
      </div>
      <div
        data-flash
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 [background:radial-gradient(circle_at_50%_50%,rgba(242,214,123,0.55),rgba(212,175,55,0.15)_35%,transparent_70%)]"
      />
    </div>
  );
}

export function IntroScene() {
  return (
    <SceneSection id="intro" length={2.6} label="Introdução NicoTech" overlap={false}>
      <IntroCopy />
    </SceneSection>
  );
}
