"use client";

import Link from "next/link";
import type { CatalogApp } from "@/data/apps";
import { BKF_MODULES } from "@/data/bkf/modules";
import { LiveQueuePriorityBadges } from "@/components/bkf/LiveQueuePriorityBadges";

type Props = {
  app: CatalogApp;
};

export function AppOverview({ app }: Props) {
  return (
    <>
      <div className="bkf-panel" style={{ marginBottom: "0.85rem" }}>
        <div className="bkf-panel__head">
          <div>
            <h2 className="bkf-panel__title">Prioridade: atendimento</h2>
            <p className="bkf-panel__sub">
              Comece pela fila de chat. Usuários, Premium e demais módulos vêm
              na sequência.
            </p>
            <div style={{ marginTop: "0.75rem" }}>
              <LiveQueuePriorityBadges appId={app.appId} />
            </div>
          </div>
          <Link
            href={`/intranet/bkf/apps/${app.appId}/chat/`}
            className="pill pill-blue"
          >
            Abrir Chat / fila
          </Link>
        </div>
      </div>
      <div className="bkf-grid">
        {BKF_MODULES.map((mod) => (
          <Link
            key={mod.id}
            href={`/intranet/bkf/apps/${app.appId}/${mod.id}/`}
            className="bkf-card"
          >
            <h3>{mod.title}</h3>
            <p>{mod.description}</p>
            {mod.id === "chat" ? (
              <div style={{ marginTop: "0.75rem" }}>
                <LiveQueuePriorityBadges appId={app.appId} compact />
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </>
  );
}
