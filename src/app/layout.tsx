import type { Metadata } from "next";
import { Geist, Syne } from "next/font/google";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const body = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gadgetapps-portal.web.app"),
  title: {
    default: "Gadget Apps Technology",
    template: "%s · Gadget Apps",
  },
  description:
    "Gadget Apps Technology — produtos digitais e área colaborador.",
  openGraph: {
    title: "Gadget Apps Technology",
    description: "Produtos digitais e área colaborador.",
    url: "https://gadgetapps-portal.web.app",
    siteName: "Gadget Apps Technology",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/hero.jpg" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
