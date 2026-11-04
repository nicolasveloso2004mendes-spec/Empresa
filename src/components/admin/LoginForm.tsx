"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: fd.get("password"), website: fd.get("website") || undefined }),
        });
        setBusy(false);
        if (res.ok) router.replace("/admin");
        else setError((await res.json().catch(() => ({}))).error ?? "Falha no login");
      }}
    >
      <div>
        <label htmlFor="password" className="label">Senha</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
