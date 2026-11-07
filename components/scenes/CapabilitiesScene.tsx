"use client";
import { useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SceneSection, useScene, useSceneTimeline } from "@/components/cinematic/SceneSection";
import { ScrollTrigger, SplitText, scrollToScene } from "@/lib/animation/gsap";
import { capabilities } from "@/data/capabilities";

const N = capabilities.length - 1;

function CapsCopy() {
  const [active, setActive] = useState(0);
  const { el } = useScene();

  // same stepping as the Director, so the list and the camera agree
  useLayoutEffect(() => {
    const st = ScrollTrigger.create({
      trigger: el(),
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => {
        const x = s.progress * N;
        const i = Math.min(N, Math.floor(x) + (x - Math.floor(x) > 0.78 ? 1 : 0));
        setActive((a) => (a === i ? a : i));
      },
    });
    return () => st.kill();
  }, [el]);

  useSceneTimeline((tl, root) => {
    const t = SplitText.create(root.querySelector("[data-title]"), { type: "chars", mask: "chars" });
    tl.from(t.chars, { yPercent: 120, duration: 0.05, stagger: 0.003, ease: "power4.out" }, 0)
      .from("[data-rail] li", { opacity: 0, x: -24, duration: 0.04, stagger: 0.008 }, 0.02)
      .to("[data-caps]", { opacity: 0, duration: 0.025 }, 0.975);
  });

  const c = capabilities[active];
  return (
    <div data-caps className="relative flex h-full flex-col justify-between px-[var(--gutter)] pb-14 pt-24">
      <div className="scrim-b pointer-events-none absolute inset-0 md:hidden" aria-hidden />
      <div className="relative">
        <p className="eyebrow">04 — Serviços</p>
        <h2 data-title className="display mt-4 text-[clamp(2.8rem,7.5vw,7rem)]">
          Nossos serviços<span className="text-gold">.</span>
        </h2>
      </div>

      <div className="relative grid items-end gap-8 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <ol data-rail className="order-2 flex flex-wrap gap-x-4 gap-y-1 md:order-1 md:flex-col md:gap-0">
          {capabilities.map((cap, i) => (
            <li key={cap.index}>
              <button
                onClick={() => scrollToScene("capabilities", (i / N) * 0.985 + (i === 0 ? 0.01 : 0))}
                aria-current={i === active ? "true" : undefined}
                className="group flex min-h-11 items-center gap-3 text-left"
              >
                <span className={`font-mono text-[11px] tracking-[0.2em] ${i === active ? "text-gold" : "text-bone/40"}`}>{cap.index}</span>
                <span
                  className={`hidden h-px transition-all duration-500 md:block ${i === active ? "w-10 bg-gold" : "w-3 bg-white/25 group-hover:w-6"}`}
                />
                <span
                  className={`hidden text-sm uppercase tracking-[0.14em] transition-colors md:inline ${
                    i === active ? "text-bone" : "text-bone/45 group-hover:text-bone/80"
                  }`}
                >
                  {cap.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="order-1 md:order-2 md:justify-self-end md:text-right" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={c.index}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="md:max-w-lg md:ml-auto"
            >
              <p className="font-mono text-[11px] tracking-[0.2em] text-gold">{c.index} / 06</p>
              <h3 className="display mt-2 text-[clamp(2.4rem,5vw,4.6rem)]">{c.title}</h3>
              <p className="mt-3 text-lg text-gold-hi">{c.line}</p>
              <p className="mt-2 leading-relaxed text-bone/75">{c.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function CapabilitiesScene() {
  return (
    <SceneSection id="capabilities" length={6.5} label="Nossos serviços">
      <CapsCopy />
    </SceneSection>
  );
}
