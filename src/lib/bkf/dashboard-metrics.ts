import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import type { BkfUser } from "@/data/bkf/mock-users";
import type { SupportTicket } from "@/data/bkf/support-tickets";
import { getAngelsCareDb } from "@/lib/firebase/angels-care";
import {
  loadPremiumStatusRows,
  type PremiumStatusRow,
} from "@/lib/bkf/premium-firestore";
import { mapThreadDoc } from "@/lib/bkf/support-firestore";
import { loadAppUsers } from "@/lib/bkf/users-firestore";
import {
  loadModerationReports,
  reportsMetricsFromRows,
  type ReportsDashMetrics,
} from "@/lib/bkf/reports-firestore";
import {
  loadSosAuditEvents,
  sosMetricsFromRows,
  type SosDashMetrics,
} from "@/lib/bkf/sos-firestore";
import {
  functionFailureMetrics,
  loadFunctionFailures,
  type FunctionFailureMetrics,
} from "@/lib/bkf/functions-monitor-firestore";

export type ChatDashMetrics = {
  pending: number;
  open: number;
  pendingStatus: number;
  assigned: number;
  resolved: number;
  unread: number;
  normal: number;
  high: number;
  urgent: number;
};

export type UsersDashMetrics = {
  total: number;
  active: number;
  disabled: number;
  premium: number;
};

export type PremiumDashMetrics = {
  total: number;
  active: number;
  expired: number;
  expiring7: number;
  expiring30: number;
  bySource: { key: string; label: string; count: number }[];
  byPlan: { key: string; label: string; count: number }[];
};

export type AdminDashBundle = {
  chat: ChatDashMetrics;
  users: UsersDashMetrics;
  premium: PremiumDashMetrics;
  reports: ReportsDashMetrics;
  sos: SosDashMetrics;
  functionFailures: FunctionFailureMetrics;
};

const EMPTY_CHAT: ChatDashMetrics = {
  pending: 0,
  open: 0,
  pendingStatus: 0,
  assigned: 0,
  resolved: 0,
  unread: 0,
  normal: 0,
  high: 0,
  urgent: 0,
};

function sourceBucket(source: string | null | undefined): {
  key: string;
  label: string;
} {
  const s = (source || "").trim();
  if (s === "google_play") return { key: "google_play", label: "Google Play" };
  if (s === "bkf_admin") return { key: "bkf_admin", label: "BKF suporte" };
  if (s === "bkf_bonus") return { key: "bkf_bonus", label: "BKF bônus" };
  if (s === "dev_mock" || s === "test_mode") {
    return { key: "test", label: "Teste / mock" };
  }
  if (!s) return { key: "unknown", label: "Sem origem" };
  return { key: s, label: s };
}

function planBucket(planType: string | null | undefined): {
  key: string;
  label: string;
} {
  switch (planType) {
    case "monthly":
      return { key: "monthly", label: "Mensal" };
    case "annual":
      return { key: "annual", label: "Anual" };
    case "pass_5":
      return { key: "pass_5", label: "Passe 5" };
    case "pass_15":
      return { key: "pass_15", label: "Passe 15" };
    case "pass_25":
      return { key: "pass_25", label: "Passe 25" };
    default:
      return {
        key: planType || "unknown",
        label: planType?.trim() ? planType : "Sem plano",
      };
  }
}

export function chatMetricsFromTickets(tickets: SupportTicket[]): ChatDashMetrics {
  const m: ChatDashMetrics = { ...EMPTY_CHAT };
  for (const t of tickets) {
    if (t.status === "open") m.open += 1;
    else if (t.status === "pending") m.pendingStatus += 1;
    else if (t.status === "assigned") m.assigned += 1;
    else if (t.status === "resolved") m.resolved += 1;

    m.unread += t.unreadForStaff || 0;

    if (t.status !== "resolved") {
      m.pending += 1;
      if (t.priority === "urgent") m.urgent += 1;
      else if (t.priority === "high") m.high += 1;
      else m.normal += 1;
    }
  }
  return m;
}

