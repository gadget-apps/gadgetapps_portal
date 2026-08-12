import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";

/** Único e-mail que pode virar o 1º admin sem convite (bootstrap). */
export const BKF_BOOTSTRAP_EMAIL = "gadget.apps.technology@gmail.com";

export const BKF_SESSION_KEY = "gat_intranet_demo";
const SESSION_TTL_MS = 15 * 60 * 1000;

export type BkfOperator = {
  uid: string;
  email: string;
  displayName: string;
  active: boolean;
  createdAt: string;
};

export type BkfInvite = {
  email: string;
  status: "pending" | "accepted" | "revoked";
  invitedByEmail: string;
  createdAt: string;
};

type BkfSession = {
  email: string;
  uid: string;
  okAt: number;
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
  return new Date().toISOString();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBootstrapEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email ?? "") === BKF_BOOTSTRAP_EMAIL;
}

export function readBkfSession(): BkfSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BKF_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BkfSession>;
    if (!parsed.uid || !parsed.email) return null;
    return {
      email: String(parsed.email),
      uid: String(parsed.uid),
      okAt: Number(parsed.okAt ?? 0),
    };
  } catch {
    return null;
  }
}

export function writeBkfSession(email: string, uid: string): void {
  sessionStorage.setItem(
    BKF_SESSION_KEY,
    JSON.stringify({
      email: normalizeEmail(email),
      uid,
      okAt: Date.now(),
    } satisfies BkfSession),
  );
}

export function clearBkfSession(): void {
  sessionStorage.removeItem(BKF_SESSION_KEY);
}

/** Gate rápido: cache de sessão → senão 1 leitura Firestore (sem write). */
export async function ensureBkfSession(
  user: User,
): Promise<{ ok: true; email: string } | { ok: false; reason: string }> {
  const email = normalizeEmail(user.email ?? "");
  if (!email) {
    return { ok: false, reason: "Sessão sem e-mail." };
  }

  const cached = readBkfSession();
  if (
    cached &&
    cached.uid === user.uid &&
    Date.now() - cached.okAt < SESSION_TTL_MS
  ) {
    return { ok: true, email: cached.email };
  }

  const allowed = await hasBkfOperatorAccess(user.uid);
  if (allowed) {
    writeBkfSession(email, user.uid);
    return { ok: true, email };
  }

  const claim = await claimBkfAccess({ uid: user.uid, email });
  if (!claim.ok) return claim;
  writeBkfSession(email, user.uid);
  return { ok: true, email };
}

