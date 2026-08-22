// KPIs e SLAs BKF — white-label por `appId`.
// BKF KPIs and SLAs — white-label per `appId`.
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { getAngelsCareDb } from "@/lib/firebase/angels-care";
import { loadOuvidoriaItems } from "@/lib/bkf/feedback-firestore";
import { loadModerationReports } from "@/lib/bkf/reports-firestore";
import { mapThreadDoc } from "@/lib/bkf/support-firestore";
import {
  DEFAULT_SLA_TARGETS_HOURS,
  avg,
  countCodes,
  formatHours,
  hoursBetween,
  median,
} from "@/lib/bkf/resolution-codes";

export type ChannelSla = {
  channel: "ouvidoria" | "reports" | "chat";
  title: string;
  open: number;
  closed: number;
  total: number;
  avgCloseHours: number | null;
  medianCloseHours: number | null;
  withinSla: number;
  closedWithClock: number;
  slaTargetHours: number;
  pctWithinSla: number | null;
  codeBreakdown: { id: string; label: string; count: number }[];
};

export type KpiBundle = {
  appId: string;
  loadedAt: string;
  channels: ChannelSla[];
  totals: {
    open: number;
    closed: number;
    withinSla: number;
    closedWithClock: number;
  };
};

function slaPct(within: number, closed: number): number | null {
  if (closed <= 0) return null;
  return Math.round((within / closed) * 1000) / 10;
}

export async function loadKpiBundle(appId: string): Promise<KpiBundle> {
  if (!appId) throw new Error("appId obrigatório para KPIs white-label.");

  const [ouvidoriaAll, reportsAll, chatSnap] = await Promise.all([
    loadOuvidoriaItems(appId),
    loadModerationReports(),
    getDocs(
      query(
        collection(getAngelsCareDb(), "support_threads"),
        orderBy("lastMessageAt", "desc"),
        limit(300),
      ),
    ),
  ]);

  const ouvidoria = ouvidoriaAll;
  const reports = reportsAll.filter((r) => !r.isSeed);
  const chat = chatSnap.docs
    .map((d) => mapThreadDoc(d.id, d.data() as Record<string, unknown>))
    .filter((t) => t.appId === appId && !t.id.startsWith("seed_"));

  const ouvOpen = ouvidoria.filter((r) => r.status === "open").length;
  const ouvClosed = ouvidoria.filter((r) => r.status !== "open");
  const ouvHours = ouvClosed
    .map((r) => hoursBetween(r.createdAt, r.reviewedAt))
    .filter((h): h is number => h != null);
  const ouvWithin = ouvClosed.filter((r) => {
    const h = hoursBetween(r.createdAt, r.reviewedAt);
    return h != null && h <= DEFAULT_SLA_TARGETS_HOURS.ouvidoria;
  }).length;

  const ouvChannel: ChannelSla = {
    channel: "ouvidoria",
    title: "Ouvidoria",
    open: ouvOpen,
    closed: ouvClosed.length,
    total: ouvidoria.length,
    avgCloseHours: avg(ouvHours),
    medianCloseHours: median(ouvHours),
    withinSla: ouvWithin,
    closedWithClock: ouvHours.length,
    slaTargetHours: DEFAULT_SLA_TARGETS_HOURS.ouvidoria,
    pctWithinSla: slaPct(ouvWithin, ouvHours.length),
    codeBreakdown: countCodes(ouvClosed),
  };

  const repOpen = reports.filter((r) => r.status === "open").length;
  const repClosed = reports.filter((r) => r.status !== "open");
  const repHours = repClosed
    .map((r) => hoursBetween(r.createdAt, r.reviewedAt))
    .filter((h): h is number => h != null);
  const repWithin = repClosed.filter((r) => {
    const h = hoursBetween(r.createdAt, r.reviewedAt);
    return h != null && h <= DEFAULT_SLA_TARGETS_HOURS.reports;
  }).length;

  const repChannel: ChannelSla = {
    channel: "reports",
    title: "Denúncias",
    open: repOpen,
    closed: repClosed.length,
    total: reports.length,
    avgCloseHours: avg(repHours),
    medianCloseHours: median(repHours),
    withinSla: repWithin,
    closedWithClock: repHours.length,
    slaTargetHours: DEFAULT_SLA_TARGETS_HOURS.reports,
    pctWithinSla: slaPct(repWithin, repHours.length),
    codeBreakdown: countCodes(repClosed),
  };

  const chatOpen = chat.filter((t) => t.status !== "resolved").length;
  const chatClosed = chat.filter((t) => t.status === "resolved");
  const chatHours = chatClosed
    .map((t) => hoursBetween(t.createdAt, t.resolvedAt || t.lastMessageAt))
    .filter((h): h is number => h != null);
  const chatWithin = chatClosed.filter((t) => {
    const h = hoursBetween(t.createdAt, t.resolvedAt || t.lastMessageAt);
    return h != null && h <= DEFAULT_SLA_TARGETS_HOURS.chat;
  }).length;

  const chatChannel: ChannelSla = {
    channel: "chat",
    title: "Chat / fila",
    open: chatOpen,
    closed: chatClosed.length,
    total: chat.length,
    avgCloseHours: avg(chatHours),
    medianCloseHours: median(chatHours),
    withinSla: chatWithin,
    closedWithClock: chatHours.length,
    slaTargetHours: DEFAULT_SLA_TARGETS_HOURS.chat,
    pctWithinSla: slaPct(chatWithin, chatHours.length),
    codeBreakdown: countCodes(chatClosed),
  };

  const channels = [ouvChannel, repChannel, chatChannel];
  return {
    appId,
    loadedAt: new Date().toISOString(),
    channels,
    totals: {
      open: channels.reduce((s, c) => s + c.open, 0),
      closed: channels.reduce((s, c) => s + c.closed, 0),
      withinSla: channels.reduce((s, c) => s + c.withinSla, 0),
      closedWithClock: channels.reduce((s, c) => s + c.closedWithClock, 0),
    },
  };
}

export { formatHours };
