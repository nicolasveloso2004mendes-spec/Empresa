export type Capability = {
  index: string;
  title: string;
  line: string;
  body: string;
  visual: "panes" | "knot" | "network" | "flow" | "grid" | "gyro";
};

export const capabilities: Capability[] = [
  {
    index: "01",
    title: "Sites Premium",
    line: "Interfaces que vendem antes da primeira conversa.",
    body: "Sites institucionais e comerciais com direção de arte própria, copy de conversão, SEO técnico e performance de verdade.",
    visual: "panes",
  },
  {
    index: "02",
    title: "Experiências Digitais",
    line: "WebGL, 3D e animação com propósito.",
    body: "Experiências interativas, scroll storytelling e apresentações imersivas que fazem a marca ser lembrada.",
    visual: "knot",
  },
  {
    index: "03",
    title: "Inteligência Artificial",
    line: "Agentes que respondem, qualificam e encaminham.",
    body: "Atendimento com IA no WhatsApp e assistentes treinados no seu negócio, com regras claras e passagem para humano.",
    visual: "network",
  },
  {
    index: "04",
    title: "Automação de Processos",
    line: "O trabalho repetido roda sozinho.",
    body: "Fluxos que conectam formulários, planilhas, CRM e mensagens — menos digitação, menos erro, mais tempo.",
    visual: "flow",
  },
  {
    index: "05",
    title: "Sistemas Web",
    line: "Painéis e sistemas sob medida.",
    body: "Áreas de cliente, dashboards e ferramentas internas que organizam a operação em um só lugar.",
    visual: "grid",
  },
  {
    index: "06",
    title: "Estratégia Digital",
    line: "Direção antes da execução.",
    body: "Posicionamento, arquitetura de informação, tráfego pago e Instagram alinhados ao objetivo comercial.",
    visual: "gyro",
  },
];
