const faqs = [
  {
    q: "Posso solicitar caixas sob medida?",
    a: "Sim. A empresa fabrica caixas de papelão sob medida, com produção própria. Informe o comprimento, a largura e a altura que você precisa — ou conte o que vai embalar — e a equipe avalia a construção mais adequada.",
  },
  {
    q: "Quais informações ajudam no orçamento?",
    a: "O que será embalado, as medidas em centímetros (comprimento × largura × altura), a quantidade estimada, o peso aproximado do conteúdo, como a caixa será usada (envio, estoque, mudança) e a sua cidade. Se não tiver algum dado, tudo bem: a equipe ajuda a levantar.",
  },
  {
    q: "Qual tipo de papelão devo escolher?",
    a: "Depende do produto e do uso. A onda simples costuma ser usada em itens mais leves; a onda dupla costuma ser indicada para itens mais pesados ou que serão empilhados. O kraft é uma opção de acabamento no tom natural do papel. Como cada caso é diferente, a recomendação final é feita com a equipe.",
  },
  {
    q: "Existe quantidade mínima?",
    a: "As condições de quantidade dependem do modelo e das medidas. Consulte a equipe pelo WhatsApp informando a quantidade que você pretende pedir.",
  },
  {
    q: "Como consultar prazo e entrega?",
    a: "Prazo e entrega são informados no atendimento, de acordo com o pedido. Envie sua solicitação pelo WhatsApp com a quantidade e a cidade de entrega para a equipe orientar.",
  },
];

export function Faq() {
  return (
    <section id="perguntas" className="section faq" aria-labelledby="faq-title">
      <div className="container faq__inner">
        <div className="faq__head">
          <p className="kicker">07 — Perguntas frequentes</p>
          <h2 id="faq-title" className="section-title">
            Antes de <em>pedir.</em>
          </h2>
        </div>
        <div className="faq__list">
          {faqs.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>
                <h3>{f.q}</h3>
                <span className="faq-item__icon" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
