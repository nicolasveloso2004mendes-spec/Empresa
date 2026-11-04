import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold uppercase text-bone">Página não encontrada</h1>
        <Link href="/produtos" className="btn-primary mt-8">Ver produtos</Link>
      </main>
    </>
  );
}
