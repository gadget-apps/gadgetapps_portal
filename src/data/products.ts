export type PublicProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  officialSiteUrl: string;
  playStoreUrl?: string;
  status: "live" | "coming_soon";
  accentColor: string;
};

export const PUBLIC_PRODUCTS: PublicProduct[] = [
  {
    slug: "angels-care",
    name: "Angel's Care",
    tagline: "Garantindo o cuidado de quem sempre cuidou de você",
    description:
      "Tecnologia de ponta e profissionais qualificados unidos com um único propósito: a qualidade de vida e a proteção absoluta do seu familiar.",
    officialSiteUrl: "https://app-angelscare.web.app",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.angelscare.app",
    status: "live",
    accentColor: "#F27421",
  },
  {
    slug: "proximo",
    name: "Próximo produto",
    tagline: "Em breve na família Gadget Apps.",
    description:
      "Espaço reservado para o próximo aplicativo da empresa.",
    officialSiteUrl: "#",
    status: "coming_soon",
    accentColor: "#64748B",
  },
];

export function getProductBySlug(slug: string): PublicProduct | undefined {
  return PUBLIC_PRODUCTS.find((p) => p.slug === slug);
}
