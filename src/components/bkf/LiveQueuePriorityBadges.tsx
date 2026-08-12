"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_QUEUE_COUNTS,
  watchPendingQueueByPriority,
  type QueuePriorityCounts,
} from "@/lib/bkf/queue-stats";
import { QueuePriorityBadges } from "@/components/bkf/QueuePriorityBadges";

type Props = {
  appId: string;
  compact?: boolean;
};

export function LiveQueuePriorityBadges({ appId, compact }: Props) {
  const [counts, setCounts] = useState<QueuePriorityCounts>(EMPTY_QUEUE_COUNTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = watchPendingQueueByPriority(
      appId,
      (next) => {
        setCounts(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [appId]);

  return (
    <QueuePriorityBadges counts={counts} loading={loading} compact={compact} />
  );
}
