import {
  collection,
  doc,
  deleteField,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";
import type { BkfUser } from "@/data/bkf/mock-users";

const PAGE_SIZE = 80;

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

function mapRole(raw: unknown): BkfUser["userRole"] {
  const role = String(raw ?? "").trim();
  if (role === "Contratante") return "Contratante";
  if (role === "Assistido") return "Assistido";
  if (role === "Cuidador" || role.toLowerCase().includes("cuidador")) {
    return "Cuidador (Profissional)";
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

  return {
    id,
    displayName: String(data.name ?? "Usuário"),
    email: String(data.email ?? ""),
    phone: data.phone ? String(data.phone) : undefined,
    userRole: mapRole(data.userRole),
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
 * Carrega usuários em lote (sem listener pesado na coleção inteira).
 * Sem índice: fallback para get sem orderBy.
 */
export async function loadAppUsers(): Promise<BkfUser[]> {
  const db = getAngelsCareDb();
  const col = collection(db, "users");

  try {
    const snap = await getDocs(
      query(col, orderBy("name"), limit(PAGE_SIZE)),
    );
    return snap.docs.map((d) =>
      mapUserDoc(d.id, d.data() as Record<string, unknown>),
    );
  } catch {
    const snap = await getDocs(query(col, limit(PAGE_SIZE)));
    const list = snap.docs.map((d) =>
      mapUserDoc(d.id, d.data() as Record<string, unknown>),
    );
    list.sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
    return list;
  }
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
