"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { SceneSection, useSceneTimeline } from "@/components/cinematic/SceneSection";
import { SplitText, scrollToScene } from "@/lib/animation/gsap";
import { cine } from "@/lib/animation/store";
import { useDevice } from "@/hooks/useDeviceTier";
import type { Project } from "@/data/projects";
import { ProjectDetails } from "@/components/ui/ProjectDetails";

type Focus = "auto" | "desktop" | "mobile";

function WorkCopy({ project, index, total }: { project: Project; index: number; total: number }) {
  const id = `work-${project.slug}`;
  const { webgl, ready } = useDevice();
  const [focus, setFocus] = useState<Focus>("auto");
  const [open, setOpen] = useState(false);
  const pct = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    cine.device[project.slug] = focus;
  }, [focus, project.slug]);

  useSceneTimeline((tl, root) => {
    const name = SplitText.create(root.querySelector("[data-name]"), { type: "words,chars", mask: "chars" });
    tl.from("[data-slate]", { opacity: 0, y: 20, duration: 0.06 }, 0.01)
      .from(name.chars, { yPercent: 120, duration: 0.1, stagger: 0.006, ease: "power4.out" }, 0.25)
      .from("[data-sector]", { opacity: 0, y: 16, duration: 0.06 }, 0.3)
      .to("[data-namewrap]", { opacity: 0, x: -60, filter: "blur(8px)", duration: 0.07, ease: "power2.in" }, 0.5)
      .fromTo("[data-live]", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.04 }, 0.6)
      .to("[data-live]", { opacity: 0, duration: 0.04 }, 0.8)
      .fromTo("[data-mobilecap]", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.06 }, 0.86)
      .to("[data-slate]", { opacity: 0, duration: 0.03 }, 0.97)
      .to("[data-mobilecap]", { opacity: 0, duration: 0.03 }, 0.97)
      .to("[data-controls]", { opacity: 0, duration: 0.03 }, 0.97);
    // live readout of the real page being scrolled on screen
    tl.to({}, {
      duration: 0.4,
      onUpdate() {
        if (pct.current) pct.current.textContent = String(Math.round(this.progress() * 100)).padStart(3, "0");
      },
    }, 0.48);
  }, [project.slug]);

  const set = (f: Focus) => setFocus((cur) => (cur === f ? "auto" : f));

  return (
    <div className="relative h-full">
      {ready && !webgl && <DeviceFallback project={project} />}

      <div data-slate className="absolute left-[var(--gutter)] top-24 z-10">
        <p className="eyebrow">
          03 — Selected work · {project.index}/{String(total).padStart(2, "0")}
        </p>
      </div>

      {/* scroll-driven captions step aside when the visitor locks the camera on a device */}
      <div className="transition-opacity duration-500" style={{ opacity: focus === "auto" ? 1 : 0 }}>
      <div data-namewrap className="absolute left-[var(--gutter)] top-1/2 z-10 max-w-[min(90vw,44rem)] -translate-y-1/2">
        <h2 data-name className="display text-[clamp(3.2rem,9vw,8.5rem)] [text-shadow:0_4px_40px_rgba(0,0,0,0.6)]">
          {project.client}
        </h2>
        <p data-sector className="mt-4 max-w-sm font-mono text-[11px] uppercase leading-5 tracking-[0.2em] text-bone/70">
          {project.sector}
        </p>
      </div>

      <div data-live className="absolute bottom-28 left-[var(--gutter)] z-10 bg-void/80 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/80 backdrop-blur-md sm:bottom-32">
        <span className="text-gold">● Live capture</span> — {project.url.replace("https://", "").replace(/\/$/, "")} ·{" "}
        <span ref={pct}>000</span>%
      </div>

      <div data-mobilecap className="absolute bottom-44 left-[var(--gutter)] z-10 max-w-[15rem] sm:bottom-auto sm:left-auto sm:right-[var(--gutter)] sm:top-1/3 sm:text-right">
        <p className="eyebrow">Mobile</p>
        <p className="display mt-2 text-[clamp(2rem,4vw,3.6rem)]">Pensado para o polegar.</p>
      </div>
      </div>

      {/* controls */}
      <div data-controls className="absolute inset-x-[var(--gutter)] bottom-6 z-20 flex flex-wrap items-center gap-2 sm:bottom-12">
        <div role="group" aria-label="Visualização" className="flex border border-white/15 bg-void/70 backdrop-blur-md">
          {(["desktop", "mobile"] as const).map((f) => (
            <button
              key={f}
              onClick={() => (webgl ? set(f) : scrollToScene(id, f === "desktop" ? 0.62 : 0.95))}
              aria-pressed={focus === f}
              className={`min-h-11 px-4 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                focus === f ? "bg-gold text-void" : "text-bone/75 hover:text-bone"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="min-h-11 border border-white/15 bg-void/70 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/80 backdrop-blur-md transition-colors hover:border-gold hover:text-gold-hi"
        >
          Detalhes
        </button>
        <Link
          href={`/projetos/${project.slug}`}
          className="flex min-h-11 items-center border border-white/15 bg-void/70 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/80 backdrop-blur-md transition-colors hover:border-gold hover:text-gold-hi"
        >
          Estudo de caso →
        </Link>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center bg-gold px-4 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-void transition-colors hover:bg-gold-hi"
        >
          Abrir site ↗
        </a>
        {focus !== "auto" && (
          <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.18em] text-bone/50">
            Câmera travada no {focus} · clique de novo para voltar
          </span>
        )}
      </div>

      {ready &&
        createPortal(
          <AnimatePresence>{open && <ProjectDetails project={project} onClose={() => setOpen(false)} />}</AnimatePresence>,
          document.body,
        )}
      <span className="sr-only">
        Projeto {index + 1} de {total}: {project.client}. {project.summary}
      </span>
    </div>
  );
}

/** No-WebGL version: real captures in CSS device frames, scrubbed by scroll. */
function DeviceFallback({ project }: { project: Project }) {
  useSceneTimeline((tl) => {
    tl.fromTo("[data-fb-desk]", { yPercent: 0 }, { yPercent: -70, duration: 0.5 }, 0.45).from("[data-fb-phone]", { y: 200, opacity: 0, duration: 0.2 }, 0.72);
  }, [project.slug]);
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-6 px-[var(--gutter)] pt-10" aria-hidden>
      <div className="relative aspect-[16/10] w-[min(70vw,880px)] overflow-hidden rounded-md border-[10px] border-graphite-2 bg-graphite shadow-[0_40px_120px_rgba(212,175,55,0.15)]">
        <img data-fb-desk src={project.media.desktopFull} alt="" className="w-full" loading="lazy" />
      </div>
      <motion.div data-fb-phone className="relative hidden aspect-[9/19.5] w-[min(18vw,220px)] overflow-hidden rounded-[1.6rem] border-[6px] border-graphite-2 md:block">
        <img src={project.media.mobile} alt="" className="w-full" loading="lazy" />
      </motion.div>
    </div>
  );
}

export function WorkScene({ project, index, total }: { project: Project; index: number; total: number }) {
  return (
    <SceneSection id={`work-${project.slug}`} length={4.6} label={`Projeto ${project.client}`}>
      <WorkCopy project={project} index={index} total={total} />
    </SceneSection>
  );
}
