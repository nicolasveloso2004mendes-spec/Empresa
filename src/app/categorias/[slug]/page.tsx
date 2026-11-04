import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Catalog } from "@/components/site/Catalog";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { listCategories, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await listCategories()).find((x) => x.slug === slug);
  if (!c) return { title: "Categoria não encontrada" };
  return { title: `${c.name} em 3D`, description: c.description || `${c.name} no showroom 3D da BBM Imports.`, alternates: { canonical: `/categorias/${c.slug}` } };
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const [categories, all] = await Promise.all([listCategories(), listProducts()]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const products = all.filter((p) => p.category === cat.id);
  return (
    <>
      <SiteHeader />
      <main>
        <nav aria-label="Categorias" className="mx-auto flex max-w-[1400px] flex-wrap gap-2 px-5 pt-10 md:px-10">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categorias/${c.slug}`}
              aria-current={c.id === cat.id ? "page" : undefined}
              className="rounded-full border border-white/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-bone/70 hover:border-white/30 aria-[current=page]:border-champagne aria-[current=page]:text-champagne"
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <Catalog products={products} categories={categories} title={cat.name} headingLevel={1} showTabs={false} />
      </main>
      <SiteFooter />
    </>
  );
}
