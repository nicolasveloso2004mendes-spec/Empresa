/**
 * Assinatura tipográfica provisória (a mesma da demonstração caixa-3d.html).
 * Substitua por <Image src="/logo.svg" ... /> quando o arquivo oficial do logotipo for enviado.
 */
export function Wordmark({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  return (
    <span className={`wordmark wordmark--${tone}${compact ? " wordmark--compact" : ""}`}>
      <span className="wordmark__name">
        Quick<span>Pack</span>
      </span>
      <span className="wordmark__sub">Babadopulos Embalagens</span>
    </span>
  );
}
