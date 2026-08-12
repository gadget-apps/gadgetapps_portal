"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CatalogApp } from "@/data/apps";
import { modulesForRole } from "@/data/bkf/modules";
import { LiveQueuePriorityBadges } from "@/components/bkf/LiveQueuePriorityBadges";
import { isBootstrapEmail } from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

type Props = {
  app: CatalogApp;
};

export function AppOverview({ app }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(isBootstrapEmail(getAngelsCareAuth().currentUser?.email));
  }, []);

  const modules = modulesForRole(isAdmin);

  return (
    <>
      <div className="bkf-panel" style={{ marginBottom: "0.85rem" }}>
        <div className="bkf-panel__head">
          <div>
            <h2 className="bkf-panel__title">Prioridade: atendimento</h2>
            <p className="bkf-panel__sub">
              {isAdmin
                ? "Comece pela fila de chat. Usuários, Premium e demais módulos vêm na sequência."
                : "Sua área de trabalho é o Chat / fila. Defina seu nome de atendimento antes de responder."}
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
        {modules.map((mod) => (
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
