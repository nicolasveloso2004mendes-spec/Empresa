"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ ease: "power3.out" });
}

export { gsap, ScrollTrigger, SplitText };

/** Lenis instance (set by SmoothScroll) used for programmatic, smooth jumps */
type Scroller = { scrollTo: (target: number | string | HTMLElement, opts?: { duration?: number; offset?: number; immediate?: boolean }) => void };
let scroller: Scroller | null = null;
export const setScroller = (s: Scroller | null) => (scroller = s);

export function scrollToTarget(target: string | HTMLElement | number, duration = 2.2) {
  if (scroller) return scroller.scrollTo(target, { duration });
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (typeof el === "number") window.scrollTo({ top: el, behavior: "smooth" });
  else (el as HTMLElement | null)?.scrollIntoView({ behavior: "smooth" });
}

/** scroll so that a pinned scene sits at fraction `f` of its own progress */
export function scrollToScene(id: string, f = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const y = top + f * Math.max(0, el.offsetHeight - window.innerHeight) + 1;
  scrollToTarget(y);
}
