import { notFound } from "next/navigation";
import { AppOverview } from "@/components/bkf/AppOverview";
import { BkfShell } from "@/components/bkf/BkfShell";
import { CATALOG_APPS, getAppById } from "@/data/apps";

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
      <AppOverview app={app} />
    </BkfShell>
  );
}
