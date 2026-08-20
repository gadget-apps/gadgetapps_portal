import {
  collection,
  doc,
  deleteField,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  getAngelsCareAuth,
  getAngelsCareDb,
  getAngelsCareFunctions,
} from "@/lib/firebase/angels-care";
import type { BkfUser } from "@/data/bkf/mock-users";

/** Lotes ao paginar a coleção users (sem teto artificial de listagem). */
const BATCH_SIZE = 300;

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

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function mapRole(raw: unknown): BkfUser["userRole"] {
  const role = String(raw ?? "").trim();
  if (role === "Contratante") return "Contratante";
  if (role === "Assistido") return "Assistido";
  if (
    role === "Cuidador" ||
    role.toLowerCase().includes("cuidador") ||
    role.toLowerCase() === "profissional"
  ) {
    return "Profissional";
  }
  return "Contratante";
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

export function mapUserDoc(
  id: string,
  data: Record<string, unknown>,
): BkfUser {
  const disabled =
    data.disabledByAdmin === true ||
    data.accountDisabled === true ||
    data.isDisabled === true ||
    data.status === "disabled" ||
    data.isDeleted === true;

  const premiumUntil = tsToIso(data.premiumUntil);
  const lastActive =
    tsToIso(data.lastTokenUpdate) ||
    tsToIso(data.entitlementUpdatedAt) ||
    tsToIso(data.createdAt) ||
    new Date().toISOString();

  const email = firstNonEmptyString(
    data.email,
    data.normalizedEmail,
    data.mail,
  );
  const storedName = firstNonEmptyString(
    data.name,
    data.fullName,
    data.displayName,
  );
  const userRole = mapRole(data.userRole);

  return {
    id,
    displayName: storedName || email || "Usuário",
    email,
    phone: data.phone ? String(data.phone) : undefined,
    userRole,
    isPremium: isPremiumEffective(data),
    premiumUntil: premiumUntil ? premiumUntil.slice(0, 10) : undefined,
    premiumProductId: data.premiumProductId
      ? String(data.premiumProductId)
      : undefined,
    premiumPlanType: data.premiumPlanType
      ? String(data.premiumPlanType)
      : undefined,
    premiumSource: data.premiumSource ? String(data.premiumSource) : undefined,
    accountDisabled: disabled,
    lastActiveAt: lastActive,
    createdAt: tsToIso(data.createdAt).slice(0, 10) || "",
  };
}

/**
 * Lê a coleção users paginada (sem teto artificial).
 */
async function fetchAllUserDocs(): Promise<BkfUser[]> {
  const db = getAngelsCareDb();
  const col = collection(db, "users");
  const list: BkfUser[] = [];
  let cursor: QueryDocumentSnapshot | null = null;

  for (;;) {
    const q: Query = cursor
      ? query(
          col,
          orderBy(documentId()),
          startAfter(cursor),
          limit(BATCH_SIZE),
        )
      : query(col, orderBy(documentId()), limit(BATCH_SIZE));

    const snap = await getDocs(q);
    for (const d of snap.docs) {
      list.push(mapUserDoc(d.id, d.data() as Record<string, unknown>));
    }
    if (snap.size < BATCH_SIZE) break;
    cursor = snap.docs[snap.docs.length - 1] ?? null;
    if (!cursor) break;
  }

  list.sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
  return list;
}

/**
 * Completa e-mails ausentes no Firestore a partir do Firebase Auth (admin BKF).
 */
export async function syncUserEmailsFromAuth(): Promise<{
  updated: number;
}> {
  const fn = httpsCallable(getAngelsCareFunctions(), "syncUserEmailsFromAuth");
  const res = await fn({});
  const data = (res.data ?? {}) as { updated?: number };
  return { updated: Number(data.updated ?? 0) };
}

/**
 * Carrega **todos** os usuários.
 * Se algum perfil estiver sem e-mail (comum vs Auth), sincroniza Auth → Firestore
 * e recarrega — por isso contratante@gmail.com passa a aparecer.
 */
export async function loadAppUsers(): Promise<BkfUser[]> {
  let list = await fetchAllUserDocs();
  const missingEmail = list.some((u) => !u.email);
  if (!missingEmail) return list;

  try {
    const { updated } = await syncUserEmailsFromAuth();
    if (updated > 0) {
      list = await fetchAllUserDocs();
    }
  } catch {
    // Operador sem permissão ou Function indisponível — mantém lista parcial.
  }

  return list;
}

export async function setUserDisabledByAdmin(
  userId: string,
  disabled: boolean,
): Promise<void> {
  const auth = getAngelsCareAuth();
  const operator = auth.currentUser;
  if (!operator) throw new Error("Sessão expirada. Faça login de novo.");

  const ref = doc(getAngelsCareDb(), "users", userId);
  if (disabled) {
    await updateDoc(ref, {
      accountDisabled: true,
      isDisabled: true,
      status: "disabled",
      disabledAt: serverTimestamp(),
      disabledByAdmin: true,
      disabledByEmail: (operator.email ?? "").toLowerCase(),
      disabledReason: "Desativado pelo BKF",
    });
  } else {
    await updateDoc(ref, {
      accountDisabled: false,
      isDisabled: false,
      status: deleteField(),
      disabledAt: deleteField(),
      disabledByAdmin: false,
      disabledByEmail: deleteField(),
      disabledReason: deleteField(),
    });
  }
}
