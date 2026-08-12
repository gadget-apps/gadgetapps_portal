import Link from "next/link";

export function BrandMark({
  tone = "light",
  size = "md",
}: {
  tone?: "light" | "dark";
  size?: "md" | "lg";
}) {
  const dark = tone === "dark";
  const title = size === "lg" ? "text-2xl sm:text-[1.65rem]" : "text-lg sm:text-xl";

  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <span
        aria-hidden
        className={`grid h-9 w-9 place-items-center rounded-[0.65rem] border ${
          dark
            ? "border-white/15 bg-white/5 text-hero-fg"
            : "border-border bg-surface text-ink"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M3 12.5V5.5L9 2.5L15 5.5V12.5L9 15.5L3 12.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M9 8.2V15.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M3.2 5.7L9 8.5L14.8 5.7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="min-w-0 leading-none">
        <span className={`font-display block font-bold tracking-tight ${title}`}>
          Gadget Apps
        </span>
        <span
          className={`mt-1 block text-[10px] font-medium uppercase tracking-[0.28em] ${
            dark ? "text-hero-fg/55" : "text-muted"
          }`}
        >
          Technology
        </span>
      </span>
    </Link>
  );
}
