"use client";

import { materials, productLines } from "@/lib/site";
import { useQuote } from "@/lib/quote-context";
import { ConventionalBoxArt, CustomBoxArt, DieCutBoxArt, FluteArt } from "./Illustrations";

const arts = {
  convencional: <ConventionalBoxArt />,
  "corte-vinco": <DieCutBoxArt />,
  "sob-medida": <CustomBoxArt />,
} as const;

export function ProductLine() {
  const { chooseInterest } = useQuote();
  return (
    <section id="embalagens" className="section products" aria-labelledby="products-title">
      <div className="container">
        <div className="section-head section-head--split">
          <div>
            <p className="kicker">02 — Linha de embalagens</p>
            <h2 id="products-title" className="section-title">
              Três caminhos para <em>embalar bem.</em>
            </h2>
          </div>
          <p className="section-lead">
            Do modelo clássico ao projeto com faca própria, cada caixa é definida pelo que você precisa
            guardar, vender ou enviar.
          </p>
        </div>

        <div className="products__grid">
          {productLines.map((p, i) => (
            <article key={p.id} className="product">
              <figure className="product__art">
                {arts[p.id as keyof typeof arts]}
                <figcaption>Ilustração</figcaption>
              </figure>
              <div className="product__body">
                <p className="product__meta">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>{p.detail}</span>
                </p>
                <h3 className="product__title">{p.title}</h3>
                <p>{p.text}</p>
                <button type="button" className="link-btn" onClick={() => chooseInterest(p.label)}>
                  Orçar {p.title.toLowerCase()} <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="materials" aria-labelledby="materials-title">
          <div className="materials__intro">
            <h3 id="materials-title" className="materials__title">Onda simples, onda dupla ou kraft?</h3>
            <p>
              A escolha depende do peso do produto, da forma de transporte e de como as caixas serão
              empilhadas. Não existe um papelão ideal para todos os casos: a equipe ajuda a definir a opção
              adequada para o seu uso.
            </p>
          </div>
          <ul className="materials__list">
            {materials.map((m) => (
              <li key={m.id} className="material">
                {m.id !== "kraft" ? (
                  <FluteArt layers={m.id === "onda-simples" ? 1 : 2} />
                ) : (
                  <span className="material__swatch" aria-hidden="true" />
                )}
                <h4>{m.title}</h4>
                <p>{m.text}</p>
              </li>
            ))}
          </ul>
          <p className="materials__note">Ilustrações esquemáticas, fora de escala.</p>
        </div>
      </div>
    </section>
  );
}
