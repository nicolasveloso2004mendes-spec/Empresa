/**
 * Dados confirmados da empresa. Edite aqui para atualizar o site inteiro.
 * Não acrescente preços, prazos, certificações ou números sem confirmação.
 */
export const company = {
  brand: "Quick Pack",
  legalName: "Babadopulos Embalagens",
  phoneDisplay: "(11) 93013-9747",
  phoneHref: "tel:+5511930139747",
  whatsappNumber: "5511930139747",
  email: "quickbabadopulos@gmail.com",
  instagramHandle: "@babadopulosembalagens",
  instagramUrl: "https://www.instagram.com/babadopulosembalagens/",
  address: {
    street: "Rua Soldado Américo Rodrigues, 97",
    district: "Parque Novo Mundo",
    city: "São Paulo",
    state: "SP",
    postalCode: "02186-020",
  },
} as const;

export const fullAddress = `${company.address.street} — ${company.address.district}, ${company.address.city} — ${company.address.state}, ${company.address.postalCode}`;

export const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  `${company.address.street}, ${company.address.district}, ${company.address.city} - ${company.address.state}, ${company.address.postalCode}`,
)}`;

export type Application = {
  id: string;
  label: string;
  title: string;
  text: string;
  points: string[];
};

export const applications: Application[] = [
  {
    id: "ecommerce",
    label: "E-commerce e envios",
    title: "E-commerce e envios",
    text: "Caixas no tamanho do produto, para reduzir espaço vazio e chegar bem ao cliente final.",
    points: ["Medidas pensadas para o produto", "Montagem prática na expedição"],
  },
  {
    id: "comercio",
    label: "Comércio e produtos",
    title: "Comércio e produtos",
    text: "Embalagens para entregar, estocar ou acompanhar a venda no balcão.",
    points: ["Formatos variados", "Opção em papel kraft"],
  },
  {
    id: "logistica",
    label: "Logística e armazenamento",
    title: "Logística e armazenamento",
    text: "Caixas para transporte e estoque, com o tipo de papelão definido junto à equipe.",
    points: ["Onda simples ou dupla", "Padronização de medidas"],
  },
  {
    id: "mudancas",
    label: "Mudanças e organização",
    title: "Mudanças e organização",
    text: "Caixas para embalar, transportar e guardar objetos da casa ou do escritório.",
    points: ["Tamanhos para diferentes volumes", "Uso em mudança e arquivo"],
  },
];

export type ProductLine = {
  id: string;
  label: string;
  title: string;
  text: string;
  detail: string;
};

export const productLines: ProductLine[] = [
  {
    id: "convencional",
    label: "Caixa convencional",
    title: "Caixas convencionais",
    text: "O modelo clássico com quatro abas na tampa e no fundo. Versátil para envio, estoque e mudança.",
    detail: "Fechamento com fita",
  },
  {
    id: "corte-vinco",
    label: "Corte e vinco",
    title: "Corte e vinco",
    text: "Caixas com recortes e dobras definidos por faca, para formatos que montam com encaixes.",
    detail: "Formato definido em projeto",
  },
  {
    id: "sob-medida",
    label: "Sob medida",
    title: "Sob medida",
    text: "Comprimento, largura e altura definidos a partir do seu produto e de como ele será usado.",
    detail: "Medidas informadas por você",
  },
];

export const materials = [
  {
    id: "onda-simples",
    title: "Onda simples",
    text: "Uma camada ondulada entre duas capas de papel. Costuma ser usada em itens mais leves e em envios do dia a dia.",
  },
  {
    id: "onda-dupla",
    title: "Onda dupla",
    text: "Duas camadas onduladas, com mais espessura. Costuma ser indicada para itens mais pesados ou para empilhamento.",
  },
  {
    id: "kraft",
    title: "Kraft",
    text: "Acabamento em papel kraft, no tom natural do papel, para quem quer uma aparência mais crua e próxima do material.",
  },
] as const;

/** Opções do campo "Aplicação ou tipo de embalagem". */
export const interestOptions = [
  { group: "Aplicação", options: applications.map((a) => a.label) },
  {
    group: "Tipo de embalagem",
    options: [...productLines.map((p) => p.label), "Caixa em papel kraft"],
  },
] as const;

export const UNKNOWN = "Ainda não sei";
