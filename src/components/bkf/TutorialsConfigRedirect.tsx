"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Encaminha o atalho antigo /tutorials/ para Config técnica → vídeos.
 *  Forwards the legacy /tutorials/ shortcut to Config técnica → videos. */
export function TutorialsConfigRedirect({ appId }: { appId: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/intranet/bkf/apps/${appId}/config/?secao=videos`);
  }, [appId, router]);

  return (
    <p className="bkf-empty">Abrindo Config técnica → Vídeos tutoriais…</p>
  );
}
