import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-baseline gap-2" aria-label="BBM Imports — página inicial">
      <span className="font-display text-[17px] font-bold tracking-[0.18em] text-bone">BBM</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.42em] text-mute transition-colors group-hover:text-champagne">Imports</span>
    </Link>
  );
}
