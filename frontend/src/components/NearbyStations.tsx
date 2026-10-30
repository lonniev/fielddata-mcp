/** A checklist of stations whose owners publish them. A ticked station joins the patron's stations, read like any other. */

import { useEffect, useState } from "react";
import { LocateFixed } from "lucide-react";
import { useProperty } from "@tollbooth-dpyc/web/react";
import { isChosen, toggleChoice, withoutStation } from "../lib/chosen";
import { listStations, nearbyStations, type NearbyStation, type Station } from "../lib/field";
import { formatDistance, formatQuantity, radiusChoices } from "../lib/units";
import { useUnits } from "../lib/useUnits";

export default function NearbyStations() {
  const [units] = useUnits();
  const [chosen, setChosen] = useProperty<string[]>("chosen_stations", []);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [reach, setReach] = useState(1);
  const [found, setFound] = useState<NearbyStation[] | null>(null);
  const [saved, setSaved] = useState<Station[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  // One reading on arrival, so chosen stations show by name with no search.
  useEffect(() => {
    if (!chosen.length) return;
    listStations().then((r) => setSaved(r.stations)).catch((e: Error) => setProblem(e.message));
    // eslint-disable-next-line
  }, []);

  function locate() {
    setProblem("");
    if (!navigator.geolocation) {
      setProblem("This browser cannot give a location: type one in.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLat(coords.latitude.toFixed(4));
        setLon(coords.longitude.toFixed(4));
      },
      (e) => setProblem(`The location could not be read: ${e.message}`),
    );
  }

  async function search() {
    setBusy(true);
    setProblem("");
    try {
      setFound((await nearbyStations(Number(lat), Number(lon), radius.km)).stations);
    } catch (e) {
      setProblem((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const radii = radiusChoices(units);
  const radius = radii[reach];
  const air = (s: NearbyStation) => {
    const r = s.readings.find((x) => x.sensor_kind === "air_temperature");
    return r ? formatQuantity(r.quantity, r.unit, units) : "";
  };
  const shownIds = new Set((found ?? []).map((s) => s.station_id));
  const others = saved.filter((s) => isChosen(chosen, s.station_id) && !shownIds.has(s.station_id));
  const canSearch = lat.trim() !== "" && lon.trim() !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));

  return (
    <section data-tour="nearby" className="card p-5 lg:col-span-2">
      <h2 className="font-display text-lg">Nearby stations</h2>
      <p className="prose-line mb-3 text-sm">Tick a station its owner publishes, and it joins your stations on the panel and for your AI agents.</p>
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="grid gap-1">Latitude<input className="field w-32" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} /></label>
        <label className="grid gap-1">Longitude<input className="field w-32" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} /></label>
        <button type="button" className="chip" onClick={locate}><LocateFixed size={16} aria-hidden /> Use my location</button>
        <label className="grid gap-1">Within
          <select className="field" value={reach} onChange={(e) => setReach(Number(e.target.value))}>
            {radii.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
          </select>
        </label>
        <button type="button" className="chip chip-accent" disabled={busy || !canSearch} onClick={() => void search()}>{busy ? "Looking…" : "Find stations"}</button>
      </div>
      {problem && <p className="mt-3 text-sm text-[var(--tb-err-ink)]">{problem}</p>}
      {found?.length === 0 && <p className="prose-line mt-3 text-sm">No station is published within {radius.label} of that place.</p>}
      {(others.length > 0 || (found?.length ?? 0) > 0) && (
        <ul className="mt-3 grid gap-x-6 md:grid-cols-2 xl:grid-cols-3">
          {others.map((s) => (
            <li key={s.station_id} className="border-t border-[var(--tb-line)] py-2 text-sm">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="size-5 accent-[var(--tb-accent)]" checked onChange={() => setChosen(withoutStation(chosen, s.station_id))} />
                <span className="min-w-0 flex-1 font-medium">{s.name}</span>
              </label>
            </li>
          ))}
          {(found ?? []).map((s) => (
            <li key={s.station_id} className="border-t border-[var(--tb-line)] py-2 text-sm">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="size-5 accent-[var(--tb-accent)]" checked={isChosen(chosen, s.station_id)} onChange={() => setChosen(toggleChoice(chosen, s.choice))} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{s.name}</span>
                  <span className="block font-mono text-xs text-[var(--tb-muted)]">{formatDistance(s.distance_km, units)}{air(s) && ` · ${air(s)}`}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
