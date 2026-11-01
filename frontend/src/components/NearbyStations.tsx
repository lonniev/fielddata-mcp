/** A checklist of stations whose owners publish them. A ticked station joins the patron's stations, read like any other. */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LocateFixed, Map as MapIcon } from "lucide-react";
import { useProperty } from "@tollbooth-dpyc/web/react";
import { chosenRow, isChosen, shortStationId, toggleChoice } from "../lib/chosen";
import { listStations, nearbyStations, type NearbyStation, type Station } from "../lib/field";
import { formatDistance, formatQuantity, radiusChoices } from "../lib/units";
import { useUnits } from "../lib/useUnits";
import { VENDORS } from "../lib/vendors";
import StationMap, { type MapStation } from "./StationMap";

export default function NearbyStations() {
  const { hash } = useLocation();
  const [units] = useUnits();
  const [chosen, setChosen] = useProperty<string[]>("chosen_stations", []);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [reach, setReach] = useState(1);
  const [found, setFound] = useState<NearbyStation[] | null>(null);
  const [saved, setSaved] = useState<Station[]>([]);
  const [busy, setBusy] = useState(false);
  const [onMap, setOnMap] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    if (hash === "#nearby") document.getElementById("nearby")?.scrollIntoView();
  }, [hash]);

  // One reading once there are choices, which the account may bring after arrival, to show them by name.
  const hasChoices = chosen.length > 0;
  useEffect(() => {
    if (!hasChoices) return;
    listStations().then((r) => setSaved(r.stations)).catch((e: Error) => setProblem(e.message));
  }, [hasChoices]);

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
  const others = chosen.map(chosenRow)
    .filter((c) => !(found ?? []).some((s) => shortStationId(s.station_id) === c.short))
    .map((c) => {
      const known = saved.find((s) => shortStationId(s.station_id) === c.short);
      const vendor = VENDORS.find((v) => v.id === c.vendor)?.label ?? "Saved";
      const near = c.latitude != null && c.longitude != null ? ` near ${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)}` : "";
      return { ...c, name: known?.name ?? `${vendor} station${near}` };
    });
  const place = lat.trim() !== "" && lon.trim() !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))
    ? { latitude: Number(lat), longitude: Number(lon) }
    : null;
  const onTheMap: MapStation[] = [
    ...others.flatMap((s) => (s.latitude != null && s.longitude != null
      ? [{ id: s.choice, name: s.name, latitude: s.latitude, longitude: s.longitude, chosen: true, line: "", toggle: () => setChosen(toggleChoice(chosen, s.choice)) }]
      : [])),
    ...(found ?? []).map((s) => ({
      id: s.station_id, name: s.name, latitude: s.latitude, longitude: s.longitude,
      chosen: isChosen(chosen, s.station_id),
      line: `${formatDistance(s.distance_km, units)}${air(s) && ` · ${air(s)}`}`,
      toggle: () => setChosen(toggleChoice(chosen, s.choice)),
    })),
  ];
  const canSearch = place !== null;

  return (
    <section id="nearby" data-tour="nearby" className="card p-5 lg:col-span-2">
      <h2 className="font-display text-lg">Nearby stations</h2>
      <p className="prose-line mb-3 text-sm">Tick a station its owner publishes, and it joins your stations on the panel and for your AI agents. Untick it to remove it.</p>
      {others.length > 0 && (
        <ul className="mb-4 grid gap-x-6 md:grid-cols-2 xl:grid-cols-3">
          {others.map((s) => (
            <li key={s.choice} className="border-t border-[var(--tb-line)] py-2 text-sm">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="size-5 accent-[var(--tb-accent)]" checked onChange={() => setChosen(toggleChoice(chosen, s.choice))} />
                <span className="min-w-0 flex-1 font-medium">{s.name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="grid gap-1">Latitude<input className="field w-32" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} /></label>
        <label className="grid gap-1">Longitude<input className="field w-32" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} /></label>
        <button type="button" className="chip" onClick={locate}><LocateFixed size={16} aria-hidden /> Use my location</button>
        <button type="button" className={onMap ? "chip chip-on" : "chip"} aria-pressed={onMap} onClick={() => setOnMap((v) => !v)}><MapIcon size={16} aria-hidden /> Find on map</button>
        <label className="grid gap-1">Within
          <select className="field" value={reach} onChange={(e) => setReach(Number(e.target.value))}>
            {radii.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
          </select>
        </label>
        <button type="button" className="chip chip-accent" disabled={busy || !canSearch} onClick={() => void search()}>{busy ? "Looking…" : "Find stations"}</button>
      </div>
      {onMap && (
        <StationMap place={place} stations={onTheMap}
          onPlace={(latitude, longitude) => {
            setLat(latitude.toFixed(4));
            setLon(longitude.toFixed(4));
          }} />
      )}
      {problem && <p className="mt-3 text-sm text-[var(--tb-err-ink)]">{problem}</p>}
      {found?.length === 0 && <p className="prose-line mt-3 text-sm">No station is published within {radius.label} of that place.</p>}
      {(found?.length ?? 0) > 0 && (
        <ul className="mt-3 grid gap-x-6 md:grid-cols-2 xl:grid-cols-3">
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
