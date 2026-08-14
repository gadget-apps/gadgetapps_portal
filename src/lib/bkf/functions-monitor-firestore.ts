import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { getAngelsCareDb } from "@/lib/firebase/angels-care";

const PAGE_SIZE = 100;

export type FunctionFailure = {
  id: string;
  createdAt: string;
  functionName: string;
  triggerType: string;
  severity: string;
  phase: string;
  code: string;
  message: string;
  stack: string | null;
  uid: string | null;
  context: Record<string, unknown>;
};

export type FunctionFailureMetrics = {
  total: number;
  errors: number;
  warnings: number;
  callable: number;
  schedule: number;
  firestore: number;
  https: number;
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

function mapRow(id: string, data: Record<string, unknown>): FunctionFailure {
  const ctx =
    data.context && typeof data.context === "object"
      ? (data.context as Record<string, unknown>)
      : {};
  return {
    id,
    createdAt: tsToIso(data.createdAt),
    functionName: String(data.functionName ?? ""),
    triggerType: String(data.triggerType ?? ""),
    severity: String(data.severity ?? "error"),
    phase: String(data.phase ?? ""),
    code: String(data.code ?? ""),
    message: String(data.message ?? ""),
    stack: data.stack ? String(data.stack) : null,
    uid: data.uid ? String(data.uid) : null,
    context: ctx,
  };
}

export async function loadFunctionFailures(): Promise<FunctionFailure[]> {
  const db = getAngelsCareDb();
  const col = collection(db, "cloud_function_failures");
  try {
    const snap = await getDocs(
      query(col, orderBy("createdAt", "desc"), limit(PAGE_SIZE)),
    );
    return snap.docs.map((d) =>
      mapRow(d.id, d.data() as Record<string, unknown>),
    );
  } catch {
    const snap = await getDocs(query(col, limit(PAGE_SIZE)));
    const list = snap.docs.map((d) =>
      mapRow(d.id, d.data() as Record<string, unknown>),
    );
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }
}

export function functionFailureMetrics(
  rows: FunctionFailure[],
): FunctionFailureMetrics {
  const m: FunctionFailureMetrics = {
    total: rows.length,
    errors: 0,
    warnings: 0,
    callable: 0,
    schedule: 0,
    firestore: 0,
    https: 0,
  };
  for (const r of rows) {
    if (r.severity === "warning") m.warnings += 1;
    else m.errors += 1;
    if (r.triggerType === "callable") m.callable += 1;
    else if (r.triggerType === "schedule") m.schedule += 1;
    else if (r.triggerType === "firestore") m.firestore += 1;
    else if (r.triggerType === "https") m.https += 1;
  }
  return m;
}

export function formatFailureDt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleString("pt-BR");
}

export function triggerTypeLabel(t: string): string {
  switch (t) {
    case "callable":
      return "Callable";
    case "schedule":
      return "Agendada";
    case "firestore":
      return "Firestore";
    case "https":
      return "HTTP";
    default:
      return t || "—";
  }
}
