import { company } from "./site";

export type QuoteData = {
  name: string;
  company: string;
  interest: string;
  quantity: string;
  quantityUnknown: boolean;
  length: string;
  width: string;
  height: string;
  location: string;
  notes: string;
};

export const emptyQuote: QuoteData = {
  name: "",
  company: "",
  interest: "",
  quantity: "",
  quantityUnknown: false,
  length: "",
  width: "",
  height: "",
  location: "",
  notes: "",
};

export type QuoteErrors = Partial<Record<keyof QuoteData, string>>;

export const DIMENSION_MAX = 9999;
export const QUANTITY_MAX = 10_000_000;

/** Aceita vírgula ou ponto como separador decimal. */
export function parseDecimal(value: string): number {
  return Number(value.trim().replace(",", "."));
}

export function validateDimension(value: string): string | undefined {
  if (value.trim() === "") return undefined;
  const n = parseDecimal(value);
  if (!Number.isFinite(n)) return "Use apenas números, por exemplo 30 ou 12,5.";
  if (n <= 0) return "A medida precisa ser maior que zero.";
  if (n > DIMENSION_MAX) return "Confira a medida: o valor parece alto demais para centímetros.";
  return undefined;
}

export function validateQuote(data: QuoteData): QuoteErrors {
  const errors: QuoteErrors = {};
  if (data.name.trim().length < 2) errors.name = "Informe seu nome para a equipe saber com quem falar.";

  if (!data.quantityUnknown && data.quantity.trim() !== "") {
    const q = Number(data.quantity.trim());
    if (!Number.isInteger(q)) errors.quantity = "Informe um número inteiro de caixas, sem vírgula.";
    else if (q < 1) errors.quantity = "A quantidade precisa ser de pelo menos 1 caixa.";
    else if (q > QUANTITY_MAX) errors.quantity = "Confira a quantidade informada.";
  }

  for (const key of ["length", "width", "height"] as const) {
    const err = validateDimension(data[key]);
    if (err) errors[key] = err;
  }
  return errors;
}

function formatCm(value: string): string {
  return String(parseDecimal(value)).replace(".", ",");
}

export function buildQuoteMessage(data: QuoteData): string {
  const lines: string[] = ["Olá! Vim pelo site da Quick Pack e gostaria de um orçamento.", ""];
  lines.push(`Nome: ${data.name.trim()}`);
  if (data.company.trim()) lines.push(`Empresa: ${data.company.trim()}`);
  lines.push(`Aplicação/embalagem: ${data.interest || "Ainda não sei"}`);

  if (data.quantityUnknown) lines.push("Quantidade estimada: Ainda não sei");
  else if (data.quantity.trim()) lines.push(`Quantidade estimada: ${Number(data.quantity)} caixas`);

  const dims = [
    ["C", data.length],
    ["L", data.width],
    ["A", data.height],
  ].filter(([, v]) => v.trim() !== "");
  if (dims.length) {
    lines.push(`Medidas (cm): ${dims.map(([k, v]) => `${k} ${formatCm(v)}`).join(" × ")}`);
  }
  if (data.location.trim()) lines.push(`Cidade/UF: ${data.location.trim()}`);
  if (data.notes.trim()) lines.push("", `Observações: ${data.notes.trim()}`);
  return lines.join("\n");
}

export function whatsappUrl(message: string): string {
  return `https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const genericWhatsappUrl = whatsappUrl(
  "Olá! Vim pelo site da Quick Pack e gostaria de um orçamento de caixas de papelão.",
);
