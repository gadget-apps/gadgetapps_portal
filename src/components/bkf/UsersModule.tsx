"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { BkfUser } from "@/data/bkf/mock-users";
import {
  getAngelsCareAuth,
} from "@/lib/firebase/angels-care";
import { isBkfAdminSession } from "@/lib/bkf/operators";
import {
  BKF_PREMIUM_PRODUCTS,
  addDaysYmd,
  grantBkfAdminPremium,
  revokeBkfAdminPremium,
  todayYmd,
  type BkfPremiumKind,
} from "@/lib/bkf/premium-admin";
import {
  loadAppUsers,
  setUserDisabledByAdmin,
} from "@/lib/bkf/users-firestore";
import { usersMetricsFromRows } from "@/lib/bkf/dashboard-metrics";
import { KpiStrip } from "@/components/bkf/KpiStrip";

type Props = { appId: string };

type Filter = "all" | "active" | "disabled" | "premium";

function roleTagClass(role: BkfUser["userRole"]): string {
  if (role === "Profissional") return "bkf-tag bkf-tag--role-profissional";
  if (role === "Assistido") return "bkf-tag bkf-tag--role-assistido";
  return "bkf-tag bkf-tag--role-contratante";
}

type PremiumForm = {
  productId: string;
  startDate: string;
  endDate: string;
  kind: BkfPremiumKind;
  reason: string;
};

function defaultForm(user: BkfUser): PremiumForm {
  const productId =
    user.premiumProductId &&
    BKF_PREMIUM_PRODUCTS.some((p) => p.productId === user.premiumProductId)
      ? user.premiumProductId
      : BKF_PREMIUM_PRODUCTS[0].productId;
  const start = todayYmd();
  const product =
    BKF_PREMIUM_PRODUCTS.find((p) => p.productId === productId) ??
    BKF_PREMIUM_PRODUCTS[0];
  const endFromUser =
    user.premiumUntil && user.premiumUntil >= start
      ? user.premiumUntil
      : addDaysYmd(start, product.accessDays);
  return {
    productId,
    startDate: start,
    endDate: endFromUser,
    kind: "support",
    reason: "",
  };
}

