"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Product } from "@/lib/schema";
import { CubeIcon } from "@/components/site/icons";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const StoryStage = dynamic(() => import("./StoryStage"), { ssr: false });

const SCENES = [
  { eyebrow: "01 — Presença", title: "Leve como um pensamento.", text: "Um aparelho flutuando no escuro, pronto para ser examinado de perto." },
  { eyebrow: "02 — Câmeras", title: "Cada lente em evidência.", text: "Aproxime-se do conjunto de câmeras como faria na loja." },
  { eyebrow: "03 — Acabamento", title: "O toque do material.", text: "A traseira revela textura, reflexos e cor sob luz de estúdio." },
  { eyebrow: "04 — Tela", title: "A frente que você vai usar todo dia.", text: "Gire para ver a tela, as bordas e o recorte superior." },
  { eyebrow: "05 — Sua vez", title: "Agora é com você.", text: "Gire, aproxime e compare cores no showroom interativo." },
];

/**
 * Scroll storytelling: seção alta (5 telas) com um palco sticky. Nenhum scroll é bloqueado —
 * a rolagem nativa só alimenta a timeline do GSAP.
 */
export function StorySection({ product }: { product: Product }) {
  const reduced = useReducedMotion();
  const id = "showroom";
  return (
    <section id={id} className="relative bg-black" style={{ height: reduced ? "auto" : "500svh" }} aria-label="Conheça o aparelho" data-testid="story">
      <div className={reduced ? "relative" : "sticky top-0 h-[100svh] overflow-hidden"}>
        <div className={reduced ? "relative h-[70svh]" : "absolute inset-0"}>
          <StoryStage product={product} sectionId={id} reduced={reduced} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75))]" />
        </div>
        <div className={reduced ? "mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:px-10" : "absolute inset-0"}>
          {SCENES.map((s, i) => (
            <div
              key={s.eyebrow}
              data-scene={i}
              className={
                reduced
                  ? ""
                  : `absolute inset-x-0 mx-auto max-w-[1400px] px-5 md:px-10 ${i % 2 ? "bottom-[12svh] md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:text-right" : "bottom-[12svh] md:bottom-auto md:top-1/2 md:-translate-y-1/2"}`
              }
              style={!reduced && i > 0 ? { opacity: 0, visibility: "hidden" } : undefined}
            >
              <div className={`max-w-[420px] ${i % 2 && !reduced ? "md:ml-auto" : ""}`}>
                <p className="eyebrow">{s.eyebrow}</p>
                <h2 className="mt-4 font-display text-[clamp(1.4rem,3.4vw,2.6rem)] font-bold uppercase leading-[1.05] text-bone">{s.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-bone/65 md:text-base">{s.text}</p>
                {i === SCENES.length - 1 && (
                  <Link href={`/showroom/${product.slug}`} className="btn-primary pointer-events-auto mt-8" data-testid="story-explore">
                    <CubeIcon /> Explorar em 3D
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
