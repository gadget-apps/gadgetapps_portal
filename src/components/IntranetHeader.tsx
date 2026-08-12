import Link from "next/link";

type Props = {
  title: string;
  badge?: string;
  badgeColor?: string;
  backHref?: string;
  backLabel?: string;
};

export function IntranetHeader({
  title,
  badge,
  badgeColor = "#0F766E",
  backHref,
  backLabel = "← Intranet",
}: Props) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="text-xs font-medium text-muted hover:text-foreground"
            >
              {backLabel}
            </Link>
          ) : null}
          <h1
            className={`text-xl font-semibold tracking-tight ${backHref ? "mt-1" : ""}`}
          >
            {title}
          </h1>
        </div>
        {badge ? (
          <span
            className="rounded-md px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: badgeColor }}
          >
            {badge}
          </span>
        ) : (
          <Link
            href="/"
            className="text-xs text-muted hover:text-foreground"
          >
            Site público
          </Link>
        )}
      </div>
    </header>
  );
}
