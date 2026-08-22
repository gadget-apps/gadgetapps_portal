"use client";

export type DashTone =
  | "default"
  | "ok"
  | "warn"
  | "bad"
  | "info"
  | "muted";

export type DashChartItem = {
  label: string;
  value: number;
  tone?: DashTone;
};

const TONE_COLOR: Record<DashTone, string> = {
  default: "#374151",
  ok: "#059669",
  warn: "#d97706",
  bad: "#dc2626",
  info: "#2563eb",
  muted: "#9ca3af",
};

const PALETTE = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0d9488", "#64748b"];

export function toneColor(tone: DashTone | undefined, index = 0): string {
  if (tone && tone !== "default") return TONE_COLOR[tone];
  return PALETTE[index % PALETTE.length];
}

export function chartTotal(items: DashChartItem[]): number {
  return items.reduce((sum, i) => sum + (i.value || 0), 0);
}

export function pointHint(
  label: string,
  value: number,
  pct?: number | null,
): string {
  if (pct == null || Number.isNaN(pct)) return `${label}: ${value}`;
  return `${label}: ${value} (${pct}%)`;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function donutSlicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`,
  ].join(" ");
}
