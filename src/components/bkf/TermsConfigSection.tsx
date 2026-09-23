"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  emptyTermsDocument,
  formatTermsLastUpdate,
  loadLatestTermsDocument,
  publishNewTermsVersion,
  saveTermsInPlace,
  type LegalTermsDocument,
  type TermsClause,
} from "@/lib/bkf/legal-documents-firestore";

type Props = {
  isAdmin: boolean;
};

export function TermsConfigSection({ isAdmin }: Props) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<LegalTermsDocument>(emptyTermsDocument());
  const [title, setTitle] = useState(current.title);
  const [lastUpdate, setLastUpdate] = useState(current.lastUpdate);
  const [clauses, setClauses] = useState<TermsClause[]>(current.clauses);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void loadLatestTermsDocument()
      .then((doc) => {
        if (cancelled) return;
        applyDocument(doc);
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReady(true);
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar legal_documents.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function applyDocument(doc: LegalTermsDocument) {
    setCurrent(doc);
    setTitle(doc.title);
    setLastUpdate(doc.lastUpdate || formatTermsLastUpdate());
    setClauses(doc.clauses.length ? doc.clauses : [{ title: "", body: "" }]);
  }

  function updateClause(index: number, patch: Partial<TermsClause>) {
    setClauses((prev) =>
      prev.map((clause, i) => (i === index ? { ...clause, ...patch } : clause)),
    );
  }

  function addClause() {
    setClauses((prev) => [...prev, { title: "", body: "" }]);
  }

  function removeClause(index: number) {
    setClauses((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

  function formInput(): { title: string; lastUpdate: string; clauses: TermsClause[] } {
    return {
      title,
      lastUpdate: lastUpdate.trim() || formatTermsLastUpdate(),
      clauses,
    };
  }

  async function onSaveInPlace(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin || busy) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const saved = await saveTermsInPlace(current, formInput());
      applyDocument(saved);
      setMsg(
        `Texto atualizado na versão ${saved.version}. Quem já aceitou essa versão não verá a tela de aceite de novo.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar os termos.");
    } finally {
      setBusy(false);
    }
  }

  async function onPublishNewVersion() {
    if (!isAdmin || busy) return;
    const nextHint = current.exists ? "próximo patch" : current.version;
    const ok = window.confirm(
      current.exists
        ? `Publicar uma nova versão? O app vai exigir novo aceite de todos os usuários (versão atual ${current.version} → próximo patch).`
        : `Criar o primeiro documento de termos (versão ${nextHint})?`,
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const saved = await publishNewTermsVersion(current, formInput());
      applyDocument(saved);
      setMsg(`Nova versão ${saved.version} publicada. O app vai pedir novo aceite.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao publicar nova versão.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <p className="bkf-empty">Carregando termos…</p>;
  }

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.85rem",
        padding: "1rem",
        display: "grid",
        gap: "0.75rem",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "1rem" }}>Termos de uso (app)</h3>
      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
        O app lê <code>legal_documents</code> no Firestore. Salvar na mesma
        versão só troca o texto. Publicar nova versão (1.0.0 → 1.0.1) exige
        aceite de novo. O site institucional é outro deploy.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <span className="bkf-tag bkf-tag--ok">
          {current.exists ? `versão ${current.version}` : "ainda não existe"}
        </span>
        {current.exists ? (
          <span className="bkf-mono" style={{ fontSize: 12 }}>
            {current.docId}
            {current.updatedAt
              ? ` · ${new Date(current.updatedAt).toLocaleString("pt-BR")}`
              : ""}
          </span>
        ) : (
          <span className="bkf-mono" style={{ fontSize: 12 }}>
            será criado ao publicar a primeira versão
          </span>
        )}
      </div>

      <form onSubmit={onSaveInPlace} style={{ display: "grid", gap: "0.75rem" }}>
        <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}>
          Título
          <input
            className="bkf-input"
            value={title}
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}>
          Data exibida (“Atualizado em”)
          <input
            className="bkf-input"
            value={lastUpdate}
            disabled={busy}
            onChange={(e) => setLastUpdate(e.target.value)}
            style={{ maxWidth: "20rem" }}
          />
        </label>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {clauses.map((clause, index) => (
            <div
              key={`clause-${index}`}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.7rem",
                padding: "0.75rem",
                display: "grid",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "0.85rem" }}>
                  Cláusula {index + 1}
                </strong>
                <button
                  type="button"
                  className="bkf-chip"
                  disabled={busy || clauses.length <= 1}
                  onClick={() => removeClause(index)}
                >
                  Remover
                </button>
              </div>
              <input
                className="bkf-input"
                placeholder="Título da cláusula"
                value={clause.title}
                disabled={busy}
                onChange={(e) => updateClause(index, { title: e.target.value })}
              />
              <textarea
                className="bkf-input"
                rows={5}
                placeholder="Texto da cláusula"
                value={clause.body}
                disabled={busy}
                onChange={(e) => updateClause(index, { body: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </div>
          ))}
        </div>

        <div>
          <button
            type="button"
            className="bkf-chip"
            disabled={busy}
            onClick={addClause}
          >
            + Cláusula
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button
            type="submit"
            className="pill pill-blue"
            disabled={busy || !current.exists}
          >
            {busy ? "Salvando…" : "Salvar texto (mesma versão)"}
          </button>
          <button
            type="button"
            className="pill"
            disabled={busy}
            onClick={() => void onPublishNewVersion()}
          >
            Publicar nova versão (exige aceite)
          </button>
        </div>
      </form>

      {msg ? (
        <p style={{ margin: 0, color: "#166534", fontSize: "0.875rem" }}>{msg}</p>
      ) : null}
      {error ? (
        <p style={{ margin: 0, color: "#b00020", fontSize: "0.875rem" }}>{error}</p>
      ) : null}
    </section>
  );
}
