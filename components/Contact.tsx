import { company, fullAddress, routeUrl } from "@/lib/site";
import { genericWhatsappUrl } from "@/lib/whatsapp";
import { Wordmark } from "./Wordmark";

export function Contact() {
  return (
    <section id="contato" className="contact" aria-labelledby="contact-title">
      <div className="container">
        <div className="contact__cta">
          <p className="kicker kicker--light">08 — Contato</p>
          <h2 id="contact-title" className="contact__title">
            Vamos encontrar a caixa <em>certa</em> para o seu produto?
          </h2>
          <div className="contact__actions">
            <a href="#orcamento" className="btn btn--kraft btn--lg">
              Solicitar orçamento <span aria-hidden="true">→</span>
            </a>
            <a href={genericWhatsappUrl} className="btn btn--outline-light btn--lg" target="_blank" rel="noopener noreferrer">
              Chamar no WhatsApp
            </a>
          </div>
        </div>

        <div className="contact__grid">
          <address className="contact__block">
            <h3>Endereço</h3>
            <p>
              {company.address.street}
              <br />
              {company.address.district}, {company.address.city} — {company.address.state}
              <br />
              CEP {company.address.postalCode}
            </p>
            <a href={routeUrl} className="btn btn--outline-light btn--sm" target="_blank" rel="noopener noreferrer" aria-label={`Traçar rota até ${fullAddress} no Google Maps`}>
              Traçar rota
            </a>
          </address>
          <div className="contact__block">
            <h3>Telefone e WhatsApp</h3>
            <p>
              <a href={company.phoneHref}>{company.phoneDisplay}</a>
            </p>
            <p>
              <a href={genericWhatsappUrl} target="_blank" rel="noopener noreferrer">
                Conversar pelo WhatsApp
              </a>
            </p>
          </div>
          <div className="contact__block">
            <h3>E-mail e redes</h3>
            <p>
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </p>
            <p>
              <a href={company.instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram {company.instagramHandle}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <Wordmark tone="light" compact />
        <p>
          {company.legalName} · Caixas de papelão sob medida · {company.address.city} — {company.address.state}
        </p>
        <a href="#inicio">Voltar ao topo ↑</a>
      </div>
    </footer>
  );
}
