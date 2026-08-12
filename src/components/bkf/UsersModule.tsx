"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { BkfUser } from "@/data/bkf/mock-users";
import {
  loadAppUsers,
  setUserDisabledByAdmin,
} from "@/lib/bkf/users-firestore";

type Props = { appId: string };

type Filter = "all" | "active" | "disabled" | "premium";

export function UsersModule({ appId }: Props) {
  const [rows, setRows] = useState<BkfUser[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (appId !== "angels_care") {
      setRows([]);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    setError(null);

    void loadAppUsers()
      .then((list) => {
        if (cancelled) return;
        startTransition(() => {
          setRows(list);
          setReady(true);
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReady(true);
        setError(
          err instanceof Error ? err.message : "Falha ao carregar usuários.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [appId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((u) => {
      if (filter === "active" && u.accountDisabled) return false;
      if (filter === "disabled" && !u.accountDisabled) return false;
      if (filter === "premium" && !u.isPremium) return false;
      if (!query) return true;
      return (
        u.displayName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.userRole.toLowerCase().includes(query)
      );
    });
  }, [rows, q, filter]);

  async function toggleDisabled(user: BkfUser) {
    if (busyId) return;
    const next = !user.accountDisabled;
    const ok = window.confirm(
      next
        ? `Desativar ${user.displayName}? A pessoa não conseguirá entrar no app até reativar.`
        : `Reativar ${user.displayName}?`,
    );
    if (!ok) return;

    setBusyId(user.id);
    setError(null);
    try {
      await setUserDisabledByAdmin(user.id, next);
      setRows((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, accountDisabled: next } : u,
        ),
      );
      setNote(
        next
          ? `${user.displayName} desativado no Firebase.`
          : `${user.displayName} reativado no Firebase.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar status.");
    } finally {
      setBusyId(null);
    }
  }

  if (appId !== "angels_care") {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Usuários ainda não disponíveis para este app.</p>
      </div>
    );
  }

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Usuários</h2>
          <p className="bkf-panel__sub">
            Contas do Angel&apos;s Care (até 80 por carga). Ativar/desativar
            bloqueia o login quando desativado pelo BKF.
          </p>
        </div>
        <p className="bkf-panel__count">
          {ready ? `${filtered.length} exibidos` : "carregando…"}
        </p>
      </div>

      <div className="bkf-toolbar">
        <input
          className="bkf-input"
          placeholder="Buscar nome, e-mail ou papel…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="bkf-filters">
          {(
            [
              ["all", "Todos"],
              ["active", "Ativos"],
              ["disabled", "Desativados"],
              ["premium", "Premium"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`bkf-chip ${filter === id ? "is-on" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="bkf-toast" style={{ color: "#b00020" }}>
          {error}
        </p>
      ) : null}
      {note ? <p className="bkf-toast">{note}</p> : null}

      {!ready ? (
        <p className="bkf-empty">Carregando usuários…</p>
      ) : (
        <div className="bkf-table-wrap">
          <table className="bkf-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Papel</th>
                <th>Premium</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className={u.accountDisabled ? "is-disabled" : ""}
                >
                  <td>
                    <div className="bkf-user">
                      <strong>{u.displayName}</strong>
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td>{u.userRole}</td>
                  <td>
                    {u.isPremium ? (
                      <span className="bkf-tag bkf-tag--ok">
                        Sim{u.premiumUntil ? ` · até ${u.premiumUntil}` : ""}
                      </span>
                    ) : (
                      <span className="bkf-tag">Não</span>
                    )}
                  </td>
                  <td>
                    {u.accountDisabled ? (
                      <span className="bkf-tag bkf-tag--bad">Desativado</span>
                    ) : (
                      <span className="bkf-tag bkf-tag--ok">Ativo</span>
                    )}
                  </td>
                  <td className="bkf-mono">
                    {u.lastActiveAt
                      ? new Date(u.lastActiveAt).toLocaleString("pt-BR")
                      : "—"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="bkf-action"
                      disabled={busyId === u.id}
                      onClick={() => toggleDisabled(u)}
                    >
                      {busyId === u.id
                        ? "…"
                        : u.accountDisabled
                          ? "Ativar"
                          : "Desativar"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="bkf-empty">Nenhum usuário neste filtro.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
