"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./Wordmark";

const links = [
  { href: "#embalagens", label: "Embalagens" },
  { href: "#sob-medida", label: "Sob medida" },
  { href: "#empresa", label: "Empresa" },
  { href: "#contato", label: "Contato" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
      <div className="site-header__inner">
        <a href="#inicio" className="site-header__brand" aria-label="Quick Pack, Babadopulos Embalagens — início" onClick={close}>
          <Wordmark compact />
        </a>

        <nav className="site-nav" aria-label="Principal">
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <a href="#orcamento" className="btn btn--primary btn--sm site-header__cta">
          Pedir orçamento
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-toggle__icon" aria-hidden="true" />
          <span className="menu-toggle__text">{open ? "Fechar" : "Menu"}</span>
        </button>
      </div>

      <div id="menu-mobile" ref={panelRef} className="mobile-menu" hidden={!open}>
        <nav aria-label="Menu móvel">
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={close}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#orcamento" className="btn btn--primary btn--block" onClick={close}>
            Pedir orçamento
          </a>
        </nav>
      </div>
    </header>
  );
}
