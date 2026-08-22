// Garante que /login abra sem e-mail/senha (autofill do Chrome, bfcache, navegação suave).
// Ensures /login opens with empty email/password (Chrome autofill, bfcache, soft navigation).

export const LOGIN_WIPE_KEY = "gat_login_wipe";

// Chamar em toda saída da intranet / logout / redirect para /login.
// Call on every intranet exit / logout / redirect to /login.
export function markLoginFieldsMustWipe(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LOGIN_WIPE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function consumeLoginWipeToken(): string {
  if (typeof window === "undefined") return String(Date.now());
  try {
    const existing = sessionStorage.getItem(LOGIN_WIPE_KEY);
    sessionStorage.setItem(LOGIN_WIPE_KEY, String(Date.now()));
    return existing ?? String(Date.now());
  } catch {
    return String(Date.now());
  }
}
