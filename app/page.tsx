import { Experience } from "@/components/cinematic/Experience";
import { site } from "@/data/site";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "NicoTech",
    slogan: site.tagline,
    description: site.description,
    url: site.url,
    email: "nicotech.contato@gmail.com",
    telephone: "+5511953851744",
    areaServed: "BR",
    address: { "@type": "PostalAddress", addressLocality: "Guarulhos", addressRegion: "SP", addressCountry: "BR" },
    sameAs: [site.primaryContact.href, "https://nico-tech.vercel.app/"],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Experience />
    </>
  );
}
