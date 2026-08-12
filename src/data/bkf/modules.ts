export const BKF_MODULES = [
  {
    id: "chat",
    title: "Chat / fila",
    description: "Atendimento suporte ↔ usuário e fila com atribuição.",
    /** false = operadores e admin */
    adminOnly: false,
  },
  {
    id: "team",
    title: "Equipe",
    description: "Convites e operadores do BKF.",
    adminOnly: true,
  },
  {
    id: "users",
    title: "Usuários",
    description: "Listar, filtrar e ativar/desativar acesso.",
    adminOnly: true,
  },
  {
    id: "premium",
    title: "Premium",
    description: "Histórico de assinatura.",
    adminOnly: true,
  },
  {
    id: "reports",
    title: "Denúncias",
    description: "Fila de moderação.",
    adminOnly: true,
  },
  {
    id: "sos",
    title: "SOS / Functions",
    description: "Saúde de alertas e backend.",
    adminOnly: true,
  },
  {
    id: "config",
    title: "Config técnica",
    description: "Force update e flags.",
    adminOnly: true,
  },
] as const;

export type BkfModuleId = (typeof BKF_MODULES)[number]["id"];

export function isBkfModule(id: string): id is BkfModuleId {
  return BKF_MODULES.some((m) => m.id === id);
}

export function isAdminOnlyModule(id: string): boolean {
  const mod = BKF_MODULES.find((m) => m.id === id);
  return mod?.adminOnly === true;
}

/** Módulos visíveis no menu conforme perfil. */
export function modulesForRole(isAdmin: boolean) {
  return BKF_MODULES.filter((m) => isAdmin || !m.adminOnly);
}
