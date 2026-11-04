import { company, fullAddress } from "./site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: `${company.legalName} — ${company.brand}`,
  description: "Fabricação de caixas de papelão sob medida com produção própria.",
  telephone: "+55 11 93013-9747",
  email: company.email,
  ...(siteUrl ? { url: siteUrl } : {}),
  address: {
    "@type": "PostalAddress",
    streetAddress: company.address.street,
    addressLocality: company.address.city,
    addressRegion: company.address.state,
    postalCode: company.address.postalCode,
    addressCountry: "BR",
  },
  areaServed: "São Paulo e região",
  sameAs: [company.instagramUrl],
  hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
};
