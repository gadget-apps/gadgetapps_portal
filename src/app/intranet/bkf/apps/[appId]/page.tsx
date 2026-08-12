import Link from "next/link";
import { notFound } from "next/navigation";
import { BkfShell } from "@/components/bkf/BkfShell";
import { CATALOG_APPS, getAppById } from "@/data/apps";
import { BKF_MODULES } from "@/data/bkf/modules";

type Props = { params: Promise<{ appId: string }> };

export function generateStaticParams() {
  return CATALOG_APPS.filter((a) => a.status === "active").map((a) => ({
    appId: a.appId,
  }));
}

export default async function AppHomePage({ params }: Props) {
  const { appId } = await params;
  const app = getAppById(appId);
  if (!app || app.status !== "active") notFound();

  return (
    <BkfShell app={app}>
      <div className="bkf-panel" style={{ marginBottom: "0.85rem" }}>
        <div className="bkf-panel__head">
          <div>
            <h2 className="bkf-panel__title">Prioridade: atendimento</h2>
            <p className="bkf-panel__sub">
              Comece pela fila de chat. Usuários, Premium e demais módulos
              vêm na sequência.
            </p>
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
          </Link>
        ))}
      </div>
    </BkfShell>
  );
}
