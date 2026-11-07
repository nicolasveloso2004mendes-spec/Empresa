import { LogoMark } from "@/components/ui/LogoMark";
import { site } from "@/data/site";
import { projects } from "@/data/projects";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-gold/20 bg-void/90 px-[var(--gutter)] pb-24 pt-16 backdrop-blur-sm sm:pb-16">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10" />
            <span className="font-display text-3xl tracking-[0.06em]">NICOTECH</span>
          </div>
          <p className="mt-4 max-w-sm text-bone/65">{site.tagline}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/45">{site.location}</p>
        </div>
        <div>
          <h2 className="eyebrow">Contato</h2>
          <ul className="mt-4 space-y-2">
            {site.contacts.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex min-h-11 items-center gap-3 text-bone/80 transition-colors hover:text-gold-hi"
                >
                  <span className="w-20 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/45">{c.label}</span>
                  {c.value}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="eyebrow">Projetos</h2>
          <ul className="mt-4 space-y-2">
            {projects.map((p) => (
              <li key={p.slug}>
                <a href={`/projetos/${p.slug}`} className="inline-flex min-h-11 items-center text-bone/80 transition-colors hover:text-gold-hi">
                  {p.client} — estudo de caso
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="hairline mt-14" />
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/40">© {new Date().getFullYear()} NicoTech · Digital Experiences Beyond Ordinary</p>
    </footer>
  );
}
