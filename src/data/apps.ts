export type AppStatus = "active" | "inactive" | "coming_soon";

export type CatalogApp = {
  // Identificador interno estável para isolamento white-label (ex.: angels_care); nunca mudar.
  // Stable internal id for white-label isolation (e.g. angels_care); never change.
  appId: string;
  name: string;
  description: string;
  firebaseProjectId: string;
  status: AppStatus;
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
