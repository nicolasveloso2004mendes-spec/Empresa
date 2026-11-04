import { About, HowTo } from "@/components/About";
import { Applications } from "@/components/Applications";
import { Contact, Footer } from "@/components/Contact";
import { CustomSize } from "@/components/CustomSize";
import { Faq } from "@/components/Faq";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MobileCta } from "@/components/MobileCta";
import { ProductLine } from "@/components/ProductLine";
import { QuoteForm } from "@/components/QuoteForm";
import { QuoteProvider } from "@/lib/quote-context";
import { jsonLd } from "@/lib/seo";

export default function Home() {
  return (
    <QuoteProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <Applications />
        <ProductLine />
        <CustomSize />
        <About />
        <HowTo />
        <QuoteForm />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <MobileCta />
    </QuoteProvider>
  );
}
