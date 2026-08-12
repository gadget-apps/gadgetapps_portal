"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { IntranetHeader } from "@/components/IntranetHeader";
import { INTRANET_MODULES } from "@/data/intranet";
import {
  clearBkfSession,
  ensureBkfSession,
} from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

export default function IntranetPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

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

  async function logout() {
    try {
      await signOut(getAngelsCareAuth());
    } catch {
      /* ignore */
    }
    clearBkfSession();
    router.push("/login/");
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 text-sm text-muted">
        Verificando acesso…
      </main>
    );
  }

  return (
    <div className="min-h-full">
      <IntranetHeader
        title="Intranet"
        backHref="/"
        backLabel="← Site público"
      />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Olá{email ? `, ${email}` : ""}
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Hub interno da empresa. O Backoffice (BKF) é o primeiro módulo;
              outros entram aqui conforme a Gadget Apps crescer.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-background"
          >
            Sair
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {INTRANET_MODULES.map((mod) => {
            const available = mod.status === "available";
            const body = (
              <div
                className={`rounded-xl border border-border bg-surface p-5 ${
                  available ? "hover:border-slate-400 hover:shadow-sm" : "opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{mod.title}</h3>
                  <span className="text-xs text-muted">
                    {available ? "Disponível" : "Em breve"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{mod.description}</p>
              </div>
            );

            if (!available) {
              return <div key={mod.id}>{body}</div>;
            }

            return (
              <Link key={mod.id} href={mod.href} className="block">
                {body}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
