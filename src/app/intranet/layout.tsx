"use client";

import { useEffect, type ReactNode } from "react";
import { markLoginFieldsMustWipe } from "@/lib/bkf/login-fields";

/**
 * Qualquer saída da árvore /intranet (logout, link, back, replace)
 * marca o login para abrir sem e-mail/senha.
 */
export default function IntranetLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    return () => {
      markLoginFieldsMustWipe();
    };
  }, []);

  return children;
}
