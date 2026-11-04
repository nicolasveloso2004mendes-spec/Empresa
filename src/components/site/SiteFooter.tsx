import Link from "next/link";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./icons";
import { whatsappLink } from "@/lib/whatsapp";
import { listCategories } from "@/lib/store";

export async function SiteFooter() {
  const categories = await listCategories();
  return (
    <footer id="atendimento" className="border-t border-line bg-black">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div>
          <Logo />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-mute">
            Escolha com calma, veja cada detalhe em 3D e tire suas dúvidas direto com a nossa equipe no WhatsApp.
          </p>
          <a
            href={whatsappLink("Olá! Vim pelo site da BBM Imports e quero atendimento.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp mt-8"
            data-testid="footer-whatsapp"
          >
            <WhatsAppIcon /> Falar no WhatsApp
          </a>
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-3 text-sm text-bone/75">
          <span className="eyebrow mb-2">Navegação</span>
          <Link href="/" className="hover:text-bone">Início</Link>
          <Link href="/produtos" className="hover:text-bone">Produtos</Link>
          <Link href="/showroom" className="hover:text-bone">Showroom 3D</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/categorias/${c.slug}`} className="hover:text-bone">{c.name}</Link>
          ))}
        </nav>
        <div className="text-xs leading-relaxed text-mute">
          <span className="eyebrow mb-4 block">Aviso</span>
          Apple e iPhone são marcas da Apple Inc.; Samsung e Galaxy, da Samsung Electronics; Xiaomi, da Xiaomi Inc.
          As marcas são citadas apenas para identificar os aparelhos revendidos; a BBM Imports não é afiliada a esses fabricantes.
          Modelos identificados como “demonstrativos” servem apenas para ilustrar o showroom e não representam fielmente nenhum aparelho comercial.
        </div>
      </div>
      <div className="border-t border-line py-6 text-center text-[11px] uppercase tracking-[0.2em] text-white/35">
        © {new Date().getFullYear()} BBM Imports
      </div>
    </footer>
  );
}
