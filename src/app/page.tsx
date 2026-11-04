import { Hero } from "@/components/home/Hero";
import { StorySection } from "@/components/home/StorySection";
import { Catalog } from "@/components/site/Catalog";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { WhatsAppIcon } from "@/components/site/icons";
import { listCategories, listProducts } from "@/lib/store";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  // Somente o primeiro produto publicado é carregado em 3D na home (hero + storytelling).
  const featured = products[0] ?? null;
  return (
    <>
      <SiteHeader overlay />
      <main>
        <Hero product={featured} />
        {featured && <StorySection product={featured} />}
        <Catalog products={products} categories={categories} />
        <section className="border-t border-line">
          <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 px-5 py-20 md:flex-row md:items-center md:px-10">
            <div>
              <p className="eyebrow">Atendimento</p>
              <h2 className="mt-4 max-w-xl font-display text-[clamp(1.3rem,2.8vw,2.1rem)] font-bold uppercase leading-[1.1] text-bone">Viu algum detalhe que quer confirmar?</h2>
              <p className="mt-3 max-w-lg text-mute">Fale com a equipe da BBM Imports e tire dúvidas sobre cor, capacidade, condição e disponibilidade.</p>
            </div>
            <a href={whatsappLink("Olá! Vi o showroom 3D da BBM Imports e quero tirar algumas dúvidas.")} target="_blank" rel="noopener noreferrer" className="btn-whatsapp" data-testid="cta-whatsapp">
              <WhatsAppIcon /> Falar no WhatsApp
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
