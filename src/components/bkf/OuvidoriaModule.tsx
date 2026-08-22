"use client";

import { useEffect, useMemo, useState } from "react";
import { isBkfAdminSession } from "@/lib/bkf/operators";
import {
  formatFeedbackDt,
  loadOuvidoriaItems,
  ouvidoriaNotePresets,
  resolveOuvidoriaItem,
  typeLabelPt,
  type OuvidoriaItem,
  type OuvidoriaType,
} from "@/lib/bkf/feedback-firestore";
import { getAppById } from "@/data/apps";

type Props = { appId: string };
type StatusFilter = "open" | "all" | "reviewed" | "dismissed";
type TypeFilter = "all" | OuvidoriaType;
type SourceFilter = "all" | "site" | "app";

const DEFAULT_REPLY =
  "Olá,\n\nObrigado pelo contato com a Ouvidoria.\n\n";

export function OuvidoriaModule({ appId }: Props) {
  const appName = getAppById(appId)?.name || appId;
  const notePresets = ouvidoriaNotePresets(appName);
  const [rows, setRows] = useState<OuvidoriaItem[]>([]);
  const [ready, setReady] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selected, setSelected] = useState<OuvidoriaItem | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [resolutionCodes, setResolutionCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsAdmin(isBkfAdminSession());
  }, []);

  async function reload() {
    setReady(false);
    setError(null);
    try {
      const list = await loadOuvidoriaItems(appId);
      setRows(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar ouvidoria.",
      );
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    void reload();
  }, [appId]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
      return true;
    });
  }, [rows, statusFilter, typeFilter, sourceFilter]);

  function openItem(row: OuvidoriaItem) {
    setSelected(row);
    setReviewNote(row.reviewNote || "");
    setReplyBody(row.replyText || DEFAULT_REPLY);
    setResolutionCodes(row.resolutionCodes || []);
    setNote(null);
    setError(null);
  }

  function closeModal() {
    setSelected(null);
    setReviewNote("");
    setReplyBody("");
    setResolutionCodes([]);
  }

  function toggleNotePreset(preset: { id: string; label: string; text: string }) {
    setResolutionCodes((prev) => {
      if (prev.includes(preset.id)) {
        return prev.filter((id) => id !== preset.id);
      }
      return [...prev, preset.id];
    });
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
  }

  async function onResolve(status: "reviewed" | "dismissed") {
    if (!selected) return;

    if (status === "reviewed") {
      if (!selected.email) {
        setError("Sem e-mail do usuário — não é possível encerrar com envio.");
        return;
      }
      if (replyBody.trim().length < 10) {
        setError("Preencha a resposta ao usuário (mín. 10 caracteres) antes de marcar como tratada.");
        return;
      }
    }

    setBusy(true);
    setError(null);
    setNote(null);
    try {
      await resolveOuvidoriaItem(
        selected,
        status,
        reviewNote,
        status === "reviewed" ? replyBody : "",
        resolutionCodes,
      );
      if (status === "reviewed") {
        const parts = ["Marcada como tratada.", "E-mail de resposta será enviado ao usuário."];
        if (selected.source === "app") {
          parts.push("Push enviado no app.");
        }
        setNote(parts.join(" "));
      } else {
        setNote("Descartada (sem e-mail ao usuário).");
      }
      closeModal();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar.");
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Somente Admin acessa a ouvidoria.</p>
      </div>
    );
  }

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Ouvidoria</h2>
          <p className="bkf-panel__sub">
            Escreva a resposta, marque como tratada — o e-mail vai automaticamente
            ao usuário. No app, também há push.
          </p>
        </div>
      </div>

      {error ? (
        <p style={{ color: "#b00020", marginBottom: "0.75rem" }}>{error}</p>
      ) : null}
      {note ? (
        <p style={{ color: "#166534", marginBottom: "0.75rem" }}>{note}</p>
      ) : null}

      <div style={{ marginBottom: "0.75rem" }}>
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.8rem", color: "#6b7280" }}>
          Status
        </p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(
            [
              ["open", "Abertas"],
              ["reviewed", "Tratadas"],
              ["dismissed", "Descartadas"],
              ["all", "Todas"],
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
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.8rem", color: "#6b7280" }}>
          Tipo
        </p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(
            [
              ["all", "Todos"],
              ["elogio", "Elogios"],
              ["sugestao", "Sugestões"],
              ["reclamacao", "Reclamações"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`bkf-chip ${typeFilter === id ? "is-on" : ""}`}
              onClick={() => setTypeFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.8rem", color: "#6b7280" }}>
          Canal
        </p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(
            [
              ["all", "Todos"],
              ["app", "App"],
              ["site", "Site"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`bkf-chip ${sourceFilter === id ? "is-on" : ""}`}
              onClick={() => setSourceFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!ready ? (
        <p className="bkf-empty">Carregando…</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {visible.map((row) => (
            <li key={`${row.collection}-${row.id}`}>
              <button
                type="button"
                onClick={() => openItem(row)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.85rem 0.25rem",
                  border: 0,
                  borderBottom: "1px solid var(--line, #e5e7eb)",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong>{typeLabelPt(row.type)}</strong>
                  <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                    {" · "}
                    {row.source === "app" ? "App" : "Site"}
                    {" · "}
                    {formatFeedbackDt(row.createdAt)}
                    {" · "}
                    {row.email || "sem e-mail"}
                  </span>
                  <div
                    style={{
                      marginTop: "0.25rem",
                      fontSize: "0.9rem",
                      color: "#374151",
                    }}
                  >
                    {row.message.slice(0, 140)}
                    {row.message.length > 140 ? "…" : ""}
                  </div>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: "0.8rem",
                    color: "#9a3412",
                    fontWeight: 600,
                    marginTop: "0.15rem",
                  }}
                >
                  Abrir →
                </span>
              </button>
            </li>
          ))}
          {visible.length === 0 ? (
            <li className="bkf-empty">Nenhum item neste filtro.</li>
          ) : null}
        </ul>
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
                <h3 className="bkf-modal__title">
                  {typeLabelPt(selected.type)}
                </h3>
                <p className="bkf-modal__sub">
                  {selected.source === "app" ? "App" : "Site"}
                  {" · "}
                  {formatFeedbackDt(selected.createdAt)}
                  {" · "}
                  {selected.status === "open"
                    ? "Aberta"
                    : selected.status === "reviewed"
                      ? "Tratada"
                      : "Descartada"}
                </p>
              </div>
              <button type="button" className="bkf-action" onClick={closeModal}>
                Fechar
              </button>
            </div>

            <div className="bkf-field">
              <span>Usuário</span>
              <strong>{selected.name || "—"}</strong>
              <span className="bkf-mono">{selected.email || "sem e-mail"}</span>
            </div>

            <div className="bkf-field">
              <span>Mensagem</span>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {selected.message}
              </p>
            </div>

            {selected.status === "open" ? (
              <>
                <label className="bkf-field">
                  <span>Resposta ao usuário (enviada por e-mail ao marcar tratada)</span>
                  <textarea
                    className="bkf-input bkf-textarea"
                    rows={5}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    disabled={!selected.email || busy}
                    placeholder="Escreva a resposta que o usuário receberá por e-mail…"
                  />
                </label>

                <div className="bkf-field">
                  <span>Nota interna (atalhos — base para KPIs)</span>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.35rem",
                      flexWrap: "wrap",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {notePresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`bkf-chip ${resolutionCodes.includes(preset.id) ? "is-on" : ""}`}
                        disabled={busy}
                        onClick={() => toggleNotePreset(preset)}
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
                    disabled={busy}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Registro interno da tratativa…"
                  />
                </div>

                <div className="bkf-modal__actions" style={{ flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="pill pill-blue"
                    disabled={busy || !selected.email}
                    onClick={() => void onResolve("reviewed")}
                  >
                    Marcar tratada e enviar e-mail
                  </button>
                  <button
                    type="button"
                    className="bkf-action"
                    disabled={busy}
                    onClick={() => void onResolve("dismissed")}
                  >
                    Descartar
                  </button>
                  <p
                    style={{
                      flex: "1 1 100%",
                      margin: "0.35rem 0 0",
                      fontSize: "0.8rem",
                      color: "#6b7280",
                    }}
                  >
                    {selected.source === "app"
                      ? "Ao encerrar: e-mail com a resposta + push no app."
                      : "Ao encerrar: e-mail com a resposta (origem site, sem push)."}
                  </p>
                </div>
              </>
            ) : (
              <>
                {selected.replyText ? (
                  <div className="bkf-field">
                    <span>Resposta enviada</span>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {selected.replyText}
                    </p>
                  </div>
                ) : null}
                {selected.reviewNote ? (
                  <div className="bkf-field">
                    <span>Nota interna</span>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {selected.reviewNote}
                    </p>
                  </div>
                ) : null}
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
                  Item já encerrado.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
