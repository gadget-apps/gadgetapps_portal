"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  eventTypeLabel,
  formatDate,
  formatDt,
  loadPremiumEvents,
  loadPremiumStatusRows,
  planLabel,
  sourceLabel,
  type PremiumEventRow,
  type PremiumStatusRow,
} from "@/lib/bkf/premium-firestore";
import { premiumMetricsFromRows } from "@/lib/bkf/dashboard-metrics";
import { isBootstrapEmail } from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";
import { KpiStrip } from "@/components/bkf/KpiStrip";
import { DashBarChart } from "@/components/bkf/DashBarChart";

type Props = { appId: string };

type Tab = "status" | "events";
type StatusFilter = "all" | "active" | "expired";
type EventFilter = "all" | "granted" | "revoked" | "mock";

export function PremiumModule({ appId }: Props) {
  const [tab, setTab] = useState<Tab>("status");
  const [statusRows, setStatusRows] = useState<PremiumStatusRow[]>([]);
  const [events, setEvents] = useState<PremiumEventRow[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setIsAdmin(isBootstrapEmail(getAngelsCareAuth().currentUser?.email));
  }, []);

  useEffect(() => {
    if (appId !== "angels_care") {
      setStatusRows([]);
      setEvents([]);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    setError(null);

    void Promise.all([loadPremiumStatusRows(), loadPremiumEvents()])
      .then(([status, ev]) => {
        if (cancelled) return;
        startTransition(() => {
          setStatusRows(status);
          setEvents(ev);
          setReady(true);
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReady(true);
        setError(
          err instanceof Error ? err.message : "Falha ao carregar Premium.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [appId]);

  const filteredStatus = useMemo(() => {
    const query = q.trim().toLowerCase();
    return statusRows.filter((u) => {
      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "expired" && u.isActive) return false;
      if (!query) return true;
      return (
        u.displayName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        planLabel(u.planType).toLowerCase().includes(query) ||
        sourceLabel(u.source).toLowerCase().includes(query) ||
        (u.productId ?? "").toLowerCase().includes(query)
      );
    });
  }, [statusRows, q, statusFilter]);

  const filteredEvents = useMemo(() => {
    const query = q.trim().toLowerCase();
    return events.filter((e) => {
      if (eventFilter === "granted" && e.eventType !== "granted") return false;
      if (eventFilter === "revoked" && e.eventType !== "revoked") return false;
      if (
        eventFilter === "mock" &&
        e.eventType !== "mock_on" &&
        e.eventType !== "mock_off"
      ) {
        return false;
      }
      if (!query) return true;
      return (
        e.displayName.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        e.uid.toLowerCase().includes(query) ||
        eventTypeLabel(e.eventType).toLowerCase().includes(query) ||
        planLabel(e.planType).toLowerCase().includes(query) ||
        (e.productId ?? "").toLowerCase().includes(query)
      );
    });
  }, [events, q, eventFilter]);

  const premiumKpis = useMemo(
    () => premiumMetricsFromRows(statusRows),
    [statusRows],
  );

  if (appId !== "angels_care") {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Premium ainda não disponível para este app.</p>
      </div>
    );
  }

  const countLabel =
    tab === "status"
      ? `${filteredStatus.length} status`
      : `${filteredEvents.length} eventos`;

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Premium</h2>
          <p className="bkf-panel__sub">
            Status atual no perfil do usuário. Eventos novos passam a ser
            registrados após o deploy das Functions (compras, mocks e
            expirações).
          </p>
        </div>
        <p className="bkf-panel__count">
          {ready ? countLabel : "carregando…"}
        </p>
      </div>

      {isAdmin ? (
        <>
          <KpiStrip
            loading={!ready}
            items={[
              { label: "Ativos", value: premiumKpis.active, tone: "ok" },
              { label: "Expirados", value: premiumKpis.expired },
              {
                label: "Expira em 7d",
                value: premiumKpis.expiring7,
                tone: premiumKpis.expiring7 > 0 ? "warn" : "default",
              },
              { label: "Expira em 30d", value: premiumKpis.expiring30 },
            ]}
          />
          <div className="bkf-dash__charts bkf-dash__charts--compact">
            <DashBarChart
              title="Origem (ativos)"
              items={premiumKpis.bySource.map((s) => ({
                label: s.label,
                value: s.count,
              }))}
              emptyLabel={ready ? "Nenhum ativo" : "Carregando…"}
            />
            <DashBarChart
              title="Plano (ativos)"
              items={premiumKpis.byPlan.map((p) => ({
                label: p.label,
                value: p.count,
              }))}
              emptyLabel={ready ? "Nenhum ativo" : "Carregando…"}
            />
          </div>
        </>
      ) : null}

      <div className="bkf-toolbar">
        <div className="bkf-filters">
          {(
            [
              ["status", "Status atual"],
              ["events", "Eventos"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`bkf-chip ${tab === id ? "is-on" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="bkf-input"
          placeholder={
            tab === "status"
              ? "Buscar nome, e-mail, plano ou origem…"
              : "Buscar nome, e-mail, uid ou tipo…"
          }
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="bkf-filters">
          {tab === "status"
            ? (
                [
                  ["all", "Todos"],
                  ["active", "Ativos"],
                  ["expired", "Expirados"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`bkf-chip ${statusFilter === id ? "is-on" : ""}`}
                  onClick={() => setStatusFilter(id)}
                >
                  {label}
                </button>
              ))
            : (
                [
                  ["all", "Todos"],
                  ["granted", "Concedidos"],
                  ["revoked", "Revogados"],
                  ["mock", "Mock"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`bkf-chip ${eventFilter === id ? "is-on" : ""}`}
                  onClick={() => setEventFilter(id)}
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

      {!ready ? (
        <p className="bkf-empty">Carregando Premium…</p>
      ) : tab === "status" ? (
        <div className="bkf-table-wrap">
          <table className="bkf-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Plano</th>
                <th>Origem</th>
                <th>Última compra</th>
                <th>Válido até</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStatus.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="bkf-user">
                      <strong>{u.displayName}</strong>
                      <span>{u.email || u.id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="bkf-user">
                      <strong>{planLabel(u.planType)}</strong>
                      <span className="bkf-mono">{u.productId || "—"}</span>
                    </div>
                  </td>
                  <td>{sourceLabel(u.source)}</td>
                  <td className="bkf-mono">{formatDt(u.lastPurchaseAt)}</td>
                  <td className="bkf-mono">{formatDate(u.premiumUntil)}</td>
                  <td>
                    {u.isActive ? (
                      <span className="bkf-tag bkf-tag--ok">Ativo</span>
                    ) : (
                      <span className="bkf-tag bkf-tag--bad">Expirado</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredStatus.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="bkf-empty">
                      Nenhum entitlement Premium neste filtro.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bkf-table-wrap">
          <table className="bkf-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Evento</th>
                <th>Usuário</th>
                <th>Plano</th>
                <th>Origem</th>
                <th>Válido até</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e) => (
                <tr key={e.id}>
                  <td className="bkf-mono">{formatDt(e.createdAt)}</td>
                  <td>
                    <span
                      className={`bkf-tag ${
                        e.eventType === "revoked" || e.eventType === "mock_off"
                          ? "bkf-tag--bad"
                          : "bkf-tag--ok"
                      }`}
                    >
                      {eventTypeLabel(e.eventType)}
                    </span>
                    {e.reason ? (
                      <div className="bkf-mono" style={{ marginTop: 4 }}>
                        {e.reason}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="bkf-user">
                      <strong>{e.displayName || e.email || "—"}</strong>
                      <span>{e.email || e.uid}</span>
                    </div>
                  </td>
                  <td>
                    <div className="bkf-user">
                      <strong>{planLabel(e.planType)}</strong>
                      <span className="bkf-mono">{e.productId || "—"}</span>
                    </div>
                  </td>
                  <td>{sourceLabel(e.source)}</td>
                  <td className="bkf-mono">{formatDate(e.premiumUntil)}</td>
                </tr>
              ))}
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="bkf-empty">
                      Ainda não há eventos. Eles aparecem após compras, mocks ou
                      expirações processadas pelas Functions atualizadas.
                    </p>
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
