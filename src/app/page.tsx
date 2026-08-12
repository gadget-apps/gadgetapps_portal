import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { PUBLIC_PRODUCTS } from "@/data/products";

export default function HomePage() {
  const angels = PUBLIC_PRODUCTS.find((p) => p.slug === "angels-care");
  const soon = PUBLIC_PRODUCTS.filter((p) => p.status !== "live");

  return (
    <>
      <section className="hero">
        <div className="hero__media">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={85}
          />
        </div>
        <div className="hero__shade" aria-hidden />
        <SiteHeader on="hero" />
        <div className="hero__body">
          <div>
            <div className="hero__brand rise">
              <h1 className="sr-only">Gadget Apps Technology</h1>
              <Image
                src="/brand/gadget_apps_logo.png"
                alt="Gadget Apps Technology"
                width={480}
                height={140}
                priority
              />
            </div>
            <p className="hero__copy rise rise-d1">
              Produtos digitais com operação séria. Entre no site oficial de
              cada app ou na área da equipe.
            </p>
            <div className="hero__actions rise rise-d2">
              <a href="#produtos" className="pill pill-light">
                Ver produtos
              </a>
              <Link href="/login/" className="pill pill-ghost">
                Área colaborador
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section id="produtos" className="section">
          <Reveal>
            <p className="section__eyebrow">Produtos</p>
            <h2 className="section__title">Feitos para o mundo real</h2>
            <p className="section__lead">
              Cada aplicativo tem site e operação próprios. Este é o portal da
              empresa.
            </p>
          </Reveal>

          {angels ? (
            <Reveal delayMs={80}>
              <article className="spotlight">
                <div className="spotlight__copy">
                  <Image
                    src="/brand/angels_logo.png"
                    alt="Angel's Care"
                    width={420}
                    height={160}
                    className="spotlight__logo"
                  />
                  <p className="spotlight__tag">{angels.tagline}</p>
                  <div className="spotlight__actions">
                    <a
                      href={angels.officialSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pill pill-blue"
                    >
                      Site oficial
                    </a>
                    <Link
                      href={`/produtos/${angels.slug}/`}
                      className="pill pill-dark"
                    >
                      Saiba mais
                    </Link>
                  </div>
                </div>
                <div className="spotlight__media">
                  <Image
                    src="/product-angelscare.jpg"
                    alt=""
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    quality={85}
                  />
                  <Image
                    src="/brand/angels_icon.png"
                    alt=""
                    width={220}
                    height={220}
                    className="spotlight__mark"
                  />
                </div>
              </article>
            </Reveal>
          ) : null}

          {soon.map((p) => (
            <Reveal key={p.slug} delayMs={120}>
              <div className="soon-row">
                <div>
                  <strong style={{ color: "var(--fg)" }}>{p.name}</strong>
                  <div style={{ marginTop: "0.35rem" }}>{p.tagline}</div>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                  EM BREVE
                </span>
              </div>
            </Reveal>
          ))}
        </section>

        <section id="plataforma" className="section" style={{ paddingTop: 0 }}>
          <Reveal>
            <p className="section__eyebrow">Plataforma</p>
            <h2 className="section__title">Tudo em um só lugar</h2>
            <p className="section__lead">
              Produtos, operação e intranet — com a identidade visual oficial
              da Gadget Apps e do Angel&apos;s Care.
            </p>
          </Reveal>

          <Reveal delayMs={60}>
            <div className="bento">
              <Link
                href={angels ? `/produtos/${angels.slug}/` : "/produtos/"}
                className="bento__cell bento__cell--photo bento__cell--span2r"
              >
                <div className="bento__photo">
                  <Image
                    src="/product-angelscare.jpg"
                    alt=""
                    fill
                    sizes="(max-width: 720px) 100vw, 50vw"
                    quality={80}
                  />
                </div>
                <div className="bento__overlay" aria-hidden />
                <div className="bento__body">
                  <Image
                    src="/brand/angels_icon.png"
                    alt=""
                    width={72}
                    height={72}
                    className="bento__mark"
                  />
                  <p className="bento__kicker">Produto em destaque</p>
                  <h3 className="bento__title">Angel&apos;s Care</h3>
                  <p className="bento__text">
                    Cuidado conectado — site oficial e app na Play Store.
                  </p>
                  <span className="bento__cta">Abrir produto →</span>
                </div>
              </Link>

              <div className="bento__cell bento__cell--brand bento__cell--span2">
                <Image
                  src="/brand/gadget_apps_logo.png"
                  alt="Gadget Apps Technology"
                  width={280}
                  height={90}
                  className="bento__mark--lg"
                />
                <p className="bento__text">
                  Empresa por trás dos produtos — portal, intranet e operação.
                </p>
              </div>

              <Link href="/login/" className="bento__cell bento__cell--dark bento__cell--span2">
                <div>
                  <p className="bento__kicker">Intranet</p>
                  <h3 className="bento__title">Área colaborador</h3>
                  <p className="bento__text">
                    Acesso da equipe ao hub interno da Gadget Apps.
                  </p>
                </div>
                <span className="bento__cta">Entrar →</span>
              </Link>

              <Link href="/intranet/bkf/" className="bento__cell bento__cell--wide bento__cell--span2">
                <div>
                  <Image
                    src="/brand/angels_icon.png"
                    alt=""
                    width={48}
                    height={48}
                    className="bento__mark"
                  />
                  <p className="bento__kicker">Operação</p>
                  <h3 className="bento__title">Backoffice (BKF)</h3>
                  <p className="bento__text">
                    Multi-app: usuários, Premium, denúncias, chat e config.
                  </p>
                </div>
                <span className="bento__cta">Abrir BKF →</span>
              </Link>

              <div className="bento__cell">
                <div>
                  <p className="bento__kicker">Multi-app</p>
                  <h3 className="bento__title">Catálogo</h3>
                  <p className="bento__text">
                    Novos produtos entram no mesmo portal.
                  </p>
                </div>
              </div>

              <div className="bento__cell">
                <div>
                  <p className="bento__kicker">Suporte</p>
                  <h3 className="bento__title">Atendimento</h3>
                  <p className="bento__text">
                    Fila, histórico e moderação no BKF.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="team-band">
          <div className="section">
            <Reveal>
              <p className="section__eyebrow">Equipe</p>
              <h2 className="section__title">Área colaborador</h2>
              <p className="section__lead">
                Intranet com Backoffice (BKF) e espaço para novos módulos
                internos.
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <Link href="/login/" className="pill pill-blue">
                  Entrar
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
