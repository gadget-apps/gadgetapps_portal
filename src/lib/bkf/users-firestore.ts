import {
  collection,
  doc,
  deleteField,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";
import type { BkfUser } from "@/data/bkf/mock-users";

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
    accountDisabled: disabled,
    lastActiveAt: lastActive,
    createdAt: tsToIso(data.createdAt).slice(0, 10) || "",
  };
}

export function watchAppUsers(
  onChange: (users: BkfUser[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getAngelsCareDb(), "users"),
    (snap) => {
      const list = snap.docs.map((d) =>
        mapUserDoc(d.id, d.data() as Record<string, unknown>),
      );
      list.sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
      onChange(list);
    },
    (err) => onError?.(err),
  );
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
