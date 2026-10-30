/**
 * What the panel will show one day: every instrument on a made-up farm. It makes
 * no tool call, so tapping an instrument is free. Each block carries the mark,
 * so nobody takes these figures for their own ground.
 */

import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatDateTime } from "@tollbooth-dpyc/web";
import { tourTarget, useTimezone } from "@tollbooth-dpyc/web/react";
import { define } from "../lib/glossary";
import { instrumentLabel } from "../lib/instruments";
import type { Reading } from "../lib/field";
import { previewDays, previewReadings, previewSeries } from "../lib/preview";
import { convert } from "../lib/units";
import { useUnits } from "../lib/useUnits";
import { COLUMNS, figure } from "../views/Log";
import Deck from "./instruments/Deck";
import Trace from "./Trace";

const Mark = () => <span className="sample-mark">Illustrative</span>;

export default function PanelPreview({ lead }: { lead: ReactNode }) {
  const [, zone] = useTimezone();
  const [units] = useUnits();
  const now = useMemo(() => Date.now(), []);
  const readings = useMemo(() => previewReadings(now), [now]);
  const days = useMemo(() => previewDays(now), [now]);
  const [opened, setOpened] = useState<Reading>(() => readings.find((r) => r.sensor_kind === "pressure") ?? readings[0]);

  return (
    <div className="space-y-4">
      <section className="card flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
        <div className="min-w-0 flex-1 basis-80">
          <h1 className="text-3xl">Your panel, one day</h1>
          <p className="prose-line mt-1 text-sm">These instruments read a made-up farm, and none of these figures come from a real station.</p>
        </div>
        {lead}
      </section>

      <header className="card flex flex-wrap items-center gap-3 p-4">
        <h2 {...tourTarget("panel.station")} className="text-xl">Home Farm</h2>
        <Mark />
        <span className="ml-auto font-mono text-xs text-[var(--tb-muted)]">{formatDateTime(new Date(now).toISOString(), zone)}</span>
      </header>

      <div {...tourTarget("panel.deck")} className="card p-4">
        <Deck readings={readings} units={units} onOpen={setOpened} wide />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-2 flex flex-wrap items-center gap-3 text-lg">
            {instrumentLabel(opened.sensor_kind, opened.channel, opened.channel_name)}: the last day <Mark />
          </h2>
          <p className="prose-line mb-2 text-sm">{define(opened.sensor_kind)?.said(units)}</p>
          <Trace series={previewSeries(opened, now)} units={units} label={opened.sensor_kind} />
        </section>

        <section className="card overflow-x-auto p-4">
          <h2 className="mb-2 flex flex-wrap items-center gap-3 text-lg">The log <Mark /></h2>
          <table className="w-full text-right font-mono text-sm">
            <thead className="text-xs text-[var(--tb-muted)]">
              <tr>
                <th className="py-1.5 text-left font-normal">Date</th>
                {COLUMNS.map((c) => (
                  <th key={c.col} className="py-1.5 pl-3 font-normal">{c.name}{c.unit && ` (${convert(0, c.unit, units).unit})`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date} className="border-t border-[var(--tb-line)]">
                  <td className="py-1.5 text-left">{d.date}</td>
                  {COLUMNS.map((c) => <td key={c.col} className="py-1.5 pl-3">{figure(d[c.col] as number | null, c.unit, units)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

/** For a stranger: the same panel, and the way in. */
export function PublicPanel() {
  return (
    <div className="page">
      <PanelPreview lead={<Link to="/signin" className="chip chip-accent">Sign in</Link>} />
    </div>
  );
}
