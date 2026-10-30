/** The instrument panel: a station's latest readings, each on its own instrument. */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDateTime, getPatronOnboardingStatus } from "@tollbooth-dpyc/web";
import { RefreshButton, tourTarget, useAppShell, useProperty, useTimezone, useTour } from "@tollbooth-dpyc/web/react";
import Deck from "../components/instruments/Deck";
import StationKeys from "../components/StationKeys";
import Trace from "../components/Trace";
import { currentReadings, listStations, readingHistory, type Reading, type Series, type Station } from "../lib/field";
import { instrumentLabel } from "../lib/instruments";
import { useUnits } from "../lib/useUnits";

const DAY_MS = 24 * 60 * 60 * 1000;

type Opened = { reading: Reading; series: Series | null; failed: string };

export default function Panel() {
  useTour("panel");
  const { session } = useAppShell();
  const [, zone] = useTimezone();
  const [units] = useUnits();
  const [ready, setReady] = useState<boolean | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [chosen, setChosen] = useProperty<string>("station", "");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [problem, setProblem] = useState("");
  const [opened, setOpened] = useState<Opened | null>(null);

  const station = stations.find((s) => s.station_id === chosen) ?? stations[0];

  const read = useCallback(async (stationId: string) => {
    setProblem("");
    try {
      setReadings((await currentReadings(stationId)).readings);
    } catch (e) {
      setProblem((e as Error).message);
    }
  }, []);

  const load = useCallback(async () => {
    setProblem("");
    try {
      const status = await getPatronOnboardingStatus(session.npub);
      setReady(status.ready);
      if (!status.ready) return;
      const found = (await listStations()).stations;
      setStations(found);
      const first = found.find((s) => s.station_id === chosen) ?? found[0];
      if (first) await read(first.station_id);
    } catch (e) {
      setProblem((e as Error).message);
    }
    // The stored choice seeds this one arrival; choosing a station reads it directly.
  }, [session.npub, read]);

  useEffect(() => {
    void load();
  }, [load]);

  async function open(reading: Reading) {
    setOpened({ reading, series: null, failed: "" });
    try {
      const end = new Date();
      const start = new Date(end.getTime() - DAY_MS);
      const { series } = await readingHistory(reading.station_id, start.toISOString(), end.toISOString(), reading.sensor_kind);
      const match = series.find((s) => s.channel === reading.channel) ?? null;
      setOpened({ reading, series: match, failed: "" });
    } catch (e) {
      setOpened({ reading, series: null, failed: (e as Error).message });
    }
  }

  const newest = readings.reduce((latest, r) => (r.observed_at > latest ? r.observed_at : latest), "");

  return (
    <div className="page space-y-4">
      {ready === false && <StationKeys npub={session.npub} onConnected={load} />}

      {ready && (
        <header className="card flex flex-wrap items-center gap-3 p-4">
          {stations.length > 1 ? (
            <select
              {...tourTarget("panel.station")}
              aria-label="Station"
              className="field"
              value={station?.station_id ?? ""}
              onChange={(e) => {
                setChosen(e.target.value);
                setOpened(null);
                void read(e.target.value);
              }}
            >
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <h1 {...tourTarget("panel.station")} className="text-xl">
              {station?.name ?? "No stations yet"}
            </h1>
          )}
          <span className="ml-auto font-mono text-xs text-[var(--tb-muted)]">
            {newest && formatDateTime(newest, zone)}
          </span>
          {station && (
            <span {...tourTarget("panel.refresh")}>
              <RefreshButton onRefresh={() => read(station.station_id)} label="Read the instruments" classNames={{ root: "chip" }} />
            </span>
          )}
        </header>
      )}

      {problem && (
        <p className="rounded-lg border border-[var(--tb-err-line)] bg-[var(--tb-err-bg)] p-3 text-sm text-[var(--tb-err-ink)]">
          {problem} <Link to="/wallet" className="underline">Wallet</Link>
        </p>
      )}

      {ready && stations.length === 0 && !problem && (
        <p className="card prose-line p-5 text-sm">Your station account lists no stations yet: add one at ecowitt.net and it appears here.</p>
      )}

      {readings.length > 0 && (
        <div {...tourTarget("panel.deck")} className="card p-4">
          <Deck readings={readings} units={units} onOpen={open} />
        </div>
      )}

      {opened && (
        <section className="card p-4">
          <h2 className="mb-2 text-lg">
            {instrumentLabel(opened.reading.sensor_kind, opened.reading.channel, opened.reading.channel_name)}: the last day
          </h2>
          {opened.failed ? (
            <p className="text-sm text-[var(--tb-err-ink)]">{opened.failed}</p>
          ) : opened.series ? (
            <Trace series={opened.series} units={units} label={opened.reading.sensor_kind} />
          ) : (
            <p className="prose-line text-sm" aria-busy="true">Reading the trace…</p>
          )}
        </section>
      )}
    </div>
  );
}
