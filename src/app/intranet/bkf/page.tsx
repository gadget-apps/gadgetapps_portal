"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { CATALOG_APPS, statusLabel } from "@/data/apps";
import { hasBkfOperatorAccess } from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

const DEMO_FLAG = "gat_intranet_demo";

export default function BkfCatalogPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(getAngelsCareAuth(), async (user) => {
      if (!user) {
        sessionStorage.removeItem(DEMO_FLAG);
        router.replace("/login/");
        return;
      }
      const allowed = await hasBkfOperatorAccess(user.uid);
      if (!allowed) {
        sessionStorage.removeItem(DEMO_FLAG);
        router.replace("/login/");
        return;
      }
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) {
    return (
      <main style={{ padding: "3rem 1.5rem", color: "var(--muted)" }}>
        Verificando acesso…
      </main>
    );
  }

  return (
    <div className="bkf" style={{ gridTemplateColumns: "1fr" }}>
      <div className="bkf__main">
        <header className="bkf__top">
          <div>
            <Link href="/intranet/" className="bkf__back" style={{ color: "#6b7280" }}>
              ← Intranet
            </Link>
            <h1 className="bkf__title" style={{ marginTop: "0.35rem" }}>
              Backoffice (BKF)
            </h1>
            <p style={{ margin: "0.35rem 0 0", color: "#6b7280", fontSize: "0.9rem" }}>
              Escolha o app para operar. Os dados de cada produto ficam isolados.
            </p>
          </div>
        </header>
        <div className="bkf__content">
          <div className="bkf-grid">
            {CATALOG_APPS.map((app) => {
              const canOpen = app.status === "active";
              const body = (
                <div className="bkf-card" style={{ opacity: canOpen ? 1 : 0.55 }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    {app.appId === "angels_care" ? (
                      <Image
                        src="/brand/angels_icon.png"
                        alt=""
                        width={40}
                        height={40}
                      />
                    ) : (
                      <span
                        className="bkf__app-fallback"
                        style={{ background: app.accentColor }}
                      >
                        {app.name.charAt(0)}
                      </span>
                    )}
                    <div>
                      <h3>{app.name}</h3>
                      <p>{statusLabel(app.status)}</p>
                    </div>
                  </div>
                  <p style={{ marginTop: "0.75rem" }}>{app.description}</p>
                  <p
                    className="bkf-mono"
                    style={{ marginTop: "0.75rem", whiteSpace: "normal" }}
                  >
                    appId: {app.appId} · Firebase: {app.firebaseProjectId}
                  </p>
                </div>
              );

              if (!canOpen) return <div key={app.appId}>{body}</div>;
              return (
                <Link
                  key={app.appId}
                  href={`/intranet/bkf/apps/${app.appId}/chat/`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {body}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
