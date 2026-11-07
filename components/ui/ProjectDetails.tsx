"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { Project } from "@/data/projects";

/** Side drawer with the real details of the work. Focus-trapped, Esc to close. */
export function ProjectDetails({ project, onClose }: { project: Project; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a,button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[60] flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button aria-label="Fechar detalhes" className="absolute inset-0 bg-void/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`d-${project.slug}`}
        tabIndex={-1}
        data-lenis-prevent
        className="relative h-full w-full max-w-xl overflow-y-auto border-l border-gold/25 bg-graphite p-8 outline-none sm:p-10"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow">Projeto {project.index} · {project.year}</p>
            <h3 id={`d-${project.slug}`} className="display mt-3 text-6xl">
              {project.client}
            </h3>
          </div>
          <button onClick={onClose} className="min-h-11 min-w-11 border border-white/15 font-mono text-xs text-bone/80 hover:border-gold">
            ✕<span className="sr-only">Fechar</span>
          </button>
        </div>
        <p className="mt-6 leading-relaxed text-bone/85">{project.summary}</p>
        <img src={project.media.desktop} alt={`Página inicial real do site ${project.client}`} className="mt-8 w-full border border-white/10" />
        <h4 className="eyebrow mt-10">Desafio</h4>
        <p className="mt-3 leading-relaxed text-bone/80">{project.challenge}</p>
        <h4 className="eyebrow mt-10">O que foi feito</h4>
        <ul className="mt-3 space-y-3">
          {project.approach.map((a) => (
            <li key={a} className="flex gap-3 leading-relaxed text-bone/80">
              <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-gold" />
              {a}
            </li>
          ))}
        </ul>
        <div className="mt-10 grid grid-cols-2 gap-8">
          <div>
            <h4 className="eyebrow">Entregas</h4>
            <ul className="mt-3 space-y-1 text-sm text-bone/75">
              {project.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="eyebrow">Stack</h4>
            <ul className="mt-3 space-y-1 text-sm text-bone/75">
              {project.stack.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center bg-gold px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-void hover:bg-gold-hi">
            Abrir site real ↗
          </a>
          <Link href={`/projetos/${project.slug}`} className="flex min-h-12 items-center border border-white/20 px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/85 hover:border-gold">
            Estudo de caso completo →
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
