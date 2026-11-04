const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatPrice = (value: number | null | undefined) => (value == null ? null : brl.format(value));
