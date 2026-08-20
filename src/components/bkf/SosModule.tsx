"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { KpiStrip } from "@/components/bkf/KpiStrip";
import { DashBarChart } from "@/components/bkf/DashBarChart";
import { isBkfAdminSession } from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";
import {
  formatSosDt,
  loadSosAuditEvents,
  outcomeLabel,
  sosMetricsFromRows,
  triggerLabel,
  type SosAuditEvent,
} from "@/lib/bkf/sos-firestore";

type Props = { appId: string };

type Filter =
  | "all"
  | "alert_sent"
  | "false_alarm_sent"
  | "deduplicated"
  | "suppressed_no_premium";

function outcomeTone(outcome: string): string {
  if (outcome === "alert_sent") return "bkf-tag--bad";
  if (outcome === "false_alarm_sent") return "bkf-tag--ok";
  return "";
}

function deliveryLabel(status: string): string {
  if (status === "sent") return "Enviado";
  if (status === "failed") return "Falhou";
  if (status === "skipped") return "Ignorado";
  return status || "—";
}

function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function SosModule({ appId }: Props) {
  const [rows, setRows] = useState<SosAuditEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selected, setSelected] = useState<SosAuditEvent | null>(null);
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

    void loadSosAuditEvents()
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
          err instanceof Error
            ? err.message
            : "Falha ao carregar auditoria SOS.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [appId]);

  const metrics = useMemo(() => sosMetricsFromRows(rows), [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.outcome !== filter) return false;
      if (!query) return true;
      return (
        r.assistedName.toLowerCase().includes(query) ||
        r.assistedId.toLowerCase().includes(query) ||
        r.contractorId.toLowerCase().includes(query) ||
        r.senderUid.toLowerCase().includes(query) ||
        r.reason.toLowerCase().includes(query) ||
        r.title.toLowerCase().includes(query) ||
        r.body.toLowerCase().includes(query) ||
        r.dedupeKey.toLowerCase().includes(query) ||
        outcomeLabel(r.outcome).toLowerCase().includes(query) ||
        triggerLabel(r.triggerSource).toLowerCase().includes(query)
      );
    });
  }, [rows, filter, q]);

  if (appId !== "angels_care") {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Auditoria SOS ainda não disponível para este app.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Somente o admin BKF acessa a auditoria SOS.</p>
      </div>
    );
  }

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">SOS — auditoria</h2>
          <p className="bkf-panel__sub">
            Registro de botão SOS e sensor de queda. O aviso vai automaticamente
            ao contratante e à rede de profissionais contratados — aqui não há
            fila de atendimento; o BKF só resguarda evidência.
          </p>
        </div>
        <p className="bkf-panel__count">
          {ready ? `${filtered.length} exibidos` : "carregando…"}
        </p>
      </div>

      <KpiStrip
        loading={!ready}
        items={[
          {
            label: "Alertas",
            value: metrics.alerts,
            tone: metrics.alerts > 0 ? "warn" : "default",
          },
          {
            label: "Falsos alarmes",
            value: metrics.falseAlarms,
            tone: "ok",
          },
          { label: "Suprimidos", value: metrics.suppressed },
          { label: "Duplicados", value: metrics.deduped },
        ]}
      />

      <div className="bkf-dash__charts bkf-dash__charts--compact">
        <DashBarChart
          title="Últimos eventos (amostra)"
          items={[
            { label: "Alertas", value: metrics.alerts },
            { label: "Falsos", value: metrics.falseAlarms },
            { label: "Suprimidos", value: metrics.suppressed },
            { label: "Duplicados", value: metrics.deduped },
          ]}
          emptyLabel={ready ? "Nenhum evento ainda" : "Carregando…"}
        />
      </div>

      <div className="bkf-toolbar">
        <input
          className="bkf-input"
          placeholder="Buscar assistido, IDs, motivo, dedupe…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="bkf-filters">
          {(
            [
              ["all", "Todos"],
              ["alert_sent", "Alertas"],
              ["false_alarm_sent", "Falsos"],
              ["deduplicated", "Duplicados"],
              ["suppressed_no_premium", "Suprimidos"],
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

      {!ready ? (
        <p className="bkf-empty">Carregando auditoria…</p>
      ) : filtered.length === 0 ? (
        <p className="bkf-empty">
          Nenhum evento nesta amostra. Disparos reais do app passam a
          aparecer após o deploy da Function com log enriquecido.
        </p>
      ) : (
        <div className="bkf-table-wrap">
          <table className="bkf-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Origem</th>
                <th>Resultado</th>
                <th>Assistido</th>
                <th>Envios</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{formatSosDt(r.createdAt || r.clientTimestamp)}</td>
                  <td>{triggerLabel(r.triggerSource)}</td>
                  <td>
                    <span className={`bkf-tag ${outcomeTone(r.outcome)}`}>
                      {outcomeLabel(r.outcome)}
                    </span>
                  </td>
                  <td>
                    <div>{r.assistedName || "—"}</div>
                    <div className="bkf-mono" style={{ fontSize: 12 }}>
                      {r.assistedId || "—"}
                    </div>
                  </td>
                  <td>{r.sentCount}</td>
                  <td>
                    <button
                      type="button"
                      className="pill pill-blue"
                      onClick={() => setSelected(r)}
                    >
                      Detalhe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <div className="bkf-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="bkf-modal__backdrop"
            aria-label="Fechar"
            onClick={() => setSelected(null)}
          />
          <div className="bkf-modal__card bkf-modal__card--wide">
            <div className="bkf-modal__head">
              <div>
                <h3 className="bkf-modal__title">
                  {outcomeLabel(selected.outcome)}
                </h3>
                <p className="bkf-modal__sub">
                  {formatSosDt(selected.createdAt || selected.clientTimestamp)}{" "}
                  · {triggerLabel(selected.triggerSource)}
                </p>
              </div>
              <button
                type="button"
                className="pill"
                onClick={() => setSelected(null)}
              >
                Fechar
              </button>
            </div>

            <div className="bkf-meta-grid">
              <div>
                <span className="bkf-label">Assistido</span>
                <strong>{selected.assistedName || "—"}</strong>
                <div className="bkf-mono">{selected.assistedId || "—"}</div>
              </div>
              <div>
                <span className="bkf-label">Contratante</span>
                <div className="bkf-mono">{selected.contractorId || "—"}</div>
              </div>
              <div>
                <span className="bkf-label">Remetente (UID)</span>
                <div className="bkf-mono">{selected.senderUid || "—"}</div>
              </div>
              <div>
                <span className="bkf-label">Tipo notificação</span>
                <div>{selected.notificationType || "—"}</div>
              </div>
            </div>

            {(selected.title || selected.body || selected.reason) && (
              <div style={{ marginTop: 16 }}>
                <span className="bkf-label">Mensagem / motivo</span>
                {selected.title ? (
                  <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
                    {selected.title}
                  </p>
                ) : null}
                {selected.body ? (
                  <p style={{ margin: "4px 0 0" }}>{selected.body}</p>
                ) : null}
                {selected.reason ? (
                  <p style={{ margin: "4px 0 0", opacity: 0.85 }}>
                    {selected.reason}
                  </p>
                ) : null}
              </div>
            )}

            <div className="bkf-meta-grid" style={{ marginTop: 16 }}>
              <div>
                <span className="bkf-label">Notificar contratante</span>
                <div>
                  {selected.notifyContractorRequested ? "Sim" : "Não"}
                </div>
              </div>
              <div>
                <span className="bkf-label">Premium (queda)</span>
                <div>
                  {selected.premiumCheck
                    ? selected.premiumCheck.required
                      ? selected.premiumCheck.contractorPremiumEffective
                        ? "Exigido — OK"
                        : "Exigido — sem Premium"
                      : "Não exigido (SOS manual)"
                    : "—"}
                </div>
              </div>
              <div>
                <span className="bkf-label">Dedupe</span>
                <div className="bkf-mono" style={{ wordBreak: "break-all" }}>
                  {selected.dedupeKey || "—"}
                  {selected.deduplicated ? " (duplicado)" : ""}
                </div>
              </div>
              <div>
                <span className="bkf-label">Timestamp cliente</span>
                <div className="bkf-mono">
                  {selected.clientTimestamp || "—"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <span className="bkf-label">Localização no evento</span>
              {selected.locationAtEvent?.available &&
              selected.locationAtEvent.latitude != null &&
              selected.locationAtEvent.longitude != null ? (
                <p style={{ margin: "4px 0 0" }}>
                  {selected.locationAtEvent.latitude},{" "}
                  {selected.locationAtEvent.longitude}
                  {selected.locationAtEvent.accuracy != null
                    ? ` (±${selected.locationAtEvent.accuracy} m)`
                    : ""}{" "}
                  <a
                    href={mapsUrl(
                      selected.locationAtEvent.latitude,
                      selected.locationAtEvent.longitude,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir mapa
                  </a>
                </p>
              ) : (
                <p style={{ margin: "4px 0 0" }}>Indisponível no snapshot</p>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <span className="bkf-label">Análise de áudio (IA)</span>
              {!selected.ai.attempted ? (
                <p style={{ margin: "4px 0 0" }}>Não tentada</p>
              ) : (
                <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                  <li>
                    Emergência:{" "}
                    {selected.ai.isEmergency == null
                      ? "—"
                      : selected.ai.isEmergency
                        ? "sim"
                        : "não"}
                  </li>
                  <li>Contexto: {selected.ai.context || "—"}</li>
                  <li>
                    Falha na análise:{" "}
                    {selected.ai.analysisFailed ? "sim" : "não"}
                  </li>
                  <li className="bkf-mono" style={{ wordBreak: "break-all" }}>
                    Áudio: {selected.ai.audioStoragePath || "—"}
                  </li>
                </ul>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <span className="bkf-label">IDs profissionais (cliente)</span>
              <p className="bkf-mono" style={{ margin: "4px 0 0", wordBreak: "break-all" }}>
                {selected.professionalIdsFromClient.length
                  ? selected.professionalIdsFromClient.join(", ")
                  : "—"}
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <span className="bkf-label">
                Destinatários resolvidos ({selected.resolvedRecipientIds.length})
              </span>
              <p className="bkf-mono" style={{ margin: "4px 0 0", wordBreak: "break-all" }}>
                {selected.resolvedRecipientIds.length
                  ? selected.resolvedRecipientIds.join(", ")
                  : "—"}
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <span className="bkf-label">
                Alvos FCM ({selected.fcmTargetIds.length}) · enviados:{" "}
                {selected.sentCount}
              </span>
              {selected.delivery.length === 0 ? (
                <p style={{ margin: "4px 0 0" }}>Sem relatório de entrega</p>
              ) : (
                <div className="bkf-table-wrap" style={{ marginTop: 8 }}>
                  <table className="bkf-table">
                    <thead>
                      <tr>
                        <th>UID</th>
                        <th>Status</th>
                        <th>Detalhe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.delivery.map((d, i) => (
                        <tr key={`${d.recipientId}-${i}`}>
                          <td className="bkf-mono">{d.recipientId}</td>
                          <td>{deliveryLabel(d.status)}</td>
                          <td style={{ wordBreak: "break-all" }}>
                            {d.messageId ||
                              d.error ||
                              d.skippedReason ||
                              "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bkf-modal__actions">
              <span className="bkf-mono" style={{ fontSize: 12, opacity: 0.7 }}>
                id {selected.id}
              </span>
              <button
                type="button"
                className="pill"
                onClick={() => setSelected(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
