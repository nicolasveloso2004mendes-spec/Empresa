"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
      }}
    >
      Sair
    </button>
  );
}

export function AdminProductActions({ id, slug, published }: { id: string; slug: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const togglePublish = async () => {
    setBusy(true);
    const res = await fetch(`/api/admin/products/${id}`);
    const p = await res.json();
    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, published: !published }),
    });
    setBusy(false);
    router.refresh();
  };
  const remove = async () => {
    if (!confirm("Excluir este produto? Esta ação não pode ser desfeita.")) return;
    setBusy(true);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${published ? "bg-champagne/15 text-champagne" : "bg-white/5 text-mute"}`}>
        {published ? "Publicado" : "Rascunho"}
      </span>
      <button type="button" className="btn-ghost" onClick={togglePublish} disabled={busy} data-testid={`toggle-${id}`}>
        {published ? "Despublicar" : "Publicar"}
      </button>
      <Link href={`/admin/produtos/${id}`} className="btn-ghost">Editar</Link>
      {published && <Link href={`/showroom/${slug}`} className="btn-ghost" target="_blank">Ver</Link>}
      <button type="button" className="btn-ghost hover:!border-red-400 hover:!text-red-300" onClick={remove} disabled={busy}>Excluir</button>
    </div>
  );
}
