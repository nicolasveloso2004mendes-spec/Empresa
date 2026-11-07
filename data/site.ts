/**
 * Configuração comercial da NicoTech.
 * O botão "START A PROJECT" abre `primaryContact`. Troque aqui para mudar o canal.
 */
export const site = {
  name: "NicoTech",
  tagline: "Digital Experiences Beyond Ordinary.",
  description:
    "NicoTech — estúdio digital que cria sites premium, experiências interativas, IA e automação para empresas que querem ir além.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  primaryContact: {
    label: "Instagram",
    href: "https://www.instagram.com/nic_otech/",
    handle: "@nic_otech",
  },
  contacts: [
    { label: "Instagram", value: "@nic_otech", href: "https://www.instagram.com/nic_otech/" },
    { label: "E-mail", value: "nicotech.contato@gmail.com", href: "mailto:nicotech.contato@gmail.com" },
    {
      label: "WhatsApp",
      value: "(11) 95385-1744",
      href: "https://wa.me/5511953851744?text=" +
        encodeURIComponent("Olá! Vi o portfólio da NicoTech e quero conversar sobre um projeto."),
    },
  ],
  location: "Guarulhos · SP · Brasil",
} as const;
