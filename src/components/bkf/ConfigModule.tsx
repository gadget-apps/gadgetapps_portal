"use client";

import { useState } from "react";
import {
  clearSeedSupportTickets,
  seedSupportTickets,
} from "@/lib/bkf/seed-support";

export function ConfigModule() {
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(25);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSeed() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const n = Math.min(60, Math.max(5, Math.floor(count) || 25));
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

  async function onClear() {
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

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Config técnica</h2>
          <p className="bkf-panel__sub">
            Ferramentas internas. Use os tickets sintéticos só para teste de
            fila, performance e usabilidade.
          </p>
        </div>
      </div>

      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "0.85rem",
          padding: "1rem",
          display: "grid",
          gap: "0.75rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Tickets de suporte (teste)</h3>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
          Gera conversas falsas em <code>support_threads</code> com{" "}
          <code>isSeed: true</code>. Não cria usuários reais no app.
        </p>

        <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}>
          Quantidade (5–60)
          <input
            className="bkf-input"
            type="number"
            min={5}
            max={60}
            value={count}
            disabled={busy}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ maxWidth: "8rem" }}
          />
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          <button
            type="button"
            className="pill pill-blue"
            disabled={busy}
            onClick={onSeed}
          >
            {busy ? "Aguarde…" : "Gerar tickets de teste"}
          </button>
          <button
            type="button"
            className="bkf-action"
            disabled={busy}
            onClick={onClear}
          >
            Limpar tickets de teste
          </button>
        </div>

        {msg ? (
          <p style={{ margin: 0, color: "#166534", fontSize: "0.875rem" }}>{msg}</p>
        ) : null}
        {error ? (
          <p style={{ margin: 0, color: "#b00020", fontSize: "0.875rem" }}>{error}</p>
        ) : null}
      </section>
    </div>
  );
}
