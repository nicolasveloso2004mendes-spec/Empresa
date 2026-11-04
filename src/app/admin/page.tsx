import Link from "next/link";
import { listProducts } from "@/lib/store";
import { AdminProductActions, LogoutButton } from "@/components/admin/AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const products = await listProducts({ includeUnpublished: true });
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-bold uppercase text-bone">Produtos 3D</h1>
        <div className="flex gap-2">
          <Link href="/admin/produtos/novo" className="btn-primary">Cadastrar smartphone</Link>
          <LogoutButton />
        </div>
      </div>
      <ul className="mt-10 divide-y divide-line rounded-2xl border border-line">
        {products.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="font-medium text-bone">{p.name}</div>
              <div className="mt-1 text-xs text-mute">
                /{p.slug} · {p.model.url} · {p.colors.length} cores · {p.hotspots.length} hotspots
                {p.demo && " · demonstrativo"}
              </div>
            </div>
            <AdminProductActions id={p.id} slug={p.slug} published={p.published} />
          </li>
        ))}
        {products.length === 0 && <li className="p-5 text-mute">Nenhum produto.</li>}
      </ul>
    </main>
  );
}
