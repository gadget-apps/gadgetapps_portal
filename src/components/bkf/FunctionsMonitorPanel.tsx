"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { KpiStrip } from "@/components/bkf/KpiStrip";
import { DashBarChart } from "@/components/bkf/DashBarChart";
import {
  formatFailureDt,
  functionFailureMetrics,
  loadFunctionFailures,
  triggerTypeLabel,
  type FunctionFailure,
} from "@/lib/bkf/functions-monitor-firestore";

type SeverityFilter = "all" | "error" | "warning";

export function FunctionsMonitorPanel() {
  const [rows, setRows] = useState<FunctionFailure[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FunctionFailure | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    void loadFunctionFailures()
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
            : "Falha ao carregar monitor de Functions.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => functionFailureMetrics(rows), [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "error" && r.severity === "warning") return false;
      if (filter === "warning" && r.severity !== "warning") return false;
      if (!query) return true;
      return (
        r.functionName.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query) ||
        r.message.toLowerCase().includes(query) ||
        r.triggerType.toLowerCase().includes(query) ||
        (r.uid || "").toLowerCase().includes(query)
      );
    });
  }, [rows, filter, q]);

  return (
    <>
      <p className="bkf-panel__sub" style={{ marginTop: 0 }}>
        Falhas e avisos gravados pelas Cloud Functions (chamadas e
        processamentos). Erros de cliente esperados (auth / argumento inválido)
        não entram aqui — só problemas internos, FCM zerado, schedulers e
        processamentos que falharam.
      </p>

      <KpiStrip
        loading={!ready}
        items={[
          {
            label: "Erros",
            value: metrics.errors,
            tone: metrics.errors > 0 ? "bad" : "ok",
          },
          {
            label: "Avisos",
            value: metrics.warnings,
            tone: metrics.warnings > 0 ? "warn" : "default",
          },
          { label: "Callable", value: metrics.callable },
          { label: "Na amostra", value: metrics.total },
        ]}
      />

      <div className="bkf-dash__charts bkf-dash__charts--compact">
        <DashBarChart
          title="Por tipo de trigger"
          items={[
            { label: "Callable", value: metrics.callable },
            { label: "Agendada", value: metrics.schedule },
            { label: "Firestore", value: metrics.firestore },
            { label: "HTTP", value: metrics.https },
          ]}
          emptyLabel={ready ? "Nenhuma falha registrada" : "Carregando…"}
        />
      </div>

      <div className="bkf-toolbar">
        <input
          className="bkf-input"
          placeholder="Buscar function, código, mensagem, UID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="bkf-filters">
          {(
            [
              ["all", "Todas"],
              ["error", "Erros"],
              ["warning", "Avisos"],
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
        <p className="bkf-empty">Carregando falhas…</p>
      ) : filtered.length === 0 ? (
        <p className="bkf-empty">
          Nenhuma falha nesta amostra. Eventos aparecem automaticamente quando
          uma Function falha ou reporta problema de processamento.
        </p>
      ) : (
        <div className="bkf-table-wrap">
          <table className="bkf-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Function</th>
                <th>Tipo</th>
                <th>Severidade</th>
                <th>Código</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{formatFailureDt(r.createdAt)}</td>
                  <td className="bkf-mono">{r.functionName || "—"}</td>
                  <td>{triggerTypeLabel(r.triggerType)}</td>
                  <td>
                    <span
                      className={`bkf-tag ${
                        r.severity === "warning"
                          ? ""
                          : "bkf-tag--bad"
                      }`}
                    >
                      {r.severity === "warning" ? "aviso" : "erro"}
                    </span>
                  </td>
                  <td className="bkf-mono">{r.code || "—"}</td>
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
                <h3 className="bkf-modal__title">{selected.functionName}</h3>
                <p className="bkf-modal__sub">
                  {formatFailureDt(selected.createdAt)} ·{" "}
                  {triggerTypeLabel(selected.triggerType)} · {selected.severity}
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
                <span className="bkf-label">Código</span>
                <div className="bkf-mono">{selected.code || "—"}</div>
              </div>
              <div>
                <span className="bkf-label">Fase</span>
                <div>{selected.phase || "—"}</div>
              </div>
              <div>
                <span className="bkf-label">UID</span>
                <div className="bkf-mono">{selected.uid || "—"}</div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <span className="bkf-label">Mensagem</span>
              <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
                {selected.message || "—"}
              </p>
            </div>

            {Object.keys(selected.context).length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <span className="bkf-label">Contexto</span>
                <pre
                  className="bkf-mono"
                  style={{
                    margin: "4px 0 0",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(selected.context, null, 2)}
                </pre>
              </div>
            ) : null}

            {selected.stack ? (
              <div style={{ marginTop: 16 }}>
                <span className="bkf-label">Stack</span>
                <pre
                  className="bkf-mono"
                  style={{
                    margin: "4px 0 0",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 240,
                    overflow: "auto",
                    fontSize: 11,
                  }}
                >
                  {selected.stack}
                </pre>
              </div>
            ) : null}

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
    </>
  );
}
