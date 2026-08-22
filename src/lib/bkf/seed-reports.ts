import {
  collection,
  doc,
  getDocs,
  query,
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

const REASONS = [
  "Assédio ou comportamento inadequado",
  "Spam ou golpe",
  "Conteúdo ofensivo",
  "Outro",
] as const;

const DETAILS = [
  "Mensagens repetidas pedindo dados bancários.",
  "Linguagem ofensiva durante a conversa.",
  "Tentativa de contactar fora do app de forma suspeita.",
  "Comportamento inadequado após o matching.",
  "Conteúdo impróprio na conversa.",
  "",
];

const STATUSES = ["open", "open", "open", "reviewed", "dismissed"] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}

function minutesAgo(mins: number): Timestamp {
  return Timestamp.fromDate(new Date(Date.now() - mins * 60_000));
}

function person(n: number, stamp: number, role: "rep" | "tgt") {
  const first = pick(FIRST_NAMES, n + (role === "tgt" ? 7 : 0));
  const last = pick(LAST_NAMES, n * 2 + (role === "tgt" ? 1 : 0));
  const name = `${first} ${last}`;
  const uid = `seed_${role}_${stamp}_${n}`;
  const email = `seed.${role}.${stamp}.${n}@teste.local`;
  return { name, uid, email };
}

// Denúncias sintéticas em moderation_reports (isSeed: true). Não cria usuários reais — só docs para testar a fila BKF.
// Synthetic reports in moderation_reports (isSeed: true). Does not create real users — docs only to test the BKF queue.
export async function seedModerationReports(count = 15): Promise<number> {
  const auth = getAngelsCareAuth();
  if (!auth.currentUser) throw new Error("Faça login no BKF.");

  const db = getAngelsCareDb();
  const stamp = Date.now();
  let created = 0;
  const batchSize = 40;

  for (let offset = 0; offset < count; offset += batchSize) {
    const batch = writeBatch(db);
    const slice = Math.min(batchSize, count - offset);

    for (let i = 0; i < slice; i++) {
      const n = offset + i;
      const reporter = person(n, stamp, "rep");
      const reported = person(n + 11, stamp, "tgt");
      const status = pick(STATUSES, n);
      const reason = pick(REASONS, n);
      const details = pick(DETAILS, n + 2);
      const reportId = `seed_report_${stamp}_${n}`;
      const createdAt = minutesAgo(n * 11 + 5);

      const row: Record<string, unknown> = {
        reporterId: reporter.uid,
        reportedUserId: reported.uid,
        connectionId: `seed_conn_${stamp}_${n}`,
        reason,
        status,
        createdAt,
        isSeed: true,
        seedBatch: String(stamp),
        reporterName: reporter.name,
        reporterEmail: reporter.email,
        reportedName: reported.name,
        reportedEmail: reported.email,
      };
      if (details) row.details = details;

      if (status !== "open") {
        row.reviewedAt = minutesAgo(n * 3 + 1);
        row.reviewedByEmail = (auth.currentUser.email ?? "").toLowerCase();
        row.reviewedByUid = auth.currentUser.uid;
        row.reviewNote =
          status === "reviewed"
            ? "Seed: caso analisado (teste)."
            : "Seed: descartado (teste).";
      }

      batch.set(doc(db, "moderation_reports", reportId), row);
      created += 1;
    }

    await batch.commit();
  }

  return created;
}

export async function clearSeedModerationReports(): Promise<number> {
  const auth = getAngelsCareAuth();
  if (!auth.currentUser) throw new Error("Faça login no BKF.");

  const db = getAngelsCareDb();
  const snap = await getDocs(
    query(collection(db, "moderation_reports"), where("isSeed", "==", true)),
  );

  let removed = 0;
  let batch = writeBatch(db);
  let ops = 0;

  for (const d of snap.docs) {
    batch.delete(d.ref);
    ops += 1;
    removed += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  return removed;
}
