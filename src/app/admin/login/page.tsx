import { adminConfigured } from "@/lib/session";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/site/Logo";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const configured = adminConfigured();
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-5">
      <Logo />
      <h1 className="mt-10 font-display text-xl font-bold uppercase text-bone">Painel 3D</h1>
      {configured ? (
        <LoginForm />
      ) : (
        <p className="mt-6 rounded-xl border border-white/10 p-4 text-sm text-mute">
          Painel desativado. Defina <code className="text-bone">ADMIN_PASSWORD</code> (12+ caracteres) e{" "}
          <code className="text-bone">SESSION_SECRET</code> (32+ caracteres) no ambiente e reinicie o servidor.
        </p>
      )}
    </main>
  );
}
