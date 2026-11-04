import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Syncopate } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const syncopate = Syncopate({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-syncopate", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "BBM Imports | Showroom 3D de smartphones", template: "%s | BBM Imports" },
  description: "Explore smartphones em 3D: gire, aproxime e veja cada detalhe antes de falar com a BBM Imports pelo WhatsApp.",
  openGraph: { type: "website", locale: "pt_BR", siteName: SITE.name },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${syncopate.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
