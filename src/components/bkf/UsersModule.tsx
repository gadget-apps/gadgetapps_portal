"use client";

import { useMemo, useState } from "react";
import type { BkfUser } from "@/data/bkf/mock-users";
import { usersForApp } from "@/data/bkf/mock-users";

type Props = { appId: string };

type Filter = "all" | "active" | "disabled" | "premium";

export function UsersModule({ appId }: Props) {
  const seed = usersForApp(appId);
  const [rows, setRows] = useState<BkfUser[]>(seed);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [note, setNote] = useState<string | null>(null);

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

  function toggleDisabled(id: string) {
    setRows((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const next = !u.accountDisabled;
        setNote(
          next
            ? `${u.displayName} desativado (demo local).`
            : `${u.displayName} reativado (demo local).`,
        );
        return { ...u, accountDisabled: next };
      }),
    );
  }

  if (seed.length === 0) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Nenhum usuário de demonstração para este app.</p>
      </div>
    );
  }

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Usuários</h2>
          <p className="bkf-panel__sub">
            MVP com dados de demonstração. Ativar/desativar ainda não grava no
            Firebase do Angel&apos;s Care (próximo passo, custo zero).
          </p>
        </div>
        <p className="bkf-panel__count">{filtered.length} exibidos</p>
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

      {note ? <p className="bkf-toast">{note}</p> : null}

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
              <tr key={u.id} className={u.accountDisabled ? "is-disabled" : ""}>
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
                  {new Date(u.lastActiveAt).toLocaleString("pt-BR")}
                </td>
                <td>
                  <button
                    type="button"
                    className="bkf-action"
                    onClick={() => toggleDisabled(u.id)}
                  >
                    {u.accountDisabled ? "Ativar" : "Desativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
