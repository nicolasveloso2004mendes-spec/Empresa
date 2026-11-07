"use client";
import { useLayoutEffect } from "react";
import { SceneSection } from "@/components/cinematic/SceneSection";
import { Blueprint } from "@/components/transitions/Blueprint";
import { gsap, SplitText } from "@/lib/animation/gsap";
import { site } from "@/data/site";

function FinalCopy() {
  // scrubbed while the scene rises into view, so the screen is never empty on arrival
  useLayoutEffect(() => {
    const section = document.getElementById("final");
    if (!section) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: section, start: "top 85%", end: "top 10%", scrub: 0.6 },
      });
      section.querySelectorAll<HTMLElement>("[data-fl]").forEach((l, i) => {
        const gold = l.hasAttribute("data-gold");
        const sp = SplitText.create(l, gold ? { type: "lines", mask: "lines", linesClass: "gold-text" } : { type: "chars", mask: "chars" });
        tl.from(gold ? sp.lines : sp.chars, { yPercent: 120, duration: 0.3, stagger: 0.012, ease: "power4.out" }, i * 0.14);
      });
      tl.from("[data-alt]", { opacity: 0, y: 16, duration: 0.2 }, 0.75);
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative flex h-full flex-col items-center justify-center px-[var(--gutter)] text-center">
      <div className="scrim-b pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <p className="eyebrow relative">06 — Contato</p>
      <h2 className="display relative mt-6 text-[clamp(3.2rem,10.5vw,10rem)]">
        <span data-fl className="block">Vamos criar</span>
        <span data-fl className="block">algo</span>
        <span data-fl data-gold className="block text-gold">extraordinário.</span>
      </h2>
      <Blueprint mode="self" cursors={18} className="relative mt-12">
        <a
          data-bp
          href={site.primaryContact.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex min-h-20 items-center gap-6 overflow-hidden bg-gold px-10 font-mono text-sm font-medium uppercase tracking-[0.3em] text-void sm:min-h-24 sm:px-16 sm:text-base"
        >
          <span className="absolute inset-0 -translate-x-full bg-gold-hi transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-0" aria-hidden />
          <span className="relative">Começar um projeto</span>
          <span className="relative transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden>
            ↗
          </span>
          <span className="sr-only">(abre o {site.primaryContact.label} {site.primaryContact.handle} em nova aba)</span>
        </a>
      </Blueprint>
      <p data-alt className="relative mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/55">
        {site.primaryContact.label} {site.primaryContact.handle} · ou{" "}
        <a href={site.contacts[2].href} target="_blank" rel="noopener noreferrer" className="inline-block whitespace-nowrap py-2 text-gold-hi underline-offset-4 hover:underline">
          WhatsApp
        </a>{" "}
        ·{" "}
        <a href={site.contacts[1].href} className="inline-block whitespace-nowrap py-2 text-gold-hi underline-offset-4 hover:underline">
          e-mail
        </a>
      </p>
    </div>
  );
}

export function FinalScene() {
  return (
    <SceneSection id="final" length={2.2} label="Vamos criar algo extraordinário" overlap={false}>
      <FinalCopy />
    </SceneSection>
  );
}
