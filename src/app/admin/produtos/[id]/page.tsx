import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { getProductById, listCategories } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditarProduto({ params }: { params: Promise<{ id: string }> }) {
  const [p, categories] = await Promise.all([getProductById((await params).id), listCategories()]);
  if (!p) notFound();
  return (
    <main className="mx-auto max-w-[1500px] px-5 py-10">
      <Link href="/admin" className="text-xs uppercase tracking-[0.2em] text-mute hover:text-bone">← Produtos</Link>
      <h1 className="mb-8 mt-3 font-display text-xl font-bold uppercase text-bone">{p.name}</h1>
      <ProductEditor initial={p} isNew={false} categories={categories} />
    </main>
  );
}
