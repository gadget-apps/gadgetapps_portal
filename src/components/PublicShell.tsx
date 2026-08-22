"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader({ on = "page" }: { on?: "hero" | "page" }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const tick = () => setScrolled(window.scrollY > 8);
    tick();
    window.addEventListener("scroll", tick, { passive: true });
    return () => window.removeEventListener("scroll", tick);
  }, []);

  return (
    <header
      className="topbar"
      data-on={on}
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div className="topbar__inner">
        <Link href="/" className="brand" aria-label="Gadget Apps Technology">
          <Image
            src="/brand/gadget_apps_logo.png"
            alt="Gadget Apps Technology"
            width={676}
            height={369}
            className="brand__logo"
            priority
          />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <a href="/#produtos" className="nav-link">
            Produtos
          </a>
          <Link href="/suporte/" className="nav-link">
            Suporte
          </Link>
          <Link href="/ouvidoria/" className="nav-link">
            Ouvidoria
          </Link>
          <Link
            href="/login/"
            className={`pill ${on === "hero" && !scrolled ? "pill-light" : "pill-dark"}`}
          >
            Intranet
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__meta">
          © {new Date().getFullYear()} · gadgetapps-portal.web.app
          {" · "}
          <Link href="/ouvidoria/" style={{ color: "inherit" }}>
            Ouvidoria
          </Link>
        </p>
      </div>
    </footer>
  );
}

export const PublicHeader = SiteHeader;
export const PublicFooter = SiteFooter;