export function usersMetricsFromRows(rows: BkfUser[]): UsersDashMetrics {
  let active = 0;
  let disabled = 0;
  let premium = 0;
  for (const u of rows) {
    if (u.accountDisabled) disabled += 1;
    else active += 1;
    if (u.isPremium) premium += 1;
  }
  return { total: rows.length, active, disabled, premium };
}

export function premiumMetricsFromRows(
  rows: PremiumStatusRow[],
): PremiumDashMetrics {
  const now = Date.now();
  const d7 = now + 7 * 24 * 60 * 60 * 1000;
  const d30 = now + 30 * 24 * 60 * 60 * 1000;
  let active = 0;
  let expired = 0;
  let expiring7 = 0;
  let expiring30 = 0;
  const sourceMap = new Map<string, { label: string; count: number }>();
  const planMap = new Map<string, { label: string; count: number }>();

  for (const r of rows) {
    if (r.isActive) {
      active += 1;
      const until = r.premiumUntil ? new Date(r.premiumUntil).getTime() : NaN;
      if (!Number.isNaN(until)) {
        if (until <= d7) expiring7 += 1;
        if (until <= d30) expiring30 += 1;
      }
    } else {
      expired += 1;
    }

    if (r.isActive) {
      const src = sourceBucket(r.source);
      const prev = sourceMap.get(src.key) || { label: src.label, count: 0 };
      prev.count += 1;
      sourceMap.set(src.key, prev);

      const plan = planBucket(r.planType);
      const pPrev = planMap.get(plan.key) || { label: plan.label, count: 0 };
      pPrev.count += 1;
      planMap.set(plan.key, pPrev);
    }
  }

  return {
    total: rows.length,
    active,
    expired,
    expiring7,
    expiring30,
    bySource: Array.from(sourceMap.entries())
      .map(([key, v]) => ({ key, label: v.label, count: v.count }))
      .sort((a, b) => b.count - a.count),
    byPlan: Array.from(planMap.entries())
      .map(([key, v]) => ({ key, label: v.label, count: v.count }))
      .sort((a, b) => b.count - a.count),
  };
}

async function loadChatMetrics(appId: string): Promise<ChatDashMetrics> {
  const db = getAngelsCareDb();
  try {
    const snap = await getDocs(
      query(collection(db, "support_threads"), orderBy("lastMessageAt", "desc"), limit(200)),
    );
    const tickets = snap.docs
      .map((d) => mapThreadDoc(d.id, d.data() as Record<string, unknown>))
      .filter((t) => t.appId === appId);
    return chatMetricsFromTickets(tickets);
  } catch {
    return { ...EMPTY_CHAT };
  }
}

export async function loadAdminDashBundle(
  appId: string,
): Promise<AdminDashBundle> {
  const [chat, users, premiumRows, reportRows, sosRows, failureRows] =
    await Promise.all([
    loadChatMetrics(appId),
    loadAppUsers().then(usersMetricsFromRows).catch(() => ({
      total: 0,
      active: 0,
      disabled: 0,
      premium: 0,
    })),
    loadPremiumStatusRows()
      .then(premiumMetricsFromRows)
      .catch(() => premiumMetricsFromRows([])),
    loadModerationReports()
      .then(reportsMetricsFromRows)
      .catch(() => ({ total: 0, open: 0, reviewed: 0, dismissed: 0 })),
    loadSosAuditEvents()
      .then(sosMetricsFromRows)
      .catch(() => ({
        total: 0,
        alerts: 0,
        falseAlarms: 0,
        suppressed: 0,
        deduped: 0,
      })),
    loadFunctionFailures()
      .then(functionFailureMetrics)
      .catch(() => ({
        total: 0,
        errors: 0,
        warnings: 0,
        callable: 0,
        schedule: 0,
        firestore: 0,
        https: 0,
      })),
  ]);
  return {
    chat,
    users,
    premium: premiumRows,
    reports: reportRows,
    sos: sosRows,
    functionFailures: failureRows,
  };
}
