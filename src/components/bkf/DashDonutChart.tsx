"use client";

import { useState } from "react";
import {
  chartTotal,
  donutSlicePath,
  pointHint,
  toneColor,
  type DashChartItem,
} from "@/lib/bkf/dash-chart";

type Props = {
  title: string;
  items: DashChartItem[];
  emptyLabel?: string;
};

/** Donut + legenda — boa para composição (partes de um todo). */
export function DashDonutChart({
  title,
  items,
  emptyLabel = "Sem dados",
}: Props) {
  const [tip, setTip] = useState<string | null>(null);
  const total = chartTotal(items);
  const empty = items.length === 0 || total === 0;
  const size = 120;
  const stroke = 16;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;

  let angle = 0;
  const arcs = items.map((item, index) => {
    const frac = total > 0 ? item.value / total : 0;
    const sweep = frac * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return {
      ...item,
      color: toneColor(item.tone, index),
      start,
      end,
      pct: Math.round(frac * 100),
      hint: pointHint(item.label, item.value, Math.round(frac * 100)),
    };
  });

  return (
    <div className="bkf-dash-chart bkf-dash-chart--donut">
      <div className="bkf-dash-chart__head">
        <h4 className="bkf-dash-chart__title">{title}</h4>
        {!empty ? (
          <span className="bkf-dash-chart__total">total {total}</span>
        ) : null}
      </div>
      {empty ? (
        <p className="bkf-empty bkf-dash-chart__empty">{emptyLabel}</p>
      ) : (
        <div className="bkf-donut">
          <div className="bkf-donut__viz">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={title}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#eef0f3"
                strokeWidth={stroke}
              />
              {arcs.map((arc) => {
                if (arc.value <= 0) return null;
                // Fatia completa (100%) vira círculo cheio.
                if (arc.end - arc.start >= 359.9) {
                  return (
                    <circle
                      key={arc.label}
                      className="bkf-donut__slice"
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth={stroke}
                      onMouseEnter={() => setTip(arc.hint)}
                      onMouseLeave={() => setTip(null)}
                      onFocus={() => setTip(arc.hint)}
                      onBlur={() => setTip(null)}
                      tabIndex={0}
                    >
                      <title>{arc.hint}</title>
                    </circle>
                  );
                }
                return (
                  <path
                    key={arc.label}
                    className="bkf-donut__slice"
                    d={donutSlicePath(cx, cy, r, arc.start, arc.end)}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                    onMouseEnter={() => setTip(arc.hint)}
                    onMouseLeave={() => setTip(null)}
                    onFocus={() => setTip(arc.hint)}
                    onBlur={() => setTip(null)}
                    tabIndex={0}
                  >
                    <title>{arc.hint}</title>
                  </path>
                );
              })}
            </svg>
            <div className="bkf-donut__center">
              <strong>{total}</strong>
            </div>
            {tip ? <div className="bkf-chart-tip">{tip}</div> : null}
          </div>
          <ul className="bkf-donut__legend">
            {arcs.map((arc) => (
              <li
                key={arc.label}
                className="bkf-tip"
                data-tip={arc.hint}
                title={arc.hint}
                onMouseEnter={() => setTip(arc.hint)}
                onMouseLeave={() => setTip(null)}
              >
                <span
                  className="bkf-donut__swatch"
                  style={{ background: arc.color }}
                />
                <span className="bkf-donut__name">{arc.label}</span>
                <strong>{arc.value}</strong>
                <span className="bkf-donut__pct">{arc.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
