import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShowroomClient } from "@/components/showroom/ShowroomClient";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getProductBySlug, listCategories, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Produto não encontrado" };
  return {
    title: `${p.name} em 3D`,
    description: `Gire, aproxime e veja os detalhes do ${p.name} no showroom 3D da BBM Imports.`,
    alternates: { canonical: `/showroom/${p.slug}` },
  };
}

export default async function ShowroomPage({ params }: Props) {
  const { slug } = await params;
  const [product, all, categories] = await Promise.all([getProductBySlug(slug), listProducts(), listCategories()]);
  if (!product) notFound();
  const category = categories.find((c) => c.id === product.category) ?? null;
  // Mesma categoria primeiro, depois as demais (na ordem das categorias).
  const order = (id: string) => (id === product.category ? -1 : categories.findIndex((c) => c.id === id));
  const others = [...all].sort((a, b) => order(a.category) - order(b.category));
  return (
    <>
      <SiteHeader />
      <main>
        <ShowroomClient
          product={product}
          category={category ? { slug: category.slug, name: category.name } : null}
          others={others.map((p) => ({ slug: p.slug, name: p.name, category: categories.find((c) => c.id === p.category)?.name ?? "" }))}
        />
      </main>
    </>
  );
}
