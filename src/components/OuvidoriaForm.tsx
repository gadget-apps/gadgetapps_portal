"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import { SiteFooter, SiteHeader } from "@/components/PublicShell";

const ENDPOINT =
  "https://us-central1-app-angelscare.cloudfunctions.net/submitPublicFeedback";

type FeedbackType = "reclamacao" | "sugestao" | "elogio";

export function OuvidoriaForm() {
  const [type, setType] = useState<FeedbackType>("elogio");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [telegramSent, setTelegramSent] = useState(true);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          email,
          message,
          product: "angels_care",
          company: honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        telegramSent?: number;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível enviar. Tente de novo.");
      }
      setTelegramSent(Number(data.telegramSent || 0) > 0);
      setDone(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ paddingTop: "var(--header)" }}>
        <SiteHeader on="page" />
      </div>
      <main
        style={{
          width: "min(520px, calc(100% - 2.5rem))",
          margin: "3.5rem auto 5rem",
        }}
      >
        <p className="section__eyebrow">Ouvidoria</p>
        <h1 className="section__title">Elogios, sugestões e reclamações</h1>
        <p className="section__lead">
          Canal direto com a equipe Gadget Apps / Angel’s Care. Sem necessidade
          de login. Respondemos pelo e-mail informado.
        </p>

        {done ? (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1.25rem 1.4rem",
              borderRadius: "1.25rem",
              background: "var(--soft)",
              border: "1px solid var(--line)",
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>Mensagem enviada.</p>
            <p style={{ margin: "0.5rem 0 0", color: "var(--muted)" }}>
              {telegramSent
                ? "Obrigado. Nossa equipe foi avisada no Telegram e retorna pelo e-mail informado, quando necessário."
                : "Obrigado. Sua mensagem foi registrada. Se precisar de retorno, use o e-mail informado."}
            </p>
            <button
              type="button"
              className="pill pill-blue"
              style={{ marginTop: "1rem", border: 0, cursor: "pointer" }}
              onClick={() => {
                setDone(false);
                setTelegramSent(true);
              }}
            >
              Enviar outra
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            style={{
              marginTop: "1.25rem",
              display: "grid",
              gap: "0.9rem",
              padding: "1.5rem",
              borderRadius: "1.25rem",
              background: "var(--soft)",
              border: "1px solid var(--line)",
            }}
          >
            <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
              <legend style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                Tipo
              </legend>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="type"
                    checked={type === "elogio"}
                    onChange={() => setType("elogio")}
                    disabled={busy}
                  />
                  Elogios
                </label>
                <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="type"
                    checked={type === "sugestao"}
                    onChange={() => setType("sugestao")}
                    disabled={busy}
                  />
                  Sugestões
                </label>
                <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="type"
                    checked={type === "reclamacao"}
                    onChange={() => setType("reclamacao")}
                    disabled={busy}
                  />
                  Reclamações
                </label>
              </div>
            </fieldset>

            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}>
              Nome (opcional)
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                autoComplete="name"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}>
              E-mail para retorno
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                autoComplete="email"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}>
              Mensagem
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={busy}
                placeholder="Descreva com o máximo de detalhes possível."
                style={{ ...inputStyle, resize: "vertical", minHeight: "8rem" }}
              />
            </label>

            <input
              type="text"
              name="company"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                height: 0,
                width: 0,
                opacity: 0,
              }}
            />

            {error ? (
              <p style={{ color: "#b00020", margin: 0, fontSize: "0.875rem" }}>
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="pill pill-blue"
              disabled={busy}
              style={{ border: 0, cursor: busy ? "wait" : "pointer" }}
            >
              {busy ? "Enviando…" : "Enviar"}
            </button>

            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
              Dúvidas de uso do app com conta: use{" "}
              <a href="/suporte/" style={{ color: "inherit" }}>
                Suporte
              </a>
              .
            </p>
          </form>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

const inputStyle: CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: "0.75rem",
  padding: "0.7rem 0.85rem",
  font: "inherit",
  background: "#fff",
};
