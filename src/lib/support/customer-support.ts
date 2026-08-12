import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";

export type CustomerSupportMessage = {
  id: string;
  sender: "user" | "staff";
  senderName: string;
  text: string;
  createdAt: string;
  isDeleted: boolean;
  isSystem: boolean;
};

export type SupportProductId = "angels_care";

export type SupportSource = "web_portal" | "web_angelscare";

const WELCOME_TEXT =
  "Olá! Você entrou na fila de suporte Angel's Care. Em breve um atendente vai se apresentar e ajudar por aqui.";

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

function displayNameFromUser(user: User, profileName?: string): string {
  const fromProfile = profileName?.trim();
  if (fromProfile) return fromProfile;
  const fromAuth = user.displayName?.trim();
  if (fromAuth) return fromAuth;
  const email = user.email?.trim() ?? "";
  if (email.includes("@")) return email.split("@")[0]!;
  return "Usuário";
}

/** Lê perfil do app e bloqueia conta desativada no BKF. */
export async function assertCustomerAllowed(user: User): Promise<{
  displayName: string;
  email: string;
}> {
  const db = getAngelsCareDb();
  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.exists() ? (snap.data() as Record<string, unknown>) : {};

  if (data.disabledByAdmin === true) {
    await signOut(getAngelsCareAuth());
    throw new Error(
      "Esta conta foi desativada pela equipe Angel's Care. Entre em contato por e-mail.",
    );
  }

  const name = displayNameFromUser(user, String(data.name ?? ""));
  const email = (user.email ?? String(data.email ?? "")).trim().toLowerCase();
  return { displayName: name, email };
}

export function watchCustomerAuth(
  onUser: (user: User | null) => void,
): Unsubscribe {
  return onAuthStateChanged(getAngelsCareAuth(), onUser);
}

export async function signInCustomerEmail(
  email: string,
  password: string,
): Promise<User> {
  const cred = await signInWithEmailAndPassword(
    getAngelsCareAuth(),
    email.trim().toLowerCase(),
    password,
  );
  await assertCustomerAllowed(cred.user);
  return cred.user;
}

export async function signInCustomerGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(getAngelsCareAuth(), provider);
  await assertCustomerAllowed(cred.user);
  return cred.user;
}

export async function signOutCustomer(): Promise<void> {
  await signOut(getAngelsCareAuth());
}

export async function ensureCustomerThread(params: {
  appId: SupportProductId;
  source: SupportSource;
}): Promise<void> {
  const user = getAngelsCareAuth().currentUser;
  if (!user) throw new Error("Faça login com sua conta Angel's Care.");

  const profile = await assertCustomerAllowed(user);
  const db = getAngelsCareDb();
  const threadRef = doc(db, "support_threads", user.uid);
  const snap = await getDoc(threadRef);

  if (!snap.exists()) {
    await setDoc(threadRef, {
      userId: user.uid,
      userName: profile.displayName,
      userEmail: profile.email,
      appId: params.appId,
      status: "open",
      priority: "normal",
      assigneeEmail: null,
      unreadForStaff: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessageText: WELCOME_TEXT,
      source: params.source,
    });

    await addDoc(collection(threadRef, "messages"), {
      senderId: "__support__",
      senderType: "staff",
      senderName: "Fila",
      text: WELCOME_TEXT,
      timestamp: serverTimestamp(),
      isRead: true,
      isSystem: true,
      isDeleted: false,
      isEdited: false,
    });
    return;
  }

  await setDoc(
    threadRef,
    {
      userName: profile.displayName,
      userEmail: profile.email || String(snap.data()?.userEmail ?? ""),
      appId: params.appId,
      source: params.source,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function watchCustomerMessages(
  onChange: (messages: CustomerSupportMessage[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const user = getAngelsCareAuth().currentUser;
  if (!user) {
    onChange([]);
    return () => undefined;
  }

  const db = getAngelsCareDb();
  const q = query(
    collection(db, "support_threads", user.uid, "messages"),
    orderBy("timestamp", "asc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      const userName = user.displayName?.trim() || user.email?.split("@")[0] || "Você";
      const list: CustomerSupportMessage[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const senderType = String(data.senderType ?? "");
        const isStaff =
          senderType === "staff" ||
          String(data.senderId) === "__support__" ||
          data.isSystem === true;
        return {
          id: d.id,
          sender: isStaff ? "staff" : "user",
          senderName: isStaff
            ? String(data.senderName ?? "Suporte")
            : String(data.senderName ?? userName),
          text: String(data.text ?? ""),
          createdAt: tsToIso(data.timestamp),
          isDeleted: data.isDeleted === true,
          isSystem: data.isSystem === true,
        };
      });
      onChange(list);
    },
    (err) => onError?.(err),
  );
}

export async function sendCustomerMessage(text: string): Promise<void> {
  const user = getAngelsCareAuth().currentUser;
  if (!user) throw new Error("Faça login com sua conta Angel's Care.");

  const trimmed = text.trim();
  if (!trimmed) return;

  const profile = await assertCustomerAllowed(user);
  const db = getAngelsCareDb();
  const threadRef = doc(db, "support_threads", user.uid);

  await addDoc(collection(threadRef, "messages"), {
    senderId: user.uid,
    senderType: "user",
    senderName: profile.displayName,
    text: trimmed,
    timestamp: serverTimestamp(),
    isRead: false,
    isSystem: false,
    isDeleted: false,
    isEdited: false,
  });

  await setDoc(
    threadRef,
    {
      status: "open",
      lastMessageAt: serverTimestamp(),
      lastMessageText: trimmed,
      updatedAt: serverTimestamp(),
      unreadForStaff: increment(1),
    },
    { merge: true },
  );
}

export function mapAuthError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";
  const message =
    err instanceof Error ? err.message : "Falha no acesso. Tente de novo.";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos. Use a mesma conta do app Angel's Care.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns minutos.";
    case "auth/popup-closed-by-user":
      return "Login com Google cancelado.";
    case "auth/popup-blocked":
      return "Pop-up bloqueado. Permita pop-ups para este site.";
    case "auth/unauthorized-domain":
      return "Domínio não autorizado no Firebase Authentication.";
    case "auth/network-request-failed":
      return "Falha de rede. Verifique a internet.";
    default:
      if (message.includes("desativada")) return message;
      return code ? `${message} (${code})` : message;
  }
}
