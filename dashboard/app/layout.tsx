import type { Metadata } from "next";
import { Oxygen } from "next/font/google";
import "./globals.css";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const oxygen = Oxygen({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-oxygen",
});

export const metadata: Metadata = {
  title: "Clínica Demo — Painel",
  description: "Painel de operação e métricas de uma clínica",
};

// A casca vale para o sistema inteiro: sidebar fixa à esquerda em todas as telas.
// Antes cada página trazia o próprio cabeçalho com logo e uma fileira de pílulas —
// o que fazia a navegação existir em quatro cópias e sair de sincronia (a aba CRM
// só apareceu numa delas). Uma casca só resolve isso na origem.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${oxygen.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-oxygen)]">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="min-w-0 overflow-hidden">{children}</SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
