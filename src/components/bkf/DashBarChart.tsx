"use client";

export type DashBarItem = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  items: DashBarItem[];
  emptyLabel?: string;
};

export function DashBarChart({ title, items, emptyLabel = "Sem dados" }: Props) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="bkf-dash-chart">
      <h4 className="bkf-dash-chart__title">{title}</h4>
      {items.length === 0 || items.every((i) => i.value === 0) ? (
        <p className="bkf-empty">{emptyLabel}</p>
      ) : (
        <ul className="bkf-dash-bars">
          {items.map((item) => (
            <li key={item.label} className="bkf-dash-bar">
              <div className="bkf-dash-bar__meta">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <div className="bkf-dash-bar__track" aria-hidden>
                <div
                  className="bkf-dash-bar__fill"
                  style={{ width: `${Math.round((item.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
