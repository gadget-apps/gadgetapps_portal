"use client";

import { useState } from "react";
import {
  chartTotal,
  pointHint,
  toneColor,
  type DashChartItem,
} from "@/lib/bkf/dash-chart";

type Props = {
  title: string;
  items: DashChartItem[];
  emptyLabel?: string;
};

/** Barra 100% empilhada — leitura rápida de proporção. */
export function DashStackChart({
  title,
  items,
  emptyLabel = "Sem dados",
}: Props) {
  const [tip, setTip] = useState<string | null>(null);
  const total = chartTotal(items);
  const empty = items.length === 0 || total === 0;

  return (
    <div className="bkf-dash-chart bkf-dash-chart--stack">
      <div className="bkf-dash-chart__head">
        <h4 className="bkf-dash-chart__title">{title}</h4>
        {!empty ? (
          <span className="bkf-dash-chart__total">total {total}</span>
        ) : null}
      </div>
      {empty ? (
        <p className="bkf-empty bkf-dash-chart__empty">{emptyLabel}</p>
      ) : (
        <>
          <div className="bkf-stack-wrap">
            <div className="bkf-stack" role="img" aria-label={title}>
              {items.map((item, index) => {
                if (!item.value) return null;
                const pct = Math.round((item.value / total) * 100);
                const hint = pointHint(item.label, item.value, pct);
                return (
                  <div
                    key={item.label}
                    className="bkf-stack__seg bkf-tip"
                    style={{
                      width: `${(item.value / total) * 100}%`,
                      background: toneColor(item.tone, index),
                    }}
                    data-tip={hint}
                    title={hint}
                    onMouseEnter={() => setTip(hint)}
                    onMouseLeave={() => setTip(null)}
                  />
                );
              })}
            </div>
            {tip ? <div className="bkf-chart-tip">{tip}</div> : null}
          </div>
          <ul className="bkf-stack__legend">
            {items.map((item, index) => {
              const pct = Math.round((item.value / total) * 100);
              const hint = pointHint(item.label, item.value, pct);
              return (
                <li
                  key={item.label}
                  className="bkf-tip"
                  data-tip={hint}
                  title={hint}
                  onMouseEnter={() => setTip(hint)}
                  onMouseLeave={() => setTip(null)}
                >
                  <span
                    className="bkf-donut__swatch"
                    style={{ background: toneColor(item.tone, index) }}
                  />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <span className="bkf-donut__pct">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
