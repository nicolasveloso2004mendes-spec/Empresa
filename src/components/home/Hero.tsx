"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/schema";
import { CubeIcon } from "@/components/site/icons";
import { useIsTouch } from "@/hooks/useIsTouch";

// O 3D só é baixado no cliente, depois do HTML da hero (que é o LCP).
const HeroStage = dynamic(() => import("./HeroStage"), { ssr: false });

export function Hero({ product }: { product: Product | null }) {
  const [introDone, setIntroDone] = useState(!product);
  const [skip, setSkip] = useState(0);
  const [textIn, setTextIn] = useState(false);
  const [touchInteract, setTouchInteract] = useState(false);
  const isTouch = useIsTouch();

  useEffect(() => {
    const t = setTimeout(() => setTextIn(true), 900);
    return () => clearTimeout(t);
  }, []);

  const onIntroDone = useCallback(() => {
    setIntroDone(true);
    setTextIn(true);
  }, []);

  // No desktop o aparelho é girável logo após a introdução; no celular, só quando o
  // visitante ativa — assim o toque continua rolando a página normalmente.
  const interactive = introDone && (!isTouch || touchInteract);

  return (
    <section className="grain relative h-[100svh] min-h-[640px] overflow-hidden bg-black" aria-labelledby="hero-title" data-testid="hero">
      {product && <HeroStage product={product} skipSignal={skip} onIntroDone={onIntroDone} interactive={interactive} />}

      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:justify-center md:px-10 md:pb-0">
        <div className="max-w-[640px]">
          <p className={`eyebrow reveal ${textIn ? "is-in" : ""}`} style={{ ["--d" as string]: "0s" }}>Showroom 3D · BBM Imports</p>
          <h1
            id="hero-title"
            className={`reveal mt-5 font-display text-[clamp(2rem,6.2vw,5rem)] font-bold uppercase leading-[0.98] tracking-[0.02em] text-bone ${textIn ? "is-in" : ""}`}
            style={{ ["--d" as string]: ".12s" }}
          >
            Tecnologia que você pode sentir.
          </h1>
          <p className={`reveal mt-6 max-w-md text-base text-bone/70 md:text-lg ${textIn ? "is-in" : ""}`} style={{ ["--d" as string]: ".28s" }}>
            Explore cada detalhe. Descubra seu próximo Apple.
          </p>
          <div className={`reveal pointer-events-auto mt-9 flex flex-wrap gap-3 ${textIn ? "is-in" : ""}`} style={{ ["--d" as string]: ".42s" }}>
            <Link href={product ? `/showroom/${product.slug}` : "/showroom"} className="btn-primary" data-testid="hero-explore">
              <CubeIcon /> Explorar em 3D
            </Link>
            <Link href="/#produtos" className="btn-outline" data-testid="hero-products">
              Conhecer produtos
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute right-5 top-20 z-20 flex items-center gap-3 md:bottom-10 md:right-10 md:top-auto">
        {!introDone && (
          <button type="button" onClick={() => setSkip((n) => n + 1)} className="btn-ghost" data-testid="hero-skip">
            Pular introdução
          </button>
        )}
        {introDone && product && isTouch && (
          <button type="button" onClick={() => setTouchInteract((v) => !v)} className="btn-ghost" aria-pressed={touchInteract} data-testid="hero-interact">
            {touchInteract ? "Concluir" : "Girar aparelho"}
          </button>
        )}
        {introDone && product && !isTouch && (
          <span className="hidden text-[11px] uppercase tracking-[0.24em] text-white/40 md:block">Arraste para girar</span>
        )}
      </div>
    </section>
  );
}
