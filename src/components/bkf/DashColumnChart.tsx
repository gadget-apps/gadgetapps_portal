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

/** Barras verticais compactas — boa para comparar poucas categorias. */
export function DashColumnChart({
  title,
  items,
  emptyLabel = "Sem dados",
}: Props) {
  const [tip, setTip] = useState<string | null>(null);
  const total = chartTotal(items);
  const max = Math.max(1, ...items.map((i) => i.value || 0));
  const empty = items.length === 0 || total === 0;

  return (
    <div className="bkf-dash-chart bkf-dash-chart--cols">
      <div className="bkf-dash-chart__head">
        <h4 className="bkf-dash-chart__title">{title}</h4>
        {!empty ? (
          <span className="bkf-dash-chart__total">total {total}</span>
        ) : null}
      </div>
      {empty ? (
        <p className="bkf-empty bkf-dash-chart__empty">{emptyLabel}</p>
      ) : (
        <div className="bkf-cols-wrap">
          <div className="bkf-cols" role="img" aria-label={title}>
            {items.map((item, index) => {
              const h = Math.max(
                item.value > 0 ? 8 : 0,
                Math.round((item.value / max) * 100),
              );
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const hint = pointHint(item.label, item.value, pct);
              return (
                <div
                  key={item.label}
                  className="bkf-cols__item bkf-tip"
                  data-tip={hint}
                  title={hint}
                  onMouseEnter={() => setTip(hint)}
                  onMouseLeave={() => setTip(null)}
                >
                  <span className="bkf-cols__value">{item.value}</span>
                  <div className="bkf-cols__track">
                    <div
                      className="bkf-cols__fill"
                      style={{
                        height: `${h}%`,
                        background: toneColor(item.tone, index),
                      }}
                    />
                  </div>
                  <span className="bkf-cols__label">{item.label}</span>
                </div>
              );
            })}
          </div>
          {tip ? <div className="bkf-chart-tip">{tip}</div> : null}
        </div>
      )}
    </div>
  );
}
