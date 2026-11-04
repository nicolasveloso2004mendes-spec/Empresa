import type { Metadata } from "next";
import { Catalog } from "@/components/site/Catalog";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { listCategories, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Produtos",
  description: "Catálogo de smartphones da BBM Imports com visualização em 3D.",
  alternates: { canonical: "/produtos" },
};

export default async function ProdutosPage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  return (
    <>
      <SiteHeader />
      <main>
        <Catalog products={products} categories={categories} title="Todos os aparelhos" headingLevel={1} />
      </main>
      <SiteFooter />
    </>
  );
}
