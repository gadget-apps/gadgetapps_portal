"use client";

export type KpiItem = {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "bad";
};

type Props = {
  items: KpiItem[];
  loading?: boolean;
};

export function KpiStrip({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="bkf-kpi-strip" aria-busy="true">
        <div className="bkf-kpi is-muted">
          <span className="bkf-kpi__label">Indicadores</span>
          <strong className="bkf-kpi__value">…</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="bkf-kpi-strip" role="group" aria-label="Indicadores">
      {items.map((item) => (
        <div
          key={item.label}
          className={`bkf-kpi ${item.tone && item.tone !== "default" ? `is-${item.tone}` : ""}`}
        >
          <span className="bkf-kpi__label">{item.label}</span>
          <strong className="bkf-kpi__value">{item.value}</strong>
          {item.hint ? <span className="bkf-kpi__hint">{item.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}
