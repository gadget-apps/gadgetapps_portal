export const BKF_MODULES = [
  {
    id: "chat",
    title: "Chat / fila",
    description: "Atendimento suporte ↔ usuário e fila com atribuição.",
  },
  {
    id: "team",
    title: "Equipe",
    description: "Convites e operadores do BKF.",
  },
  {
    id: "users",
    title: "Usuários",
    description: "Listar, filtrar e ativar/desativar acesso.",
  },
  {
    id: "premium",
    title: "Premium",
    description: "Histórico de assinatura.",
  },
  {
    id: "reports",
    title: "Denúncias",
    description: "Fila de moderação.",
  },
  {
    id: "sos",
    title: "SOS / Functions",
    description: "Saúde de alertas e backend.",
  },
  {
    id: "config",
    title: "Config técnica",
    description: "Force update e flags.",
  },
] as const;

export type BkfModuleId = (typeof BKF_MODULES)[number]["id"];

export function isBkfModule(id: string): id is BkfModuleId {
  return BKF_MODULES.some((m) => m.id === id);
}
