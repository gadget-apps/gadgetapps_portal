/**
 * Produtos públicos da Gadget Apps Technology (site institucional).
 * O site oficial de cada app continua separado; aqui só apresentamos e linkamos.
 */
export type PublicProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** Site oficial do produto (pode ser outro hosting) */
  officialSiteUrl: string;
  /** Play Store, se houver */
  playStoreUrl?: string;
  status: "live" | "coming_soon";
  accentColor: string;
};

export const PUBLIC_PRODUCTS: PublicProduct[] = [
  {
    slug: "angels-care",
    name: "Angel's Care",
    tagline: "Cuidado conectado, com segurança e suporte.",
    description:
      "Aplicativo de cuidado e matching entre famílias e profissionais, com Premium, chat, SOS e ferramentas de rotina.",
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
