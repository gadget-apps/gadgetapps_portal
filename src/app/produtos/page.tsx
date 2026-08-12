import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/PublicShell";
import { PUBLIC_PRODUCTS } from "@/data/products";

export const metadata = { title: "Produtos" };

export default function ProductsPage() {
  return (
    <>
      <div style={{ paddingTop: "var(--header)" }}>
        <SiteHeader on="page" />
      </div>
      <main className="section">
        <p className="section__eyebrow">Portfólio</p>
        <h1 className="section__title">Produtos</h1>
        <ul style={{ listStyle: "none", padding: 0, margin: "2.5rem 0 0" }}>
          {PUBLIC_PRODUCTS.map((p) => (
            <li
              key={p.slug}
              style={{
                borderTop: "1px solid var(--line)",
                padding: "1.25rem 0",
              }}
            >
              <Link
                href={`/produtos/${p.slug}/`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span className="font-display" style={{ fontWeight: 700, fontSize: "1.5rem" }}>
                  {p.name}
                </span>
                <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                  {p.status === "live" ? "Disponível →" : "Em breve"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
