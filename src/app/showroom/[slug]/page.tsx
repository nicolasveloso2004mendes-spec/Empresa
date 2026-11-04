import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShowroomClient } from "@/components/showroom/ShowroomClient";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getProductBySlug, listProducts } from "@/lib/store";

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
  const [product, all] = await Promise.all([getProductBySlug(slug), listProducts()]);
  if (!product) notFound();
  return (
    <>
      <SiteHeader />
      <main>
        <ShowroomClient product={product} others={all.map((p) => ({ slug: p.slug, name: p.name }))} />
      </main>
    </>
  );
}
