import Link from "next/link";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { blankProduct } from "@/lib/blank";
import { listCategories } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NovoProduto() {
  const categories = await listCategories();
  return (
    <main className="mx-auto max-w-[1500px] px-5 py-10">
      <Link href="/admin" className="text-xs uppercase tracking-[0.2em] text-mute hover:text-bone">← Produtos</Link>
      <h1 className="mb-8 mt-3 font-display text-xl font-bold uppercase text-bone">Cadastrar smartphone</h1>
      <ProductEditor initial={{ ...blankProduct(), category: categories[0]?.id ?? "outros" }} isNew categories={categories} />
    </main>
  );
}
