"use client";

import { applications } from "@/lib/site";
import { useQuote } from "@/lib/quote-context";

export function Applications() {
  const { chooseInterest, data } = useQuote();
  return (
    <section id="aplicacoes" className="section applications" aria-labelledby="apps-title">
      <div className="container">
        <div className="section-head">
          <p className="kicker">01 — Soluções por aplicação</p>
          <h2 id="apps-title" className="section-title">
            Para onde a sua caixa <em>vai?</em>
          </h2>
          <p className="section-lead">
            Escolha o uso mais próximo do seu. Ele já entra preenchido no pedido de orçamento.
          </p>
        </div>

        <ol className="apps">
          {applications.map((app, i) => {
            const selected = data.interest === app.label;
            return (
              <li key={app.id} className={`app${selected ? " is-selected" : ""}`}>
                <span className="app__index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="app__title">{app.title}</h3>
                <p className="app__text">{app.text}</p>
                <ul className="app__points">
                  {app.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => chooseInterest(app.label)}
                  aria-label={`Pedir orçamento para ${app.label}`}
                >
                  Pedir orçamento para este uso <span aria-hidden="true">→</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
