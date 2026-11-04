import Link from "next/link";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./icons";
import { whatsappLink } from "@/lib/whatsapp";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={`${overlay ? "absolute" : "sticky bg-black/80 backdrop-blur-xl border-b border-line"} inset-x-0 top-0 z-50`}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:h-20 md:px-10">
        <Logo />
        <nav className="hidden items-center gap-9 text-[12px] font-medium uppercase tracking-[0.2em] text-bone/70 md:flex" aria-label="Principal">
          <Link href="/#showroom" className="transition-colors hover:text-bone">Showroom</Link>
          <Link href="/produtos" className="transition-colors hover:text-bone">Produtos</Link>
          <Link href="/#atendimento" className="transition-colors hover:text-bone">Atendimento</Link>
        </nav>
        <a
          href={whatsappLink("Olá! Vim pelo site da BBM Imports e quero atendimento.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-bone transition-colors hover:border-champagne hover:text-champagne"
          data-testid="header-whatsapp"
        >
          <WhatsAppIcon />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>
    </header>
  );
}
