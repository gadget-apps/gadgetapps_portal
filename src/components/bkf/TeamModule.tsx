"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createInvite,
  revokeInvite,
  setOperatorActive,
  updateMyDisplayName,
  watchInvites,
  watchOperators,
  type BkfInvite,
  type BkfOperator,
} from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

export function TeamModule() {
  const [operators, setOperators] = useState<BkfOperator[]>([]);
  const [invites, setInvites] = useState<BkfInvite[]>([]);
  const [email, setEmail] = useState("");
  const [myName, setMyName] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const myUid = getAngelsCareAuth().currentUser?.uid ?? "";

  useEffect(() => {
    const u1 = watchOperators(
      (list) => {
        setOperators(list);
        const me = list.find((o) => o.uid === myUid);
        if (me?.displayName) setMyName(me.displayName);
        setReady(true);
      },
      (e) => {
        setReady(true);
        setError(e.message);
      },
    );
    const u2 = watchInvites(setInvites, (e) => setError(e.message));
    return () => {
      u1();
      u2();
    };
  }, [myUid]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await createInvite(trimmed);
      setEmail("");
      setOkMsg(
        `Convite criado para ${trimmed.toLowerCase()}. A pessoa usa “Aceitar convite” no login e define a senha.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao convidar.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveName(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    setBusy(true);
    try {
      await updateMyDisplayName(myName);
      setOkMsg("Nome de atendimento salvo. Será usado na saudação automática.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar nome.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Carregando equipe…</p>
      </div>
    );
  }

  const pending = invites.filter((i) => i.status === "pending");

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Equipe BKF</h2>
          <p className="bkf-panel__sub">
            Defina seu nome de atendimento e convide colaboradores pelo e-mail.
          </p>
        </div>
      </div>

      {error ? (
        <p style={{ color: "#b00020", marginBottom: "0.75rem" }}>{error}</p>
      ) : null}
      {okMsg ? (
        <p style={{ color: "#166534", marginBottom: "0.75rem" }}>{okMsg}</p>
      ) : null}

      <form
        onSubmit={onSaveName}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.6rem",
          marginBottom: "1.25rem",
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: "0.875rem", flex: "1 1 100%" }}>
          Seu nome no atendimento (aparece na saudação)
        </label>
        <input
          className="bkf-input"
          type="text"
          placeholder="Ex.: Márcio"
          value={myName}
          onChange={(e) => setMyName(e.target.value)}
          disabled={busy}
          style={{ minWidth: "200px", flex: "1 1 200px" }}
        />
        <button type="submit" className="bkf-action" disabled={busy || !myName.trim()}>
          Salvar nome
        </button>
      </form>

      <form
        onSubmit={onInvite}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.6rem",
          marginBottom: "1.5rem",
          alignItems: "center",
        }}
      >
        <input
          className="bkf-input"
          type="email"
          placeholder="colaborador@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          style={{ minWidth: "240px", flex: "1 1 220px" }}
        />
        <button
          type="submit"
          className="pill pill-blue"
          disabled={busy || !email.trim()}
        >
          {busy ? "Enviando…" : "Convidar"}
        </button>
      </form>

      <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.5rem" }}>Operadores</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem" }}>
        {operators.map((op) => (
          <li
            key={op.uid}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.65rem 0",
              borderBottom: "1px solid var(--line, #e5e7eb)",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{op.email}</strong>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {op.active ? "Ativo" : "Desativado"}
              </div>
            </div>
            <button
              type="button"
              className="bkf-action"
              onClick={() => setOperatorActive(op.uid, !op.active)}
            >
              {op.active ? "Desativar" : "Reativar"}
            </button>
          </li>
        ))}
        {operators.length === 0 ? (
          <li className="bkf-empty">Nenhum operador ainda.</li>
        ) : null}
      </ul>

      <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.5rem" }}>
        Convites pendentes
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {pending.map((inv) => (
          <li
            key={inv.email}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.65rem 0",
              borderBottom: "1px solid var(--line, #e5e7eb)",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{inv.email}</strong>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                por {inv.invitedByEmail || "—"}
              </div>
            </div>
            <button
              type="button"
              className="bkf-action"
              onClick={() => revokeInvite(inv.email)}
            >
              Revogar
            </button>
          </li>
        ))}
        {pending.length === 0 ? (
          <li className="bkf-empty">Nenhum convite pendente.</li>
        ) : null}
      </ul>
    </div>
  );
}
