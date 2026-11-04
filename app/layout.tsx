import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  axes: ["wdth"],
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  display: "swap",
  variable: "--font-serif",
});

/** Defina NEXT_PUBLIC_SITE_URL na Vercel quando houver domínio definitivo. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

const title = "Caixas de papelão sob medida em São Paulo | Quick Pack";
const description =
  "Babadopulos Embalagens: caixas de papelão sob medida com produção própria, em onda simples, onda dupla, corte e vinco e kraft. Peça seu orçamento pelo WhatsApp.";

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl), alternates: { canonical: "/" } } : {}),
  title,
  description,
  applicationName: "Quick Pack",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Quick Pack · Babadopulos Embalagens",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#183c30",
  width: "device-width",
  initialScale: 1,
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${serif.variable}`}>
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
