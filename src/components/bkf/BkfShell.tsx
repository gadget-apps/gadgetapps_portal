"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState, type ReactNode } from "react";
import type { CatalogApp } from "@/data/apps";
import { BKF_MODULES } from "@/data/bkf/modules";
import {
  clearBkfSession,
  ensureBkfSession,
} from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

type Props = {
  app: CatalogApp;
  children: ReactNode;
};

export function BkfShell({ app, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("colaborador");

  useEffect(() => {
    const unsub = onAuthStateChanged(getAngelsCareAuth(), async (user) => {
      if (!user?.email) {
        clearBkfSession();
        router.replace("/login/");
        return;
      }
      const gate = await ensureBkfSession(user);
      if (!gate.ok) {
        clearBkfSession();
        router.replace("/login/");
        return;
      }
      setEmail(gate.email);
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  async function handleLogout() {
    try {
      await signOut(getAngelsCareAuth());
    } catch {
      /* ignore */
    }
    clearBkfSession();
    router.replace("/login/");
  }

  if (!ready) {
    return (
      <main style={{ padding: "3rem 1.5rem", color: "var(--muted)" }}>
        Verificando acesso ao BKF…
      </main>
    );
  }

  const base = `/intranet/bkf/apps/${app.appId}`;

  return (
    <div className="bkf">
      <aside className="bkf__aside">
        <div className="bkf__aside-top">
          <Link href="/intranet/bkf/" className="bkf__back">
            ← Apps
          </Link>
          <div className="bkf__app">
            {app.appId === "angels_care" ? (
              <Image
                src="/brand/angels_icon.png"
                alt=""
                width={36}
                height={36}
                className="bkf__app-icon"
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
              <p className="bkf__app-name">{app.name}</p>
              <p className="bkf__app-id">{app.appId}</p>
            </div>
          </div>
        </div>

        <nav className="bkf__nav" aria-label="Módulos BKF">
          <Link
            href={`${base}/`}
            className={`bkf__nav-item ${pathname === `${base}/` || pathname === base ? "is-active" : ""}`}
          >
            Visão geral
          </Link>
          {BKF_MODULES.map((mod) => {
            const href = `${base}/${mod.id}/`;
            const active =
              pathname === href ||
              pathname === href.slice(0, -1) ||
              pathname.startsWith(`${base}/${mod.id}/`);
            return (
              <Link
                key={mod.id}
                href={href}
                className={`bkf__nav-item ${active ? "is-active" : ""}`}
              >
                {mod.title}
              </Link>
            );
          })}
        </nav>

        <div className="bkf__aside-foot">
          <p className="bkf__operator">{email}</p>
          <button
            type="button"
            className="bkf__back"
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
              font: "inherit",
              color: "inherit",
            }}
          >
            Sair
          </button>
          <Link href="/intranet/" className="bkf__back">
            Intranet
          </Link>
        </div>
      </aside>

      <div className="bkf__main">
        <header className="bkf__top">
          <div>
            <p className="bkf__eyebrow">Backoffice · BKF</p>
            <h1 className="bkf__title">{app.name}</h1>
          </div>
        </header>
        <div className="bkf__content">{children}</div>
      </div>
    </div>
  );
}