/** Após Auth: vira operador se bootstrap, convite pendente ou já era operador. */
export async function claimBkfAccess(params: {
  uid: string;
  email: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const email = normalizeEmail(params.email);
  const db = getAngelsCareDb();
  const opRef = doc(db, "bkf_operators", params.uid);
  const existing = await getDoc(opRef);

  if (existing.exists()) {
    const data = existing.data();
    if (data.active === false) {
      return { ok: false, reason: "Seu acesso ao BKF foi desativado." };
    }
    // Sem write a cada login — só valida.
    return { ok: true };
  }

  const inviteRef = doc(db, "bkf_invites", email);
  const inviteSnap = await getDoc(inviteRef);
  const invited =
    inviteSnap.exists() && inviteSnap.data()?.status === "pending";
  const bootstrap = isBootstrapEmail(email);

  if (!invited && !bootstrap) {
    return {
      ok: false,
      reason:
        "Sem convite ativo. Peça a um administrador do BKF para te convidar.",
    };
  }

  await setDoc(opRef, {
    email,
    displayName: "",
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (invited) {
    await updateDoc(inviteRef, {
      status: "accepted",
      acceptedAt: serverTimestamp(),
      acceptedUid: params.uid,
    });
  }

  return { ok: true };
}

export async function hasBkfOperatorAccess(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(getAngelsCareDb(), "bkf_operators", uid));
  return snap.exists() && snap.data()?.active !== false;
}

export async function getOperatorProfile(uid: string): Promise<{
  email: string;
  displayName: string;
  hasPersonalizedName: boolean;
} | null> {
  const snap = await getDoc(doc(getAngelsCareDb(), "bkf_operators", uid));
  if (!snap.exists() || snap.data()?.active === false) return null;
  const data = snap.data();
  const email = String(data.email ?? "");
  const displayName = String(data.displayName ?? "").trim();
  return {
    email,
    displayName,
    hasPersonalizedName: isPersonalizedDisplayName(displayName, email),
  };
}

/** Nome escolhido pelo atendente — nunca o trecho do e-mail. */
export function isPersonalizedDisplayName(
  displayName: string | null | undefined,
  email?: string | null,
): boolean {
  const name = (displayName ?? "").trim();
  if (name.length < 2) return false;
  const local = (email ?? "").split("@")[0]?.trim().toLowerCase() ?? "";
  if (local && name.toLowerCase() === local) return false;
  if (name.includes("@")) return false;
  return true;
}

export async function updateMyDisplayName(displayName: string): Promise<void> {
  const auth = getAngelsCareAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sessão inválida.");
  const name = displayName.trim();
  if (name.length < 2) {
    throw new Error("Informe o nome que deve aparecer no atendimento.");
  }
  if (name.includes("@")) {
    throw new Error("Use seu nome (ex.: Márcio), não o e-mail.");
  }
  const email = (auth.currentUser?.email ?? "").toLowerCase();
  if (!isPersonalizedDisplayName(name, email)) {
    throw new Error(
      "Escolha um nome de atendimento (ex.: Márcio). Não use o trecho do e-mail.",
    );
  }
  await updateDoc(doc(getAngelsCareDb(), "bkf_operators", uid), {
    displayName: name,
    updatedAt: serverTimestamp(),
  });
}

/** Saudação automática ao iniciar atendimento. */
export function buildAttendanceGreeting(attendantName: string): string {
  const name = attendantName.trim();
  if (!isPersonalizedDisplayName(name)) {
    throw new Error("Defina seu nome de atendimento antes de iniciar.");
  }
  return (
    `Olá! Meu nome é ${name} e realizarei o seu atendimento. ` +
    `Como posso ajudá-lo?`
  );
}

export async function createInvite(emailRaw: string): Promise<void> {
  const auth = getAngelsCareAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Sessão inválida.");
  if (!isBootstrapEmail(user.email)) {
    throw new Error("Somente o administrador pode convidar colaboradores.");
  }

  const email = normalizeEmail(emailRaw);
  if (!email.includes("@")) throw new Error("E-mail inválido.");

  const db = getAngelsCareDb();
  await setDoc(doc(db, "bkf_invites", email), {
    email,
    status: "pending",
    invitedByEmail: normalizeEmail(user.email),
    invitedByUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function revokeInvite(emailRaw: string): Promise<void> {
  const auth = getAngelsCareAuth();
  if (!isBootstrapEmail(auth.currentUser?.email)) {
    throw new Error("Somente o administrador pode revogar convites.");
  }
  const email = normalizeEmail(emailRaw);
  await updateDoc(doc(getAngelsCareDb(), "bkf_invites", email), {
    status: "revoked",
    updatedAt: serverTimestamp(),
  });
}

export async function setOperatorActive(
  uid: string,
  active: boolean,
): Promise<void> {
  const auth = getAngelsCareAuth();
  if (!isBootstrapEmail(auth.currentUser?.email)) {
    throw new Error("Somente o administrador pode ativar ou desativar operadores.");
  }
  await updateDoc(doc(getAngelsCareDb(), "bkf_operators", uid), {
    active,
    updatedAt: serverTimestamp(),
  });
}

export function watchOperators(
  onChange: (ops: BkfOperator[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const auth = getAngelsCareAuth();
  const user = auth.currentUser;
  if (!user) {
    onChange([]);
    return () => undefined;
  }

  // Admin: lista completa. Demais: só o próprio documento (regra Firestore).
  if (!isBootstrapEmail(user.email)) {
    return onSnapshot(
      doc(getAngelsCareDb(), "bkf_operators", user.uid),
      (snap) => {
        if (!snap.exists()) {
          onChange([]);
          return;
        }
        const data = snap.data();
        onChange([
          {
            uid: snap.id,
            email: String(data.email ?? user.email ?? ""),
            displayName: String(data.displayName ?? ""),
            active: data.active !== false,
            createdAt: tsToIso(data.createdAt),
          },
        ]);
      },
      (err) => onError?.(err),
    );
  }

  return onSnapshot(
    collection(getAngelsCareDb(), "bkf_operators"),
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          email: String(data.email ?? ""),
          displayName: String(data.displayName ?? ""),
          active: data.active !== false,
          createdAt: tsToIso(data.createdAt),
        };
      });
      list.sort((a, b) => a.email.localeCompare(b.email));
      onChange(list);
    },
    (err) => onError?.(err),
  );
}

export function watchInvites(
  onChange: (invites: BkfInvite[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getAngelsCareDb(), "bkf_invites"),
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          email: String(data.email ?? d.id),
          status: (data.status as BkfInvite["status"]) ?? "pending",
          invitedByEmail: String(data.invitedByEmail ?? ""),
          createdAt: tsToIso(data.createdAt),
        };
      });
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      onChange(list);
    },
    (err) => onError?.(err),
  );
}

/** Lista convites (fallback one-shot). */
export async function listPendingInvites(): Promise<BkfInvite[]> {
  const snap = await getDocs(collection(getAngelsCareDb(), "bkf_invites"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        email: String(data.email ?? d.id),
        status: (data.status as BkfInvite["status"]) ?? "pending",
        invitedByEmail: String(data.invitedByEmail ?? ""),
        createdAt: tsToIso(data.createdAt),
      };
    })
    .filter((i) => i.status === "pending");
}
