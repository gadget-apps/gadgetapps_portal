import { notFound } from "next/navigation";
import { BkfShell } from "@/components/bkf/BkfShell";
import { ChatQueueModule } from "@/components/bkf/ChatQueueModule";
import { TeamModule } from "@/components/bkf/TeamModule";
import { UsersModule } from "@/components/bkf/UsersModule";
import { CATALOG_APPS, getAppById } from "@/data/apps";
import { BKF_MODULES, isBkfModule } from "@/data/bkf/modules";

type Props = { params: Promise<{ appId: string; module: string }> };

export function generateStaticParams() {
  const params: { appId: string; module: string }[] = [];
  for (const app of CATALOG_APPS.filter((a) => a.status === "active")) {
    for (const mod of BKF_MODULES) {
      params.push({ appId: app.appId, module: mod.id });
    }
  }
  return params;
}

export default async function ModulePage({ params }: Props) {
  const { appId, module } = await params;
  const app = getAppById(appId);
  if (!app || app.status !== "active" || !isBkfModule(module)) notFound();

  const meta = BKF_MODULES.find((m) => m.id === module)!;

  let body = (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">{meta.title}</h2>
          <p className="bkf-panel__sub">
            {meta.description} Em construção — foco atual é Chat / fila.
          </p>
        </div>
      </div>
      <p className="bkf-empty">Placeholder do MVP.</p>
    </div>
  );

  if (module === "chat") {
    body = <ChatQueueModule appId={app.appId} />;
  } else if (module === "team") {
    body = <TeamModule />;
  } else if (module === "users") {
    body = <UsersModule appId={app.appId} />;
  }

  return <BkfShell app={app}>{body}</BkfShell>;
}
