"use client";

import { useState } from "react";
import { useQuote } from "@/lib/quote-context";
import { parseDecimal, validateDimension } from "@/lib/whatsapp";

const fields = [
  { key: "length", short: "C", label: "Comprimento" },
  { key: "width", short: "L", label: "Largura" },
  { key: "height", short: "A", label: "Altura" },
] as const;

function display(v: string) {
  if (!v.trim() || validateDimension(v)) return "— cm";
  return `${String(parseDecimal(v)).replace(".", ",")} cm`;
}

function DimensionArt({ l, w, h }: { l: string; w: string; h: string }) {
  return (
    <svg viewBox="0 0 400 330" className="dims-art" role="img" aria-labelledby="dims-art-title">
      <title id="dims-art-title">
        {`Ilustração de caixa com comprimento ${display(l)}, largura ${display(w)} e altura ${display(h)}`}
      </title>
      <ellipse cx="190" cy="300" rx="150" ry="14" fill="#39352b" opacity=".12" />
      <path d="M170 156 330 106 220 66 60 116Z" fill="#c69963" stroke="#8e663b" strokeWidth="2" strokeLinejoin="round" />
      <path d="M115 136 275 86" stroke="#7a5630" strokeWidth="1.4" />
      <path d="M170 276 60 236 60 116 170 156Z" fill="#b98751" stroke="#8e663b" strokeWidth="2" strokeLinejoin="round" />
      <path d="M170 276 330 226 330 106 170 156Z" fill="#a77540" stroke="#8e663b" strokeWidth="2" strokeLinejoin="round" />

      <g className="dims-art__line">
        {/* comprimento */}
        <path d="M186 296 346 246" />
        <path d="M182 286l8 18M342 236l8 18" />
        {/* largura */}
        <path d="M154 296 44 256" />
        <path d="M158 286l-8 18M48 246l-8 18" />
        {/* altura */}
        <path d="M34 236V116" />
        <path d="M26 236h16M26 116h16" />
      </g>
      <g className="dims-art__label">
        <text x="300" y="300">{`C · ${display(l)}`}</text>
        <text x="20" y="306">{`L · ${display(w)}`}</text>
        <text x="22" y="100">{`A · ${display(h)}`}</text>
      </g>
    </svg>
  );
}

export function CustomSize() {
  const { data, update, goToForm } = useQuote();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  return (
    <section id="sob-medida" className="section custom" aria-labelledby="custom-title">
      <div className="container custom__inner">
        <div className="custom__copy">
          <p className="kicker kicker--light">03 — Sob medida</p>
          <h2 id="custom-title" className="section-title section-title--light">
            Seu produto tem uma medida. <em>Sua embalagem também.</em>
          </h2>
          <p className="section-lead section-lead--light">
            Informe comprimento, largura e altura em centímetros. As medidas seguem para o pedido de
            orçamento e a equipe avalia a melhor construção com você.
          </p>

          <fieldset className="dims-fields">
            <legend>Medidas da caixa (opcional)</legend>
            {fields.map((f) => {
              const value = data[f.key];
              const err = touched[f.key] ? validateDimension(value) : undefined;
              const id = `size-${f.key}`;
              return (
                <div key={f.key} className="dims-field">
                  <label htmlFor={id}>
                    <span className="dims-field__short" aria-hidden="true">
                      {f.short}
                    </span>
                    {f.label}
                  </label>
                  <div className="input-unit">
                    <input
                      id={id}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={value}
                      aria-invalid={err ? true : undefined}
                      aria-describedby={err ? `${id}-err` : undefined}
                      onChange={(e) => update({ [f.key]: e.target.value })}
                      onBlur={() => setTouched((t) => ({ ...t, [f.key]: true }))}
                    />
                    <span aria-hidden="true">cm</span>
                  </div>
                  {err && (
                    <p id={`${id}-err`} className="field-error field-error--light">
                      {err}
                    </p>
                  )}
                </div>
              );
            })}
          </fieldset>
          <button type="button" className="btn btn--kraft" onClick={() => goToForm("quote-name")}>
            Usar medidas no orçamento <span aria-hidden="true">→</span>
          </button>
          <p className="custom__note">
            Não sabe se a medida é interna ou externa? Conte nas observações do orçamento.
          </p>
        </div>
        <div className="custom__visual">
          <DimensionArt l={data.length} w={data.width} h={data.height} />
          <p className="custom__caption">Ilustração de referência — as proporções não mudam com os valores.</p>
        </div>
      </div>
    </section>
  );
}
