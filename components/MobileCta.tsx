"use client";

import { useEffect, useState } from "react";

/** Barra fixa no celular; some no topo, sobre o formulário e no contato para não cobrir conteúdo. */
export function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hidden = new Set<string>();
    const targets = ["inicio", "orcamento", "contato"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!targets.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) hidden.add(e.target.id);
          else hidden.delete(e.target.id);
        }
        setVisible(hidden.size === 0);
      },
      { threshold: 0.05 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <div className={`mobile-cta${visible ? " is-visible" : ""}`} aria-hidden={!visible}>
      <a href="#orcamento" className="btn btn--primary btn--block" tabIndex={visible ? 0 : -1}>
        Pedir orçamento
      </a>
    </div>
  );
}
