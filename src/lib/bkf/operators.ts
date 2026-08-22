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
import { markLoginFieldsMustWipe } from "@/lib/bkf/login-fields";

// Só para seed do 1º admin (sem convite) e backfill de role legado. Acesso no dia a dia = role no doc bkf_operators, não este e-mail.
// Only for seeding the first admin (no invite) and legacy role backfill. Day-to-day access = role on the bkf_operators doc, not this email.
export const BKF_BOOTSTRAP_EMAIL = "gadget.apps.technology@gmail.com";

export const BKF_SESSION_KEY = "gat_intranet_demo";
const SESSION_TTL_MS = 15 * 60 * 1000;

export type BkfRole = "admin" | "operator";

export type BkfOperator = {
  uid: string;
  email: string;
  displayName: string;
  active: boolean;
  role: BkfRole;
  createdAt: string;
};

export type BkfInvite = {
  email: string;
  status: "pending" | "accepted" | "revoked";
  role: BkfRole;
  invitedByEmail: string;
  createdAt: string;
};

type BkfSession = {
  email: string;
  uid: string;
  role: BkfRole;
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

export function parseBkfRole(raw: unknown): BkfRole | null {
  if (raw === "admin" || raw === "operator") return raw;
  return null;
}

export function roleLabel(role: BkfRole): string {
  return role === "admin" ? "Admin" : "Operador";
}

export function isBkfAdminSession(): boolean {
  return readBkfSession()?.role === "admin";
}

export function readBkfSession(): BkfSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BKF_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BkfSession>;
    if (!parsed.uid || !parsed.email) return null;
    const role = parseBkfRole(parsed.role) ?? "operator";
    return {
      email: String(parsed.email),
      uid: String(parsed.uid),
      role,
      okAt: Number(parsed.okAt ?? 0),
    };
  } catch {
    return null;
  }
}

export function writeBkfSession(
  email: string,
  uid: string,
  role: BkfRole,
): void {
  sessionStorage.setItem(
    BKF_SESSION_KEY,
    JSON.stringify({
      email: normalizeEmail(email),
      uid,
      role,
      okAt: Date.now(),
    } satisfies BkfSession),
  );
}

export function clearBkfSession(): void {
  sessionStorage.removeItem(BKF_SESSION_KEY);
  markLoginFieldsMustWipe();
}

function mapOperatorDoc(
  uid: string,
  data: Record<string, unknown>,
  fallbackEmail = "",
): BkfOperator {
  const email = String(data.email ?? fallbackEmail);
  const explicit = parseBkfRole(data.role);
  const role: BkfRole =
    explicit ?? (isBootstrapEmail(email) ? "admin" : "operator");
  return {
    uid,
    email,
    displayName: String(data.displayName ?? ""),
    active: data.active !== false,
    role,
    createdAt: tsToIso(data.createdAt),
  };
}

