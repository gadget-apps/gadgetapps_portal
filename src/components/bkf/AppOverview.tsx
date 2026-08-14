"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CatalogApp } from "@/data/apps";
import { modulesForRole } from "@/data/bkf/modules";
import { AdminDashboard } from "@/components/bkf/AdminDashboard";
import { LiveQueuePriorityBadges } from "@/components/bkf/LiveQueuePriorityBadges";
import { isBootstrapEmail } from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

type Props = {
  app: CatalogApp;
};

export function AppOverview({ app }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleReady, setRoleReady] = useState(false);

  useEffect(() => {
    setIsAdmin(isBootstrapEmail(getAngelsCareAuth().currentUser?.email));
    setRoleReady(true);
  }, []);

  const modules = modulesForRole(isAdmin);

  if (!roleReady) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Carregando visão geral…</p>
      </div>
    );
  }

  // Dashboard completo: somente Admin.
  if (isAdmin) {
    return <AdminDashboard appId={app.appId} />;
  }

  return (
    <>
      <div className="bkf-panel" style={{ marginBottom: "0.85rem" }}>
        <div className="bkf-panel__head">
          <div>
            <h2 className="bkf-panel__title">Prioridade: atendimento</h2>
            <p className="bkf-panel__sub">
              Sua área de trabalho é o Chat / fila. Defina seu nome de
              atendimento antes de responder.
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
