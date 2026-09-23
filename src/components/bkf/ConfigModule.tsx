"use client";

import { FormEvent, useEffect, useState } from "react";
import { TutorialsModule } from "@/components/bkf/TutorialsModule";
import { TermsConfigSection } from "@/components/bkf/TermsConfigSection";
import { isBkfAdminSession } from "@/lib/bkf/operators";
import {
  DEFAULT_FORCE_MESSAGE,
  loadMobileAppConfig,
  playStoreUrlFor,
  saveMobileAppConfig,
  type MobileAppConfig,
} from "@/lib/bkf/app-config-firestore";

type ConfigSection = "force" | "termos" | "videos";

function sectionFromUrl(): ConfigSection {
  if (typeof window === "undefined") return "force";
  const secao = new URLSearchParams(window.location.search).get("secao");
  if (secao === "videos") return "videos";
  if (secao === "termos") return "termos";
  return "force";
}

function writeSectionToUrl(section: ConfigSection) {
  const url = new URL(window.location.href);
  if (section === "force") url.searchParams.delete("secao");
  else url.searchParams.set("secao", section);
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function ConfigModule({
  initialSection = "force",
}: {
  initialSection?: ConfigSection;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [configReady, setConfigReady] = useState(false);
  const [config, setConfig] = useState<MobileAppConfig | null>(null);
  const [minBuild, setMinBuild] = useState(0);
  const [message, setMessage] = useState(DEFAULT_FORCE_MESSAGE);
  const [packageId, setPackageId] = useState("br.com.angelscare.app");
  const [section, setSection] = useState<ConfigSection>(() =>
    initialSection !== "force" ? initialSection : sectionFromUrl(),
  );

  useEffect(() => {
    setIsAdmin(isBkfAdminSession());
  }, []);

  useEffect(() => {
    if (initialSection !== "force") {
      setSection(initialSection);
      return;
    }
    setSection(sectionFromUrl());
  }, [initialSection]);

  function selectSection(next: ConfigSection) {
    setSection(next);
    writeSectionToUrl(next);
  }

  useEffect(() => {
    let cancelled = false;
    setConfigReady(false);
    void loadMobileAppConfig()
      .then((cfg) => {
        if (cancelled) return;
        setConfig(cfg);
        setMinBuild(cfg.minBuildNumber);
        setMessage(cfg.message);
        setPackageId(cfg.androidPackageId);
        setConfigReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setConfigReady(true);
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar app_config/mobile.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSaveForceUpdate(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin || busy) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const saved = await saveMobileAppConfig({
        minBuildNumber: minBuild,
        message,
        androidPackageId: packageId,
        playStoreUrl: playStoreUrlFor(packageId),
      });
      setConfig(saved);
      setMinBuild(saved.minBuildNumber);
      setMessage(saved.message);
      setPackageId(saved.androidPackageId);
      setMsg(
        saved.minBuildNumber > 0
          ? `Force update ativo (producao e testes fechados): builds abaixo de ${saved.minBuildNumber} serao bloqueados.`
          : "Force update desligado (minBuildNumber = 0).",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao salvar force update.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="bkf-panel">
        <p className="bkf-empty">Somente o admin BKF acessa Config tecnica.</p>
      </div>
    );
  }

  const forceOn = minBuild > 0;

  return (
    <div className="bkf-panel">
      <div className="bkf-panel__head">
        <div>
          <h2 className="bkf-panel__title">Config tecnica</h2>
          <p className="bkf-panel__sub">
            Force update Android, termos de uso do app e vínculos dos vídeos
            tutoriais no YouTube.
          </p>
        </div>
      </div>

      <div className="bkf-filters" style={{ marginBottom: "0.9rem" }}>
        <button
          type="button"
          className={`bkf-chip ${section === "force" ? "is-on" : ""}`}
          onClick={() => selectSection("force")}
        >
          Force update
        </button>
        <button
          type="button"
          className={`bkf-chip ${section === "termos" ? "is-on" : ""}`}
          onClick={() => selectSection("termos")}
        >
          Termos de uso
        </button>
        <button
          type="button"
          className={`bkf-chip ${section === "videos" ? "is-on" : ""}`}
          onClick={() => selectSection("videos")}
        >
          Videos tutoriais
        </button>
      </div>

      {section === "videos" ? (
        <TutorialsModule embedded />
      ) : section === "termos" ? (
        <TermsConfigSection isAdmin={isAdmin} />
      ) : (
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
              Force update (Android)
            </h3>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
              Se o <strong>build number</strong> instalado (o <code>+N</code> do
              pubspec) for menor que o minimo, o app abre a tela de atualizacao
              obrigatoria — vale para <strong>producao</strong> e{" "}
              <strong>testes fechados</strong>. Use <code>0</code> para
              desligar.
            </p>

            {!configReady ? (
              <p className="bkf-empty">Carregando configuracao…</p>
            ) : (
              <form
                onSubmit={onSaveForceUpdate}
                style={{ display: "grid", gap: "0.75rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <span
                    className={`bkf-tag ${forceOn ? "bkf-tag--bad" : "bkf-tag--ok"}`}
                  >
                    {forceOn ? "Ativo" : "Desligado"}
                  </span>
                  {config?.exists ? (
                    <span className="bkf-mono" style={{ fontSize: 12 }}>
                      {config.updatedByEmail
                        ? `ultimo: ${config.updatedByEmail}`
                        : "documento existe"}
                      {config.updatedAt
                        ? ` · ${new Date(config.updatedAt).toLocaleString("pt-BR")}`
                        : ""}
                    </span>
                  ) : (
                    <span className="bkf-mono" style={{ fontSize: 12 }}>
                      ainda nao existe — sera criado ao salvar
                    </span>
                  )}
                </div>

                <label
                  style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}
                >
                  Build minimo obrigatorio (producao + testes fechados)
                  <input
                    className="bkf-input"
                    type="number"
                    min={0}
                    step={1}
                    value={minBuild}
                    disabled={busy}
                    onChange={(e) => setMinBuild(Number(e.target.value) || 0)}
                    style={{ maxWidth: "10rem" }}
                  />
                </label>

                <label
                  style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}
                >
                  Mensagem na tela de bloqueio
                  <textarea
                    className="bkf-input"
                    rows={3}
                    value={message}
                    disabled={busy}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </label>

                <label
                  style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}
                >
                  Package ID Android
                  <input
                    className="bkf-input"
                    value={packageId}
                    disabled={busy}
                    onChange={(e) => setPackageId(e.target.value)}
                  />
                </label>

                <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
                  Play Store:{" "}
                  <a
                    href={playStoreUrlFor(packageId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {playStoreUrlFor(packageId)}
                  </a>
                </p>

                <div>
                  <button
                    type="submit"
                    className="pill pill-blue"
                    disabled={busy || !message.trim()}
                  >
                    {busy ? "Salvando…" : "Salvar force update"}
                  </button>
                </div>
              </form>
            )}
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
      )}
    </div>
  );
}
