"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { emptyQuote, type QuoteData } from "./whatsapp";

type QuoteContextValue = {
  data: QuoteData;
  update: (patch: Partial<QuoteData>) => void;
  /** Preenche o interesse e leva o visitante até o formulário. */
  chooseInterest: (interest: string) => void;
  goToForm: (focusId?: string) => void;
  notice: string;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

/** Estado do orçamento mantido só em memória (nada é salvo no navegador). */
export function QuoteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<QuoteData>(emptyQuote);
  const [notice, setNotice] = useState("");

  const update = useCallback((patch: Partial<QuoteData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const goToForm = useCallback((focusId = "quote-interest") => {
    const section = document.getElementById("orcamento");
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => {
      document.getElementById(focusId)?.focus({ preventScroll: true });
    }, reduced ? 0 : 450);
  }, []);

  const chooseInterest = useCallback(
    (interest: string) => {
      setData((prev) => ({ ...prev, interest }));
      setNotice(`${interest} selecionado no formulário de orçamento.`);
      goToForm();
    },
    [goToForm],
  );

  const value = useMemo(
    () => ({ data, update, chooseInterest, goToForm, notice }),
    [data, update, chooseInterest, goToForm, notice],
  );
  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote precisa estar dentro de QuoteProvider");
  return ctx;
}
