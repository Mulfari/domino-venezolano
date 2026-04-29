import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dominó Venezolano — Juega en línea",
    template: "%s | Dominó Venezolano",
  },
  description:
    "Juega dominó venezolano en línea con tus amigos. Partidas de 4 jugadores en parejas, a 100 puntos. Gratis y en tiempo real.",
  keywords: [
    "dominó",
    "venezolano",
    "juego en línea",
    "parejas",
    "domino online",
  ],
  metadataBase: new URL("https://domino.com.ve"),
  openGraph: {
    title: "Dominó Venezolano — Juega en línea",
    description:
      "Partidas de dominó venezolano en parejas. Crea una sala, invita a tus amigos y juega en tiempo real.",
    url: "https://domino.com.ve",
    siteName: "Dominó Venezolano",
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dominó Venezolano",
    description: "Juega dominó en parejas con tus amigos, gratis y en línea.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#1a3a2a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-[#1a3a2a] text-[#f5f0e8] bg-felt relative overflow-x-hidden">
        {/* Ambient gradient blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#1e5c3a]/[0.15] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[#c9a84c]/[0.05] blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#1e5c3a]/[0.08] blur-[150px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
