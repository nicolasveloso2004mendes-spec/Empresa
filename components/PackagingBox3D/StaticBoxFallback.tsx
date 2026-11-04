/** Ilustração estática da caixa aberta, para navegadores sem CSS 3D. */
export function StaticBoxFallback({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 320"
      role="img"
      aria-label="Ilustração de caixa de papelão kraft aberta"
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx="200" cy="292" rx="150" ry="18" fill="#39352b" opacity=".18" />
      {/* abas traseiras */}
      <path d="M118 108 L200 74 L176 30 L92 62 Z" fill="#c29660" stroke="#8e663b" strokeWidth="2" />
      <path d="M200 74 L292 108 L318 64 L226 32 Z" fill="#b98751" stroke="#8e663b" strokeWidth="2" />
      {/* interior */}
      <path d="M118 108 L200 74 L292 108 L200 142 Z" fill="#8f6436" />
      {/* faces */}
      <path d="M118 108 L200 142 L200 272 L118 236 Z" fill="#c69963" stroke="#8e663b" strokeWidth="2" />
      <path d="M200 142 L292 108 L292 236 L200 272 Z" fill="#a77540" stroke="#8e663b" strokeWidth="2" />
      {/* abas frontais */}
      <path d="M118 108 L200 142 L168 186 L84 150 Z" fill="#c69963" stroke="#8e663b" strokeWidth="2" />
      <path d="M200 142 L292 108 L330 148 L236 184 Z" fill="#b98751" stroke="#8e663b" strokeWidth="2" />
    </svg>
  );
}
