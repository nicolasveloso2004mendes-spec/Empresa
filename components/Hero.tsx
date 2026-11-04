import { PackagingBox3D } from "./PackagingBox3D";

function FrontPrint() {
  return (
    <>
      <span className="box-print__brand">
        Quick<small>Pack</small>
      </span>
      <span className="box-print__small">BABADOPULOS EMBALAGENS</span>
      <span className="box-print__rule" />
      <span className="box-print__strap">FEITA PARA PROTEGER.</span>
    </>
  );
}

function SidePrint() {
  return (
    <>
      <svg className="box-print__icons" viewBox="0 0 64 28" aria-hidden="true">
        {/* símbolos de manuseio: este lado para cima e frágil */}
        <path d="M8 26V6M2 12l6-6 6 6M18 26V6M12 12l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M40 4h16l-2 9a6 6 0 0 1-12 0Z M48 19v6M43 26h10" fill="none" stroke="currentColor" strokeWidth="2.2" />
      </svg>
      <span className="box-print__side">CUIDADO EM CADA ENTREGA</span>
    </>
  );
}

export function Hero() {
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <div className="hero__inner container">
        <div className="hero__copy">
          <p className="eyebrow">
            <span className="eyebrow__dot" aria-hidden="true" />
            Caixas de papelão · Produção própria
          </p>
          <h1 id="hero-title" className="hero__title">
            A embalagem certa <em>valoriza</em> o que está dentro.
          </h1>
          <p className="hero__lead">
            Caixas de papelão sob medida para proteger seus produtos e acompanhar as necessidades do seu
            negócio.
          </p>
          <div className="hero__actions">
            <a href="#orcamento" className="btn btn--primary btn--lg">
              Solicitar orçamento
              <span className="btn__arrow" aria-hidden="true">→</span>
            </a>
            <a href="#embalagens" className="btn btn--ghost btn--lg">
              Explorar embalagens
            </a>
          </div>
          <p className="hero__support">
            <span>Produção própria</span>
            <span aria-hidden="true">•</span>
            <span>Sob medida</span>
            <span aria-hidden="true">•</span>
            <span>São Paulo e região</span>
          </p>
        </div>

        <div className="hero__visual">
          <PackagingBox3D
            label="Caixa de papelão kraft Quick Pack em 3D"
            frontPrint={<FrontPrint />}
            sidePrint={<SidePrint />}
          />
          <p className="hero__caption">Representação ilustrativa</p>
        </div>
      </div>
    </section>
  );
}
