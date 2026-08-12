import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/PublicShell";
import { getProductBySlug, PUBLIC_PRODUCTS } from "@/data/products";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PUBLIC_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const live = product.status === "live";
  const isAngels = product.slug === "angels-care";

  return (
    <>
      <div style={{ paddingTop: "var(--header)" }}>
        <SiteHeader on="page" />
      </div>
      <main className="section">
        <Link href="/produtos/" style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          ← Produtos
        </Link>
        {isAngels ? (
          <div style={{ marginTop: "1.75rem" }}>
            <h1 className="sr-only">Angel&apos;s Care</h1>
            <Image
              src="/brand/angels_logo.png"
              alt="Angel's Care"
              width={640}
              height={240}
              priority
              className="product-detail-logo"
            />
          </div>
        ) : (
          <h1 className="section__title" style={{ marginTop: "1.5rem" }}>
            {product.name}
          </h1>
        )}
        <p className="section__lead">{product.tagline}</p>
        <p style={{ marginTop: "1.25rem", maxWidth: "40rem", lineHeight: 1.6 }}>
          {product.description}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.65rem",
            marginTop: "2rem",
          }}
        >
          {live ? (
            <>
              <a
                href={product.officialSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pill pill-blue"
              >
                Site oficial
              </a>
              {product.playStoreUrl ? (
                <a
                  href={product.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill pill-dark"
                >
                  Google Play
                </a>
              ) : null}
            </>
          ) : (
            <p style={{ color: "var(--muted)" }}>Produto ainda não publicado.</p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
