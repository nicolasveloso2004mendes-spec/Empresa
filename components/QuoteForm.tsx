"use client";

import { useRef, useState, type FormEvent } from "react";
import { interestOptions, UNKNOWN } from "@/lib/site";
import { useQuote } from "@/lib/quote-context";
import {
  buildQuoteMessage,
  validateQuote,
  whatsappUrl,
  type QuoteData,
  type QuoteErrors,
} from "@/lib/whatsapp";

const fieldOrder: (keyof QuoteData)[] = ["name", "quantity", "length", "width", "height"];
const fieldIds: Partial<Record<keyof QuoteData, string>> = {
  name: "quote-name",
  quantity: "quote-quantity",
  length: "quote-length",
  width: "quote-width",
  height: "quote-height",
};

export function QuoteForm() {
  const { data, update, notice } = useQuote();
  const [errors, setErrors] = useState<QuoteErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const liveErrors = submitted ? validateQuote(data) : errors;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateQuote(data);
    setErrors(found);
    const first = fieldOrder.find((k) => found[k]);
    if (first) {
      setLastUrl(null);
      document.getElementById(fieldIds[first] ?? "")?.focus();
      return;
    }
    const url = whatsappUrl(buildQuoteMessage(data));
    setLastUrl(url);
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    else window.location.href = url;
  };

  const err = (k: keyof QuoteData) => liveErrors[k];
  const describedBy = (k: keyof QuoteData, hint?: string) =>
    [hint, err(k) ? `${fieldIds[k]}-err` : undefined].filter(Boolean).join(" ") || undefined;

  const errorList = fieldOrder.filter((k) => liveErrors[k]);

  return (
    <section id="orcamento" className="section quote" aria-labelledby="quote-title">
      <div className="container quote__inner">
        <div className="quote__intro">
          <p className="kicker">06 — Orçamento</p>
          <h2 id="quote-title" className="section-title">
            Conte o que você precisa <em>embalar.</em>
          </h2>
          <p className="section-lead">
            Preencha o que souber. Montamos a mensagem com seus dados e você revisa tudo antes de enviar
            pelo WhatsApp.
          </p>
          <p className="quote__privacy">
            Os dados não ficam salvos neste site: eles seguem apenas na mensagem que você decidir enviar.
          </p>
        </div>

        <form className="quote-form" noValidate onSubmit={onSubmit} aria-describedby="quote-required">
          <p id="quote-required" className="quote-form__req">
            Campos marcados com <span aria-hidden="true">*</span>
            <span className="sr-only">asterisco</span> são obrigatórios.
          </p>
          <p className="sr-only" aria-live="polite">
            {notice}
          </p>

          {submitted && errorList.length > 0 && (
            <div ref={summaryRef} className="form-summary" role="alert">
              <p>Revise {errorList.length === 1 ? "o campo destacado" : "os campos destacados"}:</p>
              <ul>
                {errorList.map((k) => (
                  <li key={k}>
                    <a href={`#${fieldIds[k]}`}>{liveErrors[k]}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-grid">
            <div className="field">
              <label htmlFor="quote-name">
                Nome <span aria-hidden="true">*</span>
              </label>
              <input
                id="quote-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                aria-required="true"
                value={data.name}
                aria-invalid={err("name") ? true : undefined}
                aria-describedby={describedBy("name")}
                onChange={(e) => update({ name: e.target.value })}
              />
              {err("name") && (
                <p id="quote-name-err" className="field-error">
                  {err("name")}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="quote-company">
                Empresa <span className="field__opt">(opcional)</span>
              </label>
              <input
                id="quote-company"
                name="company"
                type="text"
                autoComplete="organization"
                value={data.company}
                onChange={(e) => update({ company: e.target.value })}
              />
            </div>

            <div className="field field--full">
              <label htmlFor="quote-interest">Aplicação ou tipo de embalagem</label>
              <select
                id="quote-interest"
                name="interest"
                value={data.interest}
                onChange={(e) => update({ interest: e.target.value })}
              >
                <option value="">Selecione</option>
                {interestOptions.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value={UNKNOWN}>{UNKNOWN}</option>
              </select>
            </div>

            <div className="field field--full">
              <label htmlFor="quote-quantity">Quantidade estimada de caixas</label>
              <div className="field__row">
                <input
                  id="quote-quantity"
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  placeholder="Ex.: 500"
                  disabled={data.quantityUnknown}
                  value={data.quantityUnknown ? "" : data.quantity}
                  aria-invalid={err("quantity") ? true : undefined}
                  aria-describedby={describedBy("quantity")}
                  onKeyDown={(e) => {
                    if (["-", "+", "e", "E", ",", "."].includes(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => update({ quantity: e.target.value })}
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={data.quantityUnknown}
                    onChange={(e) => update({ quantityUnknown: e.target.checked })}
                  />
                  <span>{UNKNOWN}</span>
                </label>
              </div>
              {err("quantity") && (
                <p id="quote-quantity-err" className="field-error">
                  {err("quantity")}
                </p>
              )}
            </div>

            <fieldset className="field field--full dims-group">
              <legend>
                Medidas em centímetros <span className="field__opt">(opcional)</span>
              </legend>
              <p id="dims-hint" className="field__hint">
                Comprimento × largura × altura. Deixe em branco se ainda não souber.
              </p>
              <div className="dims-group__row">
                {(
                  [
                    ["length", "Comprimento"],
                    ["width", "Largura"],
                    ["height", "Altura"],
                  ] as const
                ).map(([k, label]) => (
                  <div key={k} className="field">
                    <label htmlFor={fieldIds[k]}>{label}</label>
                    <div className="input-unit input-unit--dark">
                      <input
                        id={fieldIds[k]}
                        name={k}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={data[k]}
                        aria-invalid={err(k) ? true : undefined}
                        aria-describedby={describedBy(k, "dims-hint")}
                        onChange={(e) => update({ [k]: e.target.value })}
                      />
                      <span aria-hidden="true">cm</span>
                    </div>
                    {err(k) && (
                      <p id={`${fieldIds[k]}-err`} className="field-error">
                        {err(k)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="field field--full">
              <label htmlFor="quote-location">Cidade/UF</label>
              <input
                id="quote-location"
                name="location"
                type="text"
                autoComplete="address-level2"
                placeholder="Ex.: São Paulo/SP"
                value={data.location}
                onChange={(e) => update({ location: e.target.value })}
              />
            </div>

            <div className="field field--full">
              <label htmlFor="quote-notes">Observações</label>
              <textarea
                id="quote-notes"
                name="notes"
                rows={4}
                maxLength={1200}
                placeholder="O que vai na caixa, peso aproximado, se precisa de impressão, como será enviada…"
                value={data.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </div>
          </div>

          <div className="quote-form__submit">
            <button type="submit" className="btn btn--primary btn--lg btn--block-sm">
              Continuar no WhatsApp <span aria-hidden="true">→</span>
            </button>
            <p className="quote-form__note">
              Você será direcionado ao WhatsApp para revisar e enviar sua solicitação.
            </p>
            {lastUrl && (
              <p className="quote-form__fallback">
                O WhatsApp não abriu?{" "}
                <a href={lastUrl} target="_blank" rel="noopener noreferrer">
                  Abrir a mensagem preparada
                </a>
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
