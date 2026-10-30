/** The log: one line per local day, ruled like a ship's log. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { pageRows } from "@tollbooth-dpyc/web";
import { PageControls, SortHeader, tourTarget, useProperty, useTour, type SortHeaderProps } from "@tollbooth-dpyc/web/react";
import { dailySummary, listStations, type Station, type SummaryDay } from "../lib/field";
import { convert, type UnitSystem } from "../lib/units";
import { useUnits } from "../lib/useUnits";

const PAGE_SIZE = 14;

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function daysAgo(n: number): string {
  return isoDay(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
}

const figure = (q: number | null, unit: string, units: UnitSystem) => {
  if (q == null) return "—";
  const c = convert(q, unit, units);
  return c.value.toFixed(c.places);
};

const COLUMNS: { col: keyof SummaryDay; name: string; unit: string }[] = [
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
  const [days, setDays] = useState<SummaryDay[] | null>(null);
  const [problem, setProblem] = useState("");
  const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "date", dir: "desc" });
  const [page, setPage] = useState(0);

  const read = useCallback(async () => {
    setProblem("");
    setDays(null);
    try {
      const found = stations.length ? stations : (await listStations()).stations;
      setStations(found);
      const station = found.find((s) => s.station_id === chosen) ?? found[0];
      if (!station) {
        setDays([]);
        return;
      }
      setDays((await dailySummary(station.station_id, from, to, baseC)).days);
      setPage(0);
    } catch (e) {
      setProblem((e as Error).message);
      setDays([]);
    }
  }, [stations, chosen, from, to, baseC]);

  useEffect(() => {
    void read();
    // One reading on arrival; afterwards "Read the log" asks.
    // eslint-disable-next-line
  }, []);

  const sorted = useMemo(() => {
    const value = (d: SummaryDay) => d[sort.col as keyof SummaryDay];
    const rows = [...(days ?? [])].sort((a, b) => {
      const [x, y] = [value(a), value(b)];
      if (x == null) return 1;
      if (y == null) return -1;
      return x < y ? -1 : x > y ? 1 : 0;
    });
    return sort.dir === "desc" ? rows.reverse() : rows;
  }, [days, sort]);

  const headerProps: Pick<SortHeaderProps, "activeCol" | "dir" | "onSort"> = {
    activeCol: sort.col,
    dir: sort.dir,
    onSort: (col, dir) => setSort({ col, dir }),
  };
  const unitOf = (unit: string) => (unit ? ` (${convert(0, unit, units).unit})` : "");

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <h1 className="text-xl">Log</h1>
      <div {...tourTarget("log.range")} className="flex flex-wrap items-end gap-3 text-sm">
        <label className="grid gap-1">From<input type="date" className="field" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="grid gap-1">To<input type="date" className="field" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
        <label className="grid gap-1">Base °C<input type="number" className="field w-20" min={-10} max={40} value={baseC} onChange={(e) => setBaseC(Number(e.target.value))} /></label>
        <button type="button" className="chip chip-accent" onClick={() => void read()} disabled={days === null}>Read the log</button>
      </div>

      {problem && <p className="rounded-lg border border-[var(--tb-err-line)] bg-[var(--tb-err-bg)] p-3 text-sm text-[var(--tb-err-ink)]">{problem}</p>}
      {days === null && <p className="prose-line text-sm" aria-busy="true">Reading the log…</p>}

      {sorted.length > 0 && (
        <div {...tourTarget("log.table")} className="card overflow-x-auto">
          <table className="w-full text-right font-mono text-sm">
            <thead className="text-xs text-[var(--tb-muted)]">
              <tr>
                <SortHeader label="Date" col="date" {...headerProps} classNames={{ cell: "p-2 text-left font-normal" }} />
                {COLUMNS.map((c) => (
                  <SortHeader key={c.col} label={`${c.name}${unitOf(c.unit)}`} col={c.col} {...headerProps} classNames={{ cell: "p-2 font-normal" }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows(sorted, page, PAGE_SIZE).map((d) => (
                <tr key={d.date} className="border-t border-[var(--tb-line)]">
                  <td className="p-2 text-left">{d.date}</td>
                  {COLUMNS.map((c) => (
                    <td key={c.col} className="p-2">{figure(d[c.col] as number | null, c.unit, units)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PageControls page={page} pageSize={PAGE_SIZE} total={sorted.length} onPage={setPage} hideSinglePage classNames={{ root: "flex flex-wrap items-center gap-2 text-sm", chip: "chip" }} />
    </div>
  );
}