export function UsersModule({ appId }: Props) {
  const [rows, setRows] = useState<BkfUser[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [premiumUser, setPremiumUser] = useState<BkfUser | null>(null);
  const [form, setForm] = useState<PremiumForm | null>(null);
  const [premiumBusy, setPremiumBusy] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setIsAdmin(isBkfAdminSession());
  }, []);

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

  const userKpis = useMemo(() => usersMetricsFromRows(rows), [rows]);

  function openPremium(user: BkfUser) {
    setPremiumError(null);
    setPremiumUser(user);
    setForm(defaultForm(user));
  }

  function closePremium() {
    if (premiumBusy) return;
    setPremiumUser(null);
    setForm(null);
    setPremiumError(null);
  }

  function onProductChange(productId: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const product =
        BKF_PREMIUM_PRODUCTS.find((p) => p.productId === productId) ??
        BKF_PREMIUM_PRODUCTS[0];
      return {
        ...prev,
        productId,
        endDate: addDaysYmd(prev.startDate, product.accessDays),
      };
    });
  }

  function onStartChange(startDate: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const product =
        BKF_PREMIUM_PRODUCTS.find((p) => p.productId === prev.productId) ??
        BKF_PREMIUM_PRODUCTS[0];
      return {
        ...prev,
        startDate,
        endDate: addDaysYmd(startDate, product.accessDays),
      };
    });
  }

  async function submitGrant(forceOverwrite = false) {
    if (!premiumUser || !form || premiumBusy) return;
    if (!form.reason.trim() || form.reason.trim().length < 3) {
      setPremiumError("Informe o motivo (mín. 3 caracteres).");
      return;
    }
    if (form.endDate <= form.startDate) {
      setPremiumError("A data fim deve ser depois da data início.");
      return;
    }

    setPremiumBusy(true);
    setPremiumError(null);
    setError(null);
    try {
      const result = await grantBkfAdminPremium({
        targetUserId: premiumUser.id,
        productId: form.productId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
        kind: form.kind,
        forceOverwrite,
      });

      if (!result.success && result.reason === "active_play_entitlement") {
        const ok = window.confirm(
          "Este usuário tem Premium ativo via Google Play. Sobrescrever com o plano do BKF?",
        );
        if (ok) {
          setPremiumBusy(false);
          await submitGrant(true);
          return;
        }
        setPremiumError("Operação cancelada: entitlement Play ativo.");
        return;
      }

      if (!result.success) {
        setPremiumError(result.reason || "Falha ao conceder Premium.");
        return;
      }

      setRows((prev) =>
        prev.map((u) =>
          u.id === premiumUser.id
            ? {
                ...u,
                isPremium: true,
                premiumUntil: form.endDate,
                premiumProductId: form.productId,
                premiumPlanType:
                  BKF_PREMIUM_PRODUCTS.find(
                    (p) => p.productId === form.productId,
                  )?.planType,
                premiumSource:
                  form.kind === "bonus" ? "bkf_bonus" : "bkf_admin",
              }
            : u,
        ),
      );
      setNote(
        `Premium concedido a ${premiumUser.displayName} até ${form.endDate}.`,
      );
      setPremiumUser(null);
      setForm(null);
    } catch (e) {
      setPremiumError(
        e instanceof Error ? e.message : "Falha ao conceder Premium.",
      );
    } finally {
      setPremiumBusy(false);
    }
  }

  async function submitRevoke(forceOverwrite = false) {
    if (!premiumUser || !form || premiumBusy) return;
    if (!form.reason.trim() || form.reason.trim().length < 3) {
      setPremiumError("Informe o motivo da revogação (mín. 3 caracteres).");
      return;
    }
    const ok = window.confirm(
      `Revogar Premium de ${premiumUser.displayName}?`,
    );
    if (!ok) return;

    setPremiumBusy(true);
    setPremiumError(null);
    setError(null);
    try {
      const result = await revokeBkfAdminPremium({
        targetUserId: premiumUser.id,
        reason: form.reason.trim(),
        kind: form.kind,
        forceOverwrite,
      });

      if (!result.success && result.reason === "active_play_entitlement") {
        const overwrite = window.confirm(
          "Premium ativo via Google Play. Revogar mesmo assim?",
        );
        if (overwrite) {
          setPremiumBusy(false);
          await submitRevoke(true);
          return;
        }
        setPremiumError("Operação cancelada: entitlement Play ativo.");
        return;
      }

      if (!result.success) {
        setPremiumError(result.reason || "Falha ao revogar Premium.");
        return;
      }

      setRows((prev) =>
        prev.map((u) =>
          u.id === premiumUser.id
            ? {
                ...u,
                isPremium: false,
                premiumUntil: undefined,
              }
            : u,
        ),
      );
      setNote(`Premium revogado de ${premiumUser.displayName}.`);
      setPremiumUser(null);
      setForm(null);
    } catch (e) {
      setPremiumError(
        e instanceof Error ? e.message : "Falha ao revogar Premium.",
      );
    } finally {
      setPremiumBusy(false);
    }
  }

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
            Contas do Angel&apos;s Care (lista completa). Ativar/desativar
            conta bloqueia o login. Admin pode conceder ou revogar Premium com
            plano e vigência.
          </p>
        </div>
        <p className="bkf-panel__count">
          {ready ? `${filtered.length} exibidos` : "carregando…"}
        </p>
      </div>

      {isAdmin ? (
        <KpiStrip
          loading={!ready}
          items={[
            { label: "Total", value: userKpis.total },
            { label: "Ativos", value: userKpis.active, tone: "ok" },
            {
              label: "Desativados",
              value: userKpis.disabled,
              tone: userKpis.disabled > 0 ? "warn" : "default",
            },
            { label: "Premium", value: userKpis.premium, tone: "ok" },
          ]}
        />
      ) : null}

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
                      <span className="bkf-mono">
                        {u.email || "sem e-mail no perfil"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={roleTagClass(u.userRole)}>{u.userRole}</span>
                  </td>
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
                    <div className="bkf-row-actions">
                      {isAdmin ? (
                        <button
                          type="button"
                          className="bkf-action"
                          disabled={busyId === u.id || premiumBusy}
                          onClick={() => openPremium(u)}
                        >
                          Premium
                        </button>
                      ) : null}
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
                    </div>
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

      {premiumUser && form ? (
        <div className="bkf-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="bkf-modal__backdrop"
            aria-label="Fechar"
            onClick={closePremium}
          />
          <div className="bkf-modal__card">
            <div className="bkf-modal__head">
              <div>
                <h3 className="bkf-modal__title">Premium — {premiumUser.displayName}</h3>
                <p className="bkf-modal__sub">{premiumUser.email || premiumUser.id}</p>
              </div>
              <button
                type="button"
                className="bkf-action"
                onClick={closePremium}
                disabled={premiumBusy}
              >
                Fechar
              </button>
            </div>

            <label className="bkf-field">
              <span>Plano</span>
              <select
                className="bkf-input"
                value={form.productId}
                disabled={premiumBusy}
                onChange={(e) => onProductChange(e.target.value)}
              >
                {BKF_PREMIUM_PRODUCTS.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="bkf-field-row">
              <label className="bkf-field">
                <span>Início</span>
                <input
                  className="bkf-input"
                  type="date"
                  value={form.startDate}
                  disabled={premiumBusy}
                  onChange={(e) => onStartChange(e.target.value)}
                />
              </label>
              <label className="bkf-field">
                <span>Fim</span>
                <input
                  className="bkf-input"
                  type="date"
                  value={form.endDate}
                  disabled={premiumBusy}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev ? { ...prev, endDate: e.target.value } : prev,
                    )
                  }
                />
              </label>
            </div>

            <label className="bkf-field">
              <span>Tipo</span>
              <select
                className="bkf-input"
                value={form.kind}
                disabled={premiumBusy}
                onChange={(e) =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          kind: e.target.value as BkfPremiumKind,
                        }
                      : prev,
                  )
                }
              >
                <option value="support">Correção / suporte</option>
                <option value="bonus">Bonificação</option>
              </select>
            </label>

            <label className="bkf-field">
              <span>Motivo</span>
              <textarea
                className="bkf-input bkf-textarea"
                rows={3}
                placeholder="Ex.: compra Play não efetivada; cortesia de 15 dias…"
                value={form.reason}
                disabled={premiumBusy}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, reason: e.target.value } : prev,
                  )
                }
              />
            </label>

            {premiumError ? (
              <p className="bkf-toast" style={{ color: "#b00020" }}>
                {premiumError}
              </p>
            ) : null}

            <div className="bkf-modal__actions">
              {premiumUser.isPremium ? (
                <button
                  type="button"
                  className="bkf-action bkf-action--danger"
                  disabled={premiumBusy}
                  onClick={() => void submitRevoke()}
                >
                  {premiumBusy ? "…" : "Revogar Premium"}
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="bkf-action bkf-action--primary"
                disabled={premiumBusy}
                onClick={() => void submitGrant()}
              >
                {premiumBusy ? "…" : "Conceder / ajustar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
