import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { getAngelsCareDb } from "@/lib/firebase/angels-care";

const PAGE_SIZE = 80;

export type SosDeliveryRow = {
  recipientId: string;
  status: string;
  messageId?: string;
  error?: string;
  skippedReason?: string;
};

export type SosAuditEvent = {
  id: string;
  createdAt: string;
  clientTimestamp: string;
  outcome: string;
  triggerSource: string;
  notificationType: string;
  assistedId: string;
  assistedName: string;
  contractorId: string;
  senderUid: string;
  reason: string;
  title: string;
  body: string;
  sentCount: number;
  dedupeKey: string;
  deduplicated: boolean;
  notifyContractorRequested: boolean;
  professionalIdsFromClient: string[];
  resolvedRecipientIds: string[];
  fcmTargetIds: string[];
  delivery: SosDeliveryRow[];
  ai: {
    attempted: boolean;
    audioStoragePath: string | null;
    isEmergency: boolean | null;
    context: string | null;
    analysisFailed: boolean;
  };
  locationAtEvent: {
    available?: boolean;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    lastLocationUpdate?: unknown;
  } | null;
  premiumCheck: {
    required: boolean;
    contractorPremiumEffective: boolean;
  } | null;
};

function tsToIso(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string" && value) return value;
  return "";
}

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
}

function mapDelivery(raw: unknown): SosDeliveryRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = (item || {}) as Record<string, unknown>;
    return {
      recipientId: String(row.recipientId ?? ""),
      status: String(row.status ?? ""),
      messageId: row.messageId ? String(row.messageId) : undefined,
      error: row.error ? String(row.error) : undefined,
      skippedReason: row.skippedReason
        ? String(row.skippedReason)
        : undefined,
    };
  });
}

function mapEvent(
  id: string,
  data: Record<string, unknown>,
): SosAuditEvent {
  const aiRaw = (data.ai || {}) as Record<string, unknown>;
  const premiumRaw = (data.premiumCheck || null) as Record<
    string,
    unknown
  > | null;
  const locRaw = (data.locationAtEvent || null) as Record<
    string,
    unknown
  > | null;

  return {
    id,
    createdAt: tsToIso(data.createdAt),
    clientTimestamp: String(data.clientTimestamp ?? ""),
    outcome: String(data.outcome ?? ""),
    triggerSource: String(data.triggerSource ?? ""),
    notificationType: String(data.notificationType ?? ""),
    assistedId: String(data.assistedId ?? ""),
    assistedName: String(data.assistedName ?? ""),
    contractorId: String(data.contractorId ?? ""),
    senderUid: String(data.senderUid ?? ""),
    reason: String(data.reason ?? ""),
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    sentCount: Number(data.sentCount ?? 0) || 0,
    dedupeKey: String(data.dedupeKey ?? ""),
    deduplicated: data.deduplicated === true,
    notifyContractorRequested: data.notifyContractorRequested !== false,
    professionalIdsFromClient: asStringArray(data.professionalIdsFromClient),
    resolvedRecipientIds: asStringArray(data.resolvedRecipientIds),
    fcmTargetIds: asStringArray(data.fcmTargetIds),
    delivery: mapDelivery(data.delivery),
    ai: {
      attempted: aiRaw.attempted === true,
      audioStoragePath: aiRaw.audioStoragePath
        ? String(aiRaw.audioStoragePath)
        : null,
      isEmergency:
        typeof aiRaw.isEmergency === "boolean" ? aiRaw.isEmergency : null,
      context: aiRaw.context ? String(aiRaw.context) : null,
      analysisFailed: aiRaw.analysisFailed === true,
    },
    locationAtEvent: locRaw
      ? {
          available: locRaw.available === true,
          latitude:
            typeof locRaw.latitude === "number" ? locRaw.latitude : null,
          longitude:
            typeof locRaw.longitude === "number" ? locRaw.longitude : null,
          accuracy:
            typeof locRaw.accuracy === "number" ? locRaw.accuracy : null,
          lastLocationUpdate: locRaw.lastLocationUpdate ?? null,
        }
      : null,
    premiumCheck: premiumRaw
      ? {
          required: premiumRaw.required === true,
          contractorPremiumEffective:
            premiumRaw.contractorPremiumEffective === true,
        }
      : null,
  };
}

export async function loadSosAuditEvents(): Promise<SosAuditEvent[]> {
  const db = getAngelsCareDb();
  const col = collection(db, "sos_audit_events");

  try {
    const snap = await getDocs(
      query(col, orderBy("createdAt", "desc"), limit(PAGE_SIZE)),
    );
    return snap.docs.map((d) =>
      mapEvent(d.id, d.data() as Record<string, unknown>),
    );
  } catch {
    const snap = await getDocs(query(col, limit(PAGE_SIZE)));
    const list = snap.docs.map((d) =>
      mapEvent(d.id, d.data() as Record<string, unknown>),
    );
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }
}

export function outcomeLabel(outcome: string): string {
  switch (outcome) {
    case "alert_sent":
      return "Alerta enviado";
    case "false_alarm_sent":
      return "Falso alarme enviado";
    case "deduplicated":
      return "Duplicado (ignorado)";
    case "suppressed_no_premium":
      return "Suprimido (sem Premium)";
    default:
      return outcome || "—";
  }
}

export function triggerLabel(source: string): string {
  if (source === "FALL_SENSOR") return "Sensor de queda";
  if (source === "PANIC_BUTTON") return "Botão SOS";
  return source || "—";
}

export function formatSosDt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleString("pt-BR");
}

export type SosDashMetrics = {
  total: number;
  alerts: number;
  falseAlarms: number;
  suppressed: number;
  deduped: number;
};

export function sosMetricsFromRows(rows: SosAuditEvent[]): SosDashMetrics {
  let alerts = 0;
  let falseAlarms = 0;
  let suppressed = 0;
  let deduped = 0;
  for (const r of rows) {
    if (r.outcome === "alert_sent") alerts += 1;
    else if (r.outcome === "false_alarm_sent") falseAlarms += 1;
    else if (r.outcome === "suppressed_no_premium") suppressed += 1;
    else if (r.outcome === "deduplicated") deduped += 1;
  }
  return {
    total: rows.length,
    alerts,
    falseAlarms,
    suppressed,
    deduped,
  };
}
