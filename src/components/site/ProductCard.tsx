/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Category, Product } from "@/lib/schema";
import { formatPrice } from "@/lib/format";
import { CubeIcon } from "./icons";

export function availability(p: Product) {
  const anyColor = p.colors.some((c) => c.available);
  const anyCap = p.capacities.length === 0 || p.capacities.some((c) => c.available);
  return anyColor && anyCap;
}

export function startingPrice(p: Product) {
  const prices = p.capacities.filter((c) => c.available && c.price != null).map((c) => c.price as number);
  return prices.length ? Math.min(...prices) : null;
}

export function ProductCard({ product, category }: { product: Product; category?: Category }) {
  const price = formatPrice(startingPrice(product));
  const available = availability(product);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface" data-testid={`card-${product.slug}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#1d1b18,#000_70%)]">
        {product.poster ? (
          <img
            src={product.poster}
            alt={`${product.name} — imagem do modelo 3D`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain transition-transform duration-700 ease-(--ease-lux) group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-mute">Sem imagem</div>
        )}
        {product.model.articulations.length > 0 && (
          <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-bone/80">
            Abre em 3D
          </span>
        )}
        {product.demo && (
          <span className="absolute left-4 top-4 rounded-full border border-champagne/40 bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne">
            Demonstrativo
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {category && <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-champagne/80">{category.name}</p>}
        <h3 className="font-display text-[15px] font-bold uppercase leading-snug tracking-[0.06em] text-bone">{product.name}</h3>
        <p className="mt-2 text-sm text-mute">{product.condition}</p>
        <div className="mt-4 flex items-center gap-2" aria-label="Cores">
          {product.colors.map((c) => (
            <span
              key={c.id}
              title={`${c.name}${c.available ? "" : " (indisponível)"}`}
              className={`h-4 w-4 rounded-full border ${c.available ? "border-white/30" : "border-white/10 opacity-35"}`}
              style={{ background: c.swatch }}
            />
          ))}
          <span className="sr-only">{product.colors.filter((c) => c.available).map((c) => c.name).join(", ")}</span>
        </div>
        <div className="mt-4 text-sm">
          {price ? <span className="text-bone">A partir de {price}</span> : <span className="text-mute">Preço sob consulta</span>}
          <span className={`ml-3 text-xs uppercase tracking-wider ${available ? "text-champagne" : "text-white/40"}`}>{available ? "Disponível" : "Indisponível"}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 pt-auto">
          <Link href={`/showroom/${product.slug}`} className="btn-primary flex-1 !px-5" data-testid={`view3d-${product.slug}`}>
            <CubeIcon /> Visualizar em 3D
          </Link>
          <Link href={`/produtos/${product.slug}`} className="btn-ghost" aria-label={`Detalhes de ${product.name}`}>
            Detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}
