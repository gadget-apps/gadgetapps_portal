import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";
import {
  OUVIDORIA_RESOLUTION_PRESETS,
  presetsForDisplay,
  type ResolutionPreset,
} from "@/lib/bkf/resolution-codes";

export type OuvidoriaType = "reclamacao" | "sugestao" | "elogio";
export type OuvidoriaStatus = "open" | "reviewed" | "dismissed";
export type OuvidoriaSource = "site" | "app";

export type OuvidoriaItem = {
  id: string;
  type: OuvidoriaType;
  name: string;
  email: string;
  message: string;
  product: string;
  status: OuvidoriaStatus;
  createdAt: string;
  reviewedAt: string;
  reviewNote: string;
  replyText: string;
  resolutionCodes: string[];
  source: OuvidoriaSource;
  collection: "public_feedback" | "user_feedback";
};

export type PublicFeedback = OuvidoriaItem;
export type PublicFeedbackType = OuvidoriaType;
export type PublicFeedbackStatus = OuvidoriaStatus;

function tsToIso(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

function normalizeType(raw: string): OuvidoriaType {
  const t = raw.trim().toLowerCase();
  if (t === "reclamacao" || t === "complaint") return "reclamacao";
  if (t === "elogio" || t === "praise") return "elogio";
  if (t === "sugestao" || t === "suggestion") return "sugestao";
  return "sugestao";
}

function normalizeStatus(raw: string): OuvidoriaStatus {
  if (raw === "reviewed" || raw === "dismissed") return raw;
  return "open";
}

export function typeLabelPt(type: OuvidoriaType): string {
  if (type === "reclamacao") return "Reclamação";
  if (type === "elogio") return "Elogio";
  return "Sugestão";
}

export async function loadOuvidoriaItems(
  appId?: string,
): Promise<OuvidoriaItem[]> {
  const db = getAngelsCareDb();
  const [siteResult, appResult] = await Promise.allSettled([
    getDocs(query(collection(db, "public_feedback"), orderBy("createdAt", "desc"))),
    getDocs(query(collection(db, "user_feedback"), orderBy("createdAt", "desc"))),
  ]);

  const siteRows: OuvidoriaItem[] =
    siteResult.status === "fulfilled"
      ? siteResult.value.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: normalizeType(String(data.type || "sugestao")),
            name: String(data.name || ""),
            email: String(data.email || ""),
            message: String(data.message || ""),
            product: String(data.product || data.appId || ""),
            status: normalizeStatus(String(data.status || "open")),
            createdAt: tsToIso(data.createdAt),
            reviewedAt: tsToIso(data.reviewedAt),
            reviewNote: String(data.reviewNote || ""),
            replyText: String(data.replyText || ""),
            resolutionCodes: Array.isArray(data.resolutionCodes)
              ? data.resolutionCodes.map(String)
              : [],
            source: "site" as const,
            collection: "public_feedback" as const,
          };
        })
      : [];

  const appRows: OuvidoriaItem[] =
    appResult.status === "fulfilled"
      ? appResult.value.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: normalizeType(String(data.type || "suggestion")),
            name: String(data.userName || ""),
            email: String(data.userEmail || ""),
            message: String(data.message || ""),
            product: String(data.appId || data.product || ""),
            status: normalizeStatus(String(data.status || "open")),
            createdAt: tsToIso(data.createdAt),
            reviewedAt: tsToIso(data.reviewedAt),
            reviewNote: String(data.reviewNote || ""),
            replyText: String(data.replyText || ""),
            resolutionCodes: Array.isArray(data.resolutionCodes)
              ? data.resolutionCodes.map(String)
              : [],
            source: "app" as const,
            collection: "user_feedback" as const,
          };
        })
      : [];

  if (siteResult.status === "rejected" && appResult.status === "rejected") {
    throw siteResult.reason instanceof Error
      ? siteResult.reason
      : new Error("Falha ao carregar ouvidoria.");
  }

  const merged = [...siteRows, ...appRows].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || ""),
  );

  if (!appId) return merged;
  return merged.filter((row) => !row.product || row.product === appId);
}

export async function loadPublicFeedback(): Promise<OuvidoriaItem[]> {
  return loadOuvidoriaItems();
}

export async function resolveOuvidoriaItem(
  item: Pick<OuvidoriaItem, "id" | "collection">,
  status: "reviewed" | "dismissed",
  reviewNote: string,
  replyText = "",
  resolutionCodes: string[] = [],
): Promise<void> {
  const user = getAngelsCareAuth().currentUser;
  if (!user?.email) throw new Error("Sessão inválida.");
  const payload: Record<string, unknown> = {
    status,
    reviewNote: reviewNote.trim(),
    reviewedAt: serverTimestamp(),
    reviewedByEmail: user.email.toLowerCase(),
    reviewedByUid: user.uid,
    updatedAt: serverTimestamp(),
    resolutionCodes: [...new Set(resolutionCodes.map((c) => c.trim()).filter(Boolean))],
  };
  if (status === "reviewed") {
    payload.replyText = replyText.trim();
  }
  await updateDoc(doc(getAngelsCareDb(), item.collection, item.id), payload);
}

// Atalhos da Ouvidoria com texto white-label para o app atual.
// Ombudsman shortcuts with white-label copy for the current app.
export function ouvidoriaNotePresets(appName: string) {
  return presetsForDisplay(OUVIDORIA_RESOLUTION_PRESETS, appName);
}

export const INTERNAL_NOTE_PRESETS: ResolutionPreset[] =
  OUVIDORIA_RESOLUTION_PRESETS;

export async function resolvePublicFeedback(
  id: string,
  status: "reviewed" | "dismissed",
  reviewNote: string,
): Promise<void> {
  await resolveOuvidoriaItem(
    { id, collection: "public_feedback" },
    status,
    reviewNote,
  );
}

export function formatFeedbackDt(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}
