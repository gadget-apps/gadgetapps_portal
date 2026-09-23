import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";

const COLLECTION = "legal_documents";
const VERSION_DOC = /^terms_\d+_\d+_\d+$/;
const LEGACY_DOC = "terms_of_service";
const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/;

export type TermsClause = {
  title: string;
  body: string;
};

export type LegalTermsDocument = {
  docId: string;
  version: string;
  title: string;
  lastUpdate: string;
  content: string;
  clauses: TermsClause[];
  updatedAt: string;
  exists: boolean;
};

export function termsDocIdForVersion(version: string): string {
  const v = version.trim();
  if (!VERSION_RE.test(v)) {
    throw new Error(`Versão inválida: ${version}. Use o formato 1.0.0`);
  }
  return `terms_${v.replace(/\./g, "_")}`;
}

export function bumpPatchVersion(version: string): string {
  const match = version.trim().match(VERSION_RE);
  if (!match) {
    throw new Error(`Versão inválida: ${version}. Use o formato 1.0.0`);
  }
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function parseTermsClauses(raw: string): TermsClause[] {
  const parts = (raw || "").split("_t_");
  const clauses: TermsClause[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    if (i + 1 >= parts.length) break;
    const title = parts[i].trim();
    const body = parts[i + 1].trim();
    if (title && body) clauses.push({ title, body });
  }
  if (clauses.length === 0 && raw.trim()) {
    clauses.push({
      title: "Termos e Contrato de Uso",
      body: raw.trim(),
    });
  }
  return clauses;
}

export function serializeTermsClauses(clauses: TermsClause[]): string {
  return clauses
    .map((clause) => ({
      title: clause.title.trim(),
      body: clause.body.trim(),
    }))
    .filter((clause) => clause.title && clause.body)
    .map((clause) => `_t_${clause.title}_t_${clause.body}`)
    .join("\n\n");
}

export function formatTermsLastUpdate(date = new Date()): string {
  const raw = date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return raw.replace(/ de ([a-z])/, (_, letter: string) => ` de ${letter.toUpperCase()}`);
}

function isGreaterVersion(a: string, b: string): boolean {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  }
  return false;
}

function tsToIso(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string") return value;
  return "";
}

function mapTermsDoc(
  docId: string,
  data: Record<string, unknown>,
): LegalTermsDocument | null {
  const version =
    typeof data.version === "string" && data.version.trim()
      ? data.version.trim()
      : "";
  const content = typeof data.content === "string" ? data.content : "";
  if (!version || !content) return null;
  return {
    docId,
    version,
    title:
      typeof data.title === "string" && data.title.trim()
        ? data.title.trim()
        : "Termos e Contrato de Uso Angel's Care",
    lastUpdate:
      typeof data.lastUpdate === "string" && data.lastUpdate.trim()
        ? data.lastUpdate.trim()
        : formatTermsLastUpdate(),
    content,
    clauses: parseTermsClauses(content),
    updatedAt: tsToIso(data.updatedAt) || tsToIso(data.publishedAt),
    exists: true,
  };
}

export function emptyTermsDocument(): LegalTermsDocument {
  return {
    docId: "",
    version: "1.0.0",
    title: "Termos e Contrato de Uso Angel's Care",
    lastUpdate: formatTermsLastUpdate(),
    content: "",
    clauses: [{ title: "", body: "" }],
    updatedAt: "",
    exists: false,
  };
}

export async function loadLatestTermsDocument(): Promise<LegalTermsDocument> {
  const snap = await getDocs(collection(getAngelsCareDb(), COLLECTION));
  let best: LegalTermsDocument | null = null;
  snap.forEach((item) => {
    if (!VERSION_DOC.test(item.id) && item.id !== LEGACY_DOC) return;
    const mapped = mapTermsDoc(item.id, item.data() as Record<string, unknown>);
    if (!mapped) return;
    if (!best || isGreaterVersion(mapped.version, best.version)) {
      best = mapped;
    }
  });
  return best ?? emptyTermsDocument();
}

type SaveTermsInput = {
  title: string;
  lastUpdate: string;
  clauses: TermsClause[];
};

function actorEmail(): string {
  return getAngelsCareAuth().currentUser?.email?.trim() || "";
}

function termsPayload(input: SaveTermsInput, version: string) {
  const title = input.title.trim();
  const lastUpdate = input.lastUpdate.trim() || formatTermsLastUpdate();
  const content = serializeTermsClauses(input.clauses);
  if (!title) throw new Error("Informe o título do documento.");
  if (!content) throw new Error("Inclua ao menos uma cláusula com título e texto.");
  return {
    version,
    title,
    lastUpdate,
    content,
    updatedAt: serverTimestamp(),
    updatedByEmail: actorEmail(),
  };
}

/** Atualiza o texto sem mudar a versão — quem já aceitou não vê tela de aceite de novo. */
export async function saveTermsInPlace(
  current: LegalTermsDocument,
  input: SaveTermsInput,
): Promise<LegalTermsDocument> {
  if (!current.exists || !current.docId) {
    throw new Error("Não há documento de termos para atualizar.");
  }
  if (!VERSION_DOC.test(current.docId)) {
    throw new Error("Documento legado. Publique uma nova versão numerada.");
  }
  const payload = termsPayload(input, current.version);
  await updateDoc(doc(getAngelsCareDb(), COLLECTION, current.docId), payload);
  return loadLatestTermsDocument();
}

/** Cria terms_X_Y_Z com versão maior — o app exige novo aceite. */
export async function publishNewTermsVersion(
  current: LegalTermsDocument,
  input: SaveTermsInput,
): Promise<LegalTermsDocument> {
  const nextVersion = current.exists
    ? bumpPatchVersion(current.version)
    : current.version.trim() || "1.0.0";
  const docId = termsDocIdForVersion(nextVersion);
  const payload = {
    ...termsPayload(input, nextVersion),
    publishedAt: serverTimestamp(),
  };
  await setDoc(doc(getAngelsCareDb(), COLLECTION, docId), payload);
  return loadLatestTermsDocument();
}
