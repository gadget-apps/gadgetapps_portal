"use client";

import { useCallback, useEffect, useState } from "react";
import { getAppById } from "@/data/apps";
import { isBkfAdminSession } from "@/lib/bkf/operators";
import {
  formatHours,
  loadKpiBundle,
  type ChannelSla,
  type KpiBundle,
} from "@/lib/bkf/kpi-firestore";

type Props = { appId: string };

function ChannelCard({ channel }: { channel: ChannelSla }) {
  return (
    <section
      style={{
        border: "1px solid var(--line, #e5e7eb)",
        borderRadius: "0.85rem",
        padding: "1rem 1.1rem",
        background: "var(--soft, #f8fafc)",
      }}
    >
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem" }}>
        {channel.title}
      </h3>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#6b7280" }}>
        Meta SLA: {channel.slaTargetHours}h · Fechados no prazo:{" "}
        {channel.pctWithinSla == null ? "—" : `${channel.pctWithinSla}%`}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: "0.65rem",
          marginBottom: "0.85rem",
        }}
      >
        <Metric label="Abertos" value={String(channel.open)} />
        <Metric label="Encerrados" value={String(channel.closed)} />
        <Metric label="Média TTC" value={formatHours(channel.avgCloseHours)} />
        <Metric
          label="Mediana TTC"
          value={formatHours(channel.medianCloseHours)}
        />
      </div>
      {channel.codeBreakdown.length > 0 ? (
        <div>
          <p
            style={{
              margin: "0 0 0.35rem",
              fontSize: "0.8rem",
              color: "#6b7280",
              fontWeight: 600,
            }}
          >
            Tratativas (códigos)
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {channel.codeBreakdown.slice(0, 8).map((row) => (
              <li
                key={row.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  fontSize: "0.875rem",
                  padding: "0.2rem 0",
                  borderBottom: "1px solid var(--line, #e5e7eb)",
                }}
              >
                <span>{row.label}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
          Sem códigos de tratativa ainda neste canal.
        </p>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "0.65rem",
        padding: "0.55rem 0.65rem",
        border: "1px solid var(--line, #e5e7eb)",
      }}
    >
      <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export function KpisModule({ appId }: Props) {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bundle, setBundle] = useState<KpiBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const app = getAppById(appId);

  const reload = useCallback(async () => {
    setReady(false);
    setError(null);
    try {
      setBundle(await loadKpiBundle(appId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar KPIs.");
      setBundle(null);
    } finally {
      setReady(true);
    }
  }, [appId]);

  useEffect(() => {
    setIsAdmin(isBkfAdminSession());
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void reload();
  }, [isAdmin, reload]);

  if (!isAdmin) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Somente Admin acessa KPIs e SLAs.</p>
      </div>
    );
  }

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">KPIs e SLAs</h2>
          <p className="bkf-panel__sub">
            Indicadores white-label de {app?.name || appId}: volume, tempo até
            encerramento (TTC) e códigos de tratativa (Ouvidoria, Denúncias,
            Chat).
          </p>
        </div>
        <button type="button" className="bkf-action" onClick={() => void reload()}>
          Atualizar
        </button>
      </div>

      {error ? (
        <p style={{ color: "#b00020", marginBottom: "0.75rem" }}>{error}</p>
      ) : null}

      {!ready || !bundle ? (
        <p className="bkf-empty">Carregando…</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "0.65rem",
              marginBottom: "1.1rem",
            }}
          >
            <Metric label="Abertos (todos)" value={String(bundle.totals.open)} />
            <Metric
              label="Encerrados"
              value={String(bundle.totals.closed)}
            />
            <Metric
              label="No prazo (SLA)"
              value={
                bundle.totals.closedWithClock
                  ? `${Math.round(
                      (bundle.totals.withinSla / bundle.totals.closedWithClock) *
                        100,
                    )}%`
                  : "—"
              }
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: "0.85rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {bundle.channels.map((ch) => (
              <ChannelCard key={ch.channel} channel={ch} />
            ))}
          </div>

          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            App: <code>{bundle.appId}</code> · Atualizado{" "}
            {new Date(bundle.loadedAt).toLocaleString("pt-BR")}. Metas padrão:
            Ouvidoria 48h · Denúncias 72h · Chat 24h.
          </p>
        </>
      )}
    </div>
  );
}
