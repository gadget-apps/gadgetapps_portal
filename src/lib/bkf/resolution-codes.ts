// Códigos estruturados de tratativa BKF — white-label (qualquer appId); `id` estável para KPIs.
// Structured BKF handling codes — white-label (any appId); `id` is stable for KPIs.

export type ResolutionPreset = {
  id: string;
  label: string;
  // Texto com `{appName}` substituído no UI (white-label).
  // Copy with `{appName}` substituted in the UI (white-label).
  textTemplate: string;
};

function withAppName(template: string, appName: string): string {
  return template.replaceAll("{appName}", appName || "o aplicativo");
}

export function presetsForDisplay(
  presets: ResolutionPreset[],
  appName: string,
): { id: string; label: string; text: string }[] {
  return presets.map((p) => ({
    id: p.id,
    label: p.label,
    text: withAppName(p.textTemplate, appName),
  }));
}

export const OUVIDORIA_RESOLUTION_PRESETS: ResolutionPreset[] = [
  {
    id: "respondido",
    label: "Respondido",
    textTemplate: "Usuário orientado por e-mail. Caso encerrado.",
  },
  {
    id: "problema_corrigido",
    label: "Problema corrigido",
    textTemplate:
      "Problema reproduzido/confirmado e corrigido. Usuário informado.",
  },
  {
    id: "esclarecimento",
    label: "Esclarecimento",
    textTemplate:
      "Esclarecimento enviado. Sem alteração de produto necessária.",
  },
  {
    id: "roadmap",
    label: "Roadmap",
    textTemplate: "Sugestão registrada para avaliação de produto/roadmap.",
  },
  {
    id: "fora_de_escopo",
    label: "Fora de escopo",
    textTemplate:
      "Solicitação fora do escopo atual de {appName}. Usuário informado.",
  },
  {
    id: "agradecimento",
    label: "Agradecimento",
    textTemplate: "Elogio registrado e agradecimento enviado ao usuário.",
  },
  {
    id: "sem_evidencia",
    label: "Sem evidência",
    textTemplate:
      "Sem evidência suficiente para ação adicional. Encerrado com retorno ao usuário.",
  },
  {
    id: "encaminhado",
    label: "Encaminhado",
    textTemplate:
      "Encaminhado para área técnica/operacional. Retorno enviado ao usuário.",
  },
];

export const REPORTS_RESOLUTION_PRESETS: ResolutionPreset[] = [
  {
    id: "violacao_confirmada",
    label: "Violação confirmada",
    textTemplate: "Violação confirmada. Providências tomadas.",
  },
  {
    id: "sem_violacao",
    label: "Sem violação",
    textTemplate: "Análise sem identificação de violação suficiente.",
  },
  {
    id: "aviso_aplicado",
    label: "Aviso",
    textTemplate: "Aviso aplicado ao denunciado.",
  },
  {
    id: "conteudo_removido",
    label: "Conteúdo removido",
    textTemplate: "Conteúdo removido / conversa sanitizada.",
  },
  {
    id: "duplicata",
    label: "Duplicata",
    textTemplate: "Denúncia duplicada ou já tratada em outro caso.",
  },
  {
    id: "insuficiente",
    label: "Insuficiente",
    textTemplate: "Informações insuficientes para ação.",
  },
];

export const CHAT_RESOLUTION_PRESETS: ResolutionPreset[] = [
  {
    id: "duvida_resolvida",
    label: "Dúvida resolvida",
    textTemplate: "Dúvida do usuário esclarecida no chat.",
  },
  {
    id: "problema_resolvido",
    label: "Problema resolvido",
    textTemplate: "Problema técnico/operacional resolvido com o usuário.",
  },
  {
    id: "billing_ok",
    label: "Billing",
    textTemplate: "Assunto de cobrança/Premium tratado.",
  },
  {
    id: "escalado",
    label: "Escalado",
    textTemplate: "Escalado para outra área / Ouvidoria.",
  },
  {
    id: "sem_resposta_user",
    label: "Sem resposta",
    textTemplate: "Usuário não respondeu; ticket encerrado.",
  },
  {
    id: "spam",
    label: "Spam / irrelevante",
    textTemplate: "Contato irrelevante ou spam.",
  },
];

export const RESOLUTION_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  [
    ...OUVIDORIA_RESOLUTION_PRESETS,
    ...REPORTS_RESOLUTION_PRESETS,
    ...CHAT_RESOLUTION_PRESETS,
  ].map((p) => [p.id, p.label]),
);

// Metas de SLA padrão (horas) — white-label por app.
// Default SLA targets (hours) — white-label per app.
export const DEFAULT_SLA_TARGETS_HOURS = {
  ouvidoria: 48,
  reports: 72,
  chat: 24,
} as const;

export type SlaChannel = keyof typeof DEFAULT_SLA_TARGETS_HOURS;

export function hoursBetween(startIso: string, endIso: string): number | null {
  if (!startIso || !endIso) return null;
  const a = Date.parse(startIso);
  const b = Date.parse(endIso);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return (b - a) / 3_600_000;
}

export function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1]! + s[mid]!) / 2 : s[mid]!;
}

export function formatHours(h: number | null): string {
  if (h == null || !Number.isFinite(h)) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

export function countCodes(rows: { resolutionCodes?: string[] }[]): {
  id: string;
  label: string;
  count: number;
}[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    for (const code of row.resolutionCodes || []) {
      map.set(code, (map.get(code) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([id, count]) => ({
      id,
      label: RESOLUTION_LABEL_BY_ID[id] || id,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
