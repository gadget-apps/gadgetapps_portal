"use client";

import { useEffect, type ReactNode } from "react";
import { markLoginFieldsMustWipe } from "@/lib/bkf/login-fields";

// Qualquer saída da árvore /intranet (logout, link, back, replace) marca o login para abrir sem e-mail/senha.
// Any exit from the /intranet tree (logout, link, back, replace) marks login to open with empty credentials.
export default function IntranetLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    return () => {
      markLoginFieldsMustWipe();
    };
  }, []);

  return children;
}
