/** A barograph's chart: one instrument's readings across the day, drawn on ruled paper. */

import { useTimezone } from "@tollbooth-dpyc/web/react";
import { formatDateTime } from "@tollbooth-dpyc/web";
import type { Series } from "../lib/field";
import { convert, formatQuantity, type UnitSystem } from "../lib/units";

const W = 640;
const H = 220;
const PAD = { left: 52, right: 12, top: 12, bottom: 26 };

export default function Trace({ series, units, label }: { series: Series; units: UnitSystem; label: string }) {
  const [, zone] = useTimezone();
  const points = series.points.map(([at, q]) => [Date.parse(at), q] as const);
  if (points.length < 2) return <p className="prose-line text-sm">This instrument has no trace for that period.</p>;
  const times = points.map((p) => p[0]);
  const values = points.map((p) => p[1]);
  const [t0, t1] = [Math.min(...times), Math.max(...times)];
  const [v0, v1] = [Math.min(...values), Math.max(...values)];
  const span = v1 - v0 || 1;
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0 || 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - ((v - v0) / span) * (H - PAD.top - PAD.bottom);
  const rules = [0, 0.25, 0.5, 0.75, 1];
  const yLabel = (v: number) => convert(v, series.unit, units).value.toFixed(convert(v, series.unit, units).places);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}, from ${formatQuantity(values[0], series.unit, units)} to ${formatQuantity(values[values.length - 1], series.unit, units)}`} className="block w-full">
        {rules.map((r) => {
          const v = v0 + r * span;
          return (
            <g key={r}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--tb-line)" />
              <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--tb-muted)" fontFamily="var(--font-mono)">
                {yLabel(v)}
              </text>
            </g>
          );
        })}
        <polyline points={points.map(([t, v]) => `${x(t)},${y(v)}`).join(" ")} fill="none" stroke="var(--trace)" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <figcaption className="flex justify-between font-mono text-xs text-[var(--tb-muted)]">
        <span>{formatDateTime(new Date(t0).toISOString(), zone)}</span>
        <span>{formatDateTime(new Date(t1).toISOString(), zone)}</span>
      </figcaption>
    </figure>
  );
}
