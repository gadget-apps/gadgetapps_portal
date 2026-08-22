export function HeroVisual() {
  return (
    <div
      className="anim-rise anim-d3 relative mx-auto mt-12 w-full max-w-lg lg:mt-0 lg:max-w-none"
      aria-hidden
    >
      <div className="relative aspect-[5/4] w-full">
        <svg
          viewBox="0 0 520 416"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="panel" x1="80" y1="40" x2="460" y2="380" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0f766e" stopOpacity="0.35" />
              <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f4f6f8" stopOpacity="0.55" />
              <stop offset="1" stopColor="#f4f6f8" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          <rect
            x="48"
            y="36"
            width="360"
            height="240"
            rx="28"
            fill="url(#panel)"
            stroke="url(#stroke)"
            strokeWidth="1.2"
          />
          <rect
            x="112"
            y="100"
            width="360"
            height="240"
            rx="28"
            fill="rgba(244,246,248,0.03)"
            stroke="url(#stroke)"
            strokeWidth="1.2"
          />
          <rect
            x="176"
            y="164"
            width="300"
            height="200"
            rx="24"
            fill="rgba(15,118,110,0.12)"
            stroke="url(#stroke)"
            strokeWidth="1.2"
          />

          <circle cx="92" cy="72" r="4" fill="#0f766e" />
          <circle cx="112" cy="72" r="4" fill="rgba(244,246,248,0.25)" />
          <circle cx="132" cy="72" r="4" fill="rgba(244,246,248,0.15)" />

          <path
            d="M200 220H420"
            stroke="rgba(244,246,248,0.18)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M200 248H360"
            stroke="rgba(244,246,248,0.12)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M200 276H390"
            stroke="rgba(244,246,248,0.1)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          <rect
            x="200"
            y="304"
            width="88"
            height="28"
            rx="14"
            fill="#f4f6f8"
            fillOpacity="0.92"
          />
          <rect
            x="300"
            y="304"
            width="88"
            height="28"
            rx="14"
            stroke="rgba(244,246,248,0.35)"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    </div>
  );
}
