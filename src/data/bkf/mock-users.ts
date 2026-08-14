/**
 * Dados de demonstração do BKF — espelham campos reais do Angel's Care.
 * Trocaremos por leitura do Firebase app-angelscare (sem Blaze no portal).
 */
export type BkfUser = {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  userRole: "Contratante" | "Cuidador (Profissional)" | "Assistido";
  isPremium: boolean;
  premiumUntil?: string;
  premiumProductId?: string;
  premiumPlanType?: string;
  premiumSource?: string;
  accountDisabled: boolean;
  lastActiveAt: string;
  createdAt: string;
};

export const MOCK_USERS_ANGELS_CARE: BkfUser[] = [
  {
    id: "u_001",
    displayName: "Maria Silva",
    email: "maria.silva@email.com",
    phone: "+55 11 98888-1001",
    userRole: "Contratante",
    isPremium: true,
    premiumUntil: "2026-12-01",
    accountDisabled: false,
    lastActiveAt: "2026-08-12T08:10:00",
    createdAt: "2025-11-02",
  },
  {
    id: "u_002",
    displayName: "João Pereira",
    email: "joao.pereira@email.com",
    phone: "+55 21 97777-2002",
    userRole: "Cuidador (Profissional)",
    isPremium: false,
    accountDisabled: false,
    lastActiveAt: "2026-08-11T19:40:00",
    createdAt: "2026-01-15",
  },
  {
    id: "u_003",
    displayName: "Ana Costa",
    email: "ana.costa@email.com",
    userRole: "Assistido",
    isPremium: true,
    premiumUntil: "2026-09-20",
    accountDisabled: true,
    lastActiveAt: "2026-07-28T14:02:00",
    createdAt: "2025-08-20",
  },
  {
    id: "u_004",
    displayName: "Carlos Mendes",
    email: "carlos.mendes@email.com",
    phone: "+55 31 96666-3003",
    userRole: "Contratante",
    isPremium: false,
    accountDisabled: false,
    lastActiveAt: "2026-08-10T11:22:00",
    createdAt: "2026-03-01",
  },
  {
    id: "u_005",
    displayName: "Fernanda Lima",
    email: "fernanda.lima@email.com",
    userRole: "Cuidador (Profissional)",
    isPremium: true,
    premiumUntil: "2026-10-05",
    accountDisabled: false,
    lastActiveAt: "2026-08-12T07:55:00",
    createdAt: "2025-12-12",
  },
];

export function usersForApp(appId: string): BkfUser[] {
  if (appId === "angels_care") return MOCK_USERS_ANGELS_CARE;
  return [];
}
