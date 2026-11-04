/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { availability, startingPrice } from "@/components/site/ProductCard";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CubeIcon, WhatsAppIcon } from "@/components/site/icons";
import { formatPrice } from "@/lib/format";
import { getProductBySlug } from "@/lib/store";
import { productMessage, whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Produto não encontrado" };
  return { title: p.name, description: p.tagline || p.description.slice(0, 150), alternates: { canonical: `/produtos/${p.slug}` } };
}

export default async function ProdutoPage({ params }: Props) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const price = formatPrice(startingPrice(p));
  const available = availability(p);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-2 md:px-10 md:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-[radial-gradient(ellipse_at_50%_35%,#1d1b18,#000_70%)]">
          {p.poster && <img src={p.poster} alt={`${p.name} — imagem do modelo 3D`} className="mx-auto aspect-[4/5] w-full max-w-lg object-contain" />}
          {p.demo && (
            <span className="absolute left-4 top-4 rounded-full border border-champagne/40 bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne">
              Modelo demonstrativo
            </span>
          )}
        </div>
        <div>
          <p className="eyebrow">{p.condition}</p>
          <h1 className="mt-4 font-display text-[clamp(1.5rem,3vw,2.4rem)] font-bold uppercase leading-[1.05] text-bone">{p.name}</h1>
          {p.description && <p className="mt-5 max-w-lg leading-relaxed text-bone/70">{p.description}</p>}
          <div className="mt-6 text-sm">
            {price ? <span className="text-bone">A partir de {price}</span> : <span className="text-mute">Preço sob consulta</span>}
            <span className={`ml-3 text-xs uppercase tracking-wider ${available ? "text-champagne" : "text-white/40"}`}>{available ? "Disponível" : "Indisponível"}</span>
          </div>
          <div className="mt-6">
            <p className="label">Cores</p>
            <ul className="mt-2 flex flex-wrap gap-3 text-sm">
              {p.colors.map((c) => (
                <li key={c.id} className={`flex items-center gap-2 ${c.available ? "text-bone/85" : "text-white/35"}`}>
                  <span className="h-4 w-4 rounded-full border border-white/20" style={{ background: c.swatch }} />
                  {c.name}
                  {!c.available && " (indisponível)"}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={`/showroom/${p.slug}`} className="btn-primary" data-testid="product-view3d">
              <CubeIcon /> Visualizar em 3D
            </Link>
            <a
              href={whatsappLink(p.demo ? p.whatsappMessage ?? "Olá! Vim pelo site da BBM Imports." : productMessage({ productName: p.name }))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <WhatsAppIcon /> Falar no WhatsApp
            </a>
          </div>
          {p.specs.length > 0 && (
            <dl className="mt-12 divide-y divide-line border-y border-line text-sm">
              {p.specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-6 py-3">
                  <dt className="text-mute">{s.label}</dt>
                  <dd className="text-right text-bone/85">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
