/**
 * Modelo do chat de atendimento (suporte ↔ usuário).
 * Isolado por appId. Depois grava no Firestore do portal (Spark),
 * sem misturar com o chat peer-to-peer do Angel's Care.
 */

export type TicketStatus = "open" | "pending" | "assigned" | "resolved";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportMessage = {
  id: string;
  sender: "user" | "staff";
  senderName: string;
  text: string;
  createdAt: string;
  isEdited?: boolean;
  isDeleted?: boolean;
};

export type SupportTicket = {
  id: string;
  appId: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeEmail: string | null;
  unreadForStaff: number;
  createdAt: string;
  lastMessageAt: string;
  messages: SupportMessage[];
};

export function supportMacrosFor(attendantName: string): {
  id: string;
  title: string;
  body: string;
}[] {
  const name = attendantName.trim();
  const greeting = name
    ? `Olá! Meu nome é ${name} e realizarei o seu atendimento. Como posso ajudá-lo?`
    : "";
  return [
    ...(greeting
      ? [
          {
            id: "m1",
            title: "Saudação",
            body: greeting,
          },
        ]
      : []),
    {
      id: "m2",
      title: "Premium / cobrança",
      body: "Vou verificar o status da sua assinatura Premium e já retorno com o detalhe.",
    },
    {
      id: "m3",
      title: "Aguardando info",
      body: "Para seguirmos, pode me enviar o e-mail da conta e um print do erro, por favor?",
    },
    {
      id: "m4",
      title: "Encerramento",
      body: "Problema resolvido do nosso lado. Se precisar de algo mais, é só responder esta conversa. Obrigado!",
    },
  ];
}

/** @deprecated use supportMacrosFor */
export const SUPPORT_MACROS = supportMacrosFor("");

const SEED_ANGELS: SupportTicket[] = [
  {
    id: "t_1001",
    appId: "angels_care",
    userId: "u_001",
    userName: "Maria Silva",
    userEmail: "maria.silva@email.com",
    subject: "Premium não liberou após compra",
    status: "open",
    priority: "high",
    assigneeEmail: null,
    unreadForStaff: 2,
    createdAt: "2026-08-12T07:40:00",
    lastMessageAt: "2026-08-12T08:05:00",
    messages: [
      {
        id: "m_1",
        sender: "user",
        senderName: "Maria Silva",
        text: "Comprei o Premium ontem e o app ainda mostra gratuito.",
        createdAt: "2026-08-12T07:40:00",
      },
      {
        id: "m_2",
        sender: "user",
        senderName: "Maria Silva",
        text: "O recibo da Play apareceu, mas no perfil continua sem o selo.",
        createdAt: "2026-08-12T08:05:00",
      },
    ],
  },
  {
    id: "t_1002",
    appId: "angels_care",
    userId: "u_002",
    userName: "João Pereira",
    userEmail: "joao.pereira@email.com",
    subject: "Não consigo enviar mensagem no chat",
    status: "assigned",
    priority: "normal",
    assigneeEmail: "suporte@gadgetapps.com",
    unreadForStaff: 0,
    createdAt: "2026-08-11T16:10:00",
    lastMessageAt: "2026-08-12T07:20:00",
    messages: [
      {
        id: "m_3",
        sender: "user",
        senderName: "João Pereira",
        text: "Quando mando mensagem dá erro de conexão.",
        createdAt: "2026-08-11T16:10:00",
      },
      {
        id: "m_4",
        sender: "staff",
        senderName: "Suporte",
        text: "Olá João! Vou checar se há bloqueio ou falha de rede no seu perfil.",
        createdAt: "2026-08-11T16:40:00",
      },
      {
        id: "m_5",
        sender: "user",
        senderName: "João Pereira",
        text: "Obrigado, fico no aguardo.",
        createdAt: "2026-08-12T07:20:00",
      },
    ],
  },
  {
    id: "t_1003",
    appId: "angels_care",
    userId: "u_003",
    userName: "Ana Costa",
    userEmail: "ana.costa@email.com",
    subject: "Dúvida sobre Zona Segura",
    status: "pending",
    priority: "low",
    assigneeEmail: "suporte@gadgetapps.com",
    unreadForStaff: 1,
    createdAt: "2026-08-10T11:00:00",
    lastMessageAt: "2026-08-12T06:50:00",
    messages: [
      {
        id: "m_6",
        sender: "user",
        senderName: "Ana Costa",
        text: "A Zona Segura dispara alerta mesmo eu estando em casa.",
        createdAt: "2026-08-10T11:00:00",
      },
      {
        id: "m_7",
        sender: "staff",
        senderName: "Suporte",
        text: "Pode confirmar o raio configurado e se o GPS está ligado o tempo todo?",
        createdAt: "2026-08-10T12:15:00",
      },
      {
        id: "m_8",
        sender: "user",
        senderName: "Ana Costa",
        text: "GPS ligado. Raio de 100m.",
        createdAt: "2026-08-12T06:50:00",
      },
    ],
  },
  {
    id: "t_1004",
    appId: "angels_care",
    userId: "u_004",
    userName: "Carlos Mendes",
    userEmail: "carlos.mendes@email.com",
    subject: "Conta desativada por engano",
    status: "resolved",
    priority: "urgent",
    assigneeEmail: "suporte@gadgetapps.com",
    unreadForStaff: 0,
    createdAt: "2026-08-09T09:00:00",
    lastMessageAt: "2026-08-09T15:30:00",
    messages: [
      {
        id: "m_9",
        sender: "user",
        senderName: "Carlos Mendes",
        text: "Minha conta foi bloqueada e não consigo entrar.",
        createdAt: "2026-08-09T09:00:00",
      },
      {
        id: "m_10",
        sender: "staff",
        senderName: "Suporte",
        text: "Reativamos o acesso. Pode testar o login agora?",
        createdAt: "2026-08-09T14:10:00",
      },
      {
        id: "m_11",
        sender: "user",
        senderName: "Carlos Mendes",
        text: "Entrei sim, obrigado!",
        createdAt: "2026-08-09T15:30:00",
      },
    ],
  },
];

const STORAGE_KEY = "gat_bkf_support_tickets_v1";

function cloneSeed(appId: string): SupportTicket[] {
  return SEED_ANGELS.filter((t) => t.appId === appId).map((t) => ({
    ...t,
    messages: t.messages.map((m) => ({ ...m })),
  }));
}

export function loadTickets(appId: string): SupportTicket[] {
  if (typeof window === "undefined") return cloneSeed(appId);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneSeed(appId);
    const all = JSON.parse(raw) as SupportTicket[];
    const mine = all.filter((t) => t.appId === appId);
    return mine.length ? mine : cloneSeed(appId);
  } catch {
    return cloneSeed(appId);
  }
}

export function saveTickets(appId: string, tickets: SupportTicket[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const others: SupportTicket[] = raw
      ? (JSON.parse(raw) as SupportTicket[]).filter((t) => t.appId !== appId)
      : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...others, ...tickets]));
  } catch {
    /* ignore quota */
  }
}

export function statusLabel(s: TicketStatus): string {
  switch (s) {
    case "open":
      return "Novo";
    case "pending":
      return "Aguardando";
    case "assigned":
      return "Em atendimento";
    case "resolved":
      return "Resolvido";
  }
}

export function priorityLabel(p: TicketPriority): string {
  switch (p) {
    case "low":
      return "Baixa";
    case "normal":
      return "Normal";
    case "high":
      return "Alta";
    case "urgent":
      return "Urgente";
  }
}
