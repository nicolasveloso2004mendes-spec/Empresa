"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/schema";
import { ProductCard } from "./ProductCard";

type Props = {
  products: Product[];
  categories: Category[];
  title?: string;
  headingLevel?: 1 | 2;
  /** Categoria inicial (página de categoria). */
  initial?: string;
  showTabs?: boolean;
};

/** Catálogo com abas de categoria (filtragem instantânea, sem recarregar a página). */
export function Catalog({ products, categories, title = "Escolha seu próximo aparelho", headingLevel = 2, initial = "todos", showTabs = true }: Props) {
  const H = headingLevel === 1 ? "h1" : "h2";
  // Só mostra categorias que têm produto publicado.
  const used = useMemo(() => categories.filter((c) => products.some((p) => p.category === c.id)), [categories, products]);
  const [active, setActive] = useState(initial);
  const list = active === "todos" ? products : products.filter((p) => p.category === active);
  const counts = (id: string) => products.filter((p) => p.category === id).length;

  return (
    <section id="produtos" className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32" aria-labelledby="catalog-title">
      <p className="eyebrow">Catálogo 3D</p>
      <H id="catalog-title" className="mt-4 max-w-2xl font-display text-[clamp(1.5rem,3.4vw,2.6rem)] font-bold uppercase leading-[1.05] text-bone">{title}</H>

      {showTabs && used.length > 0 && (
        <div className="no-scrollbar -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0" role="tablist" aria-label="Categorias">
          {[{ id: "todos", name: "Todos", n: products.length }, ...used.map((c) => ({ id: c.id, name: c.name, n: counts(c.id) }))].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active === t.id}
              onClick={() => setActive(t.id)}
              className="min-h-11 shrink-0 rounded-full border border-white/12 px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-bone/70 transition-colors hover:border-white/30 hover:text-bone aria-selected:border-champagne aria-selected:bg-champagne/10 aria-selected:text-champagne"
              data-testid={`tab-${t.id}`}
            >
              {t.name} <span className="ml-1 tabular-nums text-white/35">{t.n}</span>
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <p className="mt-10 text-mute">Nenhum produto publicado nesta categoria no momento.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="tabpanel">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} category={categories.find((c) => c.id === p.category)} />
          ))}
        </div>
      )}

      {showTabs && active !== "todos" && (
        <Link href={`/categorias/${used.find((c) => c.id === active)?.slug ?? ""}`} className="btn-ghost mt-10">
          Ver página da categoria
        </Link>
      )}
    </section>
  );
}
