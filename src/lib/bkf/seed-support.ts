import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";

const FIRST_NAMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Elena",
  "Fábio",
  "Gisele",
  "Hugo",
  "Iris",
  "João",
  "Karina",
  "Lucas",
  "Marina",
  "Nicolas",
  "Olívia",
  "Paulo",
  "Queila",
  "Rafael",
  "Sofia",
  "Tiago",
];

const LAST_NAMES = [
  "Silva",
  "Santos",
  "Oliveira",
  "Souza",
  "Lima",
  "Costa",
  "Almeida",
  "Ferreira",
  "Rocha",
  "Martins",
];

const SUBJECTS = [
  "Premium não liberou após compra",
  "Erro ao enviar mensagem no chat",
  "Dúvida sobre Zona Segura",
  "Não consigo concluir o cadastro",
  "Problema com localização em tempo real",
  "Assinatura cobrada em duplicidade",
  "App fecha ao abrir a agenda",
  "Preciso reativar minha conta",
  "Como convidar um cuidador?",
  "Alerta de queda disparou sem motivo",
];

const USER_LINES = [
  "Olá, preciso de ajuda com isso.",
  "Já tentei reiniciar o app e continua igual.",
  "Pode me orientar o que fazer agora?",
  "Aconteceu hoje pela manhã.",
  "Segue o detalhe do que aparece na tela.",
];

const STATUSES = ["open", "assigned", "pending", "resolved"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}

function minutesAgo(mins: number): Timestamp {
  return Timestamp.fromDate(new Date(Date.now() - mins * 60_000));
}

// Cria tickets sintéticos (isSeed: true); não são conversas reais de usuários.
// Creates synthetic tickets (isSeed: true); these are not real user conversations.
export async function seedSupportTickets(count = 25): Promise<number> {
  const auth = getAngelsCareAuth();
  if (!auth.currentUser) throw new Error("Faça login no BKF.");

  const db = getAngelsCareDb();
  const stamp = Date.now();
  let created = 0;

  const batchSize = 20;
  for (let offset = 0; offset < count; offset += batchSize) {
    const batch = writeBatch(db);
    const slice = Math.min(batchSize, count - offset);

    for (let i = 0; i < slice; i++) {
      const n = offset + i;
      const first = pick(FIRST_NAMES, n);
      const last = pick(LAST_NAMES, n * 3);
      const name = `${first} ${last}`;
      const email = `seed.${stamp}.${n}@teste.local`;
      const threadId = `seed_${stamp}_${n}`;
      const subject = pick(SUBJECTS, n);
      const status = pick(STATUSES, n);
      const priority = pick(PRIORITIES, n + 1);
      const unread = status === "open" || status === "pending" ? (n % 3) + 1 : 0;
      const lastAt = minutesAgo(n * 7 + 3);

      const threadRef = doc(db, "support_threads", threadId);
      batch.set(threadRef, {
        userId: threadId,
        userName: name,
        userEmail: email,
        appId: "angels_care",
        status,
        priority,
        assigneeEmail:
          status === "open" ? null : "gadget.apps.technology@gmail.com",
        unreadForStaff: unread,
        createdAt: minutesAgo(n * 17 + 40),
        updatedAt: lastAt,
        lastMessageAt: lastAt,
        lastMessageText: subject,
        isSeed: true,
        seedBatch: String(stamp),
      });

      const welcomeRef = doc(collection(threadRef, "messages"));
      batch.set(welcomeRef, {
        senderId: "__support__",
        senderType: "staff",
        senderName: "Fila",
        text: "Olá! Você entrou na fila de suporte Angel's Care. Em breve um atendente vai se apresentar e ajudar por aqui.",
        timestamp: minutesAgo(n * 17 + 39),
        isRead: true,
        isSystem: true,
        isDeleted: false,
        isEdited: false,
      });

      const userMsgRef = doc(collection(threadRef, "messages"));
      batch.set(userMsgRef, {
        senderId: threadId,
        senderType: "user",
        senderName: name,
        text: `${subject}. ${pick(USER_LINES, n)}`,
        timestamp: minutesAgo(n * 17 + 30),
        isRead: false,
        isSystem: false,
        isDeleted: false,
        isEdited: false,
      });

      if (status !== "open") {
        const staffMsgRef = doc(collection(threadRef, "messages"));
        batch.set(staffMsgRef, {
          senderId: auth.currentUser.uid,
          senderType: "staff",
          senderName: "Atendente Teste",
          text: "Olá! Já estou verificando o seu caso e retorno em seguida.",
          timestamp: minutesAgo(n * 17 + 20),
          isRead: true,
          isSystem: false,
          isDeleted: false,
          isEdited: false,
        });
      }

      created += 1;
    }

    await batch.commit();
  }

  return created;
}

export async function clearSeedSupportTickets(): Promise<number> {
  const auth = getAngelsCareAuth();
  if (!auth.currentUser) throw new Error("Faça login no BKF.");

  const db = getAngelsCareDb();
  const snap = await getDocs(
    query(collection(db, "support_threads"), where("isSeed", "==", true)),
  );

  let removed = 0;
  for (const thread of snap.docs) {
    const messages = await getDocs(collection(thread.ref, "messages"));
    let batch = writeBatch(db);
    let ops = 0;
    for (const msg of messages.docs) {
      batch.delete(msg.ref);
      ops += 1;
      if (ops >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
    batch.delete(thread.ref);
    await batch.commit();
    removed += 1;
  }

  return removed;
}

export async function touchSeedMarker(batchId: string): Promise<void> {
  const db = getAngelsCareDb();
  await setDoc(
    doc(db, "bkf_seed_meta", "support"),
    {
      lastBatch: batchId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
