import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";
import type {
  SupportMessage,
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from "@/data/bkf/support-tickets";

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

function asStatus(raw: unknown): TicketStatus {
  const s = String(raw ?? "open");
  if (s === "pending" || s === "assigned" || s === "resolved" || s === "open") {
    return s;
  }
  return "open";
}

function asPriority(raw: unknown): TicketPriority {
  const p = String(raw ?? "normal");
  if (p === "low" || p === "high" || p === "urgent" || p === "normal") {
    return p;
  }
  return "normal";
}

export function mapThreadDoc(
  id: string,
  data: Record<string, unknown>,
): SupportTicket {
  const preview = String(data.lastMessageText ?? "").trim();
  return {
    id,
    appId: String(data.appId ?? "angels_care"),
    userId: String(data.userId ?? id),
    userName: String(data.userName ?? "Usuário"),
    userEmail: String(data.userEmail ?? ""),
    subject: preview || "Atendimento suporte",
    status: asStatus(data.status),
    priority: asPriority(data.priority),
    assigneeEmail:
      data.assigneeEmail == null || data.assigneeEmail === ""
        ? null
        : String(data.assigneeEmail),
    unreadForStaff: Number(data.unreadForStaff ?? 0) || 0,
    createdAt: tsToIso(data.createdAt),
    lastMessageAt: tsToIso(data.lastMessageAt ?? data.updatedAt ?? data.createdAt),
    messages: [],
  };
}

export function mapMessageDoc(
  id: string,
  data: Record<string, unknown>,
  userName: string,
): SupportMessage {
  const senderType = String(data.senderType ?? "");
  const isStaff =
    senderType === "staff" ||
    String(data.senderId) === "__support__" ||
    data.isSystem === true;
  return {
    id,
    sender: isStaff ? "staff" : "user",
    senderName: isStaff
      ? String(data.senderName ?? "Suporte")
      : userName || "Usuário",
    text: String(data.text ?? ""),
    createdAt: tsToIso(data.timestamp),
    isEdited: data.isEdited === true,
    isDeleted: data.isDeleted === true,
  };
}

export function watchSupportThreads(
  appId: string,
  onChange: (tickets: SupportTicket[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getAngelsCareDb();
  const q = query(
    collection(db, "support_threads"),
    orderBy("lastMessageAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const tickets = snap.docs
        .map((d) => mapThreadDoc(d.id, d.data() as Record<string, unknown>))
        .filter((t) => t.appId === appId);
      onChange(tickets);
    },
    (err) => onError?.(err),
  );
}

export function watchThreadMessages(
  threadId: string,
  userName: string,
  onChange: (messages: SupportMessage[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getAngelsCareDb();
  const q = query(
    collection(db, "support_threads", threadId, "messages"),
    orderBy("timestamp", "asc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) =>
          mapMessageDoc(d.id, d.data() as Record<string, unknown>, userName),
        ),
      );
    },
    (err) => onError?.(err),
  );
}

export async function updateThreadMeta(
  threadId: string,
  patch: Partial<{
    status: TicketStatus;
    priority: TicketPriority;
    assigneeEmail: string | null;
    unreadForStaff: number;
  }>,
): Promise<void> {
  const db = getAngelsCareDb();
  await updateDoc(doc(db, "support_threads", threadId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function sendStaffReply(params: {
  threadId: string;
  text: string;
  operatorEmail: string;
  operatorName?: string;
}): Promise<void> {
  const auth = getAngelsCareAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sessão Firebase expirada. Faça login de novo.");

  const trimmed = params.text.trim();
  if (!trimmed) return;

  const senderName = params.operatorName?.trim();
  if (!senderName) {
    throw new Error(
      "Defina seu nome de atendimento em Equipe antes de responder.",
    );
  }

  const db = getAngelsCareDb();
  const threadRef = doc(db, "support_threads", params.threadId);
  const messagesRef = collection(threadRef, "messages");

  await addDoc(messagesRef, {
    senderId: uid,
    senderType: "staff",
    senderName,
    text: trimmed,
    timestamp: serverTimestamp(),
    isRead: true,
    isSystem: false,
    isDeleted: false,
    isEdited: false,
  });

  await updateDoc(threadRef, {
    status: "assigned",
    assigneeEmail: params.operatorEmail,
    lastMessageAt: serverTimestamp(),
    lastMessageText: trimmed,
    unreadForStaff: 0,
    updatedAt: serverTimestamp(),
  });
}

export async function editStaffMessage(params: {
  threadId: string;
  messageId: string;
  text: string;
}): Promise<void> {
  const trimmed = params.text.trim();
  if (!trimmed) throw new Error("A mensagem não pode ficar vazia.");
  const db = getAngelsCareDb();
  await updateDoc(
    doc(db, "support_threads", params.threadId, "messages", params.messageId),
    {
      text: trimmed,
      isEdited: true,
      editedAt: serverTimestamp(),
    },
  );
}

export async function deleteStaffMessage(params: {
  threadId: string;
  messageId: string;
}): Promise<void> {
  const db = getAngelsCareDb();
  await updateDoc(
    doc(db, "support_threads", params.threadId, "messages", params.messageId),
    {
      isDeleted: true,
      text: "",
      deletedAt: serverTimestamp(),
    },
  );
}