async function ensureOperatorRoleBackfill(
  uid: string,
  email: string,
  data: Record<string, unknown>,
): Promise<BkfRole> {
  const existing = parseBkfRole(data.role);
  if (existing) return existing;
  const role: BkfRole = isBootstrapEmail(email) ? "admin" : "operator";
  try {
    await updateDoc(doc(getAngelsCareDb(), "bkf_operators", uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Rules podem bloquear a gravação; o role resolvido em memória ainda vale.
    // Rules may block the write; the in-memory resolved role still applies.
  }
  return role;
}

export async function ensureBkfSession(
  user: User,
): Promise<
  | { ok: true; email: string; role: BkfRole }
  | { ok: false; reason: string }
> {
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
    return { ok: true, email: cached.email, role: cached.role };
  }

  const opRef = doc(getAngelsCareDb(), "bkf_operators", user.uid);
  const snap = await getDoc(opRef);
  if (snap.exists()) {
    const data = snap.data() as Record<string, unknown>;
    if (data.active === false) {
      return { ok: false, reason: "Seu acesso ao BKF foi desativado." };
    }
    const role = await ensureOperatorRoleBackfill(user.uid, email, data);
    writeBkfSession(email, user.uid, role);
    return { ok: true, email, role };
  }

  const claim = await claimBkfAccess({ uid: user.uid, email });
  if (!claim.ok) return claim;
  writeBkfSession(email, user.uid, claim.role);
  return { ok: true, email, role: claim.role };
}

export async function claimBkfAccess(params: {
  uid: string;
  email: string;
}): Promise<
  { ok: true; role: BkfRole } | { ok: false; reason: string }
> {
  const email = normalizeEmail(params.email);
  const db = getAngelsCareDb();
  const opRef = doc(db, "bkf_operators", params.uid);
  const existing = await getDoc(opRef);

  if (existing.exists()) {
    const data = existing.data() as Record<string, unknown>;
    if (data.active === false) {
      return { ok: false, reason: "Seu acesso ao BKF foi desativado." };
    }
    const role = await ensureOperatorRoleBackfill(params.uid, email, data);
    return { ok: true, role };
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

  let role: BkfRole = "operator";
  if (invited) {
    role = parseBkfRole(inviteSnap.data()?.role) ?? "operator";
  } else if (bootstrap) {
    role = "admin";
  }

  await setDoc(opRef, {
    email,
    displayName: "",
    active: true,
    role,
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

  return { ok: true, role };
}

export async function hasBkfOperatorAccess(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(getAngelsCareDb(), "bkf_operators", uid));
  return snap.exists() && snap.data()?.active !== false;
}

export async function getMyBkfRole(): Promise<BkfRole | null> {
  const session = readBkfSession();
  if (session?.role) return session.role;
  const uid = getAngelsCareAuth().currentUser?.uid;
  const email = getAngelsCareAuth().currentUser?.email ?? "";
  if (!uid) return null;
  const snap = await getDoc(doc(getAngelsCareDb(), "bkf_operators", uid));
  if (!snap.exists() || snap.data()?.active === false) return null;
  return ensureOperatorRoleBackfill(
    uid,
    normalizeEmail(email),
    snap.data() as Record<string, unknown>,
  );
}

export async function getOperatorProfile(uid: string): Promise<{
  email: string;
  displayName: string;
  hasPersonalizedName: boolean;
  role: BkfRole;
} | null> {
  const snap = await getDoc(doc(getAngelsCareDb(), "bkf_operators", uid));
  if (!snap.exists() || snap.data()?.active === false) return null;
  const data = snap.data() as Record<string, unknown>;
  const email = String(data.email ?? "");
  const displayName = String(data.displayName ?? "").trim();
  const role =
    parseBkfRole(data.role) ??
    (isBootstrapEmail(email) ? "admin" : "operator");
  return {
    email,
    displayName,
    hasPersonalizedName: isPersonalizedDisplayName(displayName, email),
    role,
  };
}

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

async function assertCurrentIsAdmin(): Promise<void> {
  const role = await getMyBkfRole();
  if (role !== "admin") {
    throw new Error("Somente administradores do BKF podem fazer isso.");
  }
}

export async function createInvite(
  emailRaw: string,
  role: BkfRole = "operator",
): Promise<void> {
  const auth = getAngelsCareAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Sessão inválida.");
  await assertCurrentIsAdmin();

  const email = normalizeEmail(emailRaw);
  if (!email.includes("@")) throw new Error("E-mail inválido.");
  if (role !== "admin" && role !== "operator") {
    throw new Error("Perfil inválido. Use Admin ou Operador.");
  }

  const db = getAngelsCareDb();
  await setDoc(doc(db, "bkf_invites", email), {
    email,
    role,
    status: "pending",
    invitedByEmail: normalizeEmail(user.email),
    invitedByUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function revokeInvite(emailRaw: string): Promise<void> {
  await assertCurrentIsAdmin();
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
  await assertCurrentIsAdmin();
  await updateDoc(doc(getAngelsCareDb(), "bkf_operators", uid), {
    active,
    updatedAt: serverTimestamp(),
  });
}

export async function setOperatorRole(
  uid: string,
  role: BkfRole,
): Promise<void> {
  await assertCurrentIsAdmin();
  if (role !== "admin" && role !== "operator") {
    throw new Error("Perfil inválido.");
  }
  const me = getAngelsCareAuth().currentUser?.uid;
  if (me && me === uid && role !== "admin") {
    throw new Error("Você não pode remover o próprio perfil Admin.");
  }
  await updateDoc(doc(getAngelsCareDb(), "bkf_operators", uid), {
    role,
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

  const admin = isBkfAdminSession();

  if (!admin) {
    return onSnapshot(
      doc(getAngelsCareDb(), "bkf_operators", user.uid),
      (snap) => {
        if (!snap.exists()) {
          onChange([]);
          return;
        }
        onChange([
          mapOperatorDoc(
            snap.id,
            snap.data() as Record<string, unknown>,
            user.email ?? "",
          ),
        ]);
      },
      (err) => onError?.(err),
    );
  }

  return onSnapshot(
    collection(getAngelsCareDb(), "bkf_operators"),
    (snap) => {
      const list = snap.docs.map((d) =>
        mapOperatorDoc(d.id, d.data() as Record<string, unknown>),
      );
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
          role: parseBkfRole(data.role) ?? "operator",
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

export async function listPendingInvites(): Promise<BkfInvite[]> {
  const snap = await getDocs(collection(getAngelsCareDb(), "bkf_invites"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        email: String(data.email ?? d.id),
        status: (data.status as BkfInvite["status"]) ?? "pending",
        role: parseBkfRole(data.role) ?? "operator",
        invitedByEmail: String(data.invitedByEmail ?? ""),
        createdAt: tsToIso(data.createdAt),
      };
    })
    .filter((i) => i.status === "pending");
}
