"use client";
import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
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
  holdEnd = false,
}: {
  id: string;
  length?: number;
  children: ReactNode;
  className?: string;
  label: string;
  pinned?: boolean;
  /** start sticking exactly when the previous pinned scene ends (seamless handoff) */
  overlap?: boolean;
  /** stay visible after the end (when the next section is not an overlapping pinned scene) */
  holdEnd?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ctx = useMemo<Ctx>(() => ({ id, ref, el: () => ref.current ?? document.getElementById(id) }), [id]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    // pinned overlays only exist while their shot is on screen: the next scene
    // never slides over the current one, hand-offs are clean cuts in the DOM
    const show = (on: boolean) => {
      if (!stage.current) return;
      stage.current.style.visibility = on ? "visible" : "hidden";
      stage.current.style.pointerEvents = on ? "auto" : "none";
    };
    // recomputed on every update: a fast jump can skip the "active" state entirely
    let last: boolean | null = null;
    const sync = (self: ScrollTrigger) => {
      if (!pinned) return;
      const on = self.isActive || (!overlap && self.progress === 0) || (self.progress === 1 && (!overlap || holdEnd));
      if (on !== last) show((last = on));
    };
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        cine.progress[id] = self.progress;
        recomputeActive();
        sync(self);
      },
      onRefresh: (self) => {
        cine.progress[id] = self.progress;
        recomputeActive();
        sync(self);
        emit();
      },
      onToggle: (self) => {
        sync(self);
        emit();
      },
    });
    return () => st.kill();
  }, [id, pinned, overlap, holdEnd]);

  return (
    <SceneCtx.Provider value={ctx}>
      <section
        id={id}
        ref={ref}
        aria-label={label}
        data-scene={id}
        className={`relative ${pinned ? "pointer-events-none" : ""} ${className}`}
        style={
          pinned
            ? { height: `calc((1 + ${length - 1} * var(--scene-k)) * 100svh)`, marginTop: overlap ? "-100svh" : undefined }
            : undefined
        }
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
