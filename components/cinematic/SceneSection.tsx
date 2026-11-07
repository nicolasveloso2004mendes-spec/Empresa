"use client";
import { createContext, useContext, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/animation/gsap";
import { cine, recomputeActive, emit } from "@/lib/animation/store";

type Ctx = { id: string; ref: RefObject<HTMLElement | null>; el: () => HTMLElement | null };
const SceneCtx = createContext<Ctx | null>(null);
export const useScene = () => {
  const c = useContext(SceneCtx);
  if (!c) throw new Error("useScene outside <SceneSection>");
  return c;
};

/**
 * A pinned "shot". The section is `length` viewports tall; its inner stage is
 * CSS-sticky (robust with Lenis, no pin-spacer reflow). Its normalized progress is
 * published to the shared store for the WebGL director.
 */
export function SceneSection({
  id,
  length = 3,
  children,
  className = "",
  label,
  pinned = true,
  overlap = true,
}: {
  id: string;
  length?: number;
  children: ReactNode;
  className?: string;
  label: string;
  pinned?: boolean;
  /** start sticking exactly when the previous pinned scene ends (seamless handoff) */
  overlap?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    // pinned overlays only exist while their shot is on screen: the next scene
    // never slides over the current one, hand-offs are clean cuts in the DOM
    const show = (on: boolean) => {
      if (!stage.current) return;
      stage.current.style.visibility = on ? "visible" : "hidden";
      stage.current.style.pointerEvents = on ? "auto" : "none";
    };
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        cine.progress[id] = self.progress;
        recomputeActive();
      },
      onRefresh: (self) => {
        cine.progress[id] = self.progress;
        recomputeActive();
        if (pinned) show(self.isActive || (self.progress === 0 && !overlap) || (self.progress === 1 && !overlap));
        emit();
      },
      onToggle: (self) => {
        if (pinned) show(self.isActive || (!overlap && (self.progress === 0 || self.progress === 1)));
        emit();
      },
    });
    return () => st.kill();
  }, [id, pinned, overlap]);

  return (
    <SceneCtx.Provider value={{ id, ref, el: () => ref.current ?? document.getElementById(id) }}>
      <section
        id={id}
        ref={ref}
        aria-label={label}
        data-scene={id}
        className={`relative ${pinned ? "pointer-events-none" : ""} ${className}`}
        style={pinned ? { height: `${length * 100}svh`, marginTop: overlap ? "-100svh" : undefined } : undefined}
      >
        {pinned ? (
          <div ref={stage} className="pointer-events-auto sticky top-0 h-svh w-full overflow-hidden">
            {children}
          </div>
        ) : (
          children
        )}
      </section>
    </SceneCtx.Provider>
  );
}

/**
 * Builds a GSAP timeline scrubbed by the scene's progress. Positions are 0..1
 * (fractions of the scene), so choreography reads like a cue sheet.
 */
export function useSceneTimeline(build: (tl: gsap.core.Timeline, root: HTMLElement) => void, deps: unknown[] = []) {
  const { el } = useScene();
  useLayoutEffect(() => {
    // children's layout effects run before the parent's ref is attached → resolve by id
    const root = el();
    if (!root) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: cine.reduced ? true : 0.8,
        },
      });
      build(tl, root);
      tl.set({}, {}, 1); // normalize total duration to 1
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
