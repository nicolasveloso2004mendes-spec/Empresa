/** NicoTech monogram (same geometry as the 3D symbol) */
export function LogoMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <circle cx="32" cy="32" r="29" fill="none" stroke="#D4AF37" strokeWidth="2" />
      <rect x="17" y="15" width="7.5" height="34" fill="#F5F5F5" />
      <rect x="39.5" y="15" width="7.5" height="34" fill="#F5F5F5" />
      <path d="M24.5 15 L24.5 25.2 L39.5 49 L39.5 38.8 Z" fill="#D4AF37" />
    </svg>
  );
}
