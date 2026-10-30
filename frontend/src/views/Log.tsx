/** The log: one line per local day, ruled like a ship's log. The service sorts and pages it. */

import { useCallback, useEffect, useRef, useState } from "react";
import { PageControls, SortHeader, tourTarget, useProperty, useTour, type SortHeaderProps } from "@tollbooth-dpyc/web/react";
import { dailySummary, listStations, type Station, type Summary, type SummaryDay } from "../lib/field";
import { convert, type UnitSystem } from "../lib/units";
import { useUnits } from "../lib/useUnits";

const PAGE_SIZE = 14;

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function daysAgo(n: number): string {
  return isoDay(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
}

export const figure = (q: number | null, unit: string, units: UnitSystem) => {
  if (q == null) return "—";
  const c = convert(q, unit, units);
  return c.value.toFixed(c.places);
};

export const COLUMNS: { col: keyof SummaryDay; name: string; unit: string }[] = [
  { col: "temp_min_c", name: "Low", unit: "°C" },
  { col: "temp_max_c", name: "High", unit: "°C" },
  { col: "frost_hours", name: "Frost h", unit: "" },
  { col: "rain_mm", name: "Rain", unit: "mm" },
  { col: "degree_days", name: "Degree-days", unit: "" },
];

export default function Log() {
  useTour("log");
  const [units] = useUnits();
  const [chosen] = useProperty<string>("station", "");
  const [stations, setStations] = useState<Station[]>([]);
  const [from, setFrom] = useState(() => daysAgo(30));
  const [to, setTo] = useState(() => daysAgo(0));
  const [baseC, setBaseC] = useState(10);
  const [log, setLog] = useState<Summary | null>(null);
  const [reading, setReading] = useState(true);
  const [problem, setProblem] = useState("");
  const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "date", dir: "desc" });
  const [page, setPage] = useState(0);
  const asked = useRef(0);

  const read = useCallback(async (at: { col: string; dir: "asc" | "desc"; page: number }) => {
    const ask = ++asked.current;
    setProblem("");
    setReading(true);
    try {
      const found = stations.length ? stations : (await listStations()).stations;
      setStations(found);
      const station = found.find((s) => s.station_id === chosen) ?? found[0];
      const answer = station
        ? await dailySummary(station.station_id, from, to, baseC, { sortCol: at.col, sortDir: at.dir, page: at.page, pageSize: PAGE_SIZE })
        : null;
      if (ask !== asked.current) return;
      setLog(answer);
      setPage(answer?.page ?? 0);
    } catch (e) {
      if (ask === asked.current) setProblem((e as Error).message);
    } finally {
      if (ask === asked.current) setReading(false);
    }
  }, [stations, chosen, from, to, baseC]);

  useEffect(() => {
    void read({ ...sort, page: 0 });
    // One reading on arrival; afterwards a sort, a page or "Read the log" asks.
    // eslint-disable-next-line
  }, []);

  const headerProps: Pick<SortHeaderProps, "activeCol" | "dir" | "onSort"> = {
    activeCol: sort.col,
    dir: sort.dir,
    onSort: (col, dir) => {
      setSort({ col, dir });
      void read({ col, dir, page: 0 });
    },
  };
  const unitOf = (unit: string) => (unit ? ` (${convert(0, unit, units).unit})` : "");

  return (
    <div className="page space-y-4">
      <div {...tourTarget("log.range")} className="card flex flex-wrap items-end gap-3 p-4 text-sm">
        <h1 className="mr-auto self-center text-3xl">Log</h1>
        <label className="grid gap-1">From<input type="date" className="field" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="grid gap-1">To<input type="date" className="field" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
        <label className="grid gap-1">Base °C<input type="number" className="field w-20" min={-10} max={40} value={baseC} onChange={(e) => setBaseC(Number(e.target.value))} /></label>
        <button type="button" className="chip chip-accent" onClick={() => void read({ ...sort, page: 0 })} disabled={reading}>Read the log</button>
      </div>

      {problem && <p className="rounded-lg border border-[var(--tb-err-line)] bg-[var(--tb-err-bg)] p-3 text-sm text-[var(--tb-err-ink)]">{problem}</p>}
      {reading && !log && <p className="card prose-line p-5 text-sm" aria-busy="true">Reading the log…</p>}

      {log && log.total > 0 && (
        <div {...tourTarget("log.table")} className="card overflow-x-auto" aria-busy={reading}>
          <table className="w-full text-right font-mono">
            <thead className="bg-[var(--tb-surface-2)] text-xs text-[var(--tb-muted)]">
              <tr>
                <SortHeader label="Date" col="date" {...headerProps} classNames={{ cell: "px-4 py-3 text-left font-normal", active: "text-[var(--tb-accent)]" }} />
                {COLUMNS.map((c) => (
                  <SortHeader key={c.col} label={`${c.name}${unitOf(c.unit)}`} col={c.col} {...headerProps} classNames={{ cell: "px-4 py-3 font-normal", active: "text-[var(--tb-accent)]" }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {log.days.map((d) => (
                <tr key={d.date} className="border-t border-[var(--tb-line)]">
                  <td className="px-4 py-2.5 text-left">{d.date}</td>
                  {COLUMNS.map((c) => (
                    <td key={c.col} className="px-4 py-2.5">{figure(d[c.col] as number | null, c.unit, units)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {log && (
        <PageControls
          page={page}
          pageSize={PAGE_SIZE}
          total={log.total}
          onPage={(p) => void read({ ...sort, page: p })}
          hideSinglePage
          classNames={{ root: "card flex flex-wrap items-center justify-center gap-2 p-3 text-sm", chip: "chip", label: "px-2" }}
        />
      )}
    </div>
  );
}
