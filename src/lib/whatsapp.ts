import { SITE } from "./site";

/**
 * Monta o link do WhatsApp com mensagem pré-preenchida.
 * Sem número configurado, o link abre o WhatsApp para o visitante escolher o contato
 * (continua funcional) — configure NEXT_PUBLIC_WHATSAPP_NUMBER antes de publicar.
 */
export function whatsappLink(message: string, number = SITE.whatsapp): string {
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function productMessage(opts: {
  productName: string;
  color?: string;
  capacity?: string;
  demo?: boolean;
}): string {
  const parts = [opts.productName, opts.color, opts.capacity].filter(Boolean).join(" · ");
  return `Olá! Vi o showroom 3D da BBM Imports e quero atendimento sobre: ${parts}.`;
}
