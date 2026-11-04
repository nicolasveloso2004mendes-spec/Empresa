export const SITE = {
  name: "BBM Imports",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  /** Só dígitos, com DDI + DDD. Configure NEXT_PUBLIC_WHATSAPP_NUMBER. */
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
};
