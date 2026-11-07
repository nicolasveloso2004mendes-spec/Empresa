"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, setScroller } from "@/lib/animation/gsap";
import { cine, emit } from "@/lib/animation/store";

/** Lenis drives the scroll, GSAP's ticker drives Lenis, ScrollTrigger listens. One clock. */
export function SmoothScroll({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    const onGlobal = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      cine.global = max > 0 ? scrollY / max : 0;
    };
    if (!enabled) {
      setScroller(null);
      addEventListener("scroll", onGlobal, { passive: true });
      return () => removeEventListener("scroll", onGlobal);
    }
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4, syncTouch: false });
    setScroller(lenis);
    lenis.on("scroll", () => {
      ScrollTrigger.update();
      onGlobal();
      emit();
    });
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setScroller(null);
    };
  }, [enabled]);
  return null;
}
