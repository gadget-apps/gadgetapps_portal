"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { KpiStrip } from "@/components/bkf/KpiStrip";
import { DashBarChart } from "@/components/bkf/DashBarChart";
import { isBkfAdminSession } from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";
import { setUserDisabledByAdmin } from "@/lib/bkf/users-firestore";
import {
  REPORTS_RESOLUTION_PRESETS,
  presetsForDisplay,
} from "@/lib/bkf/resolution-codes";
import { getAppById } from "@/data/apps";
import {
  formatReportDt,
  isSeedConnectionId,
  loadConnectionMessages,
  loadModerationReports,
  logConversationView,
  reportsMetricsFromRows,
  resolveModerationReport,
  type ConnectionChatMessage,
  type ModerationReport,
} from "@/lib/bkf/reports-firestore";

type Props = { appId: string };

type Filter = "open" | "all" | "reviewed" | "dismissed";

export function ReportsModule({ appId }: Props) {
  const appName = getAppById(appId)?.name || appId;
  const reportPresets = presetsForDisplay(REPORTS_RESOLUTION_PRESETS, appName);
  const [rows, setRows] = useState<ModerationReport[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("open");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selected, setSelected] = useState<ModerationReport | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [resolutionCodes, setResolutionCodes] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ConnectionChatMessage[]>(
    [],
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    setIsAdmin(isBkfAdminSession());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    void loadModerationReports()
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
          err instanceof Error ? err.message : "Falha ao carregar denúncias.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [appId]);

  const metrics = useMemo(() => reportsMetricsFromRows(rows), [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "open" && r.status !== "open") return false;
      if (filter === "reviewed" && r.status !== "reviewed") return false;
      if (filter === "dismissed" && r.status !== "dismissed") return false;
      if (!query) return true;
      return (
        r.reason.toLowerCase().includes(query) ||
        r.details.toLowerCase().includes(query) ||
        r.reporterName.toLowerCase().includes(query) ||
        r.reportedName.toLowerCase().includes(query) ||
        r.reporterEmail.toLowerCase().includes(query) ||
        r.reportedEmail.toLowerCase().includes(query)
      );
    });
  }, [rows, filter, q]);

  async function closeReport(
    report: ModerationReport,
    status: "reviewed" | "dismissed",
  ) {
    if (busyId || !isAdmin) return;
    setBusyId(report.id);
    setError(null);
    try {
      await resolveModerationReport({
        reportId: report.id,
        status,
        reviewNote,
        resolutionCodes,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status,
                reviewNote: reviewNote.trim(),
                resolutionCodes,
                reviewedAt: new Date().toISOString(),
                reviewedByEmail:
                  getAngelsCareAuth().currentUser?.email?.toLowerCase() ?? "",
              }
            : r,
        ),
      );
      setNote(
        status === "reviewed"
          ? "Denúncia marcada como revisada. O denunciante recebe um push."
          : "Denúncia descartada. O denunciante recebe um push.",
      );
      setSelected(null);
      setReviewNote("");
      setResolutionCodes([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar denúncia.");
    } finally {
      setBusyId(null);
    }
  }

  async function disableReported(report: ModerationReport) {
    if (busyId || !isAdmin) return;
    const ok = window.confirm(
      `Desativar a conta de ${report.reportedName}? A pessoa não conseguirá entrar no app.`,
    );
    if (!ok) return;
    setBusyId(report.id);
    setError(null);
    try {
      await setUserDisabledByAdmin(report.reportedUserId, true);
      setNote(`${report.reportedName} desativado. Pode marcar a denúncia como revisada.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao desativar usuário.");
    } finally {
      setBusyId(null);
    }
  }

  function openReport(report: ModerationReport) {
    setSelected(report);
    setReviewNote(report.reviewNote || "");
    setResolutionCodes(report.resolutionCodes || []);
    setChatOpen(false);
    setChatMessages([]);
    setChatError(null);
  }

  function closeModal() {
    setSelected(null);
    setChatOpen(false);
    setChatMessages([]);
    setChatError(null);
  }

  async function openConversationForModeration(report: ModerationReport) {
    if (!isAdmin || chatLoading) return;

    if (report.isSeed || isSeedConnectionId(report.connectionId)) {
      setChatError(
        "Denúncia de teste (seed): não há conversa real no matching.",
      );
      return;
    }

    const ok = window.confirm(
      "Abrir a conversa apenas para análise desta denúncia?\n\n" +
        "Finalidade: moderação e prevenção a uso ilícito da plataforma " +
        "(acesso restrito ao admin, com registro de auditoria).\n\n" +
        "Não use este acesso fora desse contexto.",
    );
    if (!ok) return;

    setChatLoading(true);
    setChatError(null);
    try {
      await logConversationView(report.id);
      const msgs = await loadConnectionMessages(report.connectionId);
      setChatMessages(msgs);
      setChatOpen(true);
      setNote("Acesso à conversa registrado na denúncia (auditoria).");
    } catch (e) {
      setChatError(
        e instanceof Error
          ? e.message
          : "Falha ao carregar a conversa. Verifique permissões.",
      );
    } finally {
      setChatLoading(false);
    }
  }

  if (appId !== "angels_care") {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Denúncias ainda não disponíveis para este app.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Somente o admin BKF acessa Denúncias.</p>
      </div>
    );
  }

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Denúncias</h2>
          <p className="bkf-panel__sub">
            Origem: chat do Angel&apos;s Care (Denunciar). Fila para análise
            admin — bloquear no app é aparte e fica entre os usuários.
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
            label: "Abertas",
            value: metrics.open,
            tone: metrics.open > 0 ? "warn" : "ok",
          },
          { label: "Revisadas", value: metrics.reviewed, tone: "ok" },
          { label: "Descartadas", value: metrics.dismissed },
          { label: "Total", value: metrics.total },
        ]}
      />

      <div className="bkf-dash__charts bkf-dash__charts--compact">
        <DashBarChart
          title="Por status"
          items={[
            { label: "Abertas", value: metrics.open },
            { label: "Revisadas", value: metrics.reviewed },
            { label: "Descartadas", value: metrics.dismissed },
          ]}
          emptyLabel={ready ? "Nenhuma denúncia ainda" : "Carregando…"}
        />
      </div>

      <div className="bkf-toolbar">
        <input
          className="bkf-input"
          placeholder="Buscar motivo, nomes ou e-mails…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="bkf-filters">
          {(
            [
              ["open", "Abertas"],
              ["all", "Todas"],
              ["reviewed", "Revisadas"],
              ["dismissed", "Descartadas"],
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
        <p className="bkf-empty">Carregando denúncias…</p>
      ) : (
        <div className="bkf-table-wrap">
          <table className="bkf-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Motivo</th>
                <th>Denunciante</th>
                <th>Denunciado</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="bkf-mono">{formatReportDt(r.createdAt)}</td>
                  <td>
                    <div className="bkf-user">
                      <strong>{r.reason}</strong>
                      {r.details ? <span>{r.details}</span> : null}
                    </div>
                  </td>
                  <td>
                    <div className="bkf-user">
                      <strong>{r.reporterName}</strong>
                      <span>{r.reporterEmail || r.reporterId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="bkf-user">
                      <strong>{r.reportedName}</strong>
                      <span>{r.reportedEmail || r.reportedUserId}</span>
                    </div>
                  </td>
                  <td>
                    {r.status === "open" ? (
                      <span className="bkf-tag bkf-tag--bad">Aberta</span>
                    ) : r.status === "reviewed" ? (
                      <span className="bkf-tag bkf-tag--ok">Revisada</span>
                    ) : (
                      <span className="bkf-tag">Descartada</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="bkf-action"
                      onClick={() => openReport(r)}
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="bkf-empty">
                      Nenhuma denúncia neste filtro. Elas aparecem quando um
                      usuário denuncia no chat do app.
                    </p>
                  </td>
                </tr>
              ) : null}
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
            onClick={closeModal}
          />
          <div className="bkf-modal__card bkf-modal__card--wide">
            <div className="bkf-modal__head">
              <div>
                <h3 className="bkf-modal__title">Denúncia</h3>
                <p className="bkf-modal__sub">
                  {formatReportDt(selected.createdAt)} · {selected.reason}
                </p>
              </div>
              <button
                type="button"
                className="bkf-action"
                onClick={closeModal}
              >
                Fechar
              </button>
            </div>

            <div className="bkf-field-row">
              <div className="bkf-field">
                <span>Denunciante</span>
                <strong>{selected.reporterName}</strong>
                <span className="bkf-mono">
                  {selected.reporterEmail || selected.reporterId}
                </span>
              </div>
              <div className="bkf-field">
                <span>Denunciado</span>
                <strong>{selected.reportedName}</strong>
                <span className="bkf-mono">
                  {selected.reportedEmail || selected.reportedUserId}
                </span>
              </div>
            </div>

            {selected.details ? (
              <div className="bkf-field">
                <span>Detalhes</span>
                <p style={{ margin: 0 }}>{selected.details}</p>
              </div>
            ) : null}

            <div className="bkf-field">
              <span>Connection</span>
              <span className="bkf-mono">{selected.connectionId || "—"}</span>
            </div>

            <section className="bkf-mod-chat">
              <div className="bkf-mod-chat__head">
                <h4>Conversa (moderação)</h4>
                <p>
                  Acesso só pelo admin, somente para analisar esta denúncia e
                  impedir uso ilícito. A abertura fica registrada.
                </p>
              </div>

              {!chatOpen ? (
                <div className="bkf-mod-chat__gate">
                  <button
                    type="button"
                    className="bkf-action bkf-action--primary"
                    disabled={chatLoading}
                    onClick={() => void openConversationForModeration(selected)}
                  >
                    {chatLoading
                      ? "Abrindo…"
                      : "Abrir conversa para análise"}
                  </button>
                  {chatError ? (
                    <p className="bkf-toast" style={{ color: "#b00020" }}>
                      {chatError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="bkf-mod-chat__thread" aria-label="Histórico do chat">
                  {chatMessages.length === 0 ? (
                    <p className="bkf-empty">
                      Nenhuma mensagem nesta connection (ou conversa vazia).
                    </p>
                  ) : (
                    chatMessages.map((m) => {
                      const fromReporter = m.senderId === selected.reporterId;
                      const fromReported =
                        m.senderId === selected.reportedUserId;
                      const side = fromReporter
                        ? "reporter"
                        : fromReported
                          ? "reported"
                          : "other";
                      const label = fromReporter
                        ? selected.reporterName
                        : fromReported
                          ? selected.reportedName
                          : m.isSystem
                            ? "Sistema"
                            : "Outro";
                      return (
                        <div
                          key={m.id}
                          className={`bkf-mod-bubble is-${side}${m.isSystem ? " is-system" : ""}`}
                        >
                          <div className="bkf-mod-bubble__meta">
                            <strong>{label}</strong>
                            <span>{formatReportDt(m.timestamp)}</span>
                          </div>
                          <p className="bkf-mod-bubble__text">
                            {m.isDeleted
                              ? "(mensagem apagada)"
                              : m.text || "—"}
                            {m.isEdited && !m.isDeleted ? " · editada" : ""}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </section>

            <label className="bkf-field">
              <span>Nota da análise (atalhos KPI)</span>
              <div
                style={{
                  display: "flex",
                  gap: "0.35rem",
                  flexWrap: "wrap",
                  marginBottom: "0.5rem",
                }}
              >
                {reportPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`bkf-chip ${resolutionCodes.includes(preset.id) ? "is-on" : ""}`}
                    disabled={busyId === selected.id || selected.status !== "open"}
                    onClick={() => {
                      setResolutionCodes((prev) =>
                        prev.includes(preset.id)
                          ? prev.filter((id) => id !== preset.id)
                          : [...prev, preset.id],
                      );
                      setReviewNote((prev) => {
                        const trimmed = prev.trim();
                        if (trimmed.includes(preset.text)) {
                          return trimmed
                            .split("\n")
                            .filter((line) => line.trim() !== preset.text)
                            .join("\n")
                            .trim();
                        }
                        return trimmed ? `${trimmed}\n${preset.text}` : preset.text;
                      });
                    }}
                    title={preset.text}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <textarea
                className="bkf-input bkf-textarea"
                rows={3}
                value={reviewNote}
                disabled={busyId === selected.id || selected.status !== "open"}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="O que foi verificado / decisão…"
              />
            </label>

            <div className="bkf-modal__actions" style={{ flexWrap: "wrap" }}>
              {selected.status === "open" && !selected.isSeed ? (
                <p
                  style={{
                    flex: "1 1 100%",
                    margin: "0 0 0.35rem",
                    fontSize: "0.8rem",
                    color: "#6b7280",
                  }}
                >
                  Ao fechar (revisada ou descartada), o denunciante recebe um
                  aviso por push — texto genérico, sem detalhes da conversa.
                </p>
              ) : null}
              {!selected.isSeed ? (
                <button
                  type="button"
                  className="bkf-action bkf-action--danger"
                  disabled={busyId === selected.id}
                  onClick={() => void disableReported(selected)}
                >
                  Desativar denunciado
                </button>
              ) : (
                <span className="bkf-tag">Seed de teste</span>
              )}
              <Link
                href={`/intranet/bkf/apps/${appId}/users/`}
                className="bkf-action"
                style={{ textDecoration: "none" }}
              >
                Ir a Usuários
              </Link>
              {selected.status === "open" ? (
                <>
                  <button
                    type="button"
                    className="bkf-action"
                    disabled={busyId === selected.id}
                    onClick={() => void closeReport(selected, "dismissed")}
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    className="bkf-action bkf-action--primary"
                    disabled={busyId === selected.id}
                    onClick={() => void closeReport(selected, "reviewed")}
                  >
                    {busyId === selected.id ? "…" : "Marcar revisada"}
                  </button>
                </>
              ) : (
                <span className="bkf-tag">
                  Já {selected.status === "reviewed" ? "revisada" : "descartada"}
                  {" · denunciante notificado por push"}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
