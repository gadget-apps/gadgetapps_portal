import { httpsCallable } from "firebase/functions";
import { getAngelsCareFunctions } from "@/lib/firebase/angels-care";

export const BKF_PREMIUM_PRODUCTS = [
  {
    productId: "premium_mensal_v1",
    planType: "monthly",
    label: "Plano Premium Mensal",
    accessDays: 30,
  },
  {
    productId: "premium_anual_v1",
    planType: "annual",
    label: "Plano Premium Anual",
    accessDays: 365,
  },
  {
    productId: "creditos_5_v1",
    planType: "pass_5",
    label: "Passe 5 dias",
    accessDays: 5,
  },
  {
    productId: "creditos_15_v1",
    planType: "pass_15",
    label: "Passe 15 dias",
    accessDays: 15,
  },
  {
    productId: "creditos_25_v1",
    planType: "pass_25",
    label: "Passe 25 dias",
    accessDays: 25,
  },
] as const;

export type BkfPremiumKind = "support" | "bonus";

export type SetBkfAdminPremiumResult = {
  success: boolean;
  active?: boolean;
  reason?: string;
  planType?: string | null;
  productId?: string | null;
  premiumUntil?: string | null;
  premiumStartAt?: string | null;
};

function callableErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    const msg = String((err as { message?: string }).message ?? "");
    if (code.includes("permission-denied")) {
      return "Apenas o admin BKF pode alterar Premium.";
    }
    if (code.includes("not-found")) return "Usuário não encontrado.";
    if (code.includes("invalid-argument")) {
      return msg.replace(/^Firebase:\s*/i, "") || "Dados inválidos.";
    }
    if (msg) return msg;
  }
  return err instanceof Error ? err.message : "Falha ao atualizar Premium.";
}

export function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function grantBkfAdminPremium(input: {
  targetUserId: string;
  productId: string;
  startDate: string;
  endDate: string;
  reason: string;
  kind: BkfPremiumKind;
  forceOverwrite?: boolean;
}): Promise<SetBkfAdminPremiumResult> {
  const fn = httpsCallable(getAngelsCareFunctions(), "setBkfAdminPremium");
  try {
    const res = await fn({
      action: "grant",
      targetUserId: input.targetUserId,
      productId: input.productId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
      kind: input.kind,
      forceOverwrite: input.forceOverwrite === true,
    });
    return (res.data || {}) as SetBkfAdminPremiumResult;
  } catch (err) {
    throw new Error(callableErrorMessage(err));
  }
}

export async function revokeBkfAdminPremium(input: {
  targetUserId: string;
  reason: string;
  kind?: BkfPremiumKind;
  forceOverwrite?: boolean;
}): Promise<SetBkfAdminPremiumResult> {
  const fn = httpsCallable(getAngelsCareFunctions(), "setBkfAdminPremium");
  try {
    const res = await fn({
      action: "revoke",
      targetUserId: input.targetUserId,
      reason: input.reason,
      kind: input.kind ?? "support",
      forceOverwrite: input.forceOverwrite === true,
    });
    return (res.data || {}) as SetBkfAdminPremiumResult;
  } catch (err) {
    throw new Error(callableErrorMessage(err));
  }
}
