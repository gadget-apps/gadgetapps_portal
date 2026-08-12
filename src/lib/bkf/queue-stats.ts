import { collection, onSnapshot, orderBy, query, type Unsubscribe } from "firebase/firestore";
import { getAngelsCareDb } from "@/lib/firebase/angels-care";
import { mapThreadDoc } from "@/lib/bkf/support-firestore";

export type QueuePriorityCounts = {
  normal: number;
  high: number;
  urgent: number;
  total: number;
};

export const EMPTY_QUEUE_COUNTS: QueuePriorityCounts = {
  normal: 0,
  high: 0,
  urgent: 0,
  total: 0,
};

/** Pendentes = não resolvidos. Baixa entra em Normal na visão resumida. */
export function watchPendingQueueByPriority(
  appId: string,
  onChange: (counts: QueuePriorityCounts) => void,
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
      const counts: QueuePriorityCounts = {
        normal: 0,
        high: 0,
        urgent: 0,
        total: 0,
      };

      for (const d of snap.docs) {
        const ticket = mapThreadDoc(d.id, d.data() as Record<string, unknown>);
        if (ticket.appId !== appId) continue;
        if (ticket.status === "resolved") continue;

        counts.total += 1;
        if (ticket.priority === "urgent") counts.urgent += 1;
        else if (ticket.priority === "high") counts.high += 1;
        else counts.normal += 1; // normal + low
      }

      onChange(counts);
    },
    (err) => onError?.(err),
  );
}
