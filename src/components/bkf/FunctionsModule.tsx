"use client";

import { useEffect, useState } from "react";
import { FunctionsMonitorPanel } from "@/components/bkf/FunctionsMonitorPanel";
import { isBkfAdminSession } from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

type Props = { appId: string };

export function FunctionsModule({ appId }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(isBkfAdminSession());
  }, []);

  if (appId !== "angels_care") {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">
          Monitor de Functions ainda não disponível para este app.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">
          Somente o admin BKF acessa o monitor de Cloud Functions.
        </p>
      </div>
    );
  }

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Cloud Functions</h2>
          <p className="bkf-panel__sub">
            Saúde do backend: falhas e avisos gravados pelas Functions
            (callable, agendadas, Firestore e HTTP). Independente da auditoria
            SOS.
          </p>
        </div>
      </div>
      <FunctionsMonitorPanel />
    </div>
  );
}
