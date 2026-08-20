"use client";

import { useEffect, useState } from "react";
import {
  clearSeedSupportTickets,
  seedSupportTickets,
} from "@/lib/bkf/seed-support";
import {
  clearSeedModerationReports,
  seedModerationReports,
} from "@/lib/bkf/seed-reports";
import { isBkfAdminSession } from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

export function MocksModule() {
  const [busy, setBusy] = useState(false);
  const [ticketCount, setTicketCount] = useState(25);
  const [reportCount, setReportCount] = useState(15);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(isBkfAdminSession());
  }, []);

  async function onSeedTickets() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const n = Math.min(60, Math.max(5, Math.floor(ticketCount) || 25));
      const created = await seedSupportTickets(n);
      setMsg(
        `${created} tickets de teste criados na fila. Abra Chat / fila para validar performance.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar tickets.");
    } finally {
      setBusy(false);
    }
  }

  async function onClearTickets() {
    if (
      !window.confirm(
        "Apagar todos os tickets marcados como teste (isSeed)? Conversas reais não são afetadas.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const removed = await clearSeedSupportTickets();
      setMsg(`${removed} tickets de teste removidos.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao limpar tickets.");
    } finally {
      setBusy(false);
    }
  }

  async function onSeedReports() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const n = Math.min(60, Math.max(5, Math.floor(reportCount) || 15));
      const created = await seedModerationReports(n);
      setMsg(
        `${created} denúncias de teste criadas. Abra Denúncias para validar a fila.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar denúncias.");
    } finally {
      setBusy(false);
    }
  }

  async function onClearReports() {
    if (
      !window.confirm(
        "Apagar todas as denúncias marcadas como teste (isSeed)? Denúncias reais do app não são afetadas.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const removed = await clearSeedModerationReports();
      setMsg(`${removed} denúncias de teste removidas.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao limpar denúncias.");
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Somente o admin BKF acessa Mocks.</p>
      </div>
    );
  }

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Mocks</h2>
          <p className="bkf-panel__sub">
            Dados de teste (isSeed) para validar filas. Não cria usuários reais.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.85rem",
            padding: "1rem",
            display: "grid",
            gap: "0.75rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1rem" }}>
            Tickets de suporte (teste)
          </h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
            Gera conversas falsas em <code>support_threads</code> com{" "}
            <code>isSeed: true</code>.
          </p>

          <label
            style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}
          >
            Quantidade (5–60)
            <input
              className="bkf-input"
              type="number"
              min={5}
              max={60}
              value={ticketCount}
              disabled={busy}
              onChange={(e) => setTicketCount(Number(e.target.value))}
              style={{ maxWidth: "8rem" }}
            />
          </label>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            <button
              type="button"
              className="pill pill-blue"
              disabled={busy}
              onClick={onSeedTickets}
            >
              {busy ? "Aguarde…" : "Gerar tickets de teste"}
            </button>
            <button
              type="button"
              className="bkf-action"
              disabled={busy}
              onClick={onClearTickets}
            >
              Limpar tickets de teste
            </button>
          </div>
        </section>

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.85rem",
            padding: "1rem",
            display: "grid",
            gap: "0.75rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1rem" }}>
            Denúncias do chat (teste)
          </h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
            Gera denúncias aleatórias em <code>moderation_reports</code> com{" "}
            <code>isSeed: true</code>.
          </p>

          <label
            style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}
          >
            Quantidade (5–60)
            <input
              className="bkf-input"
              type="number"
              min={5}
              max={60}
              value={reportCount}
              disabled={busy}
              onChange={(e) => setReportCount(Number(e.target.value))}
              style={{ maxWidth: "8rem" }}
            />
          </label>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            <button
              type="button"
              className="pill pill-blue"
              disabled={busy}
              onClick={onSeedReports}
            >
              {busy ? "Aguarde…" : "Gerar denúncias de teste"}
            </button>
            <button
              type="button"
              className="bkf-action"
              disabled={busy}
              onClick={onClearReports}
            >
              Limpar denúncias de teste
            </button>
          </div>
        </section>

        {msg ? (
          <p style={{ margin: 0, color: "#166534", fontSize: "0.875rem" }}>
            {msg}
          </p>
        ) : null}
        {error ? (
          <p style={{ margin: 0, color: "#b00020", fontSize: "0.875rem" }}>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
