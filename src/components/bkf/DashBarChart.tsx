"use client";

export type DashBarTone =
  | "default"
  | "ok"
  | "warn"
  | "bad"
  | "info"
  | "muted";

export type DashBarItem = {
  label: string;
  value: number;
  tone?: DashBarTone;
};

type Props = {
  title: string;
  items: DashBarItem[];
  emptyLabel?: string;
  /** Mostra % do total ao lado do valor (padrão: true). */
  showShare?: boolean;
};

export function DashBarChart({
  title,
  items,
  emptyLabel = "Sem dados",
  showShare = true,
}: Props) {
  const total = items.reduce((sum, i) => sum + (i.value || 0), 0);
  const max = Math.max(1, ...items.map((i) => i.value || 0));
  const empty = items.length === 0 || total === 0;

  return (
    <div className="bkf-dash-chart">
      <div className="bkf-dash-chart__head">
        <h4 className="bkf-dash-chart__title">{title}</h4>
        {!empty ? (
          <span className="bkf-dash-chart__total">total {total}</span>
        ) : null}
      </div>
      {empty ? (
        <p className="bkf-empty bkf-dash-chart__empty">{emptyLabel}</p>
      ) : (
        <ul className="bkf-dash-bars">
          {items.map((item) => {
            const pct =
              total > 0 ? Math.round((item.value / total) * 100) : 0;
            const width = Math.max(
              item.value > 0 ? 4 : 0,
              Math.round((item.value / max) * 100),
            );
            const tone = item.tone && item.tone !== "default" ? item.tone : "";
            return (
              <li
                key={item.label}
                className={`bkf-dash-bar${tone ? ` is-${tone}` : ""}`}
              >
                <span className="bkf-dash-bar__label" title={item.label}>
                  {item.label}
                </span>
                <div
                  className="bkf-dash-bar__track"
                  title={`${item.label}: ${item.value}${showShare ? ` (${pct}%)` : ""}`}
                >
                  <div
                    className="bkf-dash-bar__fill"
                    style={{ width: `${width}%` }}
                    title={`${item.label}: ${item.value}${showShare ? ` (${pct}%)` : ""}`}
                  />
                </div>
                <span className="bkf-dash-bar__value">
                  <strong>{item.value}</strong>
                  {showShare ? (
                    <span className="bkf-dash-bar__pct">{pct}%</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
