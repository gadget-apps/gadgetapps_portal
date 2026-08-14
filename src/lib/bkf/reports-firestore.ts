import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";

const PAGE_SIZE = 100;

export type ModerationReportStatus = "open" | "reviewed" | "dismissed";

export type ModerationReport = {
  id: string;
  reporterId: string;
  reportedUserId: string;
  connectionId: string;
  reason: string;
  details: string;
  status: ModerationReportStatus;
  createdAt: string;
  reviewedAt: string;
  reviewedByEmail: string;
  reviewNote: string;
  reporterName: string;
  reporterEmail: string;
  reportedName: string;
  reportedEmail: string;
  isSeed: boolean;
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

function asStatus(raw: unknown): ModerationReportStatus {
  const s = String(raw ?? "open");
  if (s === "reviewed" || s === "dismissed" || s === "open") return s;
  return "open";
}

async function resolveUsers(
  uids: string[],
): Promise<Map<string, { name: string; email: string }>> {
  const db = getAngelsCareDb();
  const map = new Map<string, { name: string; email: string }>();
  const unique = [...new Set(uids.filter(Boolean))];
  await Promise.all(
    unique.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) {
          map.set(uid, { name: uid.slice(0, 8), email: "" });
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        map.set(uid, {
          name: String(data.name ?? uid.slice(0, 8)),
          email: String(data.email ?? ""),
        });
      } catch {
        map.set(uid, { name: uid.slice(0, 8), email: "" });
      }
    }),
  );
  return map;
}

function mapReport(
  id: string,
  data: Record<string, unknown>,
  users: Map<string, { name: string; email: string }>,
): ModerationReport {
  const reporterId = String(data.reporterId ?? "");
  const reportedUserId = String(data.reportedUserId ?? "");
  const reporter = users.get(reporterId) ?? {
    name: reporterId.slice(0, 8) || "—",
    email: "",
  };
  const reported = users.get(reportedUserId) ?? {
    name: reportedUserId.slice(0, 8) || "—",
    email: "",
  };
  return {
    id,
    reporterId,
    reportedUserId,
    connectionId: String(data.connectionId ?? ""),
    reason: String(data.reason ?? ""),
    details: String(data.details ?? ""),
    status: asStatus(data.status),
    createdAt: tsToIso(data.createdAt),
    reviewedAt: tsToIso(data.reviewedAt),
    reviewedByEmail: String(data.reviewedByEmail ?? ""),
    reviewNote: String(data.reviewNote ?? ""),
    reporterName: String(data.reporterName ?? reporter.name),
    reporterEmail: String(data.reporterEmail ?? reporter.email),
    reportedName: String(data.reportedName ?? reported.name),
    reportedEmail: String(data.reportedEmail ?? reported.email),
    isSeed: data.isSeed === true,
  };
}

export async function loadModerationReports(): Promise<ModerationReport[]> {
  const db = getAngelsCareDb();
  const col = collection(db, "moderation_reports");

  let docs;
  try {
    const snap = await getDocs(
      query(col, orderBy("createdAt", "desc"), limit(PAGE_SIZE)),
    );
    docs = snap.docs;
  } catch {
    const snap = await getDocs(query(col, limit(PAGE_SIZE)));
    docs = snap.docs;
  }

  const uids: string[] = [];
  for (const d of docs) {
    const data = d.data() as Record<string, unknown>;
    uids.push(String(data.reporterId ?? ""), String(data.reportedUserId ?? ""));
  }
  const users = await resolveUsers(uids);

  const list = docs.map((d) =>
    mapReport(d.id, d.data() as Record<string, unknown>, users),
  );
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list;
}

export async function resolveModerationReport(input: {
  reportId: string;
  status: "reviewed" | "dismissed";
  reviewNote?: string;
}): Promise<void> {
  const auth = getAngelsCareAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Sessão expirada. Faça login de novo.");

  await updateDoc(doc(getAngelsCareDb(), "moderation_reports", input.reportId), {
    status: input.status,
    reviewedAt: serverTimestamp(),
    reviewedByEmail: (user.email ?? "").toLowerCase(),
    reviewedByUid: user.uid,
    reviewNote: (input.reviewNote ?? "").trim(),
  });
}

export type ConnectionChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isSystem: boolean;
  isDeleted: boolean;
  isEdited: boolean;
};

export function isSeedConnectionId(connectionId: string): boolean {
  return !connectionId || connectionId.startsWith("seed_conn_");
}

/** Auditoria LGPD: registra que o admin abriu a conversa desta denúncia. */
export async function logConversationView(reportId: string): Promise<void> {
  const auth = getAngelsCareAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Sessão expirada. Faça login de novo.");

  await updateDoc(doc(getAngelsCareDb(), "moderation_reports", reportId), {
    conversationViewedAt: serverTimestamp(),
    conversationViewedByEmail: (user.email ?? "").toLowerCase(),
    conversationViewedByUid: user.uid,
  });
}

/**
 * Histórico só-leitura do matching ligado à denúncia.
 * Uso exclusivo admin, após confirmação de finalidade no UI.
 */
export async function loadConnectionMessages(
  connectionId: string,
  limitCount = 200,
): Promise<ConnectionChatMessage[]> {
  if (isSeedConnectionId(connectionId)) {
    return [];
  }

  const db = getAngelsCareDb();
  const col = collection(db, "connections", connectionId, "messages");

  let docs;
  try {
    const snap = await getDocs(
      query(col, orderBy("timestamp", "asc"), limit(limitCount)),
    );
    docs = snap.docs;
  } catch {
    const snap = await getDocs(query(col, limit(limitCount)));
    docs = [...snap.docs].sort((a, b) => {
      const aT = tsToIso((a.data() as Record<string, unknown>).timestamp);
      const bT = tsToIso((b.data() as Record<string, unknown>).timestamp);
      return aT.localeCompare(bT);
    });
  }

  return docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      senderId: String(data.senderId ?? ""),
      receiverId: String(data.receiverId ?? ""),
      text: String(data.text ?? ""),
      timestamp: tsToIso(data.timestamp),
      isSystem: data.isSystem === true,
      isDeleted: data.isDeleted === true,
      isEdited: data.isEdited === true,
    };
  });
}

export type ReportsDashMetrics = {
  total: number;
  open: number;
  reviewed: number;
  dismissed: number;
};

export function reportsMetricsFromRows(
  rows: ModerationReport[],
): ReportsDashMetrics {
  let open = 0;
  let reviewed = 0;
  let dismissed = 0;
  for (const r of rows) {
    if (r.status === "open") open += 1;
    else if (r.status === "reviewed") reviewed += 1;
    else if (r.status === "dismissed") dismissed += 1;
  }
  return { total: rows.length, open, reviewed, dismissed };
}

export function formatReportDt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}
