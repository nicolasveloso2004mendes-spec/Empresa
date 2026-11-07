import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, getProject } from "@/data/projects";
import { site } from "@/data/site";
import { LogoMark } from "@/components/ui/LogoMark";

export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  return {
    title: `${p.client} — estudo de caso`,
    description: p.summary.slice(0, 155),
    alternates: { canonical: `/projetos/${p.slug}` },
    openGraph: { images: [{ url: p.media.desktop, width: 1440, height: 900 }] },
  };
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  const i = projects.indexOf(p);
  const next = projects[(i + 1) % projects.length];

  return (
    <main className="static-stage min-h-svh px-[var(--gutter)] pb-24">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="flex min-h-11 items-center gap-3" aria-label="NicoTech — voltar para a experiência">
          <LogoMark className="h-8 w-8" />
          <span className="font-display text-xl tracking-[0.08em]">NICOTECH</span>
        </Link>
        <Link href={`/#work-${p.slug}`} className="min-h-11 content-center font-mono text-[11px] uppercase tracking-[0.2em] text-bone/70 hover:text-gold-hi">
          ← Voltar ao showcase
        </Link>
      </header>

      <section className="pt-[10svh]">
        <p className="eyebrow">Estudo de caso {p.index} · {p.year}</p>
        <h1 className="display mt-4 text-[clamp(3.6rem,12vw,11rem)]">{p.client}</h1>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/60">{p.sector}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center bg-gold px-6 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-void hover:bg-gold-hi">
            Abrir site real ↗
          </a>
          <a href={site.primaryContact.href} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center border border-white/20 px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/85 hover:border-gold">
            Quero um projeto assim
          </a>
        </div>
      </section>

      <figure className="mt-16 overflow-hidden border border-white/10 shadow-[0_60px_160px_-40px_rgba(212,175,55,0.35)]">
        <Image src={p.media.desktop} alt={`Página inicial do site ${p.client}, capturada do site publicado`} width={1440} height={900} priority sizes="(min-width: 1280px) 1200px, 100vw" className="h-auto w-full" />
      </figure>

      <div className="mt-20 grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-12">
          <section>
            <h2 className="eyebrow">Visão geral</h2>
            <p className="mt-4 text-xl leading-relaxed text-bone/85">{p.summary}</p>
          </section>
          <section>
            <h2 className="eyebrow">Desafio</h2>
            <p className="mt-4 leading-relaxed text-bone/80">{p.challenge}</p>
          </section>
          <section>
            <h2 className="eyebrow">O que foi feito</h2>
            <ul className="mt-4 space-y-4">
              {p.approach.map((a) => (
                <li key={a} className="flex gap-4 leading-relaxed text-bone/80">
                  <span aria-hidden className="mt-3 h-px w-6 shrink-0 bg-gold" />
                  {a}
                </li>
              ))}
            </ul>
          </section>
          <section className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="eyebrow">Entregas</h2>
              <ul className="mt-4 space-y-1.5 text-bone/75">{p.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
            </div>
            <div>
              <h2 className="eyebrow">Stack</h2>
              <ul className="mt-4 space-y-1.5 text-bone/75">{p.stack.map((d) => <li key={d}>{d}</li>)}</ul>
              <h2 className="eyebrow mt-8">Destaques do site</h2>
              <ul className="mt-4 space-y-1.5 text-bone/75">{p.highlights.map((d) => <li key={d}>{d}</li>)}</ul>
            </div>
          </section>
        </div>
        <div className="grid grid-cols-[1fr_0.62fr] items-start gap-6">
          <figure className="max-h-[80svh] overflow-hidden border border-white/10">
            <Image src={p.media.desktopFull} alt={`Página completa do site ${p.client}`} width={1092} height={4096} sizes="(min-width: 1024px) 40vw, 60vw" className="h-auto w-full" />
          </figure>
          <figure className="overflow-hidden rounded-[1.6rem] border-[6px] border-graphite-2">
            <Image src={p.media.mobile} alt={`Versão mobile do site ${p.client}`} width={780} height={1688} sizes="(min-width: 1024px) 22vw, 35vw" className="h-auto w-full" />
          </figure>
        </div>
      </div>

      <nav aria-label="Próximo projeto" className="mt-28 border-t border-gold/20 pt-10">
        <Link href={`/projetos/${next.slug}`} className="group block">
          <p className="eyebrow">Próximo estudo de caso</p>
          <p className="display mt-3 text-[clamp(2.8rem,8vw,7rem)] transition-colors group-hover:text-gold-hi">{next.client} →</p>
        </Link>
      </nav>
    </main>
  );
}
