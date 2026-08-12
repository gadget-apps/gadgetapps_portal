"use client";

import type { QueuePriorityCounts } from "@/lib/bkf/queue-stats";

type Props = {
  counts: QueuePriorityCounts;
  loading?: boolean;
  compact?: boolean;
};

export function QueuePriorityBadges({ counts, loading, compact }: Props) {
  if (loading) {
    return (
      <p className={`bkf-prio-badges ${compact ? "is-compact" : ""}`}>
        <span className="bkf-prio-badge is-muted">Carregando fila…</span>
      </p>
    );
  }

  if (counts.total === 0) {
    return (
      <p className={`bkf-prio-badges ${compact ? "is-compact" : ""}`}>
        <span className="bkf-prio-badge is-ok">Nenhum pendente</span>
      </p>
    );
  }

  return (
    <p
      className={`bkf-prio-badges ${compact ? "is-compact" : ""}`}
      aria-label={`${counts.total} atendimentos pendentes`}
    >
      <span className="bkf-prio-badge is-normal">
        Normal <strong>{counts.normal}</strong>
      </span>
      <span className="bkf-prio-badge is-high">
        Alta <strong>{counts.high}</strong>
      </span>
      <span className="bkf-prio-badge is-urgent">
        Urgente <strong>{counts.urgent}</strong>
      </span>
    </p>
  );
}
