"use client";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/animation/gsap";
import { useDevice } from "@/hooks/useDeviceTier";

/**
 * BLUEPRINT BUILD — the motion signature taken from the reference video:
 * a swarm of cursors flies in, draws measured wireframes (with W × H tags)
 * around every [data-bp] element, the real content materializes inside the
 * wireframe, then the scaffolding dissolves.
 *
 * Driving modes:
 *  - "scene":  scrubbed by the parent pinned scene, inside `range` (fractions)
 *  - "self":   scrubbed while the wrapper crosses the viewport
 *  - "manual": `progress` prop (0..1) — used by the Lab to let visitors scrub it
 */
type Props = {
  children: ReactNode;
  className?: string;
  mode?: "scene" | "self" | "manual";
  sceneId?: string;
  range?: [number, number];
  progress?: number;
  cursors?: number;
  tone?: "gold" | "white";
};

const ARROW =
  '<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path d="M1 1l13 7.2-5.6 1.4L5.6 16z" fill="currentColor" stroke="#050505" stroke-width="1.2" stroke-linejoin="round"/></svg>';

export function Blueprint({
  children,
  className = "",
  mode = "self",
  sceneId,
  range = [0, 0.3],
  progress,
  cursors = 14,
  tone = "gold",
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const { reducedMotion, ready } = useDevice();
  const progressRef = useRef(progress ?? 0);
  progressRef.current = progress ?? 0;

  useLayoutEffect(() => {
    if (!ready || reducedMotion) return;
    const root = wrap.current!;
    const layer = overlay.current!;
    let ctx: gsap.Context | null = null;

    const build = () => {
      ctx?.revert();
      layer.innerHTML = "";
      const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-bp]"));
      if (!targets.length) return;
      const R = root.getBoundingClientRect();
      if (R.width === 0) return;

      ctx = gsap.context(() => {
        const boxes = targets.map((el) => {
          const r = el.getBoundingClientRect();
          const box = document.createElement("div");
          box.className = "bp-box";
          box.style.cssText = `left:${r.left - R.left}px;top:${r.top - R.top}px;width:${r.width}px;height:${r.height}px`;
          box.innerHTML = `<i class="bp-h tl"></i><i class="bp-h tr"></i><i class="bp-h bl"></i><i class="bp-h br"></i><span class="bp-label">${Math.round(r.width)} × ${Math.round(r.height)}</span>`;
          layer.appendChild(box);
          return { box, x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height };
        });

        const swarm = Array.from({ length: cursors }, (_, i) => {
          const c = document.createElement("div");
          c.className = `bp-cursor ${i % 3 === 0 && tone === "gold" ? "is-gold" : ""}`;
          c.innerHTML = ARROW;
          layer.appendChild(c);
          return c;
        });

        const tl = gsap.timeline({ paused: mode === "manual", defaults: { ease: "power2.inOut" } });
        tl.set({}, {}, 1);

        // 1 — swarm arrives from the edges
        swarm.forEach((c, i) => {
          const b = boxes[i % boxes.length];
          const fromX = gsap.utils.random(-0.2, 1.2) * R.width;
          const fromY = (Math.random() > 0.5 ? 1.15 : -0.15) * R.height + gsap.utils.random(-60, 60);
          const jx = gsap.utils.random(-6, 6);
          const jy = gsap.utils.random(-6, 6);
          gsap.set(c, { x: fromX, y: fromY, opacity: 0 });
          tl.to(c, { opacity: 1, duration: 0.06 }, 0.02 + i * 0.006)
            .to(c, { x: b.x + jx, y: b.y + jy, duration: 0.26, ease: "power3.out" }, 0.02 + i * 0.008)
            // 2 — drag out the wireframe
            .to(c, { x: b.x + b.w + jx, y: b.y + b.h + jy, duration: 0.16 }, 0.3 + (i % boxes.length) * 0.01)
            // 4 — leave
            .to(
              c,
              {
                x: b.x + b.w + gsap.utils.random(-200, 200),
                y: b.y + gsap.utils.random(-260, 260),
                opacity: 0,
                duration: 0.22,
                ease: "power2.in",
              },
              0.76 + i * 0.006,
            );
        });

        boxes.forEach((b, i) => {
          const label = b.box.querySelector(".bp-label");
          gsap.set(b.box, { scaleX: 0, scaleY: 0, transformOrigin: "0 0", opacity: 1 });
          tl.to(b.box, { scaleX: 1, scaleY: 1, duration: 0.16 }, 0.3 + i * 0.01)
            .fromTo(label, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.06 }, 0.42)
            .to(b.box, { opacity: 0, duration: 0.18 }, 0.72 + i * 0.008);
        });

        // 3 — the real thing materializes inside its wireframe
        targets.forEach((el, i) => {
          tl.fromTo(
            el,
            { clipPath: "inset(0% 100% 100% 0%)", opacity: 0.25 },
            { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 0.24, ease: "power3.inOut" },
            0.46 + i * 0.015,
          );
        });

        if (mode === "manual") {
          tl.progress(progressRef.current);
        } else if (mode === "scene" && sceneId) {
          const section = document.getElementById(sceneId)!;
          const at = (f: number) => () => {
            const top = section.getBoundingClientRect().top + scrollY;
            return top + f * Math.max(1, section.offsetHeight - innerHeight);
          };
          gsap.timeline({
            scrollTrigger: { trigger: section, start: at(range[0]), end: at(range[1]), scrub: 0.6 },
          }).add(tl.play(0));
        } else {
          gsap.timeline({
            scrollTrigger: { trigger: root, start: "top 95%", end: "top 60%", scrub: 0.4 },
          }).add(tl.play(0));
        }
        tlRef.current = tl;
      }, root);
    };

    build();
    let raf = 0;
    let lastW = root.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (Math.abs(root.offsetWidth - lastW) < 2) return;
      lastW = root.offsetWidth;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(build);
    });
    ro.observe(root);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      ctx?.revert();
      layer.innerHTML = "";
      tlRef.current = null;
    };
  }, [ready, reducedMotion, mode, sceneId, range[0], range[1], cursors, tone]);

  useEffect(() => {
    if (mode === "manual" && tlRef.current) tlRef.current.progress(progress ?? 0);
  }, [progress, mode]);

  return (
    <div ref={wrap} className={`relative ${className}`}>
      {children}
      <div ref={overlay} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-visible" />
    </div>
  );
}
