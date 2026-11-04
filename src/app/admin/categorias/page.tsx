import Link from "next/link";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { listCategories, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CategoriasAdmin() {
  const [categories, products] = await Promise.all([listCategories(), listProducts({ includeUnpublished: true })]);
  const counts = Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.category === c.id).length]));
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/admin" className="text-xs uppercase tracking-[0.2em] text-mute hover:text-bone">← Produtos</Link>
      <h1 className="mb-8 mt-3 font-display text-xl font-bold uppercase text-bone">Categorias</h1>
      <CategoryEditor initial={categories} counts={counts} />
    </main>
  );
}
