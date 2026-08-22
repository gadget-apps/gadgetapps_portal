"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "firebase/auth";
import { CATALOG_APPS } from "@/data/apps";
import { SiteFooter, SiteHeader } from "@/components/PublicShell";
import {
  clearCustomerSupportLeaveMark,
  ensureCustomerThread,
  mapAuthError,
  markCustomerSupportLeft,
  sendCustomerMessage,
  signInCustomerEmail,
  signOutCustomer,
  watchCustomerAuth,
  watchCustomerMessages,
  type CustomerSupportMessage,
  type SupportProductId,
  type SupportSource,
} from "@/lib/support/customer-support";

type Step = "product" | "login" | "chat";

function resolveProduct(raw: string | null): SupportProductId | null {
  if (raw === "angels_care") return "angels_care";
  return null;
}

function resolveSource(raw: string | null): SupportSource {
  return raw === "web_angelscare" ? "web_angelscare" : "web_portal";
}

export function SupportChatApp() {
  const search = useSearchParams();
  const initialProduct = resolveProduct(search.get("produto"));
  const source = resolveSource(search.get("origem"));

  const [productId, setProductId] = useState<SupportProductId | null>(
    initialProduct,
  );
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<CustomerSupportMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadReady, setThreadReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const step: Step = useMemo(() => {
    if (!productId) return "product";
    if (!user) return "login";
    return "chat";
  }, [productId, user]);

  const productName =
    CATALOG_APPS.find((a) => a.appId === productId)?.name ?? "Produto";

  useEffect(() => {
    if (initialProduct) setProductId(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;

    void (async () => {
      // /suporte sempre inicia deslogado (Angel Guide, site público, F5); sessão Firebase persistida não deve pular o login.
      // /suporte must always start logged out (Angel Guide, public site, F5); a persisted Firebase session must not skip login.
      try {
        await signOutCustomer();
        clearCustomerSupportLeaveMark();
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      unsub = watchCustomerAuth((next) => {
        setUser(next);
        setAuthReady(true);
      });
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // Sai da sessão do cliente ao deixar /suporte (link, voltar, fechar/atualizar aba).
  // Sign the customer out when leaving /suporte (link, back, close/refresh tab).
  useEffect(() => {
    const aliveKey = "ga_support_chat_alive";
    sessionStorage.setItem(aliveKey, "1");

    const leaveSupport = () => {
      markCustomerSupportLeft();
      void signOutCustomer();
    };

    const onClickCapture = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) {
          leaveSupport();
          return;
        }
        const path = url.pathname.replace(/\/+$/, "") || "/";
        if (!path.startsWith("/suporte")) {
          leaveSupport();
        }
      } catch {
        /* ignore invalid href */
      }
    };

    window.addEventListener("pagehide", leaveSupport);
    document.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("pagehide", leaveSupport);
      document.removeEventListener("click", onClickCapture, true);
      sessionStorage.removeItem(aliveKey);
      markCustomerSupportLeft();
      // Atraso curto: evita logout fantasma no remount do React Strict Mode (dev).
      // Short delay: avoids a ghost logout on React Strict Mode remount (dev).
      window.setTimeout(() => {
        if (sessionStorage.getItem(aliveKey) === "1") {
          clearCustomerSupportLeaveMark();
          return;
        }
        void signOutCustomer();
      }, 80);
    };
  }, []);

  useEffect(() => {
    if (!user || !productId) {
      setThreadReady(false);
      setMessages([]);
      return;
    }

    let unsubMsgs: (() => void) | undefined;
    let cancelled = false;

    setBusy(true);
    setError(null);
    void ensureCustomerThread({ appId: productId, source })
      .then(() => {
        if (cancelled) return;
        setThreadReady(true);
        unsubMsgs = watchCustomerMessages(setMessages, (err) =>
          setError(err.message),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(mapAuthError(err));
        setThreadReady(false);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
      unsubMsgs?.();
    };
  }, [user, productId, source]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      clearCustomerSupportLeaveMark();
      await signInCustomerEmail(email, password);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendCustomerMessage(draft);
      setDraft("");
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    clearCustomerSupportLeaveMark();
    await signOutCustomer();
    setThreadReady(false);
    setMessages([]);
  }

  return (
    <>
      <SiteHeader on="page" />
      <main className="support-page">
        <div className="support-page__inner">
          <p className="section__eyebrow">Atendimento</p>
          <h1 className="section__title">Chat com suporte</h1>
          <p className="section__lead">
            Use a mesma conta do app Angel&apos;s Care. A conversa entra na fila
            da equipe Gadget Apps.
          </p>

          {error ? <p className="support-alert">{error}</p> : null}

          {step === "product" ? (
            <section className="support-card">
              <h2 className="support-card__title">Para qual produto?</h2>
              <p className="support-card__sub">
                Escolha o app sobre o qual você precisa de ajuda.
              </p>
              <div className="support-products">
                {CATALOG_APPS.map((app) => {
                  const active = app.status === "active";
                  return (
                    <button
                      key={app.appId}
                      type="button"
                      className="support-product"
                      disabled={!active}
                      onClick={() => {
                        if (!active) return;
                        setProductId(app.appId as SupportProductId);
                      }}
                    >
                      {app.appId === "angels_care" ? (
                        <Image
                          src="/brand/angels_icon.png"
                          alt=""
                          width={40}
                          height={40}
                        />
                      ) : (
                        <span
                          className="support-product__dot"
                          style={{ background: app.accentColor }}
                        />
                      )}
                      <span>
                        <strong>{app.name}</strong>
                        <small>
                          {active ? "Atendimento disponível" : "Em breve"}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {step === "login" ? (
            <section className="support-card">
              <h2 className="support-card__title">Entrar — {productName}</h2>
              <p className="support-card__sub">
                Conta do aplicativo (não é o login da Intranet/BKF).
              </p>

              {!authReady ? (
                <p className="support-muted">Verificando sessão…</p>
              ) : (
                <>
                  <form className="support-form" onSubmit={onLogin} autoComplete="off">
                    <label>
                      E-mail da conta do app
                      <input
                        type="email"
                        name="support_customer_email"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Senha
                      <input
                        type="password"
                        name="support_customer_password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      className="pill pill-blue"
                      disabled={busy}
                    >
                      {busy ? "Entrando…" : "Entrar"}
                    </button>
                  </form>

                  {!initialProduct ? (
                    <button
                      type="button"
                      className="support-back"
                      onClick={() => setProductId(null)}
                    >
                      ← Trocar produto
                    </button>
                  ) : null}
                </>
              )}
            </section>
          ) : null}

          {step === "chat" ? (
            <section className="support-chat">
              <header className="support-chat__head">
                <div>
                  <strong>{productName}</strong>
                  <p>{user?.email}</p>
                </div>
                <button
                  type="button"
                  className="support-back"
                  onClick={onLogout}
                >
                  Sair
                </button>
              </header>

              <div className="support-chat__messages">
                {!threadReady && busy ? (
                  <p className="support-muted">Abrindo conversa…</p>
                ) : null}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`support-bubble ${m.sender === "user" ? "is-user" : "is-staff"}`}
                  >
                    <div className="support-bubble__meta">
                      {m.senderName} ·{" "}
                      {new Date(m.createdAt).toLocaleString("pt-BR")}
                    </div>
                    {m.isDeleted ? (
                      <p className="support-bubble__deleted">Mensagem apagada</p>
                    ) : (
                      <p>{m.text}</p>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form className="support-chat__composer" onSubmit={onSend}>
                <textarea
                  rows={3}
                  placeholder="Escreva sua mensagem…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={busy || !threadReady}
                />
                <button
                  type="submit"
                  className="pill pill-blue"
                  disabled={busy || !threadReady || !draft.trim()}
                >
                  Enviar
                </button>
              </form>
            </section>
          ) : null}

          <p className="support-foot">
            Equipe Gadget Apps?{" "}
            <Link href="/login/">Acesse a Intranet</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
