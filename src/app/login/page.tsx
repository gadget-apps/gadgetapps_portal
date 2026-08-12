"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { SiteFooter, SiteHeader } from "@/components/PublicShell";
import { claimBkfAccess } from "@/lib/bkf/operators";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

const DEMO_FLAG = "gat_intranet_demo";

type Mode = "login" | "register";

function mapAuthError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";
  const message =
    err instanceof Error ? err.message : "Falha no acesso. Tente de novo.";

  switch (code) {
    case "auth/email-already-in-use":
      return "Este e-mail já tem conta. Use a aba Entrar.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos. Confira se o e-mail é exatamente gadget.apps.technology@gmail.com e se a senha é a do Firebase Authentication (não a do Gmail).";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns minutos ou redefina a senha.";
    case "auth/operation-not-allowed":
      return "Login por e-mail/senha não está ativo no Firebase. Em Authentication → Sign-in method, ative Email/Password.";
    case "auth/unauthorized-domain":
      return "Domínio não autorizado. No Firebase Authentication → Settings → Authorized domains, inclua gadgetapps-portal.web.app e localhost.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key":
      return "Chave API inválida no portal. Avise o desenvolvedor.";
    case "auth/network-request-failed":
      return "Falha de rede. Verifique a internet e tente de novo.";
    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 caracteres.";
    default:
      if (message.includes("Sem convite") || message.includes("desativado")) {
        return message;
      }
      return code ? `${message} (${code})` : message;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("gadget.apps.technology@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function finishAccess(uid: string, userEmail: string) {
    const claim = await claimBkfAccess({ uid, email: userEmail });
    if (!claim.ok) {
      await signOut(getAngelsCareAuth());
      sessionStorage.removeItem(DEMO_FLAG);
      throw new Error(claim.reason);
    }
    sessionStorage.setItem(
      DEMO_FLAG,
      JSON.stringify({ email: userEmail, uid }),
    );
    router.push("/intranet/");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (mode === "register" && password.trim().length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setBusy(true);
    try {
      const auth = getAngelsCareAuth();
      const cred =
        mode === "register"
          ? await createUserWithEmailAndPassword(
              auth,
              trimmedEmail,
              password,
            )
          : await signInWithEmailAndPassword(auth, trimmedEmail, password);

      const userEmail = (cred.user.email ?? trimmedEmail).toLowerCase();
      await finishAccess(cred.user.uid, userEmail);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onResetPassword() {
    setError("");
    setInfo("");
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Digite o e-mail e clique em Esqueci a senha.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(getAngelsCareAuth(), trimmedEmail);
      setInfo(
        "Se esse e-mail existir no Firebase Authentication, enviamos um link para redefinir a senha. Confira a caixa de entrada (e spam).",
      );
    } catch (err) {
      setError(mapAuthError(err));
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
          width: "min(420px, calc(100% - 2.5rem))",
          margin: "4rem auto 5rem",
        }}
      >
        <p className="section__eyebrow">Acesso interno</p>
        <h1 className="section__title">Área colaborador</h1>
        <p className="section__lead">
          {mode === "login"
            ? "Use a conta criada em Firebase Authentication (projeto Angel’s Care)."
            : "Crie sua senha só se já tiver sido convidado por um administrador."}
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button
            type="button"
            className={`bkf-chip ${mode === "login" ? "is-on" : ""}`}
            onClick={() => setMode("login")}
            disabled={busy}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`bkf-chip ${mode === "register" ? "is-on" : ""}`}
            onClick={() => setMode("register")}
            disabled={busy}
          >
            Aceitar convite
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            marginTop: "1rem",
            display: "grid",
            gap: "0.9rem",
            padding: "1.5rem",
            borderRadius: "1.25rem",
            background: "var(--soft)",
            border: "1px solid var(--line)",
          }}
        >
          <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.875rem" }}>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              disabled={busy}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "0.75rem",
                padding: "0.7rem 0.85rem",
                font: "inherit",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.875rem" }}>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              disabled={busy}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "0.75rem",
                padding: "0.7rem 0.85rem",
                font: "inherit",
              }}
            />
          </label>
          {error ? (
            <p style={{ color: "#b00020", margin: 0, fontSize: "0.875rem" }}>
              {error}
            </p>
          ) : null}
          {info ? (
            <p style={{ color: "#166534", margin: 0, fontSize: "0.875rem" }}>
              {info}
            </p>
          ) : null}
          <button
            type="submit"
            className="pill pill-blue"
            disabled={busy}
            style={{ border: 0, cursor: busy ? "wait" : "pointer" }}
          >
            {busy
              ? "Aguarde…"
              : mode === "register"
                ? "Criar acesso"
                : "Entrar"}
          </button>
          {mode === "login" ? (
            <button
              type="button"
              onClick={onResetPassword}
              disabled={busy}
              style={{
                border: 0,
                background: "transparent",
                color: "var(--muted)",
                font: "inherit",
                fontSize: "0.85rem",
                cursor: "pointer",
                textAlign: "left",
                padding: 0,
              }}
            >
              Esqueci a senha
            </button>
          ) : null}
        </form>
        <p style={{ marginTop: "1.5rem", fontSize: "0.875rem" }}>
          <Link href="/" style={{ color: "var(--muted)" }}>
            ← Voltar ao site
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
