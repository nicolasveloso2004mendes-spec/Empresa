/**
 * Projetos do showcase. Para adicionar um projeto:
 * 1. Adicione a entrada abaixo (slug único).
 * 2. Adicione o slug/url em scripts/capture-projects.mjs e rode `npm run capture`
 *    — isso gera capturas REAIS em public/projects/<slug>/.
 * A cena 3D, a rota /projetos/<slug>, o sitemap e a navegação são gerados a partir daqui.
 *
 * Todo texto aqui foi extraído do próprio site publicado de cada projeto.
 */
export type Project = {
  slug: string;
  index: string;
  client: string;
  sector: string;
  url: string;
  year: string;
  summary: string;
  challenge: string;
  approach: string[];
  deliverables: string[];
  stack: string[];
  /** Destaques visíveis no site publicado (não são métricas) */
  highlights: string[];
  accent: string;
  media: {
    desktop: string;
    desktopFull: string;
    mobile: string;
    mobileFull: string;
    /** altura/largura da captura longa (para rolar a textura no tamanho certo) */
    desktopFullRatio: number;
    mobileFullRatio: number;
  };
};

const media = (slug: string) => ({
  desktop: `/projects/${slug}/desktop.webp`,
  desktopFull: `/projects/${slug}/desktop-full.webp`,
  mobile: `/projects/${slug}/mobile.webp`,
  mobileFull: `/projects/${slug}/mobile-full.webp`,
  desktopFullRatio: 4096 / 1092,
  mobileFullRatio: 4096 / 780,
});

export const projects: Project[] = [
  {
    slug: "wr-car",
    index: "01",
    client: "WR Car Transportes",
    sector: "Transporte rodoviário de cargas · Guarulhos/SP",
    url: "https://w-rcar-transportes.vercel.app/",
    year: "2026",
    summary:
      "Site institucional para a WR CAR Transportes Rodoviários LTDA, transportadora de cargas gerais com sede em Guarulhos/SP, frota própria e atendimento em todo o Brasil.",
    challenge:
      "Uma transportadora precisa passar confiança antes do primeiro contato: mostrar a frota real, a segurança no trajeto e levar o cliente direto para a cotação de frete.",
    approach: [
      "Hero com a frase “Transportando confiança por todo o Brasil” e CTA direto para cotação de frete.",
      "Galeria com fotos reais da frota (Scania R 440, Volkswagen Constellation) e dos tipos de carga transportados.",
      "Seção de segurança: monitoramento Sascar, planejamento de viagens e controle operacional.",
      "Fluxo de atendimento comercial explicando como funciona a cotação.",
    ],
    deliverables: ["Direção de arte", "Copy comercial", "Desenvolvimento front-end", "SEO técnico", "Deploy na Vercel"],
    stack: ["Next.js", "Vercel"],
    highlights: ["Frota própria", "Monitoramento Sascar", "Atendimento nacional", "Cotação de frete"],
    accent: "#C8102E",
    media: media("wr-car"),
  },
  {
    slug: "nicotech",
    index: "02",
    client: "NicoTech",
    sector: "Sites, tráfego pago, Instagram e IA · Guarulhos/SP",
    url: "https://nico-tech.vercel.app/",
    year: "2026",
    summary:
      "Site comercial da NicoTech para negócios de Guarulhos: sites profissionais, anúncios no Google e Instagram, gestão de Instagram e atendimento com IA no WhatsApp.",
    challenge:
      "Explicar quatro serviços diferentes para pequenos negócios locais sem jargão e transformar a visita em conversa no WhatsApp.",
    approach: [
      "Conceito de “painel de embarque”: cada serviço é um portão com destino — “Quatro portões. Um destino: mais clientes.”",
      "Seção “Trabalho real, de cliente real” com projetos publicados, sem imagens de banco.",
      "Processo em quatro etapas, do primeiro “oi” no WhatsApp ao acompanhamento.",
      "CTA “Pedir orçamento no WhatsApp” fixo no celular e perguntas frequentes.",
    ],
    deliverables: ["Estratégia", "Direção de arte", "Copy de conversão", "Desenvolvimento", "Deploy na Vercel"],
    stack: ["HTML/CSS/JS", "Vercel"],
    highlights: ["Sites", "Tráfego pago", "Gestão de Instagram", "Agentes de IA"],
    accent: "#2BD67B",
    media: media("nicotech"),
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
