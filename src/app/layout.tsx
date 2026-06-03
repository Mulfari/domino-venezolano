import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dominó Venezolano",
  description: "Juega dominó online con tu familia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-felt min-h-screen text-ivory">{children}</body>
    </html>
  );
}
