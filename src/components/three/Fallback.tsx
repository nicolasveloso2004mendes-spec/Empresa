/* eslint-disable @next/next/no-img-element */
import type { Product } from "@/lib/schema";

/** Exibido quando o dispositivo não tem WebGL ou o modelo falha. Mantém a decisão de compra possível. */
export function ViewerFallback({ product, reason, onRetry }: { product: Product; reason: "nowebgl" | "error"; onRetry?: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center" data-testid="viewer-fallback">
      {product.poster ? (
        <img src={product.poster} alt={`Imagem estática de ${product.name}`} className="max-h-[55%] w-auto object-contain opacity-90" />
      ) : (
        <PhoneSilhouette />
      )}
      <div className="max-w-sm">
        <p className="text-sm text-white/80">
          {reason === "nowebgl"
            ? "Seu navegador ou dispositivo não suporta WebGL, por isso exibimos uma imagem estática no lugar do modelo 3D."
            : "Não foi possível carregar o modelo 3D agora."}
        </p>
        <p className="mt-1 text-xs text-white/50">Todas as informações e o atendimento continuam disponíveis.</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-ghost mt-4">
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}

function PhoneSilhouette() {
  return (
    <svg viewBox="0 0 120 240" className="h-[45%] w-auto" aria-hidden>
      <defs>
        <linearGradient id="fb-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3a3833" />
          <stop offset=".5" stopColor="#8c8a85" />
          <stop offset="1" stopColor="#2a2926" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="112" height="232" rx="20" fill="url(#fb-g)" />
      <rect x="9" y="9" width="102" height="222" rx="16" fill="#0b0b0c" />
      <rect x="45" y="17" width="30" height="8" rx="4" fill="#000" />
    </svg>
  );
}
