import { Suspense } from "react";
import { SupportChatApp } from "@/components/support/SupportChatApp";

export default function SuportePage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
          Carregando suporte…
        </main>
      }
    >
      <SupportChatApp />
    </Suspense>
  );
}
