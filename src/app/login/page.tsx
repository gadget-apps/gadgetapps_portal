"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { SiteFooter, SiteHeader } from "@/components/PublicShell";
import { claimBkfAccess, writeBkfSession, clearBkfSession } from "@/lib/bkf/operators";
import { consumeLoginWipeToken, markLoginFieldsMustWipe } from "@/lib/bkf/login-fields";
import { getAngelsCareAuth } from "@/lib/firebase/angels-care";

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
      return "E-mail ou senha incorretos. Se for o primeiro acesso, use Aceitar convite.";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  /** Desbloqueia digitação após montar — reduz autofill do gerenciador de senhas. */
  const [fieldsUnlocked, setFieldsUnlocked] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  /** Depois que o usuário digita, paramos de limpar (senão apaga ao trocar de aba). */
  const userEditedRef = useRef(false);
  const wipeWindowActiveRef = useRef(true);

  const wipeCredentials = useCallback((force = false) => {
    if (!force && userEditedRef.current) return;
    setEmail("");
    setPassword("");
    const emailEl = emailRef.current;
    const passEl = passwordRef.current;
    if (emailEl) {
      emailEl.value = "";
      emailEl.setAttribute("value", "");
    }
    if (passEl) {
      passEl.value = "";
      passEl.setAttribute("value", "");
    }
    if (!userEditedRef.current) {
      formRef.current?.reset();
    }
  }, []);

  useEffect(() => {
    userEditedRef.current = false;
    wipeWindowActiveRef.current = true;
    markLoginFieldsMustWipe();
    consumeLoginWipeToken();
    wipeCredentials(true);
    setFieldsUnlocked(false);

    // Autofill do Chrome costuma preencher depois do paint.
    const timers = [0, 50, 150, 400, 1000].map((ms) =>
      window.setTimeout(() => {
        if (!wipeWindowActiveRef.current) return;
        wipeCredentials(false);
        if (ms >= 150) setFieldsUnlocked(true);
        if (ms >= 1000) wipeWindowActiveRef.current = false;
      }, ms),
    );

    // Volta via bfcache / histórico: campos devem nascer vazios de novo.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted || wipeWindowActiveRef.current) {
        userEditedRef.current = false;
        wipeCredentials(true);
      }
    };

    window.addEventListener("pageshow", onPageShow);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [wipeCredentials]);

  function onEmailChange(value: string) {
    userEditedRef.current = true;
    wipeWindowActiveRef.current = false;
    setEmail(value);
  }

  function onPasswordChange(value: string) {
    userEditedRef.current = true;
    wipeWindowActiveRef.current = false;
    setPassword(value);
  }

  async function finishAccess(uid: string, userEmail: string) {
    const claim = await claimBkfAccess({ uid, email: userEmail });
    if (!claim.ok) {
      await signOut(getAngelsCareAuth());
      clearBkfSession();
      userEditedRef.current = false;
      wipeCredentials(true);
      throw new Error(claim.reason);
    }
    userEditedRef.current = false;
    wipeCredentials(true);
    markLoginFieldsMustWipe();
    writeBkfSession(userEmail, uid, claim.role);
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

    const submittedPassword = password;
    setBusy(true);
    try {
      const auth = getAngelsCareAuth();
      const cred =
        mode === "register"
          ? await createUserWithEmailAndPassword(
              auth,
              trimmedEmail,
              submittedPassword,
            )
          : await signInWithEmailAndPassword(
              auth,
              trimmedEmail,
              submittedPassword,
            );

      const userEmail = (cred.user.email ?? trimmedEmail).toLowerCase();
      await finishAccess(cred.user.uid, userEmail);
    } catch (err) {
      // Após tentativa: limpa senha; e-mail some também para não reaparecer “salvo”.
      userEditedRef.current = false;
      wipeCredentials(true);
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
      userEditedRef.current = false;
      wipeCredentials(true);
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
        <h1 className="section__title">Intranet</h1>
        <p className="section__lead">
          {mode === "login"
            ? "Use a conta criada em Firebase Authentication (projeto Angel’s Care)."
            : "Crie sua senha só se já tiver sido convidado por um administrador."}
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button
            type="button"
            className={`bkf-chip ${mode === "login" ? "is-on" : ""}`}
            onClick={() => {
              setMode("login");
              userEditedRef.current = false;
              wipeCredentials(true);
            }}
            disabled={busy}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`bkf-chip ${mode === "register" ? "is-on" : ""}`}
            onClick={() => {
              setMode("register");
              userEditedRef.current = false;
              wipeCredentials(true);
            }}
            disabled={busy}
          >
            Aceitar convite
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
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
          {/* Honeypot: despista gerenciadores de senha que varrem o 1º email/password. */}
          <input
            type="text"
            name="intranet_username_trap"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            value=""
            readOnly
            style={{
              position: "absolute",
              left: "-9999px",
              height: 0,
              width: 0,
              opacity: 0,
            }}
          />
          <input
            type="password"
            name="intranet_password_trap"
            autoComplete="current-password"
            tabIndex={-1}
            aria-hidden="true"
            value=""
            readOnly
            style={{
              position: "absolute",
              left: "-9999px",
              height: 0,
              width: 0,
              opacity: 0,
            }}
          />
          <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.875rem" }}>
            E-mail
            <input
              ref={emailRef}
              type="email"
              name="bkf_intranet_email_field"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onFocus={() => setFieldsUnlocked(true)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              readOnly={!fieldsUnlocked}
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
              ref={passwordRef}
              type="password"
              name="bkf_intranet_password_field"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onFocus={() => setFieldsUnlocked(true)}
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              readOnly={!fieldsUnlocked}
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
