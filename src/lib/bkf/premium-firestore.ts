import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getAngelsCareDb } from "@/lib/firebase/angels-care";

const STATUS_PAGE = 120;
const EVENTS_PAGE = 100;

export type PremiumPlanType =
  | "monthly"
  | "annual"
  | "pass_5"
  | "pass_15"
  | "pass_25"
  | string;

export type PremiumStatusRow = {
  id: string;
  displayName: string;
  email: string;
  userRole: string;
  isActive: boolean;
  planType: PremiumPlanType | null;
  productId: string | null;
  source: string | null;
  lastPurchaseAt: string;
  premiumUntil: string;
  entitlementUpdatedAt: string;
  claimId: string | null;
};

export type PremiumEventType =
  | "granted"
  | "revoked"
  | "mock_on"
  | "mock_off"
  | string;

export type PremiumEventRow = {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  eventType: PremiumEventType;
  productId: string | null;
  planType: PremiumPlanType | null;
  source: string | null;
  claimId: string | null;
  premiumUntil: string;
  reason: string | null;
  actor: string | null;
  createdAt: string;
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

function isPremiumEffective(data: Record<string, unknown>): boolean {
  if (data.isPremium !== true) return false;
  const until = data.premiumUntil;
  if (!until) return true;
  try {
    const d =
      until && typeof until === "object" && "toDate" in until
        ? (until as { toDate: () => Date }).toDate()
        : new Date(String(until));
    if (Number.isNaN(d.getTime())) return true;
    return d.getTime() > Date.now();
  } catch {
    return true;
  }
}

function hasPremiumSignal(data: Record<string, unknown>): boolean {
  return (
    data.isPremium === true ||
    Boolean(data.premiumProductId) ||
    Boolean(data.premiumPlanType) ||
    Boolean(data.lastPurchaseDate) ||
    Boolean(data.premiumUntil) ||
    Boolean(data.premiumExpiredAt)
  );
}

function mapRole(raw: unknown): string {
  const role = String(raw ?? "").trim();
  if (role === "Contratante") return "Contratante";
  if (role === "Assistido") return "Assistido";
  if (role === "Cuidador" || role.toLowerCase().includes("cuidador") || role.toLowerCase().includes("profissional")) {
    return "Profissional";
  }
  return role || "—";
}

export function planLabel(planType: string | null | undefined): string {
  switch (planType) {
    case "monthly":
      return "Mensal";
    case "annual":
      return "Anual";
    case "pass_5":
      return "Passe 5 dias";
    case "pass_15":
      return "Passe 15 dias";
    case "pass_25":
      return "Passe 25 dias";
    default:
      return planType?.trim() ? planType : "—";
  }
}

export function sourceLabel(source: string | null | undefined): string {
  switch (source) {
    case "google_play":
      return "Google Play";
    case "dev_mock":
      return "Mock / teste";
    case "test_mode":
      return "Modo teste";
    case "receipt_present":
      return "Recibo presente";
    case "bkf_admin":
      return "BKF (suporte)";
    case "bkf_bonus":
      return "BKF (bonificação)";
    default:
      return source?.trim() ? source : "—";
  }
}

export function eventTypeLabel(eventType: string): string {
  switch (eventType) {
    case "granted":
      return "Concedido";
    case "revoked":
      return "Revogado";
    case "mock_on":
      return "Mock ligado";
    case "mock_off":
      return "Mock desligado";
    default:
      return eventType || "—";
  }
}

function mapStatusDoc(
  id: string,
  data: Record<string, unknown>,
): PremiumStatusRow {
  return {
    id,
    displayName: String(data.name ?? "Usuário"),
    email: String(data.email ?? ""),
    userRole: mapRole(data.userRole),
    isActive: isPremiumEffective(data),
    planType: data.premiumPlanType
      ? String(data.premiumPlanType)
      : null,
    productId: data.premiumProductId
      ? String(data.premiumProductId)
      : null,
    source: data.premiumSource ? String(data.premiumSource) : null,
    lastPurchaseAt: tsToIso(data.lastPurchaseDate),
    premiumUntil: tsToIso(data.premiumUntil),
    entitlementUpdatedAt: tsToIso(data.entitlementUpdatedAt),
    claimId: data.premiumPurchaseClaimId
      ? String(data.premiumPurchaseClaimId)
      : null,
  };
}

function mapEventDoc(
  id: string,
  data: Record<string, unknown>,
): PremiumEventRow {
  return {
    id,
    uid: String(data.uid ?? ""),
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? data.name ?? ""),
    eventType: String(data.eventType ?? ""),
    productId: data.productId ? String(data.productId) : null,
    planType: data.planType ? String(data.planType) : null,
    source: data.source ? String(data.source) : null,
    claimId: data.claimId ? String(data.claimId) : null,
    premiumUntil: tsToIso(data.premiumUntil),
    reason: data.reason ? String(data.reason) : null,
    actor: data.actor ? String(data.actor) : null,
    createdAt: tsToIso(data.createdAt),
  };
}

// Status atual de entitlement em `users`. Não é histórico de renovações.
// Current entitlement status on `users`. This is not a renewal history.
export async function loadPremiumStatusRows(): Promise<PremiumStatusRow[]> {
  const db = getAngelsCareDb();
  const col = collection(db, "users");
  const byId = new Map<string, PremiumStatusRow>();

  try {
    const activeSnap = await getDocs(
      query(col, where("isPremium", "==", true), limit(STATUS_PAGE)),
    );
    for (const d of activeSnap.docs) {
      byId.set(d.id, mapStatusDoc(d.id, d.data() as Record<string, unknown>));
    }
  } catch {
    // Índice ou permissão: segue com a carga geral.
    // Missing index or permission: continue with the general load.
  }

  try {
    const snap = await getDocs(query(col, orderBy("name"), limit(STATUS_PAGE)));
    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      if (!hasPremiumSignal(data)) continue;
      byId.set(d.id, mapStatusDoc(d.id, data));
    }
  } catch {
    const snap = await getDocs(query(col, limit(STATUS_PAGE)));
    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      if (!hasPremiumSignal(data)) continue;
      byId.set(d.id, mapStatusDoc(d.id, data));
    }
  }

  const list = Array.from(byId.values());
  list.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    const aAt = a.lastPurchaseAt || a.entitlementUpdatedAt;
    const bAt = b.lastPurchaseAt || b.entitlementUpdatedAt;
    return bAt.localeCompare(aAt);
  });
  return list;
}

// Ledger de eventos (após o deploy das Functions). Lista vazia é esperada até haver grants/revokes.
// Event ledger (after Functions deploy). An empty list is expected until grants/revokes exist.
export async function loadPremiumEvents(): Promise<PremiumEventRow[]> {
  const db = getAngelsCareDb();
  const col = collection(db, "premium_events");

  try {
    const snap = await getDocs(
      query(col, orderBy("createdAt", "desc"), limit(EVENTS_PAGE)),
    );
    return snap.docs.map((d) =>
      mapEventDoc(d.id, d.data() as Record<string, unknown>),
    );
  } catch {
    const snap = await getDocs(query(col, limit(EVENTS_PAGE)));
    const list = snap.docs.map((d) =>
      mapEventDoc(d.id, d.data() as Record<string, unknown>),
    );
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }
}

export function formatDt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}
