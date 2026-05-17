import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PriceSync Manager — Inteligjencë Çmimesh për Tregun Kosovar",
  description:
    "Platforma #1 e Inteligjencës Konkurruese të Çmimeve dhe Optimizimit Dinamik të Marzhit për zinxhirët e mëdhenj të shitjes me pakicë në Kosovë.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq" suppressHydrationWarning>
      <body className={`${inter.className} h-full antialiased bg-gray-950 text-gray-100`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
