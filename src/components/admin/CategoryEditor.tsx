"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { categoryList, type Category } from "@/lib/schema";

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);

export function CategoryEditor({ initial, counts }: { initial: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (i: number, patch: Partial<Category>) => setList((l) => l.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, d: number) =>
    setList((l) => {
      const n = [...l];
      const j = i + d;
      if (j < 0 || j >= n.length) return l;
      [n[i], n[j]] = [n[j], n[i]];
      return n.map((c, k) => ({ ...c, order: (k + 1) * 10 }));
    });

  const save = async () => {
    const parsed = categoryList.safeParse(list);
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ") });
    const res = await fetch("/api/admin/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const json = await res.json().catch(() => ({}));
    setMsg(res.ok ? { ok: true, text: "Categorias salvas." } : { ok: false, text: json.error ?? "Falha ao salvar" });
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-4">
      {list.map((c, i) => {
        const isNew = !initial.some((x) => x.id === c.id);
        return (
          <div key={i} className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]">
            <label className="block"><span className="label">Nome</span>
              <input className="field" value={c.name} onChange={(e) => set(i, { name: e.target.value, ...(isNew ? { id: slugify(e.target.value), slug: slugify(e.target.value) } : {}) })} />
            </label>
            <label className="block"><span className="label">Slug (URL)</span>
              <input className="field" value={c.slug} onChange={(e) => set(i, { slug: e.target.value })} />
            </label>
            <div className="flex items-end gap-1">
              <button type="button" className="btn-ghost !px-3" onClick={() => move(i, -1)} aria-label="Subir">↑</button>
              <button type="button" className="btn-ghost !px-3" onClick={() => move(i, 1)} aria-label="Descer">↓</button>
              <button
                type="button"
                className="btn-ghost !px-3 hover:!border-red-400 hover:!text-red-300 disabled:opacity-30"
                disabled={(counts[c.id] ?? 0) > 0}
                title={(counts[c.id] ?? 0) > 0 ? "Categoria com produtos — mova-os antes de excluir" : "Excluir"}
                onClick={() => setList((l) => l.filter((_, j) => j !== i))}
              >
                Excluir
              </button>
            </div>
            <label className="block sm:col-span-3"><span className="label">Descrição</span>
              <input className="field" value={c.description} onChange={(e) => set(i, { description: e.target.value })} />
            </label>
            <p className="text-xs text-mute sm:col-span-3">{counts[c.id] ?? 0} produto(s) · id: {c.id}</p>
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-ghost" onClick={() => setList((l) => [...l, { id: `categoria-${l.length + 1}`, slug: `categoria-${l.length + 1}`, name: `Categoria ${l.length + 1}`, description: "", order: (l.length + 1) * 10 }])}>
          + Nova categoria
        </button>
        <button type="button" className="btn-primary" onClick={save}>Salvar</button>
        {msg && <span role="status" className={`text-sm ${msg.ok ? "text-champagne" : "text-red-300"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
