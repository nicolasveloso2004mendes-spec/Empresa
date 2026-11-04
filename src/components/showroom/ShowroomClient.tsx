"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/schema";
import { formatPrice } from "@/lib/format";
import { productMessage, whatsappLink } from "@/lib/whatsapp";
import { ArrowIcon, WhatsAppIcon } from "@/components/site/icons";

const Product3DViewer = dynamic(() => import("@/components/three/Product3DViewer"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />,
});

type NavItem = { slug: string; name: string };

export function ShowroomClient({ product, others }: { product: Product; others: NavItem[] }) {
  const firstColor = product.colors.find((c) => c.available) ?? product.colors[0];
  const firstCap = product.capacities.find((c) => c.available) ?? product.capacities[0];
  const [colorId, setColorId] = useState(firstColor.id);
  const [capId, setCapId] = useState(firstCap?.id ?? null);
  const [hotspotId, setHotspotId] = useState<string | null>(null);

  const color = product.colors.find((c) => c.id === colorId) ?? firstColor;
  const cap = product.capacities.find((c) => c.id === capId) ?? null;
  const available = color.available && (product.capacities.length === 0 || !!cap?.available);
  const price = available ? formatPrice(cap?.price) : null;

  const message = useMemo(
    () =>
      product.demo
        ? product.whatsappMessage ?? "Olá! Vi o showroom 3D da BBM Imports e quero saber quais aparelhos estão disponíveis."
        : productMessage({ productName: product.name, color: color.name, capacity: cap?.label }) +
          (available ? "" : " Quero saber quando estará disponível."),
    [product, color.name, cap?.label, available],
  );

  const idx = others.findIndex((o) => o.slug === product.slug);
  const prev = others.length > 1 ? others[(idx - 1 + others.length) % others.length] : null;
  const next = others.length > 1 ? others[(idx + 1) % others.length] : null;

  return (
    <div className="grid lg:h-[calc(100svh-5rem)] lg:grid-cols-[1fr_400px]">
      <div className="relative h-[68svh] lg:h-auto">
        <Product3DViewer
          product={product}
          colorId={color.id}
          activeHotspotId={hotspotId}
          onHotspotChange={setHotspotId}
          className="!absolute inset-0"
        />
      </div>

      <aside className="relative border-t border-line bg-surface lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0" aria-label="Configuração do aparelho" data-testid="showroom-panel">
        <div className="flex min-h-full flex-col gap-8 p-6 md:p-8">
          <div>
            <p className="eyebrow">{product.condition}</p>
            <h1 className="mt-3 font-display text-[22px] font-bold uppercase leading-tight tracking-[0.04em] text-bone">{product.name}</h1>
            {product.tagline && <p className="mt-3 text-sm leading-relaxed text-mute">{product.tagline}</p>}
          </div>

          <fieldset>
            <legend className="label">
              Cor · <span className="text-bone" data-testid="selected-color">{color.name}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorId(c.id)}
                  aria-pressed={c.id === color.id}
                  aria-label={`${c.name}${c.available ? "" : " — indisponível"}`}
                  title={`${c.name}${c.available ? "" : " — indisponível"}`}
                  data-testid={`color-${c.id}`}
                  className={`relative h-11 w-11 rounded-full border-2 transition-[border-color,transform] duration-300 ${
                    c.id === color.id ? "scale-105 border-champagne" : "border-transparent hover:border-white/30"
                  }`}
                >
                  <span className={`absolute inset-1 rounded-full ${c.available ? "" : "opacity-40"}`} style={{ background: c.swatch }} />
                  {!c.available && <span className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-white/70" aria-hidden />}
                </button>
              ))}
            </div>
            {!color.available && <p className="mt-3 text-xs text-white/60" data-testid="color-unavailable">Esta cor está indisponível no momento. Você ainda pode visualizá-la em 3D.</p>}
          </fieldset>

          {product.capacities.length > 0 && (
            <fieldset>
              <legend className="label">Capacidade</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {product.capacities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCapId(c.id)}
                    aria-pressed={c.id === capId}
                    data-testid={`cap-${c.id}`}
                    className={`min-h-12 rounded-xl border text-sm transition-colors ${
                      c.id === capId ? "border-champagne text-bone" : "border-white/10 text-bone/70 hover:border-white/25"
                    } ${c.available ? "" : "line-through decoration-white/40"}`}
                  >
                    {c.label}
                    {!c.available && <span className="sr-only"> (indisponível)</span>}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <dl className="divide-y divide-line border-y border-line text-sm">
            <Row label="Condição" value={product.condition} />
            <Row label="Preço" value={price ?? (available ? "Sob consulta" : "—")} testId="price" />
            <Row
              label="Disponibilidade"
              value={available ? "Disponível" : "Indisponível nesta configuração"}
              highlight={available}
              testId="availability"
            />
          </dl>

          <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full" data-testid="showroom-whatsapp">
            <WhatsAppIcon /> {available ? "Falar com atendimento" : "Consultar disponibilidade"}
          </a>

          {product.specs.length > 0 && (
            <div>
              <p className="label">Especificações</p>
              <dl className="mt-2 space-y-2 text-sm">
                {product.specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-4">
                    <dt className="text-mute">{s.label}</dt>
                    <dd className="text-right text-bone/85">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {others.length > 1 && (
            <nav aria-label="Outros aparelhos" className="mt-auto border-t border-line pt-6">
              <p className="label">Outros aparelhos</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                {prev && (
                  <Link href={`/showroom/${prev.slug}`} className="btn-ghost !px-3" aria-label={`Anterior: ${prev.name}`} data-testid="nav-prev">
                    <ArrowIcon dir="left" />
                  </Link>
                )}
                <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
                  {others.map((o) => (
                    <Link
                      key={o.slug}
                      href={`/showroom/${o.slug}`}
                      aria-current={o.slug === product.slug ? "page" : undefined}
                      className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-[11px] text-bone/75 hover:border-white/30 aria-[current=page]:border-champagne aria-[current=page]:text-champagne"
                      data-testid={`nav-${o.slug}`}
                    >
                      {o.name}
                    </Link>
                  ))}
                </div>
                {next && (
                  <Link href={`/showroom/${next.slug}`} className="btn-ghost !px-3" aria-label={`Próximo: ${next.name}`} data-testid="nav-next">
                    <ArrowIcon />
                  </Link>
                )}
              </div>
            </nav>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, highlight, testId }: { label: string; value: string; highlight?: boolean; testId?: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-mute">{label}</dt>
      <dd className={`text-right ${highlight ? "text-champagne" : "text-bone/90"}`} data-testid={testId}>{value}</dd>
    </div>
  );
}
