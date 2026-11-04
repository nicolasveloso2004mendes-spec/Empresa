import type { Product } from "@/lib/schema";
import { ProductCard } from "./ProductCard";

export function Catalog({ products, title = "Escolha seu próximo aparelho", headingLevel = 2 }: { products: Product[]; title?: string; headingLevel?: 1 | 2 }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <section id="produtos" className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32" aria-labelledby="catalog-title">
      <p className="eyebrow">Catálogo 3D</p>
      <H id="catalog-title" className="mt-4 max-w-2xl font-display text-[clamp(1.5rem,3.4vw,2.6rem)] font-bold uppercase leading-[1.05] text-bone">{title}</H>
      {products.length === 0 ? (
        <p className="mt-10 text-mute">Nenhum produto publicado no momento.</p>
      ) : (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
