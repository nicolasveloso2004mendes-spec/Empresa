"use client";
import { LogoMark } from "@/components/ui/LogoMark";
import { scrollToScene, scrollToTarget } from "@/lib/animation/gsap";
import { site } from "@/data/site";
import { projects } from "@/data/projects";

export function Header() {
  const go = (e: React.MouseEvent, fn: () => void) => {
    e.preventDefault();
    fn();
  };
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-[var(--gutter)] py-5">
      <a
        href="#intro"
        onClick={(e) => go(e, () => scrollToTarget(0, 2.6))}
        className="pointer-events-auto flex items-center gap-3"
        aria-label="NicoTech — voltar ao início"
      >
        <LogoMark className="h-8 w-8" />
        <span className="font-display text-xl tracking-[0.08em]">NICOTECH</span>
      </a>
      <nav aria-label="Principal" className="pointer-events-auto hidden items-center gap-8 md:flex">
        {[
          ["Work", `#work-${projects[0].slug}`, () => scrollToScene(`work-${projects[0].slug}`, 0.05)],
          ["Capabilities", "#capabilities", () => scrollToScene("capabilities", 0.02)],
          ["Lab", "#lab", () => scrollToTarget("#lab")],
        ].map(([label, href, fn]) => (
          <a
            key={label as string}
            href={href as string}
            onClick={(e) => go(e, fn as () => void)}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone/70 transition-colors hover:text-gold-hi"
          >
            {label as string}
          </a>
        ))}
      </nav>
      <a
        href={site.primaryContact.href}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto group flex min-h-11 items-center gap-2 border border-gold/50 px-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gold-hi transition-colors hover:bg-gold hover:text-void"
      >
        Start a project
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">↗</span>
      </a>
    </header>
  );
}
