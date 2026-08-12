/**
 * Catálogo de apps operados pelo backoffice.
 * Por enquanto é uma lista fixa no código.
 * Depois isso vai para o Firebase do hub (escritório).
 */
export type AppStatus = "active" | "inactive" | "coming_soon";

export type CatalogApp = {
  /** Identificador interno — nunca muda (ex.: angels_care) */
  appId: string;
  /** Nome exibido na tela */
  name: string;
  /** Texto curto do que o produto faz */
  description: string;
  /** Projeto Firebase do produto (cofre dos dados) */
  firebaseProjectId: string;
  status: AppStatus;
  /** Cor de destaque no card (hex) */
  accentColor: string;
};

export const CATALOG_APPS: CatalogApp[] = [
  {
    appId: "angels_care",
    name: "Angel's Care",
    description: "Cuidado, matching, Premium, SOS e atendimento.",
    firebaseProjectId: "app-angelscare",
    status: "active",
    accentColor: "#F27421",
  },
  {
    appId: "proximo_app",
    name: "Próximo app",
    description: "Espaço reservado para o próximo produto GadgetApps.",
    firebaseProjectId: "(ainda não definido)",
    status: "coming_soon",
    accentColor: "#64748B",
  },
];

export function getAppById(appId: string): CatalogApp | undefined {
  return CATALOG_APPS.find((app) => app.appId === appId);
}

export function statusLabel(status: AppStatus): string {
  switch (status) {
    case "active":
      return "Ativo";
    case "inactive":
      return "Inativo";
    case "coming_soon":
      return "Em breve";
  }
}
