import { company } from "@/lib/site";

export function About() {
  return (
    <section id="empresa" className="section about" aria-labelledby="about-title">
      <div className="container about__inner">
        <div className="about__head">
          <p className="kicker">04 — Empresa</p>
          <h2 id="about-title" className="section-title">
            Produção própria, <em>conversa direta.</em>
          </h2>
        </div>
        <div className="about__body">
          <p className="about__lead">
            A {company.legalName} fabrica caixas de papelão sob medida em São Paulo, no Parque Novo Mundo.
            Com produção própria, o atendimento parte do que você precisa embalar — e não de um catálogo
            fechado.
          </p>
          <dl className="about__facts">
            <div>
              <dt>O que fabricamos</dt>
              <dd>Caixas convencionais, corte e vinco e sob medida</dd>
            </div>
            <div>
              <dt>Materiais</dt>
              <dd>Onda simples, onda dupla e kraft</dd>
            </div>
            <div>
              <dt>Para quem</dt>
              <dd>E-commerce, comércio, logística, mudanças e armazenamento</dd>
            </div>
            <div>
              <dt>Onde</dt>
              <dd>São Paulo — SP e região</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

export function HowTo() {
  const steps = [
    {
      title: "Conte o que precisa embalar",
      text: "Diga qual é o produto, como ele será enviado ou guardado e o que é importante proteger.",
    },
    {
      title: "Informe medidas e quantidade estimada",
      text: "Comprimento, largura e altura em centímetros, se já souber, e quantas caixas pretende pedir.",
    },
    {
      title: "Converse com a equipe sobre a solução",
      text: "Pelo WhatsApp, a equipe tira dúvidas e orienta o tipo de caixa e de papelão para o seu caso.",
    },
  ];
  return (
    <section id="como-solicitar" className="section howto" aria-labelledby="howto-title">
      <div className="container">
        <div className="section-head">
          <p className="kicker">05 — Como solicitar</p>
          <h2 id="howto-title" className="section-title">
            Três passos até o <em>orçamento.</em>
          </h2>
        </div>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step__n" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
