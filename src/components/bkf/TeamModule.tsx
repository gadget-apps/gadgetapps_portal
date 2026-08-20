"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createInvite,
  isBkfAdminSession,
  revokeInvite,
  roleLabel,
  setOperatorActive,
  setOperatorRole,
  updateMyDisplayName,
  watchInvites,
  watchOperators,
  type BkfInvite,
  type BkfOperator,
  type BkfRole,
} from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

export function TeamModule() {
  const [operators, setOperators] = useState<BkfOperator[]>([]);
  const [invites, setInvites] = useState<BkfInvite[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<BkfRole>("operator");
  const [myName, setMyName] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const authUser = getAngelsCareAuth().currentUser;
  const myUid = authUser?.uid ?? "";
  const myEmail = authUser?.email ?? "";
  const isAdmin = isBkfAdminSession();

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
    let u2 = () => {};
    if (isAdmin) {
      u2 = watchInvites(setInvites, (e) => setError(e.message));
    }
    return () => {
      u1();
      u2();
    };
  }, [myUid, isAdmin]);

  const me = useMemo(
    () => operators.find((o) => o.uid === myUid) ?? null,
    [operators, myUid],
  );

  const visibleOperators = isAdmin
    ? operators
    : operators.filter((o) => o.uid === myUid);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setError(null);
    setOkMsg(null);
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await createInvite(trimmed, inviteRole);
      setEmail("");
      setOkMsg(
        `Convite ${roleLabel(inviteRole)} criado para ${trimmed.toLowerCase()}. ` +
          `A pessoa usa “Aceitar convite” no login e define a senha.`,
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
            {isAdmin
              ? "Convide colaboradores como Admin ou Operador. O acesso no portal segue o perfil, não o e-mail."
              : "Defina seu nome de atendimento. Somente Admin gerencia a equipe."}
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

      {!isAdmin ? (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "0.85rem 1rem",
            border: "1px solid var(--line, #e5e7eb)",
            borderRadius: "0.75rem",
            background: "var(--soft, #f5f5f7)",
          }}
        >
          <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.35rem" }}>
            Sua conta
          </h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            <strong>{me?.email || myEmail}</strong>
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#6b7280" }}>
            {me?.active === false ? "Desativado" : "Ativo"}
            {me ? ` · ${roleLabel(me.role)}` : ""}
            {myName.trim() ? ` · Nome: ${myName.trim()}` : ""}
          </p>
        </div>
      ) : null}

      {isAdmin ? (
        <>
          <form
            onSubmit={onInvite}
            style={{
              display: "grid",
              gap: "0.65rem",
              marginBottom: "1.5rem",
              maxWidth: "36rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
              Informe o e-mail e o perfil de acesso do convidado.
            </p>
            <input
              className="bkf-input"
              type="email"
              placeholder="colaborador@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <fieldset
              style={{
                margin: 0,
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                padding: "0.75rem 0.9rem",
              }}
            >
              <legend style={{ fontSize: "0.8rem", padding: "0 0.35rem" }}>
                Perfil do convite
              </legend>
              <label
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                  marginBottom: "0.55rem",
                  fontSize: "0.875rem",
                }}
              >
                <input
                  type="radio"
                  name="inviteRole"
                  checked={inviteRole === "operator"}
                  onChange={() => setInviteRole("operator")}
                  disabled={busy}
                />
                <span>
                  <strong>Operador</strong>
                  <br />
                  <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                    Só Chat / fila de atendimento.
                  </span>
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                  fontSize: "0.875rem",
                }}
              >
                <input
                  type="radio"
                  name="inviteRole"
                  checked={inviteRole === "admin"}
                  onChange={() => setInviteRole("admin")}
                  disabled={busy}
                />
                <span>
                  <strong>Admin</strong>
                  <br />
                  <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                    Acesso completo ao BKF (usuários, Premium, denúncias, config,
                    equipe…).
                  </span>
                </span>
              </label>
            </fieldset>
            <div>
              <button
                type="submit"
                className="pill pill-blue"
                disabled={busy || !email.trim()}
              >
                {busy ? "Enviando…" : "Convidar"}
              </button>
            </div>
          </form>

          <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.5rem" }}>
            Membros
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem" }}>
            {visibleOperators.map((op) => (
              <li
                key={op.uid}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: "0.65rem 0",
                  borderBottom: "1px solid var(--line, #e5e7eb)",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>{op.email}</strong>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {op.active ? "Ativo" : "Desativado"}
                    {` · ${roleLabel(op.role)}`}
                    {op.displayName ? ` · ${op.displayName}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <select
                    className="bkf-input"
                    value={op.role}
                    disabled={busy || op.uid === myUid}
                    onChange={(e) => {
                      const role = e.target.value as BkfRole;
                      void setOperatorRole(op.uid, role).catch((err) =>
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Falha ao alterar perfil.",
                        ),
                      );
                    }}
                    style={{ maxWidth: "9rem", padding: "0.35rem 0.5rem" }}
                    aria-label={`Perfil de ${op.email}`}
                  >
                    <option value="operator">Operador</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    className="bkf-action"
                    onClick={() => setOperatorActive(op.uid, !op.active)}
                  >
                    {op.active ? "Desativar" : "Reativar"}
                  </button>
                </div>
              </li>
            ))}
            {visibleOperators.length === 0 ? (
              <li className="bkf-empty">Nenhum membro ainda.</li>
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
                    {roleLabel(inv.role)} · por {inv.invitedByEmail || "—"}
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
        </>
      ) : null}
    </div>
  );
}
